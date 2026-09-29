const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('./fixtures/planning-2026-09-28.json');
const core = require('../src/core.js');

const BACK = 16232407;
const FRONT = 16232408;
const MOBILE = 16237830;
const NEED_QA = 16238652;
const DONE = 3;
const WEB_BUG = { id: 446247, name: 'WEB bug' };

function card(id, { size = null, sp = null, platforms = [], testType = [], state = 1, type = null } = {}) {
  const properties = {};
  if (sp !== null) properties.id_396449 = String(sp);
  if (platforms.length) properties.id_499149 = platforms;
  if (testType.length) properties.id_505017 = testType;
  return { id, title: `Карта ${id}`, size, properties, state, type_id: type ? type.id : null, type };
}

function settingsWith(team) {
  return core.normalizeSettings({ team });
}

function totals(report) {
  return report.rows.map((row) => row.total);
}

test('на снимке планирования 28.09 считается вся доска', () => {
  // Arrange
  const settings = settingsWith({ back: { people: 3 }, front: { people: 1 }, qa: { people: 1 } });

  // Act
  const report = core.buildReport({ cards: fixture.cards, settings });

  // Assert
  assert.deepEqual(report.rows.map(core.formatRow), ['Бэк: 48 из 30', 'Фронт: 6 из 10', 'QA: 19 из 10']);
  assert.deepEqual(report.rows.map((row) => row.over), [true, false, true]);
  assert.deepEqual([report.board.cards.length, report.board.points], [27, 73]);
  assert.equal(report.notCounted.points, 0);
  assert.equal(report.problems.length, 0);
});

test('Done входит в нагрузку и считается отдельно: SP, карты и процент от всей доски', () => {
  // Arrange
  const cards = [
    card(1, { size: 6, sp: 3, platforms: [BACK] }),
    card(2, { size: 2, sp: 2, platforms: [FRONT], state: DONE }),
  ];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.deepEqual(totals(report), [3, 2, 3]);
  assert.deepEqual(report.done.cards.map((item) => item.id), [2]);
  assert.equal(report.done.points, 2);
  assert.equal(report.board.points, 8);
  assert.equal(report.done.percent, 25);
});

test('процент Done округляется до целого, а без оценок на доске его нет', () => {
  // Arrange
  const third = [card(1, { size: 2, platforms: [BACK] }), card(2, { size: 1, platforms: [BACK], state: DONE })];
  const twoThirds = [card(1, { size: 1, platforms: [BACK] }), card(2, { size: 2, platforms: [BACK], state: DONE })];
  const unestimated = [card(1, { platforms: [BACK], state: DONE })];

  // Act
  const percents = [third, twoThirds, unestimated, []].map((cards) => core.buildReport({ cards, settings: core.defaultSettings() }).done.percent);

  // Assert
  assert.deepEqual(percents, [33, 67, null, null]);
});

test('карта в Done проверяется, как любая другая', () => {
  // Arrange
  const cards = [card(1, { size: 3, platforms: [MOBILE], testType: [NEED_QA], state: DONE })];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.equal(report.notCounted.points, 3);
  assert.deepEqual(report.warnings.map((warning) => warning.issue), ['noPlatform', 'needQaWithoutQa']);
});

test('баг в Done не попадает ни в Done, ни в процент', () => {
  // Arrange
  const cards = [
    card(1, { size: 4, sp: 2, platforms: [BACK], state: DONE, type: WEB_BUG }),
    card(2, { size: 3, sp: 1, platforms: [BACK], state: DONE }),
    card(3, { size: 3, sp: 1, platforms: [BACK] }),
  ];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.deepEqual(totals(report), [2, 0, 4]);
  assert.deepEqual(report.done.cards.map((item) => item.id), [2]);
  assert.equal(report.done.percent, 50);
  assert.deepEqual(report.bugs.cards.map((item) => item.id), [1]);
});

test('баг узнаётся по номеру типа и по слову bug или баг в названии типа', () => {
  // Arrange
  const cards = [
    card(1, { type: WEB_BUG }),
    { id: 2, properties: {}, type_id: '446247' },
    card(3, { type: { id: 500001, name: 'Mobile Bug' } }),
    card(4, { type: { id: 500002, name: 'Баг прода' } }),
    card(5, { type: { id: 119856, name: 'Technical' } }),
    card(6, { type: { id: 409115, name: 'Staff Card' } }),
    card(7),
  ];

  // Act
  const actual = cards.map((item) => core.isBug(item));

  // Assert
  assert.deepEqual(actual, [true, true, true, true, false, false, false]);
});

test('баг не считается: ни в суммах, ни на доске, ни в предупреждениях', () => {
  // Arrange
  const cards = [
    card(1, { size: 5, sp: 3, platforms: [BACK], testType: [NEED_QA], type: WEB_BUG }),
    card(2, { size: 2, platforms: [FRONT], type: WEB_BUG }),
    card(3, { type: WEB_BUG }),
    card(4, { size: 4, sp: 3, platforms: [BACK] }),
  ];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.deepEqual(totals(report), [3, 0, 1]);
  assert.deepEqual([report.board.cards.length, report.warnings.length, report.notCounted.cards.length], [1, 0, 0]);
  assert.deepEqual(report.bugs.cards.map((item) => item.id), [1, 2, 3]);
  assert.equal(report.bugs.points, 7);
});

test('на снимке 28.09 баги без оценок: цифры те же, замечаний по багам нет', () => {
  // Arrange
  const bugIds = [68758713, 70018912, 71017744, 71041106, 71095376, 71095381, 71095385, 71095389];
  const cards = fixture.cards.map((item) => (bugIds.includes(item.id) ? { ...item, type_id: WEB_BUG.id } : item));

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.deepEqual(totals(report), [48, 6, 19]);
  assert.equal(report.notCounted.points, 0);
  assert.equal(report.board.cards.length, 19);
  assert.equal(report.bugs.cards.length, 8);
  assert.equal(report.bugs.points, 0);
  assert.ok(report.warnings.every((warning) => !bugIds.includes(warning.item.id)));
});

test('платформа: Backend важнее Frontend, без них разработка не считается', () => {
  // Arrange
  const cards = [
    card(1, { size: 10, sp: 5, platforms: [BACK, FRONT, MOBILE] }),
    card(2, { size: 3, sp: 2, platforms: [FRONT, MOBILE] }),
    card(3, { size: 4, sp: 3, platforms: [MOBILE] }),
  ];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.deepEqual(totals(report), [5, 2, 7]);
  assert.equal(report.notCounted.points, 3);
  assert.ok(report.warnings.some((warning) => warning.item.id === 3 && warning.issue === 'noPlatform'));
});

test('предупреждения по оценкам', () => {
  // Arrange
  const cases = [
    [{ size: 2, sp: 3 }, 'back', false, []],
    [{ size: 3, sp: null }, 'back', false, []],
    [{ size: null, sp: 2 }, 'back', false, []],
    [{ size: 5, sp: 3 }, 'back', false, []],
    [{ size: null, sp: null }, null, true, ['noEstimate']],
    [{ size: 3, sp: null }, null, false, ['noPlatform']],
    [{ size: 2, sp: 2 }, 'front', true, ['needQaWithoutQa']],
    [{ size: 3, sp: null }, 'back', true, ['needQaWithoutQa']],
    [{ size: 3, sp: 2 }, 'front', true, []],
  ];

  // Act
  const actual = cases.map(([estimate, platform, needQa]) => core.estimateIssues(estimate, platform, needQa));

  // Assert
  assert.deepEqual(actual, cases.map((item) => item[3]));
});

test('две оценки: большая — общая с QA, меньшая — разработка, в каком бы поле ни стояли', () => {
  // Arrange
  const cards = [
    card(1, { size: 2, sp: 3, platforms: [BACK], testType: [NEED_QA] }),
    card(2, { size: 8, sp: 5, platforms: [FRONT] }),
  ];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.deepEqual(totals(report), [2, 5, 4]);
  assert.deepEqual(report.warnings, []);
});

test('одна оценка — целиком в разработку, в каком бы поле ни стояла', () => {
  // Arrange
  const cards = [
    card(1, { size: 3, platforms: [BACK] }),
    card(2, { sp: 2, platforms: [FRONT], testType: [NEED_QA] }),
  ];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.deepEqual(totals(report), [3, 2, 0]);
  assert.equal(report.notCounted.points, 0);
  assert.deepEqual(report.warnings.map((warning) => [warning.item.id, warning.issue]), [[2, 'needQaWithoutQa']]);
});

test('возможные SP: люди × (рабочие дни − праздники) − отсутствия, умножить на коэффициент', () => {
  // Arrange
  const settings = core.normalizeSettings({
    workDays: 10,
    holidays: 1,
    coefficient: '0,5',
    team: { back: { people: 3, absence: 4 }, front: { people: 1, absence: 20 }, qa: { people: 0 } },
  });

  // Act
  const report = core.buildReport({ cards: [], settings });

  // Assert
  assert.deepEqual(report.rows.map((row) => row.capacity), [11.5, 0, null]);
});

test('строка итога: нагрузка из возможных', () => {
  // Arrange
  const row = { direction: 'back', total: 33, capacity: 28, over: true };

  // Act
  const text = core.formatRow(row);

  // Assert
  assert.equal(text, 'Бэк: 33 из 28');
  assert.equal(core.formatRow({ ...row, direction: 'qa', total: 29.5, capacity: null }), 'QA: 29,5 из —');
});

test('нет полей Story Points и Platform ни в одной карте — явная ошибка', () => {
  // Arrange
  const cards = [{ id: 1, size: 3, properties: {}, state: 1 }];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });

  // Assert
  assert.equal(report.problems.length, 2);
});

test('настройки: мусор и отрицательные числа заменяются значениями по умолчанию', () => {
  // Arrange
  const raw = { workDays: 'abc', holidays: -1, coefficient: '', team: { back: { people: '2', absence: '1,5' } } };

  // Act
  const settings = core.normalizeSettings(raw);

  // Assert
  assert.equal(settings.workDays, 10);
  assert.equal(settings.holidays, 0);
  assert.equal(settings.coefficient, 1);
  assert.deepEqual(settings.team.back, { people: 2, absence: 1.5 });
  assert.deepEqual(settings.team.qa, { people: 0, absence: 0 });
});

test('склонение слова «карта»', () => {
  // Arrange
  const forms = ['карта', 'карты', 'карт'];

  // Act
  const actual = [1, 2, 5, 11, 21, 24, 112].map((count) => core.plural(count, forms));

  // Assert
  assert.deepEqual(actual, ['карта', 'карты', 'карт', 'карт', 'карта', 'карты', 'карт']);
});
