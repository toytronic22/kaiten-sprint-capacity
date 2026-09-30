const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../src/holst-core.js');
const { SPRINT_CAPACITY, buildReport, defaultSettings, takeSnapshot } = require('../src/core.js');

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

test('Подсветка: сдвинулась — жёлтая, в Done — зелёная, туда-обратно — тоже, с колонкой «из»', () => {
  const now = new Date(2026, 8, 30, 15, 0);
  const at = (h, m = 0) => new Date(2026, 8, 30, h, m).toISOString();
  const yesterday = new Date(2026, 8, 28, 12).toISOString();
  const cards = [
    { id: 1, title: 'Сдвинулась', state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: at(11, 20) },
    { id: 2, title: 'Готово', state: 3, column_id: 70, column: { title: 'Done' }, column_changed_at: at(12) },
    { id: 3, title: 'Туда-обратно', state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: at(13) },
    { id: 4, title: 'Позавчера', state: 2, column_id: 30, column: { title: 'Review' }, column_changed_at: yesterday },
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
    [3, 'doing', 'work', 'Review'],
    [4, 'review', null, null],
  ]);
});

test('Подсветка: всё, что сменило колонку с начала прошлого рабочего дня, даже если вернулось', () => {
  const at = (day, h, m = 0) => new Date(2026, 8, day, h, m).getTime();
  const iso = (day, h, m = 0) => new Date(at(day, h, m)).toISOString();
  const now = at(30, 15);
  const lookback = H.holstLookback(now);
  assert.equal(lookback, at(29, 0));
  const cards = [
    { id: 1, title: 'Сегодня', state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: iso(30, 11, 20) },
    { id: 2, title: 'Вчера вечером', state: 2, column_id: 30, column: { title: 'Review' }, column_changed_at: iso(29, 17) },
    { id: 3, title: 'Вчера утром', state: 2, column_id: 30, column: { title: 'Review' }, column_changed_at: iso(29, 0, 10) },
    { id: 4, title: 'Вернулась сегодня', state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: iso(30, 9) },
    { id: 5, title: 'В Done сегодня', state: 3, column_id: 70, column: { title: 'Done' }, column_changed_at: iso(30, 12) },
    { id: 6, title: 'Новая вчера', state: 1, column_id: 10, column: { title: 'To Do' }, column_changed_at: iso(29, 16) },
    { id: 7, title: 'Давно', state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: iso(20, 10) },
    { id: 8, title: 'Позавчера', state: 2, column_id: 30, column: { title: 'Review' }, column_changed_at: iso(28, 23, 59) },
  ];
  const histories = {
    1: [{ changed: iso(20, 10), column_id: 10 }, { changed: iso(30, 11, 20), column_id: 20 }],
    2: [{ changed: iso(20, 10), column_id: 20 }, { changed: iso(29, 17), column_id: 30 }],
    3: [{ changed: iso(20, 10), column_id: 20 }, { changed: iso(29, 0, 10), column_id: 30 }],
    4: [{ changed: iso(20, 10), column_id: 20 }, { changed: iso(29, 16), column_id: 30 }, { changed: iso(30, 9), column_id: 20 }],
    5: [{ changed: iso(20, 10), column_id: 50 }, { changed: iso(30, 12), column_id: 70 }],
    6: [{ changed: iso(29, 16), column_id: 10 }],
    8: [{ changed: iso(20, 10), column_id: 20 }, { changed: iso(28, 23, 59), column_id: 30 }],
  };
  assert.deepEqual(H.holstHistoryIds(cards, lookback), [1, 2, 3, 4, 5, 6]);
  const columns = { 10: 'To Do', 20: 'Doing', 30: 'Review', 50: 'Test', 70: 'Done' };
  const items = H.holstCards({ cards, histories, columns, now, config: SPRINT_CAPACITY });
  assert.deepEqual(items.map((item) => [item.id, item.mark, item.from]), [
    [1, 'work', 'To Do'], [2, 'work', 'Doing'], [3, 'work', 'Doing'], [4, 'work', 'Review'],
    [5, 'done', 'Test'], [6, 'work', null], [7, null, null], [8, null, null],
  ]);
  assert.deepEqual(H.holstCards({ cards, histories, columns, now: at(30, 23, 59), config: SPRINT_CAPACITY }).map((item) => item.mark), items.map((item) => item.mark));
  const tomorrow = H.holstCards({ cards, histories, columns, now: new Date(2026, 9, 1, 10).getTime(), config: SPRINT_CAPACITY });
  assert.deepEqual(tomorrow.map((item) => item.mark), ['work', null, null, 'work', 'done', null, null, null]);
  const { items: out } = H.planSticker({ items: [], cards: items, cardUrl: url });
  const line = out.find((item) => item.runs.some((run) => run.text === 'Вчера утром'));
  assert.equal(lineTexts([line])[0], `Вчера утром  ← из Doing, ${H.shortTime(at(29, 0, 10))}`);
  assert.equal(line.runs[0].marks.backgroundColor, H.HOLST_STYLE.work);
});

test('Окно подсветки: с 00:00 прошлого рабочего дня, в понедельник и выходные — с пятницы', () => {
  const at = (month, day, h, m = 0) => new Date(2026, month - 1, day, h, m).getTime();
  assert.equal(H.holstLookback(at(9, 30, 0, 5)), at(9, 29, 0));
  assert.equal(H.holstLookback(at(9, 30, 23, 55)), at(9, 29, 0));
  assert.equal(H.holstLookback(at(10, 1, 9)), at(9, 30, 0));
  assert.equal(H.holstLookback(at(10, 2, 9)), at(10, 1, 0));
  assert.equal(H.holstLookback(at(10, 3, 12)), at(10, 2, 0));
  assert.equal(H.holstLookback(at(10, 4, 12)), at(10, 2, 0));
  assert.equal(H.holstLookback(at(10, 5, 10)), at(10, 2, 0));
  assert.equal(H.holstLookback(at(10, 6, 10)), at(10, 5, 0));
  assert.equal(H.holstLookback(at(1, 1, 10)), new Date(2025, 11, 31).getTime());
});

test('В понедельник подсвечено всё с пятницы: пятница, суббота, воскресенье и сам понедельник', () => {
  const at = (month, day, h) => new Date(2026, month - 1, day, h).getTime();
  const iso = (month, day, h) => new Date(at(month, day, h)).toISOString();
  const moved = (id, month, day, h) => ({ id, title: `Карта ${id}`, state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: iso(month, day, h) });
  const cards = [moved(1, 10, 1, 23), moved(2, 10, 2, 9), moved(3, 10, 3, 12), moved(4, 10, 4, 20), moved(5, 10, 5, 8)];
  const histories = Object.fromEntries(cards.map((card) => [card.id, [{ changed: iso(9, 20, 10), column_id: 10 }, { changed: card.column_changed_at, column_id: 20 }]]));
  const items = H.holstCards({ cards, histories, columns: { 10: 'To Do', 20: 'Doing' }, now: at(10, 5, 11), config: SPRINT_CAPACITY });
  assert.deepEqual(items.map((item) => item.mark), [null, 'work', 'work', 'work', 'work']);
  const tuesday = H.holstCards({ cards, histories, columns: { 10: 'To Do', 20: 'Doing' }, now: at(10, 6, 11), config: SPRINT_CAPACITY });
  assert.deepEqual(tuesday.map((item) => item.mark), [null, null, null, null, 'work']);
});

test('Старый розовый стикер: заголовок остаётся, 🔴 переезжает к ссылке, старый «+/-» снимается', () => {
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
    'Шаг 2в Заполнить признак внешнего курьера',
  ]);
  const release = out[8].runs.find((run) => run.link);
  assert.equal(release.link, url(11));
  assert.equal(release.marks.color, H.HOLST_STYLE.link);
  const moved = out[6].runs;
  assert.equal(moved[0].marks.backgroundColor, H.HOLST_STYLE.work);
  assert.equal(moved[2].marks.color, H.HOLST_STYLE.note);
  assert.deepEqual(stats, { cards: 3, kept: 0, marked: 1, manual: 1, gone: 0, renamed: 0 });
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

test('Карта, которой больше нет в спринте, удаляется из списка, а ссылка над списком остаётся', () => {
  const items = [
    li({ text: 'Эпик над списком', link: url(40001) }),
    p(text('🔨 Doing · 2', { bold: true })),
    li({ text: 'Ушла из спринта', link: url(41001) }),
    li({ text: 'Осталась', link: url(41002) }),
    li(text('заметка команды')),
  ];
  const { items: out, stats } = H.planSticker({ items, cards: [card(41002, 'Осталась', 'doing')], lastRun: Date.parse('2026-09-30T06:00:00Z'), cardUrl: url });
  assert.deepEqual(lineTexts(out), ['Эпик над списком', '🔨 Doing · 1', 'Осталась', 'заметка команды']);
  assert.equal(stats.gone, 1);
  assert.equal(stats.manual, 1);
});

test('Пометок «+/-» и «+» больше нет: старые снимаются, «+2 часа» и остальной текст остаются', () => {
  const lastRun = Date.parse('2026-09-30T06:00:00Z');
  const items = [
    p(text('📋 To Do · 1', { bold: true })),
    li(text('+/- '), { text: 'Вернулась в To Do', link: url(51001) }),
    p(text('🔨 Doing · 3', { bold: true })),
    li(text('+ /- 🟡 '), { text: 'Кривая пометка', link: url(51002) }),
    li({ text: 'Без пометки', link: url(51003) }),
    li(text('+/- Строка текстом')),
    p(text('✅ Done · 1', { bold: true })),
    li(text('+/- '), { text: 'Готова', link: url(51004) }),
  ];
  const cards = [
    card(51001, 'Вернулась в To Do', 'todo'),
    card(51002, 'Кривая пометка', 'doing'),
    card(51003, 'Без пометки', 'doing'),
    card(51005, 'Строка текстом', 'doing'),
    card(51004, 'Готова', 'done'),
  ];
  const { items: out } = H.planSticker({ items, cards, lastRun, cardUrl: url });
  assert.deepEqual(lineTexts(out), [
    '📋 To Do · 1',
    'Вернулась в To Do',
    '🔨 Doing · 3',
    '🟡 Кривая пометка',
    'Без пометки',
    'Строка текстом',
    '✅ Done · 1',
    'Готова',
  ]);
  assert.deepEqual(lineTexts([{ runs: H.stripMarker([text('+2 часа')]) }]), ['+2 часа']);
  assert.deepEqual(lineTexts([{ runs: H.stripMarker([text('+/-🔥 ')]) }]), ['🔥 ']);
});

test('Старое название карты узнаётся и меняется на новое, дубль строки пропадает', () => {
  const lastRun = Date.parse('2026-09-30T06:00:00Z');
  const items = [
    p(text('Как поймём, что задача выполнена:', { bold: true })),
    li(text('Недельный график кухни. Показывать число сотрудников в свёрнутых станциях')),
    p(text('📋 To Do · 2', { bold: true })),
    li({ text: 'Старое имя по ссылке', link: url(61002) }),
    li({ text: 'АГ кухни. Показывать число сотрудников в свёрнутых станциях', link: url(61001) }),
  ];
  const cards = [
    card(61001, 'АГ кухни. Показывать число сотрудников в свёрнутых станциях', 'todo', { old: ['Недельный график кухни. Показывать число сотрудников в свёрнутых станциях'] }),
    card(61002, 'Новое имя по ссылке', 'todo'),
  ];
  const { items: out, stats } = H.planSticker({ items, cards, lastRun, cardUrl: url });
  assert.deepEqual(lineTexts(out), [
    'Как поймём, что задача выполнена:',
    '📋 To Do · 2',
    'Новое имя по ссылке',
    'АГ кухни. Показывать число сотрудников в свёрнутых станциях',
  ]);
  assert.equal(stats.renamed, 2);
  assert.equal(stats.cards, 2);
});

test('Старые названия берутся из истории Kaiten без повторов и без текущего', () => {
  const activity = [
    { changed_field: 'size_text', old_size_text: '1 SP' },
    { changed_field: 'title', old_title: 'Второе имя', title: 'Текущее' },
    { changed_field: 'title', old_title: 'Первое имя', title: 'Второе имя' },
    { changed_field: 'title', old_title: 'Текущее', title: 'Первое имя' },
    { changed_field: 'title', old_title: 'второе  имя', title: 'Текущее' },
  ];
  assert.deepEqual(H.holstOldTitles(activity, 'Текущее'), ['Второе имя', 'Первое имя']);
  assert.deepEqual(H.holstOldTitles(undefined, 'Текущее'), []);
  const now = new Date(2026, 8, 30, 15, 0).getTime();
  const cards = [{ id: 7, title: 'Текущее', state: 2, column_id: 20, column: { title: 'Doing' } }, { id: 8, title: 'Без истории', state: 2, column_id: 20, column: { title: 'Doing' } }];
  const items = H.holstCards({ cards, renames: { 7: activity }, now, config: SPRINT_CAPACITY });
  assert.deepEqual(items[0].old, ['Второе имя', 'Первое имя']);
  assert.equal('old' in items[1], false);
});

test('Строка «Обновлено» не копится и не считается изменением списка', () => {
  const lastRun = Date.parse('2026-09-30T06:00:00Z');
  const cards = [card(71001, 'Карта', 'todo')];
  const first = H.planSticker({ items: [], cards, lastRun, cardUrl: url }).items;
  const written = [...first, H.updatedLine(new Date(2026, 8, 30, 12, 5).getTime())];
  assert.equal(lineTexts(written).at(-1), 'Обновлено 30.09 12:05');
  const again = H.planSticker({ items: written, cards, lastRun, cardUrl: url });
  assert.deepEqual(lineTexts(again.items), ['📋 To Do · 1', 'Карта']);
  assert.equal(again.stats.manual, 0);
  assert.equal(H.stickerSignature(again.items), H.stickerSignature(written));
  const split = [{ type: 'ol-list-item', runs: [{ text: 'Кар', marks: {} }, { text: 'та', marks: { bold: false } }] }];
  assert.equal(H.stickerSignature(split), H.stickerSignature([{ type: 'ol-list-item', runs: [{ text: 'Карта' }] }]));
  assert.notEqual(H.stickerSignature(written), H.stickerSignature([...first.slice(0, 1)]));
});

test('Процент по положению бомбы — обратный к расстановке', () => {
  const labels = { top: -917, height: 2044, lines: 25 };
  for (const percent of [100, 75, 50, 33, 10]) {
    const top = H.bombTop({ percent, labels, axisY: 976, size: 169 });
    assert.ok(Math.abs(H.bombPercent({ top, labels, axisY: 976, size: 169 }) - percent) <= 2, `${percent}`);
  }
  assert.equal(H.bombPercent({ top: 976, labels, axisY: 976, size: 169 }), 0);
});

test('Выходные и подпись у бомбы', () => {
  assert.equal(H.isWeekend(new Date(2026, 9, 3, 12)), true);
  assert.equal(H.isWeekend(new Date(2026, 9, 4, 12)), true);
  assert.equal(H.isWeekend(new Date(2026, 9, 5, 12)), false);
  assert.deepEqual(lineTexts(H.bombLabelItems({ previous: 1, percent: 3, now: new Date(2026, 8, 30, 14, 5).getTime() })), ['1% → 3% (+2)', '30.09 14:05']);
  assert.deepEqual(lineTexts(H.bombLabelItems({ previous: 48, percent: 3, now: new Date(2026, 8, 30, 14, 5).getTime() })), ['48% → 3% (-45)', '30.09 14:05']);
  assert.deepEqual(lineTexts(H.bombLabelItems({ previous: 3, percent: 3, now: new Date(2026, 8, 30, 14, 5).getTime() })), ['3% → 3% (0)', '30.09 14:05']);
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

test('Данные из адреса годятся только сегодня и не дольше часа', () => {
  const now = new Date(2026, 8, 30, 15, 0).getTime();
  assert.equal(H.holstPayloadStale({ generatedAt: now - 5 * 60 * 1000 }, now), null);
  assert.equal(H.holstPayloadStale({ generatedAt: now - 61 * 60 * 1000 }, now), 'данным больше часа');
  assert.equal(H.holstPayloadStale({ generatedAt: new Date(2026, 8, 29, 23, 50).getTime() }, new Date(2026, 8, 30, 0, 10).getTime()), 'данные не сегодняшние');
  assert.equal(H.holstPayloadStale({}, now), 'в данных нет времени');
});

test('бомб на графике — по одной на каждый рабочий день спринта, кроме первого', () => {
  assert.equal(H.sprintBombCount('2026-09-27T21:00:00.000Z', '2026-10-11T20:59:59.999Z'), 9);
  assert.equal(H.sprintBombCount('2026-09-27T21:00:00.000Z', '2026-10-04T20:59:59.999Z'), 4);
  assert.equal(H.sprintBombCount('2026-09-27T21:00:00.000Z', undefined), null);
  const start = '2026-09-27T21:00:00.000Z';
  assert.equal(H.workingDayIndex(start, new Date(2026, 8, 28, 12).getTime()), 0);
  assert.equal(H.workingDayIndex(start, new Date(2026, 8, 30, 12).getTime()), 2);
  assert.equal(H.workingDayIndex(start, new Date(2026, 9, 5, 12).getTime()), 5);
  assert.equal(H.workingDayIndex(start, new Date(2026, 9, 9, 12).getTime()), 9);
});

test('бомба, подвинутая руками, важнее записи скрипта', () => {
  assert.equal(H.bombStoredTrusted({ percent: 30 }, 1000, 1000), true);
  assert.equal(H.bombStoredTrusted({ percent: 30 }, 1002, 1000), true);
  assert.equal(H.bombStoredTrusted({ percent: 30 }, 900, 1000), false);
  assert.equal(H.bombStoredTrusted({}, 1000, 1000), false);
  assert.equal(H.bombStoredTrusted(null, 1000, 1000), false);
  assert.equal(H.sameDay(new Date(2026, 8, 30, 0, 5).getTime(), new Date(2026, 8, 30, 23, 55).getTime()), true);
  assert.equal(H.sameDay(new Date(2026, 8, 29, 23, 55).getTime(), new Date(2026, 8, 30, 0, 5).getTime()), false);
});

test('Payload для Holst: процент — прогресс по стадиям и SP, Done — число карт, незнакомые колонки передаются', () => {
  // Arrange
  const cards = [
    { id: 1, title: 'Первая', state: 2, column: { title: 'Review' }, size: 4, properties: {} },
    { id: 2, title: 'Вторая', state: 3, column: { title: 'Done' }, size: 1, properties: {} },
    { id: 3, title: 'Третья', state: 1, column: { title: 'Blocked' }, size: 1, properties: {} },
  ];
  const report = buildReport({ cards, settings: defaultSettings() });

  // Act
  const payload = H.holstPayload({ cards, report, sprintStart: '2026-09-27T21:00:00.000Z', sprintFinish: '2026-10-11T20:59:59.999Z', now: Date.parse('2026-09-30T10:00:00Z'), config: SPRINT_CAPACITY, holst: { board: 'b', group: 'g', sticker: 's' }, kaiten: 'https://dodopizza.kaiten.ru', title: 'Staff Core' });

  // Assert
  assert.deepEqual([payload.percent, payload.done, payload.of, payload.unknown], [60, 1, 3, ['Blocked']]);
});

test('Незнакомые колонки: называются с числом карт, пусто — без текста', () => {
  // Act
  const one = H.unknownColumnsText(['Blocked', 'Blocked']);
  const many = H.unknownColumnsText(['Blocked', '', 'Blocked']);

  // Assert
  assert.equal(one, 'не знаю колонку «Blocked» (карт: 2) — считаю как To Do, 0%');
  assert.equal(many, 'не знаю колонки «Blocked» (карт: 2), «?» (карт: 1) — считаю как To Do, 0%');
  assert.equal(H.unknownColumnsText([]), null);
  assert.equal(H.unknownColumnsText(undefined), null);
});

test('Баг в розовом списке — с жучком в начале строки, повторный прогон его не удваивает', () => {
  // Arrange
  const lastRun = Date.parse('2026-09-30T06:00:00Z');
  const cards = [
    card(52001, 'Баг в работе', 'doing', { bug: true }),
    card(52002, 'Баг в To Do', 'todo', { bug: true }),
    card(52003, 'Бывший баг', 'doing'),
    card(52004, 'Баг с ручным жуком', 'done', { bug: true }),
  ];
  const items = [
    p(text('📋 To Do · 1', { bold: true })),
    li({ text: 'Баг в To Do', link: url(52002) }),
    p(text('🔨 Doing · 2', { bold: true })),
    li(text('+/- '), { text: 'Баг в работе', link: url(52001) }),
    li(text('🐞 +/- 🟡 '), { text: 'Бывший баг', link: url(52003) }),
    p(text('✅ Done · 1', { bold: true })),
    li(text('🐛 '), { text: 'Баг с ручным жуком', link: url(52004) }),
  ];

  // Act
  const first = H.planSticker({ items, cards, lastRun, cardUrl: url });
  const second = H.planSticker({ items: first.items, cards, lastRun, cardUrl: url });

  // Assert
  const expected = ['📋 To Do · 1', '🐞 Баг в To Do', '🔨 Doing · 2', '🐞 Баг в работе', '🟡 Бывший баг', '✅ Done · 1', '🐞 Баг с ручным жуком'];
  assert.deepEqual(lineTexts(first.items), expected);
  assert.deepEqual(lineTexts(second.items), expected);
  assert.equal(H.stickerSignature(second.items), H.stickerSignature(first.items));
});

test('Payload для Holst: баг помечен, остальные карты — нет, бывший в Done на начало — не передаётся', () => {
  // Arrange
  const cards = [
    { id: 1, title: 'Баг', state: 2, column: { title: 'Test' }, type_id: 446247, properties: {} },
    { id: 2, title: 'Задача', state: 2, column: { title: 'Doing' }, size: 3, properties: {} },
    { id: 3, title: 'Старый баг', state: 3, column: { title: 'Done' }, type_id: 446247, properties: {} },
  ];
  const snapshot = takeSnapshot({ cards, settings: defaultSettings(), now: 0, boardId: 68084 });
  const report = buildReport({ cards, settings: defaultSettings(), snapshot });

  // Act
  const payload = H.holstPayload({ cards, report, doneAtStart: snapshot.doneIds, sprintStart: '2026-09-27T21:00:00.000Z', sprintFinish: '2026-10-11T20:59:59.999Z', now: Date.parse('2026-09-30T10:00:00Z'), config: SPRINT_CAPACITY, holst: { board: 'b', group: 'g', sticker: 's' }, kaiten: 'https://dodopizza.kaiten.ru', title: 'Staff Core' });

  // Assert
  assert.deepEqual(payload.cards.map((item) => [item.id, item.bug === true]), [[1, true], [2, false]]);
  assert.equal('bug' in payload.cards[1], false);
});
