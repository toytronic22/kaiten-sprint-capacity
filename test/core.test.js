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
const CORE_BOARD = 68084;
const MOBILE_BOARD = 1321013;

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

test('Done входит в нагрузку и считается отдельно: SP и процент по числу карт всей доски', () => {
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
  assert.equal(report.done.percent, 50);
});

test('процент Done — по картам с багами, до целого: карта без оценки тоже карта, без карт процента нет', () => {
  // Arrange
  const third = [card(1, { size: 5, platforms: [BACK] }), card(2, { platforms: [BACK] }), card(3, { size: 1, platforms: [BACK], state: DONE })];
  const twoThirds = [card(1, { size: 5, platforms: [BACK] }), card(2, { platforms: [BACK], state: DONE }), card(3, { size: 1, platforms: [BACK], state: DONE })];
  const bugs = [card(1, { size: 2, platforms: [BACK], state: DONE, type: WEB_BUG }), card(2, { type: WEB_BUG })];

  // Act
  const percents = [third, twoThirds, bugs, []].map((cards) => core.buildReport({ cards, settings: core.defaultSettings() }).done.percent);

  // Assert
  assert.deepEqual(percents, [33, 67, 50, null]);
});

test('пришла новая карта — процент Done уменьшается', () => {
  // Arrange
  const board = [card(1, { size: 2, platforms: [BACK], state: DONE }), card(2, { size: 2, platforms: [BACK] })];

  // Act
  const before = core.buildReport({ cards: board, settings: core.defaultSettings() }).done.percent;
  const after = core.buildReport({ cards: [...board, card(3, { size: 1, platforms: [FRONT] })], settings: core.defaultSettings() }).done.percent;

  // Assert
  assert.deepEqual([before, after], [50, 33]);
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

test('баг в Done: в проценте считается картой, в SP Done — нет', () => {
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
  assert.deepEqual([report.done.points, report.done.count, report.done.of, report.done.percent], [3, 2, 3, 67]);
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

test('начало планирования: осталось — всё, что не в Done, дальше растёт «прибавилось»', () => {
  // Arrange
  const start = [card(1, { size: 6, sp: 3, platforms: [BACK] }), card(2, { size: 2, platforms: [FRONT] }), card(4, { size: 9, sp: 5, platforms: [BACK], state: DONE })];
  const later = [card(1, { size: 6, sp: 3, platforms: [BACK], state: DONE }), card(3, { size: 5, sp: 4, platforms: [BACK] })];
  const snapshot = core.takeSnapshot({ cards: start, settings: core.defaultSettings(), now: Date.parse('2026-09-29T09:00:00.000Z'), boardId: CORE_BOARD });

  // Act
  const report = core.buildReport({ cards: later, settings: settingsWith({ back: { people: 1 } }), snapshot });

  // Assert
  assert.deepEqual(snapshot, { boardId: CORE_BOARD, takenAt: '2026-09-29T09:00:00.000Z', totals: { back: 3, front: 2, qa: 3 }, doneIds: [4] });
  assert.deepEqual(report.rows.map(core.formatRow), ['Бэк: 3 + 4 = 7 из 10', 'Фронт: 2 − 2 = 0 из —', 'QA: 3 + 1 = 4 из —']);
  assert.deepEqual([report.done.points, report.board.points, report.done.percent], [6, 11, 50]);
});

test('спринт закрыли в конце планирования: карты, бывшие в Done, не считаются, пока не уйдут в архив', () => {
  // Arrange
  const old = card(4, { size: 9, sp: 5, platforms: [BACK], state: DONE });
  const oldBug = card(6, { state: DONE, type: WEB_BUG });
  const tail = card(1, { size: 6, sp: 3, platforms: [BACK] });
  const snapshot = core.takeSnapshot({ cards: [old, oldBug, tail], settings: core.defaultSettings(), now: 0, boardId: CORE_BOARD });
  const planned = card(5, { size: 3, platforms: [FRONT] });

  // Act
  const beforeClose = core.buildReport({ cards: [old, oldBug, tail, planned], settings: core.defaultSettings(), snapshot });
  const afterClose = core.buildReport({ cards: [tail, planned], settings: core.defaultSettings(), snapshot });

  // Assert
  for (const report of [beforeClose, afterClose]) {
    assert.deepEqual(report.rows.map(core.formatRow), ['Бэк: 3 + 0 = 3 из —', 'Фронт: 0 + 3 = 3 из —', 'QA: 3 + 0 = 3 из —']);
    assert.deepEqual([report.done.points, report.board.points, report.done.of, report.done.percent], [0, 9, 2, 0]);
  }
});

test('переоценка хвоста и смена оценки в спринте идут в «прибавилось»', () => {
  // Arrange
  const snapshot = core.takeSnapshot({ cards: [card(1, { size: 6, sp: 3, platforms: [BACK] })], settings: core.defaultSettings(), now: 0, boardId: CORE_BOARD });

  // Act
  const report = core.buildReport({ cards: [card(1, { size: 10, sp: 5, platforms: [BACK] })], settings: core.defaultSettings(), snapshot });

  // Assert
  assert.deepEqual(report.rows.map(core.formatRow), ['Бэк: 3 + 2 = 5 из —', 'Фронт: 0 + 0 = 0 из —', 'QA: 3 + 2 = 5 из —']);
});

test('карту, бывшую в Done, вернули в работу — снова считается', () => {
  // Arrange
  const snapshot = core.takeSnapshot({ cards: [card(4, { size: 2, platforms: [BACK], state: DONE })], settings: core.defaultSettings(), now: 0, boardId: CORE_BOARD });

  // Act
  const report = core.buildReport({ cards: [card(4, { size: 2, platforms: [BACK] })], settings: core.defaultSettings(), snapshot });

  // Assert
  assert.deepEqual(report.rows.map(core.formatRow)[0], 'Бэк: 0 + 2 = 2 из —');
});

test('доска Staff Mobile: вместо фронта Mobile по тегу Mobile, Frontend не считается', () => {
  // Arrange
  const cards = [
    card(1, { size: 5, sp: 3, platforms: [MOBILE] }),
    card(2, { size: 2, platforms: [FRONT] }),
    card(3, { size: 4, platforms: [BACK, MOBILE] }),
  ];

  // Act
  const mobile = core.buildReport({ cards, settings: core.defaultSettings(), config: core.boardConfig(MOBILE_BOARD) });
  const coreBoard = core.buildReport({ cards, settings: core.defaultSettings(), config: core.boardConfig(CORE_BOARD) });

  // Assert
  assert.deepEqual(mobile.rows.map(core.formatRow), ['Бэк: 4 из —', 'Mobile: 3 из —', 'QA: 2 из —']);
  assert.deepEqual(mobile.warnings.map((warning) => [warning.issue, warning.item.id]), [['noPlatform', 2]]);
  assert.deepEqual(coreBoard.rows.map(core.formatRow), ['Бэк: 4 из —', 'Фронт: 2 из —', 'QA: 2 из —']);
  assert.deepEqual(coreBoard.warnings.map((warning) => [warning.issue, warning.item.id]), [['noPlatform', 1]]);
});

test('беспредел: сейчас вдвое больше возможного', () => {
  // Arrange
  const row = (total, capacity) => ({ direction: 'back', total, capacity });

  // Act
  const actual = [row(20, 10), row(25, 10), row(19.9, 10), row(48, null), row(5, 0)].map(core.isChaos);

  // Assert
  assert.deepEqual(actual, [true, true, false, false, false]);
});

test('беспредел: трещит тот, у кого вдвое больше, на мобилке Mobile', () => {
  // Arrange
  const rows = [
    { direction: 'back', total: 30, capacity: 10 },
    { direction: 'front', total: 8, capacity: 4 },
    { direction: 'qa', total: 15, capacity: 10 },
  ];

  // Act
  const coreNames = core.chaosNames(rows, core.boardConfig(CORE_BOARD));
  const mobileNames = core.chaosNames(rows, core.boardConfig(MOBILE_BOARD));
  const qaOnly = core.chaosNames([{ direction: 'back', total: 5, capacity: 10 }, { direction: 'qa', total: 20, capacity: 10 }], core.boardConfig(CORE_BOARD));

  // Assert
  assert.deepEqual(coreNames, ['Бэк', 'Frontend']);
  assert.deepEqual(mobileNames, ['Бэк', 'Mobile']);
  assert.deepEqual(qaOnly, ['QA']);
});

test('гуси: вместо Overload пишется, кто трещит, а без имён остаётся Overload', () => {
  // Arrange
  const cases = [[], ['QA'], ['Бэк', 'Frontend'], ['Бэк', 'Mobile', 'QA']];

  // Act
  const labels = cases.map(core.chaosLabel);

  // Assert
  assert.deepEqual(labels, ['Overload', 'QA', 'Бэк и Frontend', 'Бэк, Mobile и QA']);
});

test('конец планирования: всё, что прилетело после, считается отдельно «сверху» и остаётся в «прибавилось»', () => {
  // Arrange
  const start = [card(1, { size: 6, sp: 3, platforms: [BACK] }), card(4, { size: 9, sp: 5, platforms: [BACK], state: DONE })];
  const planned = [...start, card(2, { size: 4, platforms: [FRONT] })];
  const later = [card(1, { size: 10, sp: 5, platforms: [BACK] }), card(2, { size: 4, platforms: [FRONT], state: DONE }), card(3, { size: 2, platforms: [BACK] })];
  const snapshot = core.takeSnapshot({ cards: start, settings: core.defaultSettings(), now: Date.parse('2026-09-29T09:00:00.000Z'), boardId: CORE_BOARD });
  const planEnd = core.takePlanEnd({ cards: planned, snapshot, now: Date.parse('2026-09-29T11:00:00.000Z'), boardId: CORE_BOARD });

  // Act
  const report = core.buildReport({ cards: later, settings: core.defaultSettings(), snapshot, planEnd });
  const noEnd = core.buildReport({ cards: later, settings: core.defaultSettings(), snapshot });

  // Assert
  assert.deepEqual(planEnd, { boardId: CORE_BOARD, takenAt: '2026-09-29T11:00:00.000Z', startedAt: '2026-09-29T09:00:00.000Z', totals: { back: 3, front: 4, qa: 3 } });
  assert.deepEqual(report.rows.map(core.formatRow), ['Бэк: 3 + 4 = 7 из —, сверху +4', 'Фронт: 0 + 4 = 4 из —, сверху +0', 'QA: 3 + 2 = 5 из —, сверху +2']);
  assert.deepEqual(noEnd.rows.map((row) => row.top), [null, null, null]);
});

test('конец планирования: пишется комментарием и действует только до нового начала планирования', () => {
  // Arrange
  const snapshot = { boardId: MOBILE_BOARD, takenAt: '2026-09-29T09:00:00.000Z', totals: { back: 1, front: 1, qa: 1 }, doneIds: [] };
  const planEnd = { boardId: MOBILE_BOARD, takenAt: '2026-09-29T11:00:00.000Z', startedAt: snapshot.takenAt, totals: { back: 20, front: 6.5, qa: 12 } };
  const comment = { text: core.planEndComment(planEnd), created: '2026-09-29T11:00:01Z', author: { full_name: 'Aleksey Martynov' } };
  const older = { text: core.planEndComment({ ...planEnd, totals: { back: 2, front: 2, qa: 2 } }), created: '2026-09-29T10:00:00Z' };
  const deleted = { text: core.planEndComment({ ...planEnd, totals: { back: 9, front: 9, qa: 9 } }), created: '2026-09-29T12:00:00Z', deleted: true };
  const broken = { text: 'Конец планирования. ```json\n{"totals":\n```', created: '2026-09-29T13:00:00Z' };
  const start = { text: core.snapshotComment(snapshot), created: '2026-09-29T09:00:01Z' };
  const comments = [older, comment, deleted, broken, start];

  // Act
  const actual = core.planEndFromComments(comments, snapshot);

  // Assert
  assert.ok(comment.text.startsWith('Конец планирования, Staff Mobile. После планирования: Бэк 20 · Mobile 6,5 · QA 12.'));
  assert.deepEqual(actual, { ...planEnd, author: 'Aleksey Martynov' });
  assert.deepEqual(core.snapshotFromComments(comments, MOBILE_BOARD).totals, snapshot.totals);
  assert.equal(core.planEndFromComments(comments, { ...snapshot, takenAt: '2026-09-30T09:00:00.000Z' }), null);
  assert.equal(core.planEndFromComments(comments, { ...snapshot, boardId: CORE_BOARD }), null);
  assert.equal(core.planEndFromComments(comments, null), null);
});

test('capacity в снимке и конце планирования: чел.-дни направлений с людьми из «Команды и дней», без людей — ключа нет', () => {
  // Arrange
  const settings = settingsWith({ back: { people: 2 }, qa: { people: 1, absence: 2.5 } });
  const cards = [card(1, { size: 6, sp: 3, platforms: [BACK] })];

  // Act
  const snapshot = core.takeSnapshot({ cards, settings, now: Date.parse('2026-09-29T09:00:00.000Z'), boardId: MOBILE_BOARD });
  const planEnd = core.takePlanEnd({ cards, snapshot, settings: settingsWith({ back: { people: 2, absence: 4 } }), now: Date.parse('2026-09-29T11:00:00.000Z'), boardId: MOBILE_BOARD });
  const empty = core.takeSnapshot({ cards, settings: core.defaultSettings(), now: 0, boardId: MOBILE_BOARD });

  // Assert
  assert.deepEqual([snapshot.capacity, planEnd.capacity, 'capacity' in empty], [{ back: 20, qa: 7.5 }, { back: 16 }, false]);
  assert.ok(core.snapshotComment(snapshot).startsWith('Снимок начала планирования, Staff Mobile. Осталось: Бэк 3 · Mobile 0 · QA 3. Capacity, чел.-дн.: Бэк 20 · QA 7,5.\n'));
  assert.ok(core.planEndComment(planEnd).startsWith('Конец планирования, Staff Mobile. После планирования: Бэк 3 · Mobile 0 · QA 3. Capacity, чел.-дн.: Бэк 16.\n'));
  assert.ok(core.snapshotComment(empty).startsWith('Снимок начала планирования, Staff Mobile. Осталось: Бэк 3 · Mobile 0 · QA 3.\n'));
});

test('capacity в снимке: хорошая читается обратно, отрицательная, нечисловая и пустая отбрасываются без порчи снимка', () => {
  // Arrange
  const good = { boardId: CORE_BOARD, takenAt: '2026-09-29T09:00:00.000Z', totals: { back: 3, front: 0, qa: 1 }, doneIds: [] };
  const bad = [{ back: -1, qa: 5 }, { back: 'много' }, {}, 'capacity', null];

  // Act
  const kept = core.normalizeSnapshot({ ...good, capacity: { back: '36', front: 18, qa: 0, extra: 5 } });
  const dropped = bad.map((capacity) => core.normalizeSnapshot({ ...good, capacity }));

  // Assert
  assert.deepEqual(kept.capacity, { back: 36, front: 18, qa: 0 });
  assert.deepEqual(dropped, bad.map(() => good));
});

test('журнал capacity из служебной карты: старт из снимков, конец из «Конца планирования», без capacity, удалённые и испорченные пропускаются', () => {
  // Arrange
  const start = { boardId: CORE_BOARD, takenAt: '2026-09-28T09:00:00.000Z', totals: { back: 1, front: 1, qa: 1 }, doneIds: [], capacity: { back: 30, front: 18 } };
  const end = { boardId: MOBILE_BOARD, takenAt: '2026-09-28T12:00:00.000Z', startedAt: start.takenAt, totals: { back: 2, front: 2, qa: 2 }, capacity: { back: 20, qa: 7.5 } };
  const comments = [
    { text: core.snapshotComment(start), created: '2026-09-28T09:00:01Z', author: { full_name: 'Aleksey Martynov' } },
    { text: core.planEndComment(end), created: '2026-09-28T12:00:01Z' },
    { text: core.snapshotComment({ ...start, capacity: undefined }), created: '2026-09-28T10:00:00Z' },
    { text: core.planEndComment({ ...end, capacity: { back: 99 } }), created: '2026-09-28T13:00:00Z', deleted: true },
    { text: 'Конец планирования. ```json\n{"totals":\n```', created: '2026-09-28T14:00:00Z' },
  ];

  // Act
  const log = core.capacityLogFromComments(comments);

  // Assert
  assert.deepEqual(log, [
    { kind: 'start', at: Date.parse(start.takenAt), boardId: CORE_BOARD, days: { back: 30, front: 18 } },
    { kind: 'end', at: Date.parse(end.takenAt), boardId: MOBILE_BOARD, days: { back: 20, qa: 7.5 } },
  ]);
  assert.deepEqual([core.capacityLogFromComments([]), core.capacityLogFromComments(null)], [[], []]);
});

test('процент Done по SP: SP в Done от SP доски, баги не считаются', () => {
  // Arrange
  const cards = [card(1, { size: 6, sp: 3, platforms: [BACK], state: DONE }), card(2, { size: 2, platforms: [FRONT] }), card(3, { size: 1, platforms: [FRONT] }), card(4, { size: 8, state: DONE, type: WEB_BUG })];

  // Act
  const report = core.buildReport({ cards, settings: core.defaultSettings() });
  const empty = core.buildReport({ cards: [card(5, { state: DONE })], settings: core.defaultSettings() });

  // Assert
  assert.deepEqual([report.done.percent, report.done.pointsPercent], [50, 67]);
  assert.equal(empty.done.pointsPercent, null);
});

test('снимок: испорченный или без доски не принимается', () => {
  // Arrange
  const good = { boardId: CORE_BOARD, takenAt: '2026-09-29T09:00:00.000Z', totals: { back: '3', front: 0, qa: 1.5 }, doneIds: [4, 'x', 5] };
  const broken = [null, 'снимок', { ...good, totals: undefined }, { ...good, takenAt: undefined }, { ...good, boardId: undefined }, { ...good, totals: { back: 3, front: 'abc', qa: 1 } }];

  // Act
  const actual = broken.map((raw) => core.normalizeSnapshot(raw));

  // Assert
  assert.deepEqual(core.normalizeSnapshot(good), { boardId: CORE_BOARD, takenAt: good.takenAt, totals: { back: 3, front: 0, qa: 1.5 }, doneIds: [4, 5] });
  assert.deepEqual(core.normalizeSnapshot({ ...good, doneIds: undefined }).doneIds, []);
  assert.deepEqual(actual, [null, null, null, null, null, null]);
});

test('общий снимок: пишется комментарием в Kaiten с названием доски и читается обратно', () => {
  // Arrange
  const snapshot = { boardId: MOBILE_BOARD, takenAt: '2026-09-29T09:00:00.000Z', totals: { back: 20, front: 6.5, qa: 12 }, doneIds: [4, 5] };
  const comment = { text: core.snapshotComment(snapshot), created: '2026-09-29T09:00:01Z', author: { full_name: 'Aleksey Martynov' } };

  // Act
  const actual = core.snapshotFromComments([comment], MOBILE_BOARD);

  // Assert
  assert.ok(comment.text.startsWith('Снимок начала планирования, Staff Mobile. Осталось: Бэк 20 · Mobile 6,5 · QA 12.'));
  assert.deepEqual(actual, { ...snapshot, author: 'Aleksey Martynov' });
});

test('общий снимок: берётся последний своей доски, удалённые, чужие и испорченные комментарии не считаются', () => {
  // Arrange
  const make = (back, created, boardId, extra = {}) => ({ text: core.snapshotComment({ boardId, takenAt: created, totals: { back, front: 0, qa: 0 }, doneIds: [] }), created, ...extra });
  const older = make(1, '2026-09-01T09:00:00Z', CORE_BOARD);
  const newer = make(2, '2026-09-15T09:00:00Z', CORE_BOARD);
  const mobile = make(7, '2026-09-16T09:00:00Z', MOBILE_BOARD);
  const deleted = make(3, '2026-09-20T09:00:00Z', CORE_BOARD, { deleted: true });
  const other = { text: 'Здесь панель хранит снимки', created: '2026-09-25T09:00:00Z' };
  const broken = { text: 'Снимок начала планирования. ```json\n{"totals":\n```', created: '2026-09-28T09:00:00Z' };

  // Act
  const core1 = core.snapshotFromComments([newer, other, deleted, older, mobile, broken], CORE_BOARD);
  const mobile1 = core.snapshotFromComments([newer, other, deleted, older, mobile, broken], MOBILE_BOARD);

  // Assert
  assert.deepEqual([core1.totals.back, mobile1.totals.back], [2, 7]);
  assert.deepEqual([core.snapshotFromComments([], CORE_BOARD), core.snapshotFromComments(null, CORE_BOARD), core.snapshotFromComments([older], MOBILE_BOARD)], [null, null, null]);
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

function inColumn(item, title) {
  return { ...item, column: { title } };
}

function progressOf(cards, options = {}) {
  return core.buildReport({ cards, settings: core.defaultSettings(), ...options }).progress;
}

test('прогресс спринта: вес карты — её SP, готовность — по колонке', () => {
  // Arrange
  const cards = [
    inColumn(card(1, { size: 2, sp: 2 }), 'To Do'),
    inColumn(card(2, { size: 10, sp: 5 }), 'Doing'),
    inColumn(card(3, { size: 4 }), 'Review'),
    inColumn(card(4, { sp: 5 }), 'Test'),
    inColumn(card(5, { size: 3, sp: 3 }), 'Waiting for release'),
    inColumn(card(6, { size: 6, sp: 6, state: DONE }), 'Done'),
  ];

  // Act
  const progress = progressOf(cards);

  // Assert
  assert.deepEqual([progress.points, progress.done, progress.percent], [30, 18.5, 62]);
  assert.deepEqual(progress.unknown, []);
});

test('прогресс спринта: Design Review готова, как Test, на 80%', () => {
  // Arrange
  const cards = [inColumn(card(1, { size: 5 }), 'Design Review'), inColumn(card(2, { size: 5 }), 'To Do')];

  // Act
  const progress = progressOf(cards);

  // Assert
  assert.equal(progress.percent, 40);
});

test('прогресс спринта: любой баг весит 1 SP, даже с оценкой; карта без оценки — тоже 1 SP', () => {
  // Arrange
  const cards = [
    inColumn(card(1, { size: 8, sp: 5, type: WEB_BUG }), 'Doing'),
    inColumn(card(2, { type: WEB_BUG }), 'Done'),
    inColumn(card(3), 'Review'),
    inColumn(card(4, { size: 1, sp: 1 }), 'To Do'),
  ];

  // Act
  const progress = progressOf(cards);

  // Assert
  assert.deepEqual([progress.points, progress.percent], [4, 49]);
});

test('прогресс спринта: изменились SP — прогресс пересчитан', () => {
  // Arrange
  const done = inColumn(card(1, { size: 2, sp: 2, state: DONE }), 'Done');
  const before = inColumn(card(2, { size: 2, sp: 2 }), 'To Do');
  const after = inColumn(card(2, { size: 6, sp: 3 }), 'To Do');

  // Act
  const was = progressOf([done, before]);
  const now = progressOf([done, after]);

  // Assert
  assert.deepEqual([was.percent, now.percent], [50, 25]);
});

test('прогресс спринта: незнакомая колонка считается как To Do и называется; регистр и пробелы не мешают', () => {
  // Arrange
  const cards = [
    inColumn(card(1, { size: 3 }), 'Blocked'),
    inColumn(card(2, { size: 1 }), '  waiting   for  RELEASE '),
    inColumn(card(3, { size: 1 }), ''),
    card(4, { size: 1, state: DONE }),
  ];

  // Act
  const progress = progressOf(cards);

  // Assert
  assert.equal(progress.percent, 33);
  assert.deepEqual(progress.unknown, [{ id: 1, title: 'Карта 1', column: 'Blocked' }, { id: 3, title: 'Карта 3', column: '' }]);
});

test('прогресс спринта: карта в Done считается готовой по состоянию, бывшие в Done на начало спринта не считаются', () => {
  // Arrange
  const old = inColumn(card(1, { size: 20, state: DONE }), 'Done');
  const finished = inColumn(card(2, { size: 2, state: DONE }), 'Архив');
  const open = inColumn(card(3, { size: 2 }), 'To Do');
  const snapshot = core.takeSnapshot({ cards: [old, open], settings: core.defaultSettings(), now: 0, boardId: CORE_BOARD });

  // Act
  const progress = progressOf([old, finished, open], { snapshot });

  // Assert
  assert.deepEqual([progress.points, progress.percent, progress.unknown], [4, 50, []]);
});

test('прогресс спринта: без карт процента нет, карты с оценкой 0 не весят', () => {
  // Act
  const empty = progressOf([]);
  const zero = progressOf([inColumn(card(1, { size: 0, sp: 0 }), 'Done')]);

  // Assert
  assert.equal(empty.percent, null);
  assert.deepEqual([zero.points, zero.percent], [0, null]);
});

test('прогресс спринта 28.09–11.10 на доске Staff Core 30.09: 32%', () => {
  // Arrange
  const rows = [
    ['Doing', 13, 8, 0], ['Doing', null, null, 1], ['Doing', 2, 2, 0], ['To Do', 2, 2, 0], ['Review', 2, null, 0], ['To Do', 3, 3, 0],
    ['Done', null, null, 1], ['To Do', 3, 2, 0], ['Review', 6, 3, 0], ['Waiting for release', 5, 3, 0], ['Review', 5, 2, 0],
    ['Waiting for release', 2, 3, 0], ['Doing', 10, 5, 0], ['Test', null, null, 1], ['To Do', 8, 5, 0], ['To Do', 7, 5, 0],
    ['To Do', 5, 5, 0], ['To Do', 1, 1, 0], ['To Do', null, null, 1], ['To Do', 1, 1, 0], ['Test', null, null, 1], ['Test', null, null, 1],
    ['Waiting for release', null, null, 1], ['Waiting for release', null, null, 1], ['To Do', 3, 3, 0], ['Doing', 2, 1, 0],
    ['To Do', 2, 1, 0], ['Test', null, null, 1], ['To Do', 2, 1, 0], ['To Do', 1, 1, 0],
  ];
  const cards = rows.map(([column, size, sp, bug], index) => inColumn(card(index + 1, { size, sp, state: column === 'Done' ? DONE : 2, type: bug ? WEB_BUG : null }), column));

  // Act
  const progress = progressOf(cards);

  // Assert
  assert.deepEqual([progress.points, progress.percent], [95, 32]);
});
