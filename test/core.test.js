const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('./fixtures/planning-2026-09-28.json');
const core = require('../src/core.js');

const BACK = 16232407;
const FRONT = 16232408;
const MOBILE = 16237830;
const NEED_QA = 16238652;
const WEB_BUG = { id: 446247, name: 'WEB bug' };

function card(id, { size = null, sp = null, platforms = [], testType = [], state = 1, sprint = null, type = null } = {}) {
  const properties = {};
  if (sp !== null) properties.id_396449 = String(sp);
  if (platforms.length) properties.id_499149 = platforms;
  if (testType.length) properties.id_505017 = testType;
  return { id, title: `Карта ${id}`, size, properties, state, sprint_id: sprint, column_id: 1, type_id: type ? type.id : null, type };
}

function settingsWith(team) {
  return core.normalizeSettings({ team });
}

function rowsByDirection(report) {
  return Object.fromEntries(report.rows.map((row) => [row.direction, row]));
}

test('на снимке планирования 28.09 хвосты и добавленные совпадают с ручной сверкой', () => {
  // Arrange
  const settings = settingsWith({ back: { people: 3 }, front: { people: 1 }, qa: { people: 1 } });

  // Act
  const report = core.buildReport({ cards: fixture.cards, previous: fixture.previousSprint, settings });
  const rows = rowsByDirection(report);

  // Assert
  assert.deepEqual([rows.back.tail, rows.front.tail, rows.qa.tail], [8, 2, 5]);
  assert.deepEqual([rows.back.added, rows.front.added, rows.qa.added], [31, 4, 14]);
  assert.equal(report.notCounted.points, 9);
  assert.equal(report.notCounted.cards.length, 4);
  assert.equal(report.problems.length, 0);
});

test('переоценённые на планировании хвосты считаются добавленными', () => {
  // Arrange
  const settings = core.defaultSettings();

  // Act
  const report = core.buildReport({ cards: fixture.cards, previous: fixture.previousSprint, settings });
  const reestimated = report.added.filter((item) => item.before).map((item) => item.id).sort();

  // Assert
  assert.deepEqual(reestimated, [70271594, 70314822, 70935504]);
  assert.deepEqual(report.tails.map((item) => item.id).sort(), [64631102, 68758713, 68898872, 69645690, 70686961, 70851370, 71017744]);
});

test('вписанный остаток хвоста заменяет полную оценку', () => {
  // Arrange
  const settings = core.defaultSettings();
  const remainders = { 64631102: { dev: '3', qa: '1,5' }, 69645690: { dev: 1 } };

  // Act
  const report = core.buildReport({ cards: fixture.cards, previous: fixture.previousSprint, settings, remainders });
  const rows = rowsByDirection(report);

  // Assert
  assert.equal(rows.back.tail, 4);
  assert.equal(rows.qa.tail, 1.5);
  assert.equal(report.notCounted.points, 7);
});

test('пустой остаток возвращает полную оценку', () => {
  // Arrange
  const settings = core.defaultSettings();
  const remainders = { 64631102: { dev: '', qa: null } };

  // Act
  const report = core.buildReport({ cards: fixture.cards, previous: fixture.previousSprint, settings, remainders });

  // Assert
  assert.equal(rowsByDirection(report).back.tail, 8);
});

test('без прошлого спринта все карты считаются добавленными', () => {
  // Arrange
  const settings = core.defaultSettings();

  // Act
  const report = core.buildReport({ cards: fixture.cards, previous: null, settings });
  const rows = rowsByDirection(report);

  // Assert
  assert.equal(report.tails.length, 0);
  assert.deepEqual([rows.back.added, rows.front.added, rows.qa.added], [39, 6, 19]);
});

test('карты в Done не считаются, пока не включена галочка', () => {
  // Arrange
  const cards = [card(1, { size: 5, sp: 3, platforms: [BACK] }), card(2, { size: 4, sp: 2, platforms: [BACK], state: 3 })];

  // Act
  const without = core.buildReport({ cards, previous: null, settings: core.normalizeSettings({}) });
  const withDone = core.buildReport({ cards, previous: null, settings: core.normalizeSettings({ includeDone: true }) });

  // Assert
  assert.equal(rowsByDirection(without).back.added, 3);
  assert.equal(without.done.cards.length, 1);
  assert.equal(without.done.size, 4);
  assert.equal(rowsByDirection(withDone).back.added, 5);
  assert.equal(rowsByDirection(withDone).qa.added, 4);
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

test('баг не считается: ни в суммах, ни в хвостах, ни в предупреждениях', () => {
  // Arrange
  const cards = [
    card(1, { size: 5, sp: 3, platforms: [BACK], testType: [NEED_QA], sprint: 11, type: WEB_BUG }),
    card(2, { size: 2, platforms: [FRONT], type: WEB_BUG }),
    card(3, { type: WEB_BUG }),
    card(4, { size: 4, sp: 3, platforms: [BACK] }),
  ];
  const previous = {
    id: 10,
    finish_date: '2026-09-27T20:59:59.999Z',
    cardUpdates: [{ id: 1, sprint_id: 10, updated: '2026-09-20T10:00:00.000Z', size: 5, properties: { id_396449: '3' }, version: 1 }],
  };

  // Act
  const report = core.buildReport({ cards, previous, settings: core.defaultSettings() });
  const rows = rowsByDirection(report);

  // Assert
  assert.deepEqual([rows.back.tail, rows.back.added, rows.front.added, rows.qa.tail, rows.qa.added], [0, 3, 0, 0, 1]);
  assert.deepEqual([report.tails.length, report.added.length, report.warnings.length, report.notCounted.cards.length], [0, 1, 0, 0]);
  assert.deepEqual(report.bugs.cards.map((item) => item.id), [1, 2, 3]);
  assert.equal(report.bugs.points, 7);
});

test('баг в Done уходит в баги, а не в Done, и с галочкой тоже', () => {
  // Arrange
  const cards = [card(1, { size: 4, sp: 2, platforms: [BACK], state: 3, type: WEB_BUG }), card(2, { size: 3, sp: 1, platforms: [BACK], state: 3 })];

  // Act
  const without = core.buildReport({ cards, previous: null, settings: core.normalizeSettings({}) });
  const withDone = core.buildReport({ cards, previous: null, settings: core.normalizeSettings({ includeDone: true }) });

  // Assert
  assert.deepEqual(without.done.cards.map((item) => item.id), [2]);
  assert.equal(without.done.size, 3);
  assert.equal(rowsByDirection(withDone).back.added, 1);
  assert.equal(rowsByDirection(withDone).qa.added, 2);
  assert.equal(withDone.bugs.cards.length, 1);
});

test('на снимке 28.09 баги без оценок: цифры те же, хвостов-багов и замечаний по ним нет', () => {
  // Arrange
  const bugIds = [68758713, 70018912, 71017744, 71041106, 71095376, 71095381, 71095385, 71095389];
  const cards = fixture.cards.map((item) => (bugIds.includes(item.id) ? { ...item, type_id: WEB_BUG.id } : item));
  const settings = settingsWith({ back: { people: 3 }, front: { people: 1 }, qa: { people: 1 } });

  // Act
  const report = core.buildReport({ cards, previous: fixture.previousSprint, settings });
  const rows = rowsByDirection(report);

  // Assert
  assert.deepEqual([rows.back.tail, rows.front.tail, rows.qa.tail], [8, 2, 5]);
  assert.deepEqual([rows.back.added, rows.front.added, rows.qa.added], [31, 4, 14]);
  assert.equal(report.notCounted.points, 9);
  assert.deepEqual(report.tails.map((item) => item.id).sort(), [64631102, 68898872, 69645690, 70686961, 70851370]);
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
  const report = core.buildReport({ cards, previous: null, settings: core.defaultSettings() });
  const rows = rowsByDirection(report);

  // Assert
  assert.deepEqual([rows.back.added, rows.front.added, rows.qa.added], [5, 2, 7]);
  assert.equal(report.notCounted.points, 3);
  assert.ok(report.warnings.some((warning) => warning.item.id === 3 && warning.issue === 'noPlatform'));
});

test('предупреждения по оценкам', () => {
  // Arrange
  const cases = [
    [{ size: 2, sp: 3 }, ['sizeBelowDev']],
    [{ size: 3, sp: null }, ['noDevEstimate']],
    [{ size: null, sp: 2 }, ['noSize']],
    [{ size: null, sp: null }, ['noEstimate']],
    [{ size: 5, sp: 3 }, []],
  ];

  // Act
  const actual = cases.map(([estimate]) => core.estimateIssues(estimate, 'back', false));

  // Assert
  assert.deepEqual(actual, cases.map(([, expected]) => expected));
  assert.deepEqual(core.estimateIssues({ size: 2, sp: 2 }, 'front', true), ['needQaWithoutQa']);
  assert.deepEqual(core.estimateIssues({ size: 3, sp: 2 }, 'front', true), []);
});

test('Size меньше Story Points: разработка по Story Points, QA ноль', () => {
  // Arrange
  const cards = [card(1, { size: 2, sp: 3, platforms: [BACK], testType: [NEED_QA] })];

  // Act
  const report = core.buildReport({ cards, previous: null, settings: core.defaultSettings() });
  const rows = rowsByDirection(report);

  // Assert
  assert.equal(rows.back.added, 3);
  assert.equal(rows.qa.added, 0);
  assert.deepEqual(report.warnings.map((warning) => warning.issue).sort(), ['needQaWithoutQa', 'sizeBelowDev']);
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
  const report = core.buildReport({ cards: [], previous: null, settings });
  const rows = rowsByDirection(report);

  // Assert
  assert.equal(rows.back.capacity, 11.5);
  assert.equal(rows.front.capacity, 0);
  assert.equal(rows.qa.capacity, null);
});

test('строка итога в формате команды и перебор', () => {
  // Arrange
  const row = { direction: 'back', tail: 5, added: 28, total: 33, capacity: 28, over: true };

  // Act
  const text = core.formatRow(row);

  // Assert
  assert.equal(text, 'Бэк: 5 + 28 = 33 из 28');
  assert.equal(core.formatRow({ ...row, direction: 'qa', tail: 1.5, total: 29.5, capacity: null }), 'QA: 1,5 + 28 = 29,5 из —');
});

test('снимок хвоста берётся до закрытия спринта, даже если закрыли раньше срока', () => {
  // Arrange
  const sprint = {
    id: 10,
    finish_date: '2026-09-27T20:59:59.999Z',
    actual_finish_date: '2026-09-25T10:00:05.000Z',
    cardUpdates: [
      { id: 1, sprint_id: 10, updated: '2026-09-20T10:00:00.000Z', size: 2, version: 1 },
      { id: 1, sprint_id: 10, updated: '2026-09-24T10:00:00.000Z', size: 3, version: 2 },
      { id: 1, sprint_id: null, updated: '2026-09-25T10:00:00.000Z', size: 3, version: 3 },
      { id: 1, sprint_id: null, updated: '2026-09-26T10:00:00.000Z', size: 5, version: 4 },
    ],
  };

  // Act
  const snapshots = core.snapshotsAtSprintEnd(sprint);

  // Assert
  assert.equal(snapshots.get(1).version, 2);
});

test('правки после планового конца спринта в снимок не попадают', () => {
  // Arrange
  const snapshots = core.snapshotsAtSprintEnd(fixture.previousSprint);

  // Act
  const tail = snapshots.get(70271594);

  // Assert
  assert.equal(tail.version, 5);
  assert.equal(tail.size, 2);
});

test('какой спринт считать прошлым', () => {
  // Arrange
  const now = Date.parse('2026-09-29T08:00:00.000Z');
  const running = { active: true, actual_finish_date: null, finish_date: '2026-10-11T20:59:59.999Z' };
  const overdue = { active: true, actual_finish_date: null, finish_date: '2026-09-27T20:59:59.999Z' };

  // Act
  const plans = [
    core.previousSprintPlan(null, null, now),
    core.previousSprintPlan(49133, running, now),
    core.previousSprintPlan(48880, overdue, now),
  ];

  // Assert
  assert.deepEqual(plans, [
    { source: 'history', below: null },
    { source: 'history', below: 49133 },
    { source: 'current', id: 48880 },
  ]);
});

test('прошлый спринт по истории перемещений: только своя доска и только раньше текущего', () => {
  // Arrange
  const records = [
    { board_id: 68084, sprint_id: null },
    { board_id: 68084, sprint_id: 48880 },
    { board_id: 68084, sprint_id: 49133 },
    { board_id: 77000, sprint_id: 49500 },
    { board_id: 68084, sprint_id: 48517 },
  ];

  // Act
  const planning = core.latestSprintId(records, 68084, null);
  const running = core.latestSprintId(records, 68084, 49133);

  // Assert
  assert.equal(planning, 49133);
  assert.equal(running, 48880);
});

test('в истории старого спринта виден более новый', () => {
  // Arrange
  const sprint = { id: 48517, cardUpdates: [{ board_id: 68084, sprint_id: 48517 }, { board_id: 68084, sprint_id: 48880 }, { board_id: 68084, sprint_id: 49133 }] };

  // Act
  const newer = core.newerSprintInUpdates(sprint, 68084, 49133);

  // Assert
  assert.equal(newer, 48880);
  assert.equal(core.newerSprintInUpdates({ id: 48880, cardUpdates: sprint.cardUpdates }, 68084, 49133), null);
});

test('шапка спринта читается из начала ответа', () => {
  // Arrange
  const full = JSON.stringify({ id: 49133, active: true, finish_date: '2026-10-11T20:59:59.999Z', velocity_details: { by_members: [] }, cards: [{ id: 1 }], cardUpdates: [] });
  const cut = full.indexOf(',"cards":') + ',"cards":'.length + 2;

  // Act
  const early = core.sprintHeadFrom(full.slice(0, 20));
  const head = core.sprintHeadFrom(full.slice(0, cut));

  // Assert
  assert.deepEqual(early, { found: false, head: null });
  assert.equal(head.head.id, 49133);
  assert.equal(head.head.active, true);
  assert.equal(core.sprintHeadFrom('{"a":{"b":1,"cards":[').head, null);
});

test('текущий спринт — самый свежий номер на картах', () => {
  // Arrange
  const cards = [card(1, { sprint: 48880 }), card(2, { sprint: 49133 }), card(3)];

  // Act
  const actual = core.currentSprintId(cards);

  // Assert
  assert.equal(actual, 49133);
  assert.equal(core.currentSprintId([card(1)]), null);
});

test('нет полей Story Points и Platform ни в одной карте — явная ошибка', () => {
  // Arrange
  const cards = [{ id: 1, size: 3, properties: {}, state: 1 }];

  // Act
  const report = core.buildReport({ cards, previous: null, settings: core.defaultSettings() });

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
