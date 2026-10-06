const test = require('node:test');
const assert = require('node:assert/strict');
const sprint = require('../src/sprint-core.js');
const { REPORT_CONFIG } = require('../src/report-core.js');
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
const SPRINT_ID = 500;
const DAY = 86400000;

const CFG = { ...sprint.SPRINT_REPORT, boards: { [INBOX]: 'Inbox', [BACKLOG]: 'бэклог', [EXPEDITE]: 'дежурка' }, notEscape: [112] };
const COLUMNS = { 1: 'To Do', 2: 'Doing', 3: 'Review', 4: 'Done' };
const NOW = Date.parse('2026-10-06T15:00:00.000Z');

const card = (id, extra = {}) => ({ id, type_id: 1, created: '2026-09-01T05:00:00.000Z', blocked: false, parents_ids: [], properties: {}, first_moved_to_in_progress_at: null, ...extra });
const bug = (id, source, extra = {}) => card(id, { type_id: BUG, properties: { id_425359: source }, ...extra });
const version = (id, updated, sprintId, column, state, size, extra = {}) => ({ id, updated, sprint_id: sprintId, board_id: DEV, column_id: column, state, size, archived: false, version: 1, ...extra });
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
      card(102, { blocked: true, parents_ids: [900] }),
      card(103),
      card(104, { parents_ids: [101], first_moved_to_in_progress_at: '2026-09-15T06:00:00.000Z' }),
      bug(105, [SUPPORT]),
      card(106, { created: '2026-09-16T05:00:00.000Z', parents_ids: null }),
      card(107, { parents_ids: [900] }),
      card(108, { first_moved_to_in_progress_at: '2026-09-21T06:00:00.000Z' }),
      card(109),
      bug(110, [FEATURE]),
      bug(111, INCIDENT),
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

test('Сводка: план, влёт, ушло, переоценка, в проде, перенос, баги из прода и прошлый спринт; баланс сходится', () => {
  // Act
  const result = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });

  // Assert
  assert.deepEqual(
    { plan: result.plan, added: result.added, left: result.left, reestimate: result.reestimate, done: result.done, carry: result.carry, escaped: result.escaped, prevId: result.prevId },
    {
      plan: { cards: 5, bugs: 1, sp: 19 },
      added: { tasks: 3, bugs: 3, sp: 6, from: [{ label: 'Inbox', count: 4 }, { label: 'дежурка', count: 1 }, { label: 'создано в спринте', count: 1 }], related: { tasks: 2, sp: 4 } },
      left: { cards: 2, sp: 10, to: [{ label: 'бэклог', count: 1 }, { label: 'Inbox', count: 1 }] },
      reestimate: 2,
      done: { tasks: 3, bugs: 2, sp: 10, planSp: 8, planSp0: 8, addedSp: 2 },
      carry: { cards: 4, bugs: 2, sp: 7, columns: [{ title: 'To Do', cards: 2, sp: 1 }, { title: 'Doing', cards: 1, sp: 5 }, { title: 'Review', cards: 1, sp: 1 }], blocked: 1 },
      escaped: { count: 2, done: 1 },
      prevId: 400,
    },
  );
  assert.equal(result.plan.sp + result.reestimate + result.added.sp - result.left.sp, result.done.sp + result.carry.sp);
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
  assert.deepEqual(result.lead, { median: 2, p85: 2, n: 1 });
});

test('Стартовый план: процент по последней оценке, рядом — насколько она выросла или снизилась', () => {
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
  const line = (summary) => sprint.sprintReportLines({ last: summary, now: NOW, cfg: CFG }).find((item) => item.text.startsWith('Стартовый план')).text;

  // Act
  const texts = [line(grew), line(fell)];

  // Assert
  assert.deepEqual([grew.plan.sp, grew.done.planSp, grew.done.planSp0, grew.reestimate], [8, 8, 3, 5]);
  assert.deepEqual(texts, ['Стартовый план выполнен на 100%: 8 из 8 SP по последней оценке, у карт в проде она выросла на 5 SP', 'Стартовый план выполнен на 25%: 2 из 8 SP по последней оценке, у карт в проде она снизилась на 1 SP']);
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
  assert.deepEqual(result.lead, { median: 2, p85: 5, n: 3 });
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

test('Загрузчик: воскресенье прошло, а в Kaiten спринт открыт — итоги по нему, не в кэш', async () => {
  // Arrange
  const { load, loads } = loader(chain());
  const store = memoryStore();

  // Act
  const result = await sprint.sprintReportLoad({ cards: [{ sprint_id: 503 }], boardId: DEV, now: Date.parse('2026-10-12T05:00:00.000Z'), columns: COLUMNS, load, store, cfg: CFG });

  // Assert
  assert.deepEqual([result.running, result.last.id, result.last.closedAt, result.history.map((item) => item.id)], [null, 503, null, [502, 501, 500]]);
  assert.deepEqual(loads, [503, 502, 501, 500]);
  assert.equal(store.read('sprintSummary.503'), null);
  assert.equal(sprint.sprintReportLines({ ...result, now: Date.parse('2026-10-12T05:00:00.000Z'), cfg: CFG })[0].text, 'Итоги спринта 28.09–11.10 — предварительные: в Kaiten ещё не завершён');
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

test('Текст итогов закрытого спринта: строки по порядку, формы слов, capacity не заполнена', () => {
  // Arrange
  const last = sprint.sprintSummary({ sprint: sprintData(), now: NOW, columns: COLUMNS, cfg: CFG });

  // Act
  const lines = sprint.sprintReportLines({ last, now: NOW, cfg: CFG });

  // Assert
  assert.deepEqual(lines, [
    { text: 'Итоги спринта 14.09–27.09', bold: true },
    { text: 'Цель: Выпустить экран заказов' },
    { text: 'План: 19 SP, 5 карт' },
    { text: 'Влетело: 3 задачи и 3 бага на 6 SP; откуда: Inbox 4, дежурка 1, создано в спринте 1' },
    { text: 'Из влёта — части задач и эпиков плана: 2 задачи на 4 SP' },
    { text: 'Ушло: 2 карты на 10 SP; куда: бэклог 1, Inbox 1' },
    { text: 'Переоценка карт плана: +2 SP' },
    { text: 'В проде: 10 SP — 3 задачи и 2 бага; из плана 8 SP, из влёта 2 SP' },
    { text: 'Стартовый план выполнен на 42%: 8 из 19 SP, оценка карт в проде не менялась' },
    { text: 'Перенос: 4 карты на 7 SP — To Do 2 (1 SP), Doing 1 (5 SP), Review 1 (1 SP)' },
    { text: 'Время до прода (задачи, от Doing до Done): медиана 2 рабочих дня, у 85% — до 5, всего 3 задачи' },
    { text: 'Время по колонкам: Review 63%, Doing 37%' },
    { text: 'Баги из прода: 2, исправлено 1' },
    { text: 'Следующий спринт, capacity: «Команда и дни» в панели не заполнены' },
  ]);
});

test('Текст при идущем спринте: итоги прошлого с velocity двух спринтов, ход текущего с capacity из панели', async () => {
  // Arrange
  const { load } = loader(chain());
  const loaded = await sprint.sprintReportLoad({ cards: [{ sprint_id: 503 }], boardId: DEV, now: NOW, columns: COLUMNS, load, store: memoryStore(), cfg: CFG });
  const capacity = [{ label: 'Бэк', days: 20 }, { label: 'QA', days: 7.5 }];

  // Act
  const lines = sprint.sprintReportLines({ ...loaded, capacity, now: NOW, cfg: CFG });
  const texts = lines.map((line) => line.text);

  // Assert
  assert.deepEqual(lines.filter((line) => line.bold).map((line) => line.text), ['Итоги спринта 14.09–27.09', 'Идёт спринт 28.09–11.10 — осталось 4 рабочих дня с сегодняшним']);
  assert.ok(texts.includes('Цель — из названия спринта: Спринт 502'));
  assert.ok(texts.includes('План: 8 SP, 1 карта · velocity двух прошлых спринтов: 4, 6 SP, в среднем 5'));
  assert.ok(texts.includes('План: 5 SP, 1 карта · velocity трёх прошлых спринтов: 4, 6, 8 SP, в среднем 6'));
  assert.ok(texts.includes('Capacity по «Команде и дням»: 27,5 чел.-дн. — Бэк 20, QA 7,5'));
  assert.ok(texts.includes('Не в проде: нет'));
  assert.ok(texts.includes('Время до прода: у задач в проде нет даты начала работы'));
  assert.ok(!texts.some((text) => text.startsWith('Следующий спринт')));
});

test('Текст: прошлые спринты не загрузились — строка с причиной в конце', () => {
  // Arrange
  const running = sprint.sprintSummary({ sprint: sprintData({ actual_finish_date: null }), now: Date.parse('2026-09-20T12:00:00.000Z'), columns: COLUMNS, cfg: CFG });

  // Act
  const lines = sprint.sprintReportLines({ running, historyProblem: 'нет сети', now: Date.parse('2026-09-20T12:00:00.000Z'), cfg: CFG });

  // Assert
  assert.equal(lines[0].text, 'Идёт спринт 14.09–27.09 — осталось 5 рабочих дней с сегодняшним');
  assert.equal(lines[lines.length - 1].text, 'Прошлые спринты не загрузились: нет сети');
});

test('Цель в несколько строк — пункты через точку с запятой, маркеры списка убраны', () => {
  // Arrange
  const data = sprintData({ goal: '- Запустить витрину\n\n2. Поиск по адресу,  отчёт \n• Уведомления (в работе) ' });

  // Act
  const summary = sprint.sprintSummary({ sprint: data, now: NOW, columns: COLUMNS, cfg: CFG });
  const lines = sprint.sprintReportLines({ last: summary, now: NOW, cfg: CFG });

  // Assert
  assert.equal(lines[1].text, 'Цель: Запустить витрину; Поиск по адресу, отчёт; Уведомления (в работе)');
});

test('Числа и дни словами: запятая, минус, дробь — «рабочего дня»', () => {
  // Act
  const numbers = [sprint.sprintNumber(52.666), sprint.sprintNumber(-5), sprint.sprintNumber(-0.04), sprint.sprintNumber(0)];
  const days = [sprint.sprintDays(3.94), sprint.sprintDays(1), sprint.sprintDays(5)];

  // Assert
  assert.deepEqual(numbers, ['52,7', '−5', '0', '0']);
  assert.deepEqual(days, ['3,9 рабочего дня', '1 рабочий день', '5 рабочих дней']);
});

test('Конфиг отчёта спринта совпадает с отчётом и панелью: баг, Done, источники багов из прода', () => {
  // Arrange
  const cfg = sprint.SPRINT_REPORT;

  // Assert
  assert.deepEqual(cfg.escapeSources, REPORT_CONFIG.escapeSources);
  assert.deepEqual(cfg.notEscape, REPORT_CONFIG.notEscape);
  assert.equal(cfg.source, REPORT_CONFIG.fields.source);
  assert.deepEqual(cfg.bugTypeIds, [REPORT_CONFIG.bugType]);
  assert.deepEqual(cfg.bugTypeIds, SPRINT_CAPACITY.bugTypeIds);
  assert.equal(cfg.doneState, SPRINT_CAPACITY.doneState);
  assert.deepEqual(cfg.stageOrder, Object.keys(SPRINT_CAPACITY.progress.stages));
});
