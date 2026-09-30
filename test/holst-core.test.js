const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../src/holst-core.js');
const { SPRINT_CAPACITY } = require('../src/core.js');

const url = (id) => `https://dodopizza.kaiten.ru/${id}`;
const text = (value, marks) => (marks ? { text: value, marks } : { text: value });
const li = (...runs) => ({ type: 'ol-list-item', runs });
const p = (...runs) => ({ type: 'paragraph', runs });
const lineTexts = (items) => items.map((item) => item.runs.map((run) => run.text).join(''));

const card = (id, title, block, extra = {}) => ({ id, title, block, movedAt: Date.parse('2026-09-29T10:00:00Z'), mark: null, from: null, ...extra });

test('Payload проходит через адрес без потерь, кириллица и эмодзи целы', () => {
  const payload = { v: 1, cards: [{ id: 1, title: 'Шаг 2в 🔥 «кавычки»' }], percent: 43 };
  const hash = `#${H.HOLST_HASH}=${H.encodeHolstPayload(payload)}`;
  assert.match(hash, /^#sprintcap=[A-Za-z0-9_-]+$/);
  assert.deepEqual(H.decodeHolstPayload(hash), payload);
  assert.equal(H.decodeHolstPayload('#other=1'), null);
});

test('Рабочий день спринта: понедельник старта — ноль, выходные пропускаются', () => {
  const start = new Date(2026, 8, 28, 2, 0);
  assert.equal(H.workingDayIndex(start, new Date(2026, 8, 28, 18)), 0);
  assert.equal(H.workingDayIndex(start, new Date(2026, 8, 29, 9)), 1);
  assert.equal(H.workingDayIndex(start, new Date(2026, 8, 30, 23, 59)), 2);
  assert.equal(H.workingDayIndex(start, new Date(2026, 9, 2, 12)), 4);
  assert.equal(H.workingDayIndex(start, new Date(2026, 9, 3, 12)), 4);
  assert.equal(H.workingDayIndex(start, new Date(2026, 9, 5, 12)), 5);
  assert.equal(H.workingDayIndex(start, new Date(2026, 9, 9, 12)), 9);
  assert.equal(H.workingDayIndex(start, new Date(2026, 8, 27, 12)), -1);
});

test('Бомба встаёт центром на строку процента, ноль — не ниже оси', () => {
  const labels = { top: -917, height: 2044, lines: 25 };
  const at = (percent) => H.bombTop({ percent, labels, axisY: 976, size: 169 }) + 169 / 2;
  assert.ok(Math.abs(at(100) - (-876)) < 1);
  assert.ok(Math.abs(at(75) - (-917 + 6.5 * 2044 / 25)) < 1);
  assert.ok(Math.abs(at(50) - (-917 + 12.5 * 2044 / 25)) < 1);
  assert.ok(Math.abs(at(0) - 955) < 1);
  assert.ok(Math.abs(at(-5) - 955) < 1);
  assert.ok(Math.abs(at(120) - (-876)) < 1);
});

test('Колонки Kaiten раскладываются по блокам, Design Review и Test вместе', () => {
  assert.equal(H.blockOfColumn('Design Review'), 'test');
  assert.equal(H.blockOfColumn('Test'), 'test');
  assert.equal(H.blockOfColumn('Waiting for release'), 'release');
  assert.equal(H.blockOfColumn('Review'), 'review');
  assert.equal(H.blockOfColumn('Blocked'), 'column:Blocked');
});

test('Подсветка: сдвинулась сегодня — жёлтая, в Done — зелёная, с колонкой «из»', () => {
  const now = new Date(2026, 8, 30, 15, 0);
  const at = (h, m = 0) => new Date(2026, 8, 30, h, m).toISOString();
  const yesterday = new Date(2026, 8, 29, 12).toISOString();
  const cards = [
    { id: 1, title: 'Сдвинулась', state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: at(11, 20) },
    { id: 2, title: 'Готово', state: 3, column_id: 70, column: { title: 'Done' }, column_changed_at: at(12) },
    { id: 3, title: 'Туда-обратно', state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: at(13) },
    { id: 4, title: 'Вчера', state: 2, column_id: 30, column: { title: 'Review' }, column_changed_at: yesterday },
    { id: 5, title: 'Done на старте', state: 3, column_id: 70, column: { title: 'Done' }, column_changed_at: yesterday },
  ];
  const histories = {
    1: [{ changed: yesterday, column_id: 10 }, { changed: at(11, 20), column_id: 20 }],
    2: [{ changed: yesterday, column_id: 50 }, { changed: at(12), column_id: 70 }],
    3: [{ changed: yesterday, column_id: 20 }, { changed: at(12), column_id: 30 }, { changed: at(13), column_id: 20 }],
  };
  const columns = { 10: 'To Do', 20: 'Doing', 30: 'Review', 50: 'Test', 70: 'Done' };
  const result = H.holstCards({ cards, doneAtStart: [5], histories, columns, now, config: SPRINT_CAPACITY });
  assert.deepEqual(result.map((item) => [item.id, item.block, item.mark, item.from]), [
    [1, 'doing', 'work', 'To Do'],
    [2, 'done', 'done', 'Test'],
    [3, 'doing', null, null],
    [4, 'review', null, null],
  ]);
});

test('Старый розовый стикер: заголовок остаётся, пометки «+/-» и 🔴 переезжают к ссылке', () => {
  const items = [
    p(text('Как поймём, что задача выполнена:', { bold: true })),
    p(),
    li(text('+/- Шаг 2в Заполнить признак внешнего курьера')),
    li(text('🔴 [AI] Баннер «Подтвердить график» пропадает')),
    li(text('Ручная строка без карты')),
  ];
  const cards = [
    card(11, 'Шаг 2в Заполнить признак внешнего курьера', 'release'),
    card(12, '[AI] Баннер «Подтвердить график» пропадает', 'todo'),
    card(13, 'Новая карта', 'doing', { mark: 'work', from: 'To Do', movedAt: new Date(2026, 8, 30, 11, 20).getTime() }),
  ];
  const { items: out, stats } = H.planSticker({ items, cards, cardUrl: url });
  assert.deepEqual(lineTexts(out), [
    'Как поймём, что задача выполнена:',
    '',
    'Ручная строка без карты',
    '📋 To Do · 1',
    '🔴 [AI] Баннер «Подтвердить график» пропадает',
    '🔨 Doing · 1',
    'Новая карта  ← из To Do, 30.09 11:20',
    '🚀 Waiting for release · 1',
    '+/- Шаг 2в Заполнить признак внешнего курьера',
  ]);
  const release = out[8].runs.find((run) => run.link);
  assert.equal(release.link, url(11));
  assert.equal(release.marks.color, H.HOLST_STYLE.link);
  const moved = out[6].runs;
  assert.equal(moved[0].marks.backgroundColor, H.HOLST_STYLE.work);
  assert.equal(moved[2].marks.color, H.HOLST_STYLE.note);
  assert.deepEqual(stats, { cards: 3, kept: 0, marked: 1, manual: 1, gone: 0 });
});

test('Ручной перенос строки держится, пока карта снова не сдвинется в Kaiten', () => {
  const lastRun = Date.parse('2026-09-30T06:00:00Z');
  const items = [
    p(text('📋 To Do · 1', { bold: true })),
    li({ text: 'Перенесли руками в To Do', link: url(21001), marks: { color: H.HOLST_STYLE.link } }),
    li({ text: 'Сдвинулась после прогона', link: url(22001), marks: { color: H.HOLST_STYLE.link } }, text('  '), text('← из Doing, 29.09 10:00', { color: H.HOLST_STYLE.note, italic: true, fontSize: 10 })),
    li(text('заметка команды')),
    p(text('🔨 Doing · 0', { bold: true })),
  ];
  const cards = [
    card(21001, 'Перенесли руками в To Do', 'doing', { movedAt: lastRun - 1000 }),
    card(22001, 'Сдвинулась после прогона', 'review', { movedAt: lastRun + 1000 }),
  ];
  const { items: out, stats } = H.planSticker({ items, cards, lastRun, cardUrl: url });
  assert.deepEqual(lineTexts(out), [
    '📋 To Do · 1',
    'Перенесли руками в To Do',
    'заметка команды',
    '👀 Review · 1',
    'Сдвинулась после прогона',
  ]);
  assert.equal(stats.kept, 1);
});

test('Первый прогон без отметки времени раскладывает всё по Kaiten', () => {
  const items = [
    p(text('📋 To Do · 1', { bold: true })),
    li({ text: 'Карта', link: url(31001) }),
  ];
  const { items: out } = H.planSticker({ items, cards: [card(31001, 'Карта', 'done', { mark: 'done', from: 'Test' })], cardUrl: url });
  assert.deepEqual(lineTexts(out), ['✅ Done · 1', `Карта  ← из Test, ${H.shortTime(Date.parse('2026-09-29T10:00:00Z'))}`]);
  assert.equal(out[1].runs[0].marks.backgroundColor, H.HOLST_STYLE.done);
});

test('Карта, которой больше нет в спринте, остаётся на месте и считается отдельно', () => {
  const items = [
    p(text('🔨 Doing · 1', { bold: true })),
    li({ text: 'Ушла из спринта', link: url(41001) }),
  ];
  const { items: out, stats } = H.planSticker({ items, cards: [], cardUrl: url });
  assert.deepEqual(lineTexts(out), ['🔨 Doing · 0', 'Ушла из спринта']);
  assert.equal(stats.gone, 1);
});

test('Номер карты берётся из разных видов ссылки Kaiten', () => {
  assert.equal(H.kaitenCardId('https://dodopizza.kaiten.ru/70686961'), 70686961);
  assert.equal(H.kaitenCardId('https://dodopizza.kaiten.ru/space/19143/card/70686961'), 70686961);
  assert.equal(H.kaitenCardId('https://dodopizza.kaiten.ru/70686961?x=1'), 70686961);
  assert.equal(H.kaitenCardId('https://example.com/70686961'), null);
});

test('Карта пришла с другой доски — в приписке название той доски', () => {
  const now = new Date(2026, 8, 30, 15, 0);
  const cards = [{ id: 7101, title: 'Из Inbox', state: 1, board_id: 68084, column_id: 10, column: { title: 'To Do' }, column_changed_at: new Date(2026, 8, 30, 10, 20).toISOString() }];
  const histories = { 7101: [
    { changed: new Date(2026, 8, 29, 11).toISOString(), board_id: 1108487, column_id: 3884978 },
    { changed: new Date(2026, 8, 30, 10, 20).toISOString(), board_id: 68084, column_id: 10 },
  ] };
  assert.deepEqual(H.holstForeignBoards(cards, histories), [1108487]);
  const [item] = H.holstCards({ cards, histories, columns: { 10: 'To Do' }, boards: { 1108487: 'Inbox(P2P)' }, now, config: SPRINT_CAPACITY });
  assert.deepEqual([item.block, item.mark, item.from], ['todo', 'work', 'Inbox(P2P)']);
});

test('Колонки доски вместе с подколонками, спринт — тот, где больше карт', () => {
  const board = { columns: [{ id: 1, title: 'To Do' }, { id: 2, title: 'Doing', subcolumns: [{ id: 21, title: 'Review' }] }] };
  assert.deepEqual(H.holstColumns(board), { 1: 'To Do', 2: 'Doing', 21: 'Review' });
  assert.deepEqual(H.holstColumns(null), {});
  assert.equal(H.holstSprintId([{ sprint_id: 5 }, { sprint_id: 7 }, { sprint_id: 7 }, {}]), 7);
  assert.equal(H.holstSprintId([{}]), null);
});
