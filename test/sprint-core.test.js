const test = require('node:test');
const assert = require('node:assert/strict');
const sprint = require('../src/sprint-core.js');
const { SPRINT_CAPACITY } = require('../src/core.js');

const DEV = 10;
const INBOX = 20;
const BACKLOG = 30;
const EXPEDITE = 40;
const OTHER = 77;
const BUG = 446247;
const SUPPORT = 217075;
const FEATURE = 217076;
const INCIDENT = 16194797;
const AUTOTEST = 217077;
const SPRINT_ID = 500;
const DAY = 86400000;

const CFG = { ...sprint.SPRINT_REPORT, boards: { [INBOX]: 'Inbox', [BACKLOG]: 'бэклог', [EXPEDITE]: 'дежурка' }, teams: { [DEV]: [DEV, INBOX, BACKLOG, EXPEDITE] }, backlogs: [BACKLOG], notEscape: [112] };
const COLUMNS = { 1: 'To Do', 2: 'Doing', 3: 'Review', 4: 'Done', 5: 'Test' };
const NOW = Date.parse('2026-10-06T15:00:00.000Z');

const card = (id, extra = {}) => ({ id, type_id: 1, created: '2026-09-01T05:00:00.000Z', blocked: false, parents_ids: [], properties: {}, first_moved_to_in_progress_at: null, ...extra });
const bug = (id, source, extra = {}) => card(id, { type_id: BUG, properties: { id_425359: source }, ...extra });
const version = (id, updated, sprintId, column, state, size, extra = {}) => ({ id, updated, sprint_id: sprintId, board_id: DEV, column_id: column, state, size, archived: false, version: 1, ...extra });
const record = (kind, at, days, boardId = DEV) => ({ kind, at: Date.parse(at), boardId, days });
const blocks = (report, section) => report.sections.find((item) => item.key === section).groups.flatMap((group) => group.blocks);
const block = (report, section, key) => blocks(report, section).find((item) => item.key === key);
const only = (data, ids) => ({ ...data, cards: data.cards.filter((item) => ids.includes(item.id)), cardUpdates: data.cardUpdates.filter((item) => ids.includes(item.id)) });

function sprintData(extra = {}) {
  return {
    id: SPRINT_ID,
    board_id: DEV,
    title: 'Спринт Альфа',
    goal: 'Выпустить экран заказов',
    created: '2026-09-14T09:00:00.000Z',
    start_date: '2026-09-13T21:00:00.000Z',
    finish_date: '2026-09-27T20:59:59.999Z',
    actual_finish_date: '2026-09-28T07:40:00.000Z',
    cards: [
      card(101, { first_moved_to_in_progress_at: '2026-09-15T06:00:00.000Z' }),
      card(102, { blocked: true, parents_ids: [900], title: 'Фильтр  по датам\n в отчёте' }),
      card(103),
      card(104, { parents_ids: [101], first_moved_to_in_progress_at: '2026-09-15T06:00:00.000Z' }),
      bug(105, [SUPPORT], { properties: { id_425359: [SUPPORT], id_205: [256] } }),
      card(106, { created: '2026-09-16T05:00:00.000Z', parents_ids: null }),
      card(107, { parents_ids: [900] }),
      card(108, { first_moved_to_in_progress_at: '2026-09-21T06:00:00.000Z' }),
      card(109),
      bug(110, [FEATURE]),
      bug(111, INCIDENT, { title: 'Падает экран смены', properties: { id_425359: INCIDENT, id_205: 255 } }),
      bug(112, [SUPPORT]),
    ],
    cardUpdates: [
      version(101, '2026-09-10T05:00:00.000Z', 400, 1, 1, 5),
      version(101, '2026-09-14T09:00:30.000Z', SPRINT_ID, 1, 1, 5),
      version(101, '2026-09-15T06:00:00.000Z', SPRINT_ID, 2, 2, 5),
      version(101, '2026-09-17T06:00:00.000Z', SPRINT_ID, 4, 3, 5),
      version(102, '2026-09-10T05:00:00.000Z', 400, 2, 2, 3),
      version(102, '2026-09-14T09:00:40.000Z', SPRINT_ID, 2, 2, 3),
      version(102, '2026-09-16T05:00:00.000Z', SPRINT_ID, 2, 2, 5),
      version(102, '2026-09-20T05:00:00.000Z', SPRINT_ID, 5, 2, 5),
      version(102, '2026-09-22T05:00:00.000Z', SPRINT_ID, 2, 2, 5),
      version(103, '2026-09-11T05:00:00.000Z', 450, 1, 1, 8),
      version(103, '2026-09-14T09:01:00.000Z', SPRINT_ID, 1, 1, 8),
      version(103, '2026-09-18T05:00:00.000Z', null, 31, 1, 8, { board_id: BACKLOG }),
      version(104, '2026-09-15T04:00:00.000Z', null, 21, 1, 2, { board_id: INBOX }),
      version(104, '2026-09-15T05:00:00.000Z', SPRINT_ID, 1, 1, 2),
      version(104, '2026-09-15T06:00:00.000Z', SPRINT_ID, 2, 2, 2),
      version(104, '2026-09-16T05:00:00.000Z', SPRINT_ID, 4, 3, 2),
      version(105, '2026-09-15T06:00:00.000Z', null, 41, 2, 0, { board_id: EXPEDITE }),
      version(105, '2026-09-15T07:00:00.000Z', SPRINT_ID, 2, 2, 0),
      version(105, '2026-09-15T10:00:00.000Z', SPRINT_ID, 4, 3, 0),
      version(106, '2026-09-16T05:00:05.000Z', SPRINT_ID, 1, 1, 1),
      version(107, '2026-09-15T04:00:00.000Z', null, 21, 1, 2, { board_id: INBOX }),
      version(107, '2026-09-15T08:00:00.000Z', SPRINT_ID, 1, 1, 2),
      version(107, '2026-09-16T08:00:00.000Z', null, 21, 1, 2, { board_id: INBOX }),
      version(108, '2026-09-12T05:00:00.000Z', 600, 1, 1, 3),
      version(108, '2026-09-14T09:00:50.000Z', SPRINT_ID, 1, 1, 3),
      version(108, '2026-09-21T06:00:00.000Z', SPRINT_ID, 3, 2, 3),
      version(108, '2026-09-28T06:00:00.000Z', SPRINT_ID, 4, 3, 3),
      version(109, '2026-09-28T05:00:00.000Z', SPRINT_ID, 1, 1, 4),
      version(110, '2026-09-17T05:00:00.000Z', SPRINT_ID, 4, 3, 0),
      version(110, '2026-09-14T09:00:20.000Z', SPRINT_ID, 1, 1, 0),
      version(110, '2026-09-16T05:00:00.000Z', SPRINT_ID, 2, 2, 0),
      version(110, '2026-09-16T12:00:00.000Z', SPRINT_ID, 5, 2, 0),
      version(111, '2026-09-20T05:00:00.000Z', null, 21, 1, 1, { board_id: INBOX }),
      version(111, '2026-09-21T05:00:00.000Z', SPRINT_ID, 3, 2, 1),
      version(112, '2026-09-22T04:00:00.000Z', null, 21, 1, 0, { board_id: INBOX }),
      version(112, '2026-09-22T05:00:00.000Z', SPRINT_ID, 1, 1, 0),
    ],
    ...extra,
  };
}

function chainSprint(id, monday, { board = DEV, closed = true, previous = null, size = 3 } = {}) {
  const start = Date.parse(`${monday}T00:00:00+03:00`);
  const created = start + 9 * 3600000;
  const iso = (ms) => new Date(ms).toISOString();
  const cardId = id * 10 + 1;
  const versions = [
    version(cardId, iso(created + 30000), id, 1, 1, size, { board_id: board }),
    version(cardId, iso(created + 2 * DAY), id, 4, 3, size, { board_id: board }),
  ];
  if (previous) versions.unshift(version(cardId, iso(start - 7 * DAY), previous, 1, 1, size, { board_id: board }));
  return {
    id,
    board_id: board,
    title: `Спринт ${id}`,
    goal: '',
    created: iso(created),
    start_date: iso(start),
    finish_date: iso(start + 14 * DAY - 1),
    actual_finish_date: closed ? iso(start + 14 * DAY + 7 * 3600000) : null,
    cards: [card(cardId)],
    cardUpdates: versions,
  };
}

function chain() {
  return {
    503: chainSprint(503, '2026-09-28', { closed: false, previous: 502, size: 5 }),
    502: chainSprint(502, '2026-09-14', { previous: 501, size: 8 }),
    501: chainSprint(501, '2026-08-31', { previous: 500, size: 6 }),
    500: chainSprint(500, '2026-08-17', { previous: 499, size: 4 }),
    499: chainSprint(499, '2026-08-03', { board: OTHER }),
  };
}

function memoryStore(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, read: (key) => (values.has(key) ? values.get(key) : null), write: (key, value) => values.set(key, value) };
}

function loader(sprints, broken = null) {
  const loads = [];
  const load = async (id) => {
    loads.push(id);
    if (id === broken) throw new Error('нет сети');
    return { data: sprints[id] };
  };
  return { loads, load };
}

test('Период спринта: даты Kaiten в чужом поясе сводятся к понедельнику 00:00 и воскресенью 23:59:59 по Москве', () => {
  // Arrange
  const utc7 = { start_date: '2026-09-13T17:00:00.000Z', finish_date: '2026-09-27T16:59:59.999Z' };
  const utc4 = { start_date: '2026-08-02T20:00:00.000Z', finish_date: '2026-08-16T19:59:59.999Z' };

  // Act
  const first = sprint.sprintPeriod(utc7);
  const second = sprint.sprintPeriod(utc4);

  // Assert
  assert.equal(new Date(first.start).toISOString(), '2026-09-13T21:00:00.000Z');
  assert.equal(new Date(first.end).toISOString(), '2026-09-27T20:59:59.999Z');
  assert.equal(new Date(second.start).toISOString(), '2026-08-02T21:00:00.000Z');
  assert.equal(new Date(second.end).toISOString(), '2026-08-16T20:59:59.999Z');
});

test('Спринт закончен: после воскресенья 23:59 по Москве или когда закрыт в Kaiten', () => {
  // Arrange
  const open = sprintData({ actual_finish_date: null });

  // Act
  const sunday = sprint.sprintFinished(open, Date.parse('2026-09-27T20:59:59.000Z'));
  const monday = sprint.sprintFinished(open, Date.parse('2026-09-27T21:00:00.000Z'));
  const closedEarly = sprint.sprintFinished(sprintData({ actual_finish_date: '2026-09-25T10:00:00.000Z' }), Date.parse('2026-09-25T11:00:00.000Z'));

  // Assert
  assert.equal(sunday, false);
  assert.equal(monday, true);
  assert.equal(closedEarly, true);
});

test('Текущий спринт доски: самый частый у карт, при равенстве больший, без спринта — нет', () => {
  // Act
  const frequent = sprint.sprintCurrentId([{ sprint_id: 5 }, { sprint_id: 7 }, { sprint_id: 7 }, { sprint_id: null }]);
  const tie = sprint.sprintCurrentId([{ sprint_id: 7 }, { sprint_id: 5 }]);
  const none = sprint.sprintCurrentId([{ sprint_id: null }, {}]);

  // Assert
  assert.equal(frequent, 7);
  assert.equal(tie, 7);
  assert.equal(none, null);
});

test('Время: без пояса — UTC, рабочие дни и остаток спринта — по Москве', () => {
  // Arrange
  const fridayEvening = Date.parse('2026-09-18T15:00:00.000Z');
  const mondayMorning = Date.parse('2026-09-21T06:00:00.000Z');
  const end = Date.parse('2026-10-11T20:59:59.999Z');

  // Act
  const plain = sprint.sprintTime('2026-09-14T09:00:00');
  const days = sprint.sprintWorkdays(fridayEvening, mondayMorning);
  const leftTuesday = sprint.sprintDaysLeft(Date.parse('2026-10-06T15:00:00.000Z'), end);
  const leftSaturday = sprint.sprintDaysLeft(Date.parse('2026-10-10T10:00:00.000Z'), end);

  // Assert
  assert.equal(plain, Date.parse('2026-09-14T09:00:00.000Z'));
  assert.equal(days, 0.625);
  assert.equal(leftTuesday, 4);
  assert.equal(leftSaturday, 0);
});

test('Сводка: план, влёт, ушло, переоценка, в проде, перенос и прошлый спринт; баланс сходится', () => {
  // Act
  const result = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });

  // Assert
  assert.deepEqual(
    { plan: result.plan, added: result.added, left: result.left, reestimate: result.reestimate, done: result.done, carry: result.carry, reestimateCarry: result.reestimateCarry, prevId: result.prevId },
    {
      plan: { cards: 5, bugs: 1, sp: 19 },
      added: { tasks: 3, bugs: 3, sp: 6, from: [{ label: 'Inbox', count: 4 }, { label: 'дежурка', count: 1 }, { label: 'создано в спринте', count: 1 }], related: { tasks: 2, sp: 4 } },
      left: { cards: 2, sp: 10, to: [{ label: 'бэклог', count: 1 }, { label: 'Inbox', count: 1 }] },
      reestimate: 2,
      done: { tasks: 3, bugs: 2, sp: 10, planSp: 8, planSp0: 8, addedSp: 2 },
      carry: { cards: 4, bugs: 2, sp: 7, columns: [{ title: 'To Do', cards: 2, sp: 1 }, { title: 'Doing', cards: 1, sp: 5 }, { title: 'Review', cards: 1, sp: 1 }], blocked: 1 },
      reestimateCarry: 0,
      prevId: 400,
    },
  );
  assert.deepEqual(result.items, [
    { id: 101, bug: false, plan: true, outcome: 'done', sp: 5 },
    { id: 102, bug: false, plan: true, outcome: 'carry', sp: 5, column: 'Doing' },
    { id: 103, bug: false, plan: true, outcome: 'left', sp: 8 },
    { id: 104, bug: false, plan: false, outcome: 'done', sp: 2 },
    { id: 105, bug: true, plan: false, outcome: 'done', sp: 0 },
    { id: 106, bug: false, plan: false, outcome: 'carry', sp: 1, column: 'To Do' },
    { id: 107, bug: false, plan: false, outcome: 'left', sp: 2 },
    { id: 108, bug: false, plan: true, outcome: 'done', sp: 3 },
    { id: 110, bug: true, plan: true, outcome: 'done', sp: 0 },
    { id: 111, bug: true, plan: false, outcome: 'carry', sp: 1, column: 'Review' },
    { id: 112, bug: true, plan: false, outcome: 'carry', sp: 0, column: 'To Do' },
  ]);
  assert.equal(result.plan.sp + result.reestimate + result.reestimateCarry + result.added.sp - result.left.sp, result.done.sp + result.carry.sp);
  assert.equal(result.finished, true);
});

test('Done в понедельник до закрытия в Kaiten — этому спринту; закрыли раньше — перенос; пришедшая после воскресенья карта не считается', () => {
  // Arrange
  const monday = only(sprintData(), [108, 109]);
  const closedBefore = { ...monday, actual_finish_date: '2026-09-28T05:00:00.000Z' };

  // Act
  const counted = sprint.sprintSummary({ sprint: monday, now: NOW, columns: COLUMNS, cfg: CFG });
  const carried = sprint.sprintSummary({ sprint: closedBefore, now: NOW, columns: COLUMNS, cfg: CFG });

  // Assert
  assert.deepEqual([counted.plan.cards, counted.added.tasks, counted.done.sp, counted.carry.cards], [1, 0, 3, 0]);
  assert.deepEqual([carried.done.sp, carried.carry.cards, carried.carry.columns[0].title], [0, 1, 'Review']);
});

test('Карта, положенная в спринт после воскресенья: дошла до Done к завершению в Kaiten — во влёте и в проде этого спринта, не дошла — не считается', () => {
  // Arrange
  const data = only(sprintData(), [109]);
  data.cards.push(card(113));
  data.cardUpdates.push(
    version(113, '2026-09-28T04:00:00.000Z', null, 21, 1, 2, { board_id: INBOX }),
    version(113, '2026-09-28T05:00:00.000Z', SPRINT_ID, 1, 1, 2),
    version(113, '2026-09-28T05:30:00.000Z', SPRINT_ID, 2, 2, 2),
    version(113, '2026-09-28T06:30:00.000Z', SPRINT_ID, 4, 3, 2),
  );

  // Act
  const result = sprint.sprintSummary({ sprint: data, now: NOW, columns: COLUMNS, cfg: CFG });

  // Assert
  assert.deepEqual([result.plan.cards, result.added.tasks, result.added.sp, result.added.from], [0, 1, 2, [{ label: 'Inbox', count: 1 }]]);
  assert.deepEqual([result.done.tasks, result.done.sp, result.done.addedSp, result.carry.cards, result.left.cards], [1, 2, 2, 0, 0]);
});

test('Конец спринта — завершение в Kaiten: снятые после воскресенья карты — в «Ушло», Done, ушедшая в архив, и вернувшаяся из архива до завершения — в проде', () => {
  // Arrange
  const data = only(sprintData(), [109]);
  data.cards.push(card(120), card(121, { first_moved_to_in_progress_at: '2026-09-15T06:00:00.000Z' }), card(122), card(123));
  data.cardUpdates.push(
    version(120, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 5),
    version(120, '2026-09-28T05:30:00.000Z', null, 31, 1, 5, { board_id: BACKLOG }),
    version(121, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 3),
    version(121, '2026-09-15T06:00:00.000Z', SPRINT_ID, 2, 2, 3),
    version(121, '2026-09-17T06:00:00.000Z', SPRINT_ID, 4, 3, 3),
    version(121, '2026-09-18T06:00:00.000Z', null, 4, 3, 3, { archived: true }),
    version(122, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 2),
    version(122, '2026-09-28T06:00:00.000Z', null, 1, 1, 2, { archived: true }),
    version(123, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 1),
    version(123, '2026-09-28T05:10:00.000Z', null, 1, 1, 1, { archived: true }),
    version(123, '2026-09-28T05:11:00.000Z', SPRINT_ID, 1, 1, 1),
    version(123, '2026-09-28T05:12:00.000Z', SPRINT_ID, 4, 3, 1),
  );

  // Act
  const result = sprint.sprintSummary({ sprint: data, now: NOW, columns: COLUMNS, cfg: CFG });

  // Assert
  assert.deepEqual([result.plan.cards, result.plan.sp, result.added.tasks], [4, 11, 0]);
  assert.deepEqual(result.left, { cards: 2, sp: 7, to: [{ label: 'бэклог', count: 1 }, { label: 'архив', count: 1 }] });
  assert.deepEqual([result.done.tasks, result.done.sp, result.carry.cards], [2, 4, 0]);
  assert.deepEqual(result.lead, { median: 2, p85: 2, n: 1, instant: 0 });
});

test('План выполнен на: процент по последней оценке, рядом — оценка карт на старте и к концу, прошлые спринты цепочкой без пустых', () => {
  // Arrange
  const data = only(sprintData(), []);
  data.cards.push(card(130), card(131));
  data.cardUpdates.push(
    version(130, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 3),
    version(130, '2026-09-16T06:00:00.000Z', SPRINT_ID, 2, 2, 8),
    version(130, '2026-09-18T06:00:00.000Z', SPRINT_ID, 4, 3, 8),
    version(131, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 5),
  );
  const grew = sprint.sprintSummary({ sprint: data, now: NOW, columns: COLUMNS, cfg: CFG });
  const fell = { ...grew, done: { ...grew.done, planSp: 2 } };
  const eighty = { ...grew, plan: { ...grew.plan, sp: 10 }, done: { ...grew.done, planSp: 8, planSp0: 8 } };
  const half = { ...grew, plan: { ...grew.plan, sp: 20 }, done: { ...grew.done, planSp: 11, planSp0: 11 } };
  const empty = { ...grew, plan: { ...grew.plan, sp: 0 } };
  const start = (summary, history = []) => block(sprint.sprintReportBlocks({ last: summary, history, capacityLog: [], now: NOW, cfg: CFG }), 'last', 'start');

  // Act
  const blocks = [start(grew), start(fell), start(eighty, [half, empty]), start(fell, [eighty, half])];

  // Assert
  assert.deepEqual([grew.plan.sp, grew.done.planSp, grew.done.planSp0, grew.reestimate], [8, 8, 3, 5]);
  assert.deepEqual(blocks, [
    { key: 'start', title: 'План выполнен на', value: '100%', caption: '8 из 8 SP плана в проде', lines: [{ text: 'оценка этих карт на старте 3 SP → к концу спринта 8 SP', tone: 'note' }] },
    { key: 'start', title: 'План выполнен на', value: '25%', caption: '2 из 8 SP плана в проде', lines: [{ text: 'оценка этих карт на старте 3 SP → к концу спринта 2 SP', tone: 'note' }] },
    { key: 'start', title: 'План выполнен на', value: '80%', caption: '8 из 10 SP плана в проде', lines: [{ text: 'прошлый спринт: 55%' }] },
    { key: 'start', title: 'План выполнен на', value: '25%', caption: '2 из 8 SP плана в проде', lines: [{ text: 'оценка этих карт на старте 3 SP → к концу спринта 2 SP', tone: 'note' }, { text: 'прошлые спринты: 55% → 80%' }] },
  ]);
});

test('Перенос: SP — по оценке с планирования следующего спринта, переоценка — отдельной строкой', () => {
  // Arrange
  const data = only(sprintData(), [102]);
  data.cardUpdates.push(version(102, '2026-09-28T09:30:00.000Z', 501, 2, 2, 8));

  // Act
  const result = sprint.sprintSummary({ sprint: data, now: NOW, columns: COLUMNS, cfg: CFG });
  const report = sprint.sprintReportBlocks({ last: result, capacityLog: [], now: NOW, cfg: CFG });

  // Assert
  assert.deepEqual([result.plan.sp, result.reestimate, result.reestimateCarry, result.carry.sp], [3, 2, 3, 8]);
  assert.deepEqual(block(report, 'last', 'carry'), {
    key: 'carry',
    title: 'Не дошло до прода',
    value: '8 SP',
    caption: '1 задача',
    lines: [{ text: 'Doing — 1 карта · 8 SP' }, { text: 'переоценили на следующем планировании: было 5 SP → стало 8 SP', tone: 'note' }],
  });
  assert.deepEqual(block(report, 'last', 'changes').lines, [
    { text: 'Переоценили карты плана: +2 SP' },
    { text: 'Переоценили перенесённые карты на планировании следующего спринта: +3 SP', tone: 'note' },
  ]);
});

test('Где задачи проводят время: колонки не в топе — одной строкой «остальные колонки», сумма 100%', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });
  const cut = { ...last, stages: [{ title: 'Review', share: 0.504 }, { title: 'Doing', share: 0.296 }] };

  // Act
  const stages = block(sprint.sprintReportBlocks({ last: cut, capacityLog: [], now: NOW, cfg: CFG }), 'last', 'stages');

  // Assert
  assert.deepEqual(stages.lines, [{ text: 'Review — 50%' }, { text: 'Doing — 30%' }, { text: 'остальные колонки — 20%' }, { text: 'доля времени 3 задач от начала работы до прода', tone: 'note' }]);
});

test('Проверено QA: карта прошла колонку Test в окне спринта — считается; ещё в Test, проверена до спринта или без колонки Test — нет', () => {
  // Arrange
  const data = only(sprintData(), []);
  data.cards.push(card(150), card(151), card(152), bug(153, [FEATURE]));
  data.cardUpdates.push(
    version(150, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 2),
    version(150, '2026-09-16T05:00:00.000Z', SPRINT_ID, 5, 2, 2),
    version(150, '2026-09-18T05:00:00.000Z', SPRINT_ID, 4, 3, 2),
    version(151, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 2),
    version(151, '2026-09-25T05:00:00.000Z', SPRINT_ID, 5, 2, 2),
    version(152, '2026-09-05T05:00:00.000Z', 400, 5, 2, 2),
    version(152, '2026-09-10T05:00:00.000Z', 400, 3, 2, 2),
    version(152, '2026-09-14T09:00:10.000Z', SPRINT_ID, 3, 2, 2),
    version(153, '2026-09-15T05:00:00.000Z', SPRINT_ID, 5, 2, 0),
    version(153, '2026-09-17T05:00:00.000Z', SPRINT_ID, 2, 2, 0),
  );
  const summary = sprint.sprintSummary({ sprint: data, now: NOW, columns: COLUMNS, cfg: CFG });
  const noTest = sprint.sprintSummary({ sprint: data, now: NOW, columns: { 1: 'To Do', 2: 'Doing', 3: 'Review', 4: 'Done' }, cfg: CFG });
  const tested = (item) => block(sprint.sprintReportBlocks({ last: item, capacityLog: [], now: NOW, cfg: CFG }), 'last', 'tested');

  // Act
  const found = [tested(summary), tested(noTest)];

  // Assert
  assert.deepEqual(summary.tested, { cards: 2, tasks: 1, bugs: 1, known: true });
  assert.deepEqual(noTest.tested, { cards: 0, tasks: 0, bugs: 0, known: false });
  assert.deepEqual(found, [{ key: 'tested', title: 'Проверено QA', value: '2', caption: 'карты прошли колонку Test', lines: [{ text: '1 задача и 1 баг' }] }, undefined]);
});

test('Версии карты в выгрузке не по порядку — сортируются по времени, карта остаётся в плане', () => {
  // Act
  const result = sprint.sprintSummary({ sprint: only(sprintData(), [110]), now: NOW, columns: COLUMNS, cfg: CFG });

  // Assert
  assert.deepEqual([result.plan.cards, result.plan.bugs, result.added.bugs, result.done.bugs], [1, 1, 0, 1]);
});

test('Время до прода: медиана и 85% по задачам в проде, доли колонок только по доске спринта', () => {
  // Act
  const result = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });

  // Assert
  assert.deepEqual(result.lead, { median: 2, p85: 5, n: 3, instant: 0 });
  assert.deepEqual(result.stages.map((stage) => [stage.title, Math.round(stage.share * 100)]), [['Review', 63], ['Doing', 37]]);
});

test('Идущий спринт: до закрытия в Kaiten Done считается на сейчас', () => {
  // Arrange
  const open = sprintData({ actual_finish_date: null });

  // Act
  const sunday = sprint.sprintSummary({ sprint: open, now: Date.parse('2026-09-20T12:00:00.000Z'), columns: COLUMNS, cfg: CFG });

  // Assert
  assert.equal(sunday.finished, false);
  assert.deepEqual([sunday.done.tasks, sunday.done.bugs, sunday.left.cards], [2, 2, 2]);
});

test('Загрузчик: идёт спринт — итоги прошлого и история по цепочке, обрыв на чужой доске, закрытые — в кэш', async () => {
  // Arrange
  const sprints = chain();
  const first = loader(sprints);
  const second = loader(sprints);
  const store = memoryStore();
  const cards = [{ sprint_id: 503 }, { sprint_id: 503 }, { sprint_id: 502 }, { sprint_id: null }];

  // Act
  const result = await sprint.sprintReportLoad({ cards, boardId: DEV, now: NOW, columns: COLUMNS, load: first.load, store, cfg: CFG });
  await sprint.sprintReportLoad({ cards, boardId: DEV, now: NOW, columns: COLUMNS, load: second.load, store, cfg: CFG });

  // Assert
  assert.deepEqual([result.currentId, result.running.id, result.last.id, result.history.map((item) => item.id), result.historyProblem], [503, 503, 502, [501, 500], null]);
  assert.deepEqual(first.loads, [503, 502, 501, 500, 499]);
  assert.deepEqual(second.loads, [503]);
  assert.equal(store.read(`sprint.${DEV}`), 503);
  assert.equal(store.read('sprintSummary.503'), null);
  assert.equal(store.read('sprintSummary.502').v, CFG.cacheVersion);
});

test('Загрузчик: воскресенье прошло, а в Kaiten спринт открыт — итоги по нему, не в кэш; без идущего спринта прошлых грузит на один больше — для второй панели', async () => {
  // Arrange
  const { load, loads } = loader(chain());
  const store = memoryStore();

  // Act
  const result = await sprint.sprintReportLoad({ cards: [{ sprint_id: 503 }], boardId: DEV, now: Date.parse('2026-10-12T05:00:00.000Z'), columns: COLUMNS, load, store, cfg: CFG });

  // Assert
  assert.deepEqual([result.running, result.last.id, result.last.closedAt, result.history.map((item) => item.id)], [null, 503, null, [502, 501, 500]]);
  assert.deepEqual(loads, [503, 502, 501, 500, 499]);
  assert.equal(store.read('sprintSummary.503'), null);
  const section = sprint.sprintReportBlocks({ ...result, capacityLog: [], now: Date.parse('2026-10-12T05:00:00.000Z'), cfg: CFG }).sections[0];
  assert.deepEqual([section.title, section.note, section.tone], ['Итоги спринта 28.09–11.10', 'предварительные: в Kaiten ещё не завершён', 'warn']);
});

test('Загрузчик: у карт нет спринта — берёт запомненный, нечего брать — понятная ошибка', async () => {
  // Arrange
  const { load } = loader(chain());

  // Act
  const remembered = await sprint.sprintReportLoad({ cards: [{ sprint_id: null }], boardId: DEV, now: NOW, columns: COLUMNS, load, store: memoryStore({ [`sprint.${DEV}`]: 503 }), cfg: CFG });
  const empty = sprint.sprintReportLoad({ cards: [], boardId: DEV, now: NOW, columns: COLUMNS, load, store: memoryStore(), cfg: CFG });

  // Assert
  assert.equal(remembered.currentId, 503);
  await assert.rejects(empty, /у карт доски нет спринта/);
});

test('Загрузчик: прошлый спринт не загрузился — текущий есть, причина в historyProblem', async () => {
  // Arrange
  const { load } = loader(chain(), 501);

  // Act
  const result = await sprint.sprintReportLoad({ cards: [{ sprint_id: 503 }], boardId: DEV, now: NOW, columns: COLUMNS, load, store: memoryStore(), cfg: CFG });

  // Assert
  assert.deepEqual([result.running.id, result.last.id, result.history.length, result.historyProblem], [503, 502, 0, 'нет сети']);
});

test('Блоки итогов закрытого спринта: легенда, группы с вопросом, у каждого числа единица; прошлого нет — второй панели нет', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });

  // Act
  const report = sprint.sprintReportBlocks({ last, capacityLog: [], now: NOW, cfg: CFG });

  // Assert
  assert.deepEqual(report, {
    legend: CFG.legend,
    sections: [{
      key: 'last',
      title: 'Итоги спринта 14.09–27.09',
      groups: [
        {
          key: 'result',
          title: 'Результат',
          note: 'что дошло до прода',
          blocks: [
            { key: 'goal', title: 'Цель спринта', wide: true, lines: [{ text: 'Выпустить экран заказов', tone: 'strong' }] },
            { key: 'done', title: 'В проде', value: '10 SP', caption: '5 карт: 3 задачи и 2 бага', lines: [{ text: 'из плана на старте — 8 SP' }, { text: 'добавили после старта — 2 SP' }] },
            {
              key: 'carry',
              title: 'Не дошло до прода',
              value: '7 SP',
              caption: '4 карты: 2 задачи и 2 бага',
              lines: [{ text: 'To Do — 2 карты · 1 SP' }, { text: 'Doing — 1 карта · 5 SP' }, { text: 'Review — 1 карта · 1 SP' }],
            },
          ],
        },
        {
          key: 'predictability',
          title: 'Предсказуемость',
          note: 'совпало ли с планом',
          blocks: [
            { key: 'capacity', title: 'Capacity, человеко-дни', lines: [{ text: 'план и факт не записаны', tone: 'note' }] },
            { key: 'plan', title: 'План на старте', value: '19 SP', caption: '5 карт', lines: [] },
            { key: 'start', title: 'План выполнен на', value: '42%', caption: '8 из 19 SP плана в проде', lines: [] },
            {
              key: 'changes',
              title: 'Изменения после старта',
              wide: true,
              value: '+6 / −10 SP',
              caption: 'добавили / убрали',
              lines: [
                { text: 'Добавили 6 карт: 3 задачи и 3 бага · 6 SP' },
                { text: 'откуда: Inbox 4 · дежурка 1 · создано в спринте 1', tone: 'note' },
                { text: 'из них 2 задачи · 4 SP — части карт плана или тех же эпиков', tone: 'note' },
                { text: 'Убрали 2 карты · 10 SP' },
                { text: 'куда: бэклог 1 · Inbox 1', tone: 'note' },
                { text: 'Переоценили карты плана: +2 SP' },
              ],
            },
          ],
        },
        {
          key: 'delivery',
          title: 'Время доставки',
          note: 'как быстро задачи доходят до прода',
          blocks: [
            {
              key: 'lead',
              title: 'Время до прода',
              value: '2',
              caption: 'рабочих дня — обычная задача',
              lines: [
                { text: 'медиана: половина задач быстрее, половина дольше', tone: 'note' },
                { text: '85% задач — не дольше 5 рабочих дней' },
                { text: 'по 3 задачам от начала работы до прода; баги не считаются', tone: 'note' },
              ],
            },
            { key: 'stages', title: 'Где задачи проводят время', lines: [{ text: 'Review — 63%' }, { text: 'Doing — 37%' }, { text: 'доля времени 3 задач от начала работы до прода', tone: 'note' }] },
          ],
        },
        {
          key: 'quality',
          title: 'Качество',
          note: 'сколько багов поймали до релиза и сколько пришло из прода',
          blocks: [{ key: 'tested', title: 'Проверено QA', value: '2', caption: 'карты прошли колонку Test', lines: [{ text: '1 задача и 1 баг' }] }],
        },
        { key: 'next', title: 'Следующий спринт', note: 'сколько человеко-дней есть', blocks: [{ key: 'next', title: 'Capacity, человеко-дни', lines: [{ text: 'не посчитана', tone: 'note' }] }] },
      ],
    }],
    problem: null,
    past: null,
  });
});

test('Блоки при идущем спринте: на доске — ход текущего с capacity из панели, итоги прошлого — второй панелью; ссылки туда и обратно; velocity по спринтам до каждого', async () => {
  // Arrange
  const { load } = loader(chain());
  const loaded = await sprint.sprintReportLoad({ cards: [{ sprint_id: 503 }], boardId: DEV, now: NOW, columns: COLUMNS, load, store: memoryStore(), cfg: CFG });
  const capacity = { back: 20, qa: 7.5 };

  // Act
  const report = sprint.sprintReportBlocks({ ...loaded, capacity, capacityLog: [], now: NOW, cfg: CFG });
  const past = report.past;

  // Assert
  assert.deepEqual(report.sections.map((section) => [section.title, section.note || null, section.link]), [['Идёт спринт 28.09–11.10', 'осталось 4 рабочих дня, считая сегодня', { text: 'Итоги прошлого спринта 14.09–27.09 →', to: 'past' }]]);
  assert.deepEqual(block(report, 'running', 'plan').lines, [{ text: 'в прошлых спринтах до прода дошло: 4 → 6 → 8 SP', tone: 'note' }, { text: 'в среднем 6 SP за спринт — это velocity' }]);
  assert.deepEqual(block(report, 'running', 'capacity'), { key: 'capacity', title: 'Capacity, человеко-дни', value: '27,5', caption: 'на спринт, по панели', lines: [{ text: 'Бэк 20 · QA 7,5' }] });
  assert.deepEqual(block(report, 'running', 'open'), { key: 'open', title: 'Ещё не в проде', value: '0 SP', caption: 'ничего', lines: [] });
  assert.deepEqual(report.sections[0].groups.map((group) => [group.key, group.blocks.map((item) => item.key)]), [['result', ['goal', 'done', 'open']], ['predictability', ['capacity', 'plan', 'start', 'changes']], ['quality', ['tested']]]);
  assert.deepEqual([past.legend, past.problem, past.sections.map((section) => [section.title, section.note || null, section.link])], [null, null, [['Итоги спринта 14.09–27.09', null, { text: '← Идёт спринт 28.09–11.10', to: 'main' }]]]);
  assert.deepEqual(block(past, 'last', 'goal'), { key: 'goal', title: 'Название спринта', wide: true, lines: [{ text: 'Спринт 502', tone: 'strong' }, { text: 'цель в Kaiten не заполнена', tone: 'note' }] });
  assert.deepEqual(block(past, 'last', 'plan'), { key: 'plan', title: 'План на старте', value: '8 SP', caption: '1 карта', lines: [{ text: 'в прошлых спринтах до прода дошло: 4 → 6 SP', tone: 'note' }, { text: 'в среднем 5 SP за спринт — это velocity' }] });
  assert.deepEqual(block(past, 'last', 'lead').lines, [{ text: 'у задач в проде нет даты начала работы', tone: 'note' }]);
  assert.deepEqual(block(past, 'last', 'changes').lines, [{ text: 'план не менялся' }]);
  assert.deepEqual(past.sections[0].groups.map((group) => [group.key, group.blocks.map((item) => item.key)]), [['result', ['goal', 'done', 'carry']], ['predictability', ['capacity', 'plan', 'start', 'changes']], ['delivery', ['lead']], ['quality', ['tested']]]);
});

test('Спринт в фокусе: по умолчанию идущий, можно взять закрытый — тогда рядом предыдущий; неизвестный — первый; пусто — пусто', async () => {
  // Arrange
  const { load } = loader(chain());
  const loaded = await sprint.sprintReportLoad({ cards: [{ sprint_id: 503 }], boardId: DEV, now: NOW, columns: COLUMNS, load, store: memoryStore(), cfg: CFG });
  const ids = (found) => [found.main && found.main.id, found.past && found.past.id, found.previous(0).map((item) => item.id), found.previous(1).map((item) => item.id)];

  // Act
  const byDefault = sprint.sprintFocus({ ...loaded, focus: null });
  const last = sprint.sprintFocus({ ...loaded, focus: 502 });
  const oldest = sprint.sprintFocus({ ...loaded, focus: 500 });
  const unknown = sprint.sprintFocus({ ...loaded, focus: 999 });
  const nothing = sprint.sprintFocus({});
  const report = sprint.sprintReportBlocks({ ...loaded, focus: 502, capacityLog: [], now: NOW, cfg: CFG });

  // Assert
  assert.deepEqual(ids(byDefault), [503, 502, [500, 501, 502], [500, 501]]);
  assert.deepEqual(ids(last), [502, 501, [500, 501], [500]]);
  assert.deepEqual(ids(oldest), [500, null, [], []]);
  assert.deepEqual(ids(unknown), [503, 502, [500, 501, 502], [500, 501]]);
  assert.deepEqual(ids(nothing), [null, null, [], []]);
  assert.deepEqual([report.sections[0].title, report.sections[0].link.text, report.past.sections[0].link.text], ['Итоги спринта 14.09–27.09', 'Итоги предыдущего спринта 31.08–13.09 →', '← Итоги спринта 14.09–27.09']);
  assert.deepEqual(report.sections[0].groups.map((group) => group.key), ['result', 'predictability', 'delivery', 'quality']);
  assert.deepEqual(sprint.sprintReportBlocks({ capacityLog: [], now: NOW, cfg: CFG }), { legend: CFG.legend, sections: [], problem: null, past: null });
});

test('Время до прода: медиана за три последних спринта одной строкой, у спринта без дат — «нет данных»', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });
  const empty = { ...last, start: Date.parse('2026-08-31T00:00:00+03:00'), end: Date.parse('2026-09-13T23:59:59+03:00'), lead: { median: 0, p85: 0, n: 0 } };
  const quick = { ...last, start: Date.parse('2026-08-17T00:00:00+03:00'), end: Date.parse('2026-08-30T23:59:59+03:00'), lead: { median: 1.5, p85: 2, n: 1 } };
  const ancient = { ...last, lead: { median: 9, p85: 9, n: 9 } };

  // Act
  const lead = block(sprint.sprintReportBlocks({ last, history: [empty, quick, ancient], capacityLog: [], now: NOW, cfg: CFG }), 'last', 'lead');
  const pair = block(sprint.sprintReportBlocks({ last, history: [quick], capacityLog: [], now: NOW, cfg: CFG }), 'last', 'lead');

  // Assert
  assert.deepEqual(lead.lines, [
    { text: 'медиана: половина задач быстрее, половина дольше', tone: 'note' },
    { text: '85% задач — не дольше 5 рабочих дней' },
    { text: 'за три спринта: 1,5 → нет данных → 2 рабочих дня' },
    { text: 'по 3 задачам от начала работы до прода; баги не считаются', tone: 'note' },
  ]);
  assert.equal(pair.lines[2].text, 'за два спринта: 1,5 → 2 рабочих дня');
});

test('Время до прода: задачу перенесли в Done меньше чем за минуту от начала работы — в медиану не идёт, сказано отдельно', () => {
  // Arrange
  const data = only(sprintData(), [101]);
  data.cards.push(card(140, { first_moved_to_in_progress_at: '2026-09-16T06:00:00.000Z' }), card(141, { first_moved_to_in_progress_at: '2026-09-16T06:00:00.000Z' }));
  data.cardUpdates.push(
    version(140, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 1),
    version(140, '2026-09-16T06:00:00.000Z', SPRINT_ID, 2, 2, 1),
    version(140, '2026-09-16T06:00:30.000Z', SPRINT_ID, 4, 3, 1),
    version(141, '2026-09-14T09:00:10.000Z', SPRINT_ID, 1, 1, 1),
    version(141, '2026-09-16T06:00:00.000Z', SPRINT_ID, 2, 2, 1),
    version(141, '2026-09-16T06:00:40.000Z', SPRINT_ID, 4, 3, 1),
  );
  const both = sprint.sprintSummary({ sprint: data, now: NOW, columns: COLUMNS, cfg: CFG });
  const onlyInstant = sprint.sprintSummary({ sprint: only(data, [140]), now: NOW, columns: COLUMNS, cfg: CFG });
  const lead = (summary) => block(sprint.sprintReportBlocks({ last: summary, capacityLog: [], now: NOW, cfg: CFG }), 'last', 'lead');

  // Act
  const found = [lead(both), lead(onlyInstant)];

  // Assert
  assert.deepEqual([both.done.tasks, both.lead], [3, { median: 2, p85: 2, n: 1, instant: 2 }]);
  assert.equal(found[0].lines[2].text, 'по 1 задаче от начала работы до прода; не считаются баги и 2 задачи, которые сразу перенесли в Done');
  assert.deepEqual(found[1], { key: 'lead', title: 'Время до прода', lines: [{ text: '1 задачу в проде сразу перенесли в Done — времени в работе нет', tone: 'note' }] });
});

function sprintBugCards() {
  const raw = (id, source, priority, extra = {}) => bug(id, source, { board_id: DEV, condition: 1, archived: false, state: 1, last_moved_to_done_at: null, created: '2026-09-15T05:00:00.000Z', properties: { id_425359: source, id_205: priority }, ...extra });
  const fixedAt = (at) => ({ state: 3, last_moved_to_done_at: at });
  const vera = { owner: { id: 1, full_name: ' Вера  Тестова ' } };
  const oleg = { owner: { id: 2, full_name: 'Олег Девов' } };
  return [
    raw(201, [FEATURE], [255], { ...vera, ...fixedAt('2026-09-20T05:00:00.000Z') }),
    raw(202, [FEATURE], [256], { ...vera, state: 2, board_id: INBOX }),
    raw(201, [FEATURE], [255], fixedAt('2026-09-20T05:00:00.000Z')),
    raw(204, [SUPPORT], [255], { ...oleg, created: '2026-09-17T05:00:00.000Z', ...fixedAt('2026-09-28T07:00:00.000Z') }),
    raw(205, INCIDENT, 256, { created: '2026-09-18T05:00:00.000Z', ...fixedAt('2026-09-29T05:00:00.000Z') }),
    raw(206, [SUPPORT], [255], { created: '2026-09-10T05:00:00.000Z' }),
    raw(207, [SUPPORT], [255], { created: '2026-09-28T03:00:00.000Z' }),
    raw(208, [FEATURE], [256], { condition: 2, archived: true }),
    raw(209, [FEATURE], [], { condition: 2, archived: true, board_id: BACKLOG, owner: null }),
    raw(210, [FEATURE], [257], { ...oleg, condition: 2, archived: true, ...fixedAt('2026-09-19T05:00:00.000Z') }),
    raw(211, [], [256]),
    { ...raw(212, [SUPPORT], [255]), type_id: 1 },
    raw(112, [SUPPORT], [256], { ...vera, state: 2 }),
    raw(214, [AUTOTEST], [257], { ...oleg, board_id: EXPEDITE }),
  ];
}

test('Баги за спринт: заведённые в окне спринта на досках команды, до прода и из прода по Bug source; дубли, чужие даты, не баги и ушедшие в архив без исправления не считаются', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });

  // Act
  const bugs = sprint.sprintBugs({ cards: sprintBugCards(), summary: last, now: NOW, cfg: CFG });

  // Assert
  assert.deepEqual(bugs, {
    caught: {
      count: 6,
      done: 2,
      items: [
        { id: 201, fixed: true, priority: 'High', source: 'проверка задач' },
        { id: 202, fixed: false, priority: 'Medium', source: 'проверка задач' },
        { id: 209, fixed: false, priority: 'без важности', source: 'проверка задач' },
        { id: 210, fixed: true, priority: 'Low', source: 'проверка задач' },
        { id: 112, fixed: false, priority: 'Medium', source: 'поддержка' },
        { id: 214, fixed: false, priority: 'Low', source: 'автотесты' },
      ],
      priority: [{ label: 'High', count: 1, open: 0 }, { label: 'Medium', count: 2, open: 2 }, { label: 'Low', count: 2, open: 1 }, { label: 'без важности', count: 1, open: 1 }],
      sources: [{ label: 'проверка задач', count: 4 }, { label: 'поддержка', count: 1 }, { label: 'автотесты', count: 1 }],
    },
    escaped: {
      count: 2,
      done: 1,
      items: [{ id: 204, fixed: true, priority: 'High', source: 'поддержка' }, { id: 205, fixed: false, priority: 'Medium', source: 'инцидент' }],
      priority: [{ label: 'High', count: 1, open: 0 }, { label: 'Medium', count: 1, open: 1 }],
      sources: [{ label: 'поддержка', count: 1 }, { label: 'инцидент', count: 1 }],
    },
    unknown: 1,
  });
});

test('Окно багов: закрытый спринт — от начала до воскресенья, исправлен — если Done к завершению в Kaiten; идущий — до сейчас', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });
  const runningNow = Date.parse('2026-09-20T12:00:00.000Z');
  const running = sprint.sprintSummary({ sprint: sprintData({ actual_finish_date: null }), now: runningNow, columns: COLUMNS, cfg: CFG });

  // Act
  const windows = [sprint.sprintBugWindow(last, NOW), sprint.sprintBugWindow(running, runningNow)].map((item) => Object.values(item).map((ms) => new Date(ms).toISOString()));

  // Assert
  assert.deepEqual(windows, [
    ['2026-09-13T21:00:00.000Z', '2026-09-27T20:59:59.999Z', '2026-09-28T07:40:00.000Z'],
    ['2026-09-13T21:00:00.000Z', '2026-09-20T12:00:00.000Z', '2026-09-20T12:00:00.000Z'],
  ]);
});

test('Блоки качества: поймали до прода — важность, исправления и как нашли, без ответственных: баги находит QA, а в поле — кто чинит; из прода — откуда и важность; проверено QA', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });
  const bugs = sprint.sprintBugs({ cards: sprintBugCards(), summary: last, now: NOW, cfg: CFG });

  // Act
  const report = sprint.sprintReportBlocks({ last, bugs: { [last.id]: bugs }, capacityLog: [], now: NOW, cfg: CFG });

  // Assert
  assert.deepEqual(report.sections[0].groups.find((group) => group.key === 'quality'), {
    key: 'quality',
    title: 'Качество',
    note: 'сколько багов поймали до релиза и сколько пришло из прода',
    blocks: [
      {
        key: 'caught',
        title: 'Поймали до прода',
        value: '6',
        caption: 'багов нашли до релиза',
        lines: [
          { text: 'важность: High 1 · Medium 2 · Low 2 · без важности 1' },
          { text: 'исправлено 2 · не исправлено 4: Medium 2 · Low 1 · без важности 1' },
          { text: 'как нашли: проверка задач 4 · поддержка 1 · автотесты 1', tone: 'note' },
          { text: 'ещё 1 баг без Bug source — не знаю, до прода или из прода', tone: 'warn' },
        ],
      },
      {
        key: 'escaped',
        title: 'Пришли из прода',
        value: '2',
        caption: 'бага от пользователей и поддержки',
        lines: [{ text: 'откуда: поддержка 1 · инцидент 1' }, { text: 'важность: High 1 · Medium 1' }, { text: 'исправлено 1 · не исправлено 1: Medium 1', tone: 'warn' }],
      },
      { key: 'tested', title: 'Проверено QA', value: '2', caption: 'карты прошли колонку Test', lines: [{ text: '1 задача и 1 баг' }] },
    ],
  });
});

test('Блоки качества: багов нет — нули без строк, один и исправлен — «исправлен», баги не загрузились — причина и без «Пришли из прода», не грузили — только «Проверено QA»', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });
  const quality = (bugs) => (sprint.sprintReportBlocks({ last, bugs: { [last.id]: bugs }, capacityLog: [], now: NOW, cfg: CFG }).sections[0].groups.find((group) => group.key === 'quality') || { blocks: [] }).blocks;
  const single = bug(401, [FEATURE], { board_id: DEV, condition: 1, archived: false, state: 3, last_moved_to_done_at: '2026-09-16T05:00:00.000Z', created: '2026-09-15T05:00:00.000Z', properties: { id_425359: [FEATURE], id_205: [255] }, owner: { id: 1, full_name: 'Вера Тестова' } });
  const tested = { key: 'tested', title: 'Проверено QA', value: '2', caption: 'карты прошли колонку Test', lines: [{ text: '1 задача и 1 баг' }] };

  // Act
  const found = [quality(sprint.sprintBugs({ cards: [], summary: last, now: NOW, cfg: CFG })), quality(sprint.sprintBugs({ cards: [single], summary: last, now: NOW, cfg: CFG })), quality({ problem: 'нет сети' }), quality(null)];

  // Assert
  assert.deepEqual(found, [
    [
      { key: 'caught', title: 'Поймали до прода', value: '0', caption: 'багов нашли до релиза', lines: [] },
      { key: 'escaped', title: 'Пришли из прода', value: '0', caption: 'багов от пользователей и поддержки', lines: [] },
      tested,
    ],
    [
      { key: 'caught', title: 'Поймали до прода', value: '1', caption: 'баг нашли до релиза', lines: [{ text: 'важность: High 1' }, { text: 'исправлен' }, { text: 'как нашли: проверка задач 1', tone: 'note' }] },
      { key: 'escaped', title: 'Пришли из прода', value: '0', caption: 'багов от пользователей и поддержки', lines: [] },
      tested,
    ],
    [{ key: 'caught', title: 'Поймали до прода', lines: [{ text: 'баги не загрузились: нет сети', tone: 'warn' }] }, tested],
    [tested],
  ]);
});

test('Загрузчик: баги — по всем доскам команды за окна спринта в фокусе и прошлого, ошибка — причиной у своего спринта; без загрузчика багов нет', async () => {
  // Arrange
  const { load } = loader(chain());
  const calls = [];
  const loadBugs = async (query) => {
    calls.push(query);
    if (query.from === '2026-09-27T21:00:00.000Z') throw new Error('нет сети');
    if (query.from !== '2026-09-13T21:00:00.000Z') return [];
    return [bug(301, [FEATURE], { board_id: DEV, created: '2026-09-15T05:00:00.000Z', state: 3, last_moved_to_done_at: '2026-09-16T05:00:00.000Z' })];
  };
  const run = (extra) => sprint.sprintReportLoad({ cards: [{ sprint_id: 503 }], boardId: DEV, now: NOW, columns: COLUMNS, load, loadBugs, store: memoryStore(), cfg: CFG, ...extra });

  // Act
  const current = await run({});
  const oldest = await run({ focus: 500 });
  const without = await run({ loadBugs: null });

  // Assert
  assert.deepEqual(calls, [
    { boards: [DEV, INBOX, BACKLOG, EXPEDITE], from: '2026-09-27T21:00:00.000Z', to: '2026-10-06T15:00:00.000Z' },
    { boards: [DEV, INBOX, BACKLOG, EXPEDITE], from: '2026-09-13T21:00:00.000Z', to: '2026-09-27T20:59:59.999Z' },
    { boards: [DEV, INBOX, BACKLOG, EXPEDITE], from: '2026-08-16T21:00:00.000Z', to: '2026-08-30T20:59:59.999Z' },
  ]);
  assert.deepEqual(Object.keys(current.bugs), ['502', '503']);
  assert.deepEqual([current.bugs[503], current.bugs[502].caught.count, current.bugs[502].caught.done], [{ problem: 'нет сети' }, 1, 1]);
  assert.deepEqual([oldest.focus, Object.keys(oldest.bugs), oldest.bugs[500].caught.count], [500, ['500'], 0]);
  assert.deepEqual([without.focus, without.bugs], [null, {}]);
});

test('Важность бага: поле Bugs Priority списком или числом, пусто или чужое значение — «без важности»', () => {
  // Arrange
  const cards = [{ properties: { id_205: [255] } }, { properties: { id_205: 257 } }, { properties: {} }, { properties: { id_205: [999] } }, {}];

  // Act
  const labels = cards.map((item) => sprint.sprintPriority(item));

  // Assert
  assert.deepEqual(labels, ['High', 'Low', 'без важности', 'без важности', 'без важности']);
});

test('Ещё не в проде: колонки по строке, заблокированные в Kaiten — отдельной строкой', () => {
  // Arrange
  const running = sprint.sprintSummary({ sprint: sprintData({ actual_finish_date: null }), now: Date.parse('2026-09-20T12:00:00.000Z'), columns: COLUMNS, cfg: CFG });
  const blocked = { ...running, carry: { ...running.carry, blocked: 2 } };

  // Act
  const open = block(sprint.sprintReportBlocks({ running: blocked, capacityLog: [], now: Date.parse('2026-09-20T12:00:00.000Z'), cfg: CFG }), 'running', 'open');

  // Assert
  assert.deepEqual(open, {
    key: 'open',
    title: 'Ещё не в проде',
    value: '9 SP',
    caption: '3 задачи',
    lines: [{ text: 'To Do — 2 карты · 4 SP' }, { text: 'Test — 1 карта · 5 SP' }, { text: 'заблокированы в Kaiten: 2 карты из 3', tone: 'warn' }],
  });
});

test('Capacity из служебной карты: план — последний «Конец планирования» у начала спринта, факт — первое «Начать планирование» у конца, чужая доска и далёкие записи не в счёт', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });
  const log = [
    record('end', '2026-09-14T10:00:00.000Z', { back: 36, front: 18, qa: 18 }),
    record('end', '2026-09-14T12:00:00.000Z', { back: 40, front: 18, qa: 18 }),
    record('end', '2026-09-14T12:30:00.000Z', { back: 99 }, OTHER),
    record('end', '2026-09-01T10:00:00.000Z', { back: 1 }),
    record('start', '2026-09-15T07:00:00.000Z', { back: 5 }),
    record('start', '2026-09-28T07:00:00.000Z', { back: 30, front: 18 }),
    record('start', '2026-09-28T09:00:00.000Z', { back: 50, front: 18, qa: 18 }),
  ];

  // Act
  const capacity = block(sprint.sprintReportBlocks({ last, capacityLog: log, now: NOW, cfg: CFG }), 'last', 'capacity');

  // Assert
  assert.deepEqual(capacity, { key: 'capacity', title: 'Capacity, человеко-дни', value: '76 → 48', caption: 'план → факт', lines: [{ text: 'Бэк 40 → 30 · Фронт 18 · QA 18 → 0' }, { text: 'отклонение −37%' }] });
});

test('Capacity из служебной карты: записан только план, только факт, ничего; служебная карта не загрузилась — так и пишу', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });
  const plan = record('end', '2026-09-14T12:00:00.000Z', { back: 40, front: 18, qa: 18 });
  const fact = record('start', '2026-09-28T07:00:00.000Z', { back: 30, front: 18 });
  const labels = { back: 'Бэк', front: 'Mobile', qa: 'QA' };
  const capacity = (capacityLog) => {
    const found = block(sprint.sprintReportBlocks({ last, capacityLog, labels, now: NOW, cfg: CFG }), 'last', 'capacity');
    return [found.value || null, found.caption || null, ...found.lines.map((line) => `${line.tone || 'text'}: ${line.text}`)];
  };

  // Act
  const blocks = [capacity([plan]), capacity([fact]), capacity([]), capacity(null)];

  // Assert
  assert.deepEqual(blocks, [
    ['76', 'план', 'text: Бэк 40 · Mobile 18 · QA 18', 'note: факт не записан'],
    ['48', 'факт', 'text: Бэк 30 · Mobile 18', 'note: план не записан'],
    [null, null, 'note: план и факт не записаны'],
    [null, null, 'warn: записи capacity не загрузились'],
  ]);
});

test('Capacity идущего спринта: план из служебной карты рядом с тем, что сейчас в «Команде и днях»', () => {
  // Arrange
  const running = sprint.sprintSummary({ sprint: sprintData({ actual_finish_date: null }), now: Date.parse('2026-09-20T12:00:00.000Z'), columns: COLUMNS, cfg: CFG });
  const log = [record('end', '2026-09-14T12:00:00.000Z', { back: 40, front: 18, qa: 18 })];
  const capacity = (days, capacityLog) => {
    const found = block(sprint.sprintReportBlocks({ running, capacity: days, capacityLog, now: Date.parse('2026-09-20T12:00:00.000Z'), cfg: CFG }), 'running', 'capacity');
    return [found.value || null, found.caption || null, ...found.lines.map((line) => `${line.tone || 'text'}: ${line.text}`)];
  };

  // Act
  const blocks = [capacity({ back: 33, front: 18, qa: 18 }, log), capacity(null, log), capacity({ back: 33 }, []), capacity(null, null)];

  // Assert
  assert.deepEqual(blocks, [
    ['76 → 69', 'план → сейчас по панели', 'text: Бэк 40 → 33 · Фронт 18 · QA 18', 'text: отклонение −9%'],
    ['76', 'план', 'text: Бэк 40 · Фронт 18 · QA 18'],
    ['33', 'на спринт, по панели', 'text: Бэк 33'],
    [null, null, 'note: не посчитана', 'warn: план capacity не загрузился'],
  ]);
});

test('Блоки: прошлые спринты не загрузились — причина отдельно от секций', () => {
  // Arrange
  const running = sprint.sprintSummary({ sprint: sprintData({ actual_finish_date: null }), now: Date.parse('2026-09-20T12:00:00.000Z'), columns: COLUMNS, cfg: CFG });

  // Act
  const report = sprint.sprintReportBlocks({ running, historyProblem: 'нет сети', capacityLog: [], now: Date.parse('2026-09-20T12:00:00.000Z'), cfg: CFG });

  // Assert
  assert.deepEqual([report.sections[0].title, report.sections[0].note], ['Идёт спринт 14.09–27.09', 'осталось 5 рабочих дней, считая сегодня']);
  assert.equal(report.problem, 'Прошлые спринты не загрузились: нет сети');
});

test('Цель в несколько строк — пункты через точку с запятой, маркеры списка убраны', () => {
  // Arrange
  const data = sprintData({ goal: '- Запустить витрину\n\n2. Поиск по адресу,  отчёт \n• Уведомления (в работе) ' });

  // Act
  const summary = sprint.sprintSummary({ sprint: data, now: NOW, columns: COLUMNS, cfg: CFG });
  const goal = block(sprint.sprintReportBlocks({ last: summary, capacityLog: [], now: NOW, cfg: CFG }), 'last', 'goal');

  // Assert
  assert.deepEqual(goal.lines, [{ text: 'Запустить витрину; Поиск по адресу, отчёт; Уведомления (в работе)', tone: 'strong' }]);
});

test('Числа и дни словами: запятая, минус, дробь — «рабочего дня»', () => {
  // Act
  const numbers = [sprint.sprintNumber(52.666), sprint.sprintNumber(-5), sprint.sprintNumber(-0.04), sprint.sprintNumber(0)];
  const days = [sprint.sprintDays(3.94), sprint.sprintDays(1), sprint.sprintDays(5)];

  // Assert
  assert.deepEqual(numbers, ['52,7', '−5', '0', '0']);
  assert.deepEqual(days, ['3,9 рабочего дня', '1 рабочий день', '5 рабочих дней']);
});

test('Конфиг отчёта спринта совпадает с панелью: баг, Done, порядок колонок', () => {
  // Arrange
  const cfg = sprint.SPRINT_REPORT;

  // Assert
  assert.deepEqual(cfg.bugTypeIds, SPRINT_CAPACITY.bugTypeIds);
  assert.equal(cfg.doneState, SPRINT_CAPACITY.doneState);
  assert.deepEqual(cfg.stageOrder, Object.keys(SPRINT_CAPACITY.progress.stages));
});
