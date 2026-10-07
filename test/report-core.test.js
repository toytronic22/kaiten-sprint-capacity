const test = require('node:test');
const assert = require('node:assert/strict');
const report = require('../src/report-core.js');

const DEV = 68084;
const EXPEDITE = 1524136;
const BACKLOG = 1108490;
const OTHER = 999;
const BUG = 446247;
const NEED_QA = 16238652;
const SELF_TEST = 16238651;
const FEATURE = 217076;
const INCIDENT = 16194797;
const SUPPORT = 217075;

const COLUMNS = { 1: 'Doing', 2: 'Test', 3: 'Waiting for release', 4: 'Done', 5: 'To Do', 11: 'Test', 14: 'Done', 21: 'Inbox', 31: 'Очередь' };
const SPRINT = { from: '2026-09-14', to: '2026-09-27' };

const at = (board, column, when) => ({ board_id: board, column_id: column, changed: when });
const task = (id, testType) => ({ id, type_id: 1, created: '2026-08-20T05:00:00', properties: testType ? { id_505017: [testType] } : {} });
const bug = (id, created, source, parents = []) => ({ id, type_id: BUG, created, properties: { id_425359: [source] }, parents });

function sprintData() {
  const cards = {
    101: task(101, NEED_QA),
    102: task(102, NEED_QA),
    103: task(103, SELF_TEST),
    104: task(104, NEED_QA),
    105: task(105, null),
    106: task(106, NEED_QA),
  };
  const bugCards = {
    201: bug(201, '2026-09-15T05:00:00', FEATURE),
    202: bug(202, '2026-09-17T05:00:00', INCIDENT),
    203: bug(203, '2026-09-18T05:00:00', INCIDENT, [{ id: 202, type_id: BUG }]),
    204: bug(204, '2026-09-19T05:00:00', FEATURE),
    205: bug(205, '2026-09-19T06:00:00', SUPPORT),
  };
  for (const id of [201, 202, 203, 204]) cards[id] = bugCards[id];
  const histories = {
    101: [at(DEV, 5, '2026-09-14T04:00:00'), at(DEV, 1, '2026-09-14T05:00:00'), at(DEV, 2, '2026-09-16T05:00:00'), at(DEV, 3, '2026-09-17T05:00:00'), at(DEV, 4, '2026-09-18T05:00:00'), at(DEV, 4, '2026-09-21T05:00:00')],
    102: [at(DEV, 4, '2026-09-10T05:00:00'), at(DEV, 4, '2026-09-15T05:00:00')],
    103: [at(DEV, 1, '2026-09-18T05:00:00'), at(DEV, 3, '2026-09-21T05:00:00')],
    104: [at(DEV, 1, '2026-09-22T05:00:00'), at(DEV, 3, '2026-09-23T05:00:00')],
    105: [at(DEV, 1, '2026-09-01T05:00:00'), at(DEV, 2, '2026-09-03T05:00:00'), at(DEV, 1, '2026-09-04T05:00:00'), at(DEV, 2, '2026-09-07T05:00:00'), at(DEV, 4, '2026-09-08T05:00:00')],
    106: [at(DEV, 1, '2026-09-01T05:00:00'), at(DEV, 2, '2026-09-14T05:00:00'), at(DEV, 3, '2026-09-24T05:00:00')],
    201: [at(DEV, 2, '2026-09-15T05:00:00'), at(DEV, 1, '2026-09-15T06:00:00'), at(DEV, 2, '2026-09-16T05:00:00'), at(DEV, 4, '2026-09-16T09:00:00')],
    202: [at(EXPEDITE, 11, '2026-09-17T05:00:00'), at(EXPEDITE, 14, '2026-09-17T07:00:00')],
    203: [at(DEV, 1, '2026-09-18T05:00:00'), at(DEV, 4, '2026-09-18T08:00:00')],
    204: [at(DEV, 5, '2026-09-19T05:00:00')],
    205: [at(OTHER, 21, '2026-09-19T06:00:00'), at(DEV, 5, '2026-09-19T07:00:00'), at(BACKLOG, 31, '2026-09-20T05:00:00')],
  };
  return { cards, bugCards, histories, columns: COLUMNS };
}

function summaries() {
  const data = sprintData();
  const period = report.reportPeriod(SPRINT);
  return {
    current: report.reportSummarize({ ...data, start: period.start, end: period.end }),
    previous: report.reportSummarize({ ...data, start: period.previousStart, end: period.start }),
  };
}

test('Рабочие дни: суббота и воскресенье не считаются, сутки — по времени UTC+5', () => {
  // Arrange
  const fridayEvening = Date.parse('2026-09-18T13:00:00Z');
  const mondayMorning = Date.parse('2026-09-21T05:00:00Z');

  // Act
  const days = report.reportWorkdays(fridayEvening, mondayMorning);

  // Assert
  assert.equal(Math.round(days * 1000) / 1000, 0.667);
});

test('Done: переход в колонку Done считается, архивация карточки, уже лежащей в Done, — нет', () => {
  // Arrange
  const data = sprintData();
  const period = report.reportPeriod(SPRINT);

  // Act
  const current = report.reportFlow({ ...data, start: period.start, end: period.end });
  const previous = report.reportFlow({ ...data, start: period.previousStart, end: period.start });

  // Assert
  assert.deepEqual(current.done, [101, 201, 202, 203]);
  assert.deepEqual(previous.done, [102, 105]);
});

test('Проходы через Test: баг, заведённый прямо в Test, — не проход; возврат в Doing помечен', () => {
  // Arrange
  const data = sprintData();
  const period = report.reportPeriod(SPRINT);

  // Act
  const passes = report.reportFlow({ ...data, start: period.previousStart, end: period.end }).passes;

  // Assert
  assert.deepEqual(passes.map((pass) => [pass.card, pass.exit, Math.round(pass.days * 100) / 100]), [
    [101, 'forward', 1],
    [105, 'back', 1],
    [105, 'forward', 1],
    [106, 'forward', 8],
    [201, 'forward', 0.17],
  ]);
});

test('Баги: по дате заведения и первой доске потока; без Done и Backlog — не баг; дочерний к багу — не escape', () => {
  // Arrange
  const data = sprintData();
  const period = report.reportPeriod(SPRINT);

  // Act
  const bugs = report.reportBugs({ ...data, start: period.start, end: period.end });

  // Assert
  assert.deepEqual(bugs.map((item) => [item.id, item.board, item.feature, item.escape]), [
    [201, DEV, true, false],
    [202, EXPEDITE, false, true],
    [203, DEV, false, false],
    [205, DEV, false, true],
  ]);
});

test('Сводка спринта: разработка, тестирование, баги, escape и Done по двум спринтам', () => {
  // Act
  const { current, previous } = summaries();

  // Assert
  assert.deepEqual(current.finished, { count: 4, needQa: 3, selfTest: 1, none: 0 });
  assert.deepEqual(previous.finished, { count: 1, needQa: 0, selfTest: 0, none: 1 });
  assert.equal(Math.round(current.development.mean * 100) / 100, 5.5);
  assert.equal(Math.round(current.test.mean * 100) / 100, 0.58);
  assert.deepEqual(current.test.long, [{ card: 106, days: 8 }]);
  assert.deepEqual(current.tested, { tasks: 2, bugs: 1 });
  assert.deepEqual(previous.returned, [105]);
  assert.deepEqual(current.bugs.development, { count: 3, feature: 1, escape: 1 });
  assert.deepEqual(current.bugs.expedite, { count: 1, feature: 0, escape: 1 });
  assert.deepEqual(current.escapeIds, [202, 205]);
  assert.deepEqual(current.done, { count: 4, tasks: 1, bugs: 3 });
});

test('Текст сводки: пять пунктов, формы слов по числу, без «роста нагрузки» по числу карт', () => {
  // Arrange
  const { current, previous } = summaries();

  // Act
  const text = report.reportText({ sprint: SPRINT, current, previous });

  // Assert
  assert.equal(text, [
    'Разработка P2P за спринт 14.09–27.09',
    '1. Завершена разработка 4 задач: 3 с пометкой Need QA, 1 с Self-test, 0 без пометки. В прошлом спринте — 1 задача: 0 с Need QA, 0 с Self-test, 1 без пометки.',
    '2. Средняя скорость разработки задачи — 5,5 рабочего дня (от колонки Doing до Waiting for release), в прошлом спринте — 5 дней.',
    'Средняя скорость тестирования задачи — 0,6 рабочего дня, в прошлом спринте — 2 дня.',
    '3. Протестировали 2 задачи и перепроверили 1 исправленный баг. В прошлом спринте — 1 задачу и 0 багов.',
    '4. Заведено багов: 3 на основной доске Development и 1 на дежурной Expedite. В прошлом спринте — 0 и 0.',
    '5. Из прода вернулись 2 бага, в прошлом спринте — 0.',
  ].join('\n'));
});

test('Дни словами: дробь — «рабочего дня», целое — по числу, нет данных — так и пишем', () => {
  // Assert
  assert.equal(report.reportDays(3.94, true), '3,9 рабочего дня');
  assert.equal(report.reportDays(7.26, false), '7,3 дня');
  assert.equal(report.reportDays(1, true), '1 рабочий день');
  assert.equal(report.reportDays(2, true), '2 рабочих дня');
  assert.equal(report.reportDays(5, false), '5 дней');
  assert.equal(report.reportDays(null, true), 'нет данных');
});

test('Спринты: идущий первым, по умолчанию берётся прошлый; новые сутки — по UTC+5', () => {
  // Act
  const october = report.reportSprints(Date.parse('2026-10-06T10:00:00Z'), 3);
  const lateSunday = report.reportSprints(Date.parse('2026-09-27T20:00:00Z'), 2);

  // Assert
  assert.deepEqual(october, [
    { from: '2026-09-28', to: '2026-10-11', current: true },
    { from: '2026-09-14', to: '2026-09-27', current: false },
    { from: '2026-08-31', to: '2026-09-13', current: false },
  ]);
  assert.equal(lateSunday[0].from, '2026-09-28');
});

test('Что проверить под сводкой: escape и долгие в Test — ссылками', () => {
  // Arrange
  const { current, previous } = summaries();

  // Act
  const notes = report.reportNotes(current);
  const quiet = report.reportNotes(previous);

  // Assert
  assert.deepEqual(notes, [
    { label: 'Вернулись из прода', items: [{ id: 202 }, { id: 205 }] },
    { label: 'Дольше недели в Test — не вошли в среднее', items: [{ id: 106, note: '8 рабочих дней' }] },
  ]);
  assert.deepEqual(quiet, []);
});
