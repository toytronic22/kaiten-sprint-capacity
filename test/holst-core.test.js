const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../src/holst-core.js');
const { SPRINT_CAPACITY, buildReport, defaultSettings, takeSnapshot } = require('../src/core.js');
const { SPRINT_REPORT } = require('../src/sprint-core.js');

const url = (id) => `https://dodopizza.kaiten.ru/${id}`;
const text = (value, marks) => (marks ? { text: value, marks } : { text: value });
const li = (...runs) => ({ type: 'ol-list-item', runs });
const p = (...runs) => ({ type: 'paragraph', runs });
const lineTexts = (items) => items.map((item) => item.runs.map((run) => run.text).join(''));

const card = (id, title, block, extra = {}) => ({ id, title, block, movedAt: Date.parse('2026-09-29T10:00:00Z'), mark: null, from: null, ...extra });

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

test('Окно подсветки: праздники РФ пропускает, рабочую субботу считает, годы вне календаря — только без выходных', () => {
  const at = (year, month, day, h = 0) => new Date(year, month - 1, day, h).getTime();
  assert.equal(H.holstLookback(at(2026, 11, 5, 10), SPRINT_REPORT), at(2026, 11, 3));
  assert.equal(H.holstLookback(at(2027, 2, 24, 10), SPRINT_REPORT), at(2027, 2, 20));
  assert.equal(H.holstLookback(at(2026, 10, 12, 10), SPRINT_REPORT), at(2026, 10, 9));
  assert.equal(H.holstLookback(at(2028, 1, 4, 10), SPRINT_REPORT), at(2028, 1, 3));
  assert.equal(H.holstLookback(at(2026, 11, 5, 10)), at(2026, 11, 4));
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
    li(text('Недельный отчёт склада. Показывать остаток на свёрнутых полках')),
    p(text('📋 To Do · 2', { bold: true })),
    li({ text: 'Старое имя по ссылке', link: url(61002) }),
    li({ text: 'Склад. Показывать остаток на свёрнутых полках', link: url(61001) }),
  ];
  const cards = [
    card(61001, 'Склад. Показывать остаток на свёрнутых полках', 'todo', { old: ['Недельный отчёт склада. Показывать остаток на свёрнутых полках'] }),
    card(61002, 'Новое имя по ссылке', 'todo'),
  ];
  const { items: out, stats } = H.planSticker({ items, cards, lastRun, cardUrl: url });
  assert.deepEqual(lineTexts(out), [
    'Как поймём, что задача выполнена:',
    '📋 To Do · 2',
    'Новое имя по ссылке',
    'Склад. Показывать остаток на свёрнутых полках',
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

test('Процент над графиком: крупно процент, под ним дата и время', () => {
  // Act
  const items = H.percentLabelItems({ percent: 33, now: new Date(2026, 8, 30, 14, 5).getTime() });

  // Assert
  assert.deepEqual(lineTexts(items), ['33%', 'Обновлено 30.09 14:05']);
  assert.equal(items[0].runs[0].marks.bold, true);
  assert.ok(items[0].runs[0].marks.fontSize > items[1].runs[0].marks.fontSize);
  assert.deepEqual(lineTexts(H.percentLabelItems({ percent: 0, now: new Date(2026, 9, 5, 9, 0).getTime() })), ['0%', 'Обновлено 05.10 09:00']);
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

test('Колонки доски вместе с подколонками', () => {
  const board = { columns: [{ id: 1, title: 'To Do' }, { id: 2, title: 'Doing', subcolumns: [{ id: 21, title: 'Review' }] }] };
  assert.deepEqual(H.holstColumns(board), { 1: 'To Do', 2: 'Doing', 21: 'Review' });
  assert.deepEqual(H.holstColumns(null), {});
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
  const payload = H.holstPayload({ cards, report, now: Date.parse('2026-09-30T10:00:00Z'), config: SPRINT_CAPACITY, holst: { board: 'b', group: 'g', sticker: 's' }, kaiten: 'https://dodopizza.kaiten.ru', title: 'Staff Core' });

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
  const payload = H.holstPayload({ cards, report, doneAtStart: snapshot.doneIds, now: Date.parse('2026-09-30T10:00:00Z'), config: SPRINT_CAPACITY, holst: { board: 'b', group: 'g', sticker: 's' }, kaiten: 'https://dodopizza.kaiten.ru', title: 'Staff Core' });

  // Assert
  assert.deepEqual(payload.cards.map((item) => [item.id, item.bug === true]), [[1, true], [2, false]]);
  assert.equal('bug' in payload.cards[1], false);
});

test('После праздника подсвечены карты, сдвинутые в последний рабочий день перед ним', () => {
  // Arrange
  const iso = (day, h) => new Date(2026, 10, day, h).toISOString();
  const moved = (id, day) => ({ id, title: `Карта ${id}`, state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: iso(day, 15) });
  const cards = [moved(1, 3), moved(2, 2)];
  const histories = Object.fromEntries(cards.map((card) => [card.id, [{ changed: iso(1, 10), column_id: 10 }, { changed: card.column_changed_at, column_id: 20 }]]));
  const report = buildReport({ cards, settings: defaultSettings() });

  // Act
  const payload = H.holstPayload({ cards, report, histories, columns: { 10: 'To Do', 20: 'Doing' }, now: new Date(2026, 10, 5, 11).getTime(), config: SPRINT_CAPACITY, holst: { board: 'b', group: 'g', sticker: 's' }, kaiten: 'https://dodopizza.kaiten.ru', title: 'Staff Core', calendar: SPRINT_REPORT });

  // Assert
  assert.equal(payload.since, new Date(2026, 10, 3).getTime());
  assert.deepEqual(Object.fromEntries(payload.cards.map((item) => [item.id, item.mark])), { 1: 'work', 2: null });
});

test('Первый понедельник спринта: подсвечены карты, сдвинутые в пятницу прошлого спринта', () => {
  // Arrange
  const iso = (day, h) => new Date(2026, 8, day, h).toISOString();
  const moved = (id, day) => ({ id, title: `Карта ${id}`, state: 2, column_id: 20, column: { title: 'Doing' }, column_changed_at: iso(day, 15) });
  const cards = [moved(1, 25), moved(2, 24)];
  const histories = Object.fromEntries(cards.map((card) => [card.id, [{ changed: iso(20, 10), column_id: 10 }, { changed: card.column_changed_at, column_id: 20 }]]));
  const report = buildReport({ cards, settings: defaultSettings() });

  // Act
  const payload = H.holstPayload({ cards, report, histories, columns: { 10: 'To Do', 20: 'Doing' }, now: new Date(2026, 8, 28, 11).getTime(), config: SPRINT_CAPACITY, holst: { board: 'b', group: 'g', sticker: 's' }, kaiten: 'https://dodopizza.kaiten.ru', title: 'Staff Core' });

  // Assert
  assert.equal(payload.since, new Date(2026, 8, 25).getTime());
  assert.deepEqual(Object.fromEntries(payload.cards.map((item) => [item.id, item.mark])), { 1: 'work', 2: null });
});

const tokens = {
  createDecoder: (items) => ({ items, index: 0 }),
  hasContent: (decoder) => decoder.index < decoder.items.length,
  readVarString: (decoder) => decoder.items[decoder.index++],
  readVarUint: (decoder) => decoder.items[decoder.index++],
  readVarInt: (decoder) => decoder.items[decoder.index++],
  readVarUint8Array: (decoder) => decoder.items[decoder.index++],
};

test('Сообщения Holst: ответ, подтверждение, обновление байтами и ссылкой, V2 и пустое имя доски', () => {
  // Arrange
  const bytes = [
    'b', 3, '{"status":"ok","readOnly":false}',
    'b', 2, 7,
    'b', 0, 11, 1, 5, 0, [1, 2],
    'encV2', H.HOLST_NULL_DOC, 0, 11, 0, 5, [9], 1, 'https://cdn/board',
  ];

  // Act
  const messages = H.holstReadMessages(tokens, bytes, 'b');

  // Assert
  assert.deepEqual(messages, [
    { type: 'response', response: { status: 'ok', readOnly: false } },
    { type: 'ack' },
    { type: 'update', left: 1, data: [1, 2] },
    { type: 'update', left: 0, link: 'https://cdn/board' },
  ]);
});

test('Сообщения Holst: чужая доска обрывает разбор, незнакомый тип — ошибка', () => {
  assert.deepEqual(H.holstReadMessages(tokens, ['b', 2, 1, 'other', 2, 1, 'b', 2, 1], 'b'), [{ type: 'ack' }]);
  assert.throws(() => H.holstReadMessages(tokens, ['b', 9], 'b'), /непонятное сообщение \(9\)/);
  assert.throws(() => H.holstReadMessages(tokens, ['b', 0, 1, 0, 1, 4], 'b'), /непонятное обновление доски \(4\)/);
});

test('Очередь Holst: доска по ссылке применяется до «готово», даже если ссылка грузится дольше', async () => {
  // Arrange
  const log = [];
  let release;
  const slow = new Promise((resolve) => { release = resolve; });
  const push = H.holstSyncQueue({
    apply: (bytes) => log.push(`apply ${bytes.join('')}`),
    fetchLink: () => slow,
    onResponse: (response) => log.push(`response ${response.status}`),
    onAck: () => log.push('ack'),
    onSynced: () => log.push('synced'),
    onError: (error) => log.push(`error ${error.message}`),
  });

  // Act
  push([{ type: 'response', response: { status: 'ok' } }, { type: 'update', left: 0, link: 'x' }]);
  const last = push([{ type: 'ack' }]);
  release([4, 2]);
  await last;

  // Assert
  assert.deepEqual(log, ['response ok', 'apply 42', 'synced', 'ack']);
});

test('Очередь Holst: после ошибки дальше ничего не применяется', async () => {
  // Arrange
  const log = [];
  const push = H.holstSyncQueue({
    apply: () => log.push('apply'),
    fetchLink: () => Promise.reject(new Error('нет сети')),
    onResponse: () => log.push('response'),
    onAck: () => log.push('ack'),
    onSynced: () => log.push('synced'),
    onError: (error) => log.push(`error ${error.message}`),
  });

  // Act
  push([{ type: 'update', left: 0, link: 'x' }, { type: 'ack' }]);
  await push([{ type: 'update', left: 0, data: [1] }]);

  // Assert
  assert.deepEqual(log, ['error нет сети']);
});

const chartObjects = () => [
  { id: 'title', type: 'simple-text', parentId: 'g', position: { x: 30, y: -200 }, lines: ['Достижение цели спринта'], textScale: 3, zIndex: 1 },
  { id: 'scale', type: 'simple-text', parentId: 'g', position: { x: 0, y: 100 }, lines: ['100', '75', '50', '25', '0'], textScale: 2, lineHeight: '150%', zIndex: 3 },
  { id: 'days', type: 'simple-text', parentId: 'g', position: { x: 40, y: 400 }, lines: ['ПН            ВТ'], textScale: 2, zIndex: 2 },
  { id: 'far', type: 'simple-text', parentId: 'other', position: { x: 9000, y: 50 }, lines: ['Чужой текст'], textScale: 2, zIndex: 2 },
];

test('График по номеру шкалы из настроек: процент — над шкалой, по левому краю заголовка', () => {
  // Arrange
  const objects = chartObjects();

  // Act
  const chart = H.holstChart({ objects, group: 'g', chart: { labels: 'scale' } });
  const place = H.percentLabelPlace(chart);

  // Assert
  assert.deepEqual(chart, { top: 100, left: 30, textScale: 2, zIndex: 3, problem: null });
  assert.equal(place.x, 30);
  assert.equal(place.y + (22 + 12) * 1.5 * 2 < 100, true);
  assert.equal(place.textScale, 2);
  assert.equal(place.zIndex, 3.5);
});

test('График: номер шкалы из настроек не нашёлся — шкала ищется в группе, заголовок — ближайший текст над ней', () => {
  // Arrange
  const objects = [...chartObjects(), { id: 'note', type: 'simple-text', parentId: 'g', position: { x: 60, y: -900 }, lines: ['Старая заметка'], textScale: 2 }];

  // Act
  const chart = H.holstChart({ objects, group: 'g', chart: { labels: 'gone' } });

  // Assert
  assert.deepEqual([chart.problem, chart.top, chart.left], [null, 100, 30]);
});

test('График: заголовка нет — процент по левому краю шкалы; шкалы нет — процент не пишу', () => {
  const objects = chartObjects().filter((item) => item.id !== 'title');
  assert.equal(H.holstChart({ objects, group: 'g', chart: { labels: 'scale' } }).left, 0);
  assert.match(H.holstChart({ objects, group: 'other', chart: {} }).problem, /шкалу/);
});

test('Блок отчёта: заголовок — мелкой подписью капсом, крупная цифра с пояснением, строки по тону', () => {
  // Arrange
  const block = { key: 'start', title: 'Стартовый план', value: '70%', caption: 'выполнено', lines: [{ text: '64 из 92 SP' }, { text: 'оценка не менялась', tone: 'note' }, { text: 'с блокером: 2 карты', tone: 'warn' }] };
  const { color, size } = H.HOLST_REPORT;

  // Act
  const items = H.holstBlockItems(block);

  // Assert
  assert.deepEqual(items, [
    p(text('СТАРТОВЫЙ ПЛАН', { bold: true, color: color.label, fontSize: size.label })),
    p(text('70%', { bold: true, color: color.value, fontSize: size.value }), text('  выполнено', { color: color.text, fontSize: size.caption })),
    p(text('64 из 92 SP', { color: color.text, fontSize: size.text })),
    p(text('оценка не менялась', { color: color.note, fontSize: size.note })),
    p(text('с блокером: 2 карты', { color: color.warn, fontSize: size.text })),
  ]);
});

test('Блок отчёта: строка со ссылкой — ссылкой на карту и своим цветом, размер — по тону строки', () => {
  // Arrange
  const block = { key: 'carry', title: 'Не дошли до прода', lines: [{ text: 'Фильтр по датам', link: url(102) }, { text: 'в работе 5 рабочих дней', tone: 'note' }] };
  const { color, size } = H.HOLST_REPORT;

  // Act
  const items = H.holstBlockItems(block);

  // Assert
  assert.deepEqual(items.slice(1), [
    p({ text: 'Фильтр по датам', marks: { color: color.link, fontSize: size.text }, link: url(102) }),
    p(text('в работе 5 рабочих дней', { color: color.note, fontSize: size.note })),
  ]);
});

test('Заголовок группы: вопрос, на который отвечает группа, — серым после тире; без вопроса — только название', () => {
  // Arrange
  const { color, size } = H.HOLST_REPORT;

  // Act
  const items = [H.holstGroupItems({ title: 'Результат', note: 'что дошло до прода' }), H.holstGroupItems({ title: 'Качество' })];

  // Assert
  assert.deepEqual(items, [
    [p(text('Результат', { bold: true, color: color.group, fontSize: size.group }), text(' — что дошло до прода', { color: color.note, fontSize: size.groupNote }))],
    [p(text('Качество', { bold: true, color: color.group, fontSize: size.group }))],
  ]);
});

test('Раскладка отчёта: легенда — серым над первой секцией, нет легенды — нет и строки', () => {
  // Arrange
  const sections = [{ key: 'last', title: 'Итоги', groups: [{ key: 'result', title: 'Результат', blocks: [{ key: 'a', title: 'А', value: '1', lines: [] }] }] }];
  const layout = (legend) => H.holstReportLayout({ report: { legend, sections, problem: null }, x: 0, y: 0, textScale: 1, zIndex: 1, now: Date.parse('2026-10-06T10:00:00Z') });

  // Act
  const withLegend = layout('SP — story points, оценка карты.');
  const without = layout(undefined);

  // Assert
  const legend = withLegend.find((part) => part.part === 'legend');
  const head = withLegend.find((part) => part.part === 'head');
  assert.deepEqual(legend.items, [p(text('SP — story points, оценка карты.', { color: H.HOLST_REPORT.color.note, fontSize: H.HOLST_REPORT.size.legend }))]);
  assert.ok(legend.y < head.y);
  assert.equal(without.find((part) => part.part === 'legend'), undefined);
  assert.equal(withLegend.length, without.length + 1);
});

test('Заголовок секции: ссылка на соседнюю панель — строкой под пометкой, цветом ссылки; адреса нет — та же строка без ссылки', () => {
  // Arrange
  const { color, size } = H.HOLST_REPORT;
  const section = (link) => ({ key: 'running', title: 'Идёт спринт 28.09–11.10', note: 'итоги — после воскресенья', link, groups: [] });
  const head = (link) => H.holstReportLayout({ report: { sections: [section(link)], problem: null }, x: 0, y: 0, textScale: 1, zIndex: 1, now: 0 }).find((part) => part.part === 'head').items;

  // Act
  const linked = head({ text: 'Итоги прошлого спринта 14.09–27.09 →', to: 'past', url: 'https://app.holst.so/share/b/b1?objectId=g2' });
  const bare = head({ text: 'Итоги прошлого спринта 14.09–27.09 →', to: 'past', url: null });
  const none = head(undefined);

  // Assert
  assert.deepEqual(linked.slice(2), [p({ text: 'Итоги прошлого спринта 14.09–27.09 →', marks: { color: color.link, fontSize: size.headNote }, link: 'https://app.holst.so/share/b/b1?objectId=g2' })]);
  assert.deepEqual(bare.slice(2), [p(text('Итоги прошлого спринта 14.09–27.09 →', { color: color.link, fontSize: size.headNote }))]);
  assert.equal(none.length, 2);
});

test('Ссылки между панелями: адрес — по цели ссылки, вторая панель из отчёта убрана, цели нет — без адреса, отчёта нет — нет и панели', () => {
  // Arrange
  const pastSection = { key: 'last', title: 'Итоги спринта 14.09–27.09', link: { text: '← Идёт спринт 28.09–11.10', to: 'main' }, groups: [] };
  const report = { legend: 'SP — story points.', sections: [{ key: 'running', title: 'Идёт спринт 28.09–11.10', link: { text: 'Итоги прошлого спринта 14.09–27.09 →', to: 'past' }, groups: [] }], problem: null, past: { legend: null, sections: [pastSection], problem: null } };
  const urls = { main: 'https://app.holst.so/share/b/b1?objectId=g1', past: 'https://app.holst.so/share/b/b1?objectId=g2' };

  // Act
  const main = H.holstReportLinked(report, urls);
  const past = H.holstReportLinked(report.past, urls);
  const lonely = H.holstReportLinked(report, {});

  // Assert
  assert.equal('past' in main, false);
  assert.equal(main.legend, 'SP — story points.');
  assert.equal(main.sections[0].link.url, urls.past);
  assert.equal(past.sections[0].link.url, urls.main);
  assert.equal(lonely.sections[0].link.url, null);
  assert.equal(report.sections[0].link.url, undefined);
  assert.equal(H.holstReportLinked(null, urls), null);
});

test('Вторая панель: справа от первой через зазор, на той же высоте и в том же масштабе; адрес объекта — ссылка share с objectId', () => {
  // Arrange
  const { width, pastGap } = H.HOLST_REPORT;

  // Act
  const place = H.holstPastPlace({ x: 30, y: 400 }, 2, 3.5);
  const link = H.holstObjectUrl('https://app.holst.so', 'b1', 'g2');

  // Assert
  assert.deepEqual(place, { x: 30 + (width + pastGap) * 2, y: 400, textScale: 2, zIndex: 3.5, problem: null });
  assert.equal(link, 'https://app.holst.so/share/b/b1?objectId=g2');
});

test('Ряды блоков: по два, широкий — отдельным рядом, одиночный в конце — на весь ряд', () => {
  // Arrange
  const blocks = [{ key: 'goal', wide: true }, { key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'wide', wide: true }, { key: 'd' }];

  // Act
  const rows = H.holstReportRows(blocks).map((row) => row.map((item) => item.key));

  // Assert
  assert.deepEqual(rows, [['goal'], ['a', 'b'], ['c'], ['wide'], ['d']]);
});

test('Раскладка отчёта: тёмная панель первой и под всем, заголовок группы над её карточками, карточки ряда одной высоты, тексты поверх карточек', () => {
  // Arrange
  const lines = (count) => Array.from({ length: count }, (_, index) => ({ text: `строка ${index + 1}` }));
  const report = {
    sections: [{
      key: 'last',
      title: 'Итоги спринта 14.09–27.09',
      groups: [
        { key: 'result', title: 'Результат', blocks: [{ key: 'goal', title: 'Цель', wide: true, lines: [{ text: 'Цель', tone: 'strong' }] }, { key: 'a', title: 'А', value: '1', lines: lines(1) }, { key: 'b', title: 'Б', value: '2', lines: lines(6) }] },
        { key: 'quality', title: 'Качество', blocks: [{ key: 'c', title: 'В', value: '3', lines: [] }] },
      ],
    }],
    problem: null,
  };

  // Act
  const parts = H.holstReportLayout({ report, x: 1000, y: 2000, textScale: 2, zIndex: 50, now: Date.parse('2026-10-06T10:00:00Z') });

  // Assert
  const [panel, ...rest] = parts;
  const cards = parts.filter((part) => part.part === 'card');
  assert.deepEqual([panel.part, panel.kind, panel.shape, panel.x, panel.y, panel.width, panel.zIndex, panel.color], ['panel', 'shape', 'rectangle', 1000, 2000, H.HOLST_REPORT.width * 2, 50, H.HOLST_REPORT.panel]);
  assert.ok(cards.every((card) => card.shape === 'roundedRectangle'));
  for (const part of rest) {
    assert.ok(part.x >= panel.x && part.y >= panel.y && part.y < panel.y + panel.height, part.part);
    if (part.kind === 'shape') assert.ok(part.x + part.width <= panel.x + panel.width && part.y + part.height <= panel.y + panel.height, part.part);
  }
  assert.deepEqual(cards.map((card) => card.zIndex), [50.01, 50.01, 50.01, 50.01]);
  assert.ok(parts.filter((part) => part.kind === 'text').every((part) => part.zIndex === 50.02 && part.textScale === 2));
  assert.equal(cards[1].y, cards[2].y);
  assert.equal(cards[1].height, cards[2].height);
  assert.ok(cards[1].height > cards[3].height);
  assert.equal(cards[3].width, cards[0].width);
  const blockText = parts.find((part) => part.part === 'block' && part.items[0].runs[0].text === 'Б');
  assert.equal(blockText.width * 2, cards[2].width - 2 * H.HOLST_REPORT.inner * 2);
  assert.match(lineTexts(parts[parts.length - 1].items).pop(), /^Обновлено /);
  const groups = parts.filter((part) => part.part === 'group');
  assert.deepEqual(groups.map((part) => lineTexts(part.items)[0]), ['Результат', 'Качество']);
  assert.ok(groups[0].y < cards[0].y && groups[1].y > cards[2].y + cards[2].height && groups[1].y < cards[3].y);
  assert.equal(groups[0].items[0].runs[0].marks.color, H.HOLST_REPORT.color.group);
});

test('Раскладка отчёта: причина сбоя — в подвале над «Обновлено», жёлтым', () => {
  // Arrange
  const report = { sections: [], problem: 'Прошлые спринты не загрузились: нет сети' };

  // Act
  const footer = H.holstReportLayout({ report, x: 0, y: 0, textScale: 1, zIndex: 1, now: Date.parse('2026-10-06T10:00:00Z') }).find((part) => part.part === 'footer');

  // Assert
  assert.equal(footer.items[0].runs[0].text, 'Прошлые спринты не загрузились: нет сети');
  assert.equal(footer.items[0].runs[0].marks.color, H.HOLST_REPORT.color.warn);
  assert.match(lineTexts(footer.items)[1], /^Обновлено /);
});

test('Подпись отчёта: те же цифры — та же подпись, другая цифра или другая раскладка — другая', () => {
  // Arrange
  const report = (value) => ({ sections: [{ key: 'last', title: 'Итоги', groups: [{ key: 'predictability', title: 'Предсказуемость', blocks: [{ key: 'plan', title: 'План', value, lines: [] }] }] }], problem: null });
  const gap = H.HOLST_REPORT.gap;

  // Act
  const signatures = [H.holstReportSignature(report('8 SP')), H.holstReportSignature(report('8 SP')), H.holstReportSignature(report('9 SP'))];
  H.HOLST_REPORT.gap = gap + 4;
  const moved = H.holstReportSignature(report('8 SP'));
  H.HOLST_REPORT.gap = gap;

  // Assert
  assert.equal(signatures[0], signatures[1]);
  assert.notEqual(signatures[0], signatures[2]);
  assert.notEqual(signatures[0], moved);
  assert.match(signatures[0], /^[0-9a-f]+$/);
});

test('Отчёт на доске устарел: нет группы, другая подпись, нет подвала или частей не столько, сколько в раскладке', () => {
  // Arrange
  const report = { sections: [{ key: 'last', title: 'Итоги', groups: [{ key: 'quality', title: 'Качество', blocks: [{ key: 'escaped', title: 'Баги из прода', value: '0', lines: [] }] }] }], problem: null };
  const sig = H.holstReportSignature(report);
  const parts = H.holstReportParts(report).length;
  const found = { sig, footer: 'f', children: Array.from({ length: parts }, (_, index) => index) };

  // Act
  const stale = [
    H.holstReportStale({ found, sig, parts }),
    H.holstReportStale({ found: null, sig, parts }),
    H.holstReportStale({ found: { ...found, sig: 'old' }, sig, parts }),
    H.holstReportStale({ found: { ...found, footer: null }, sig, parts }),
    H.holstReportStale({ found: { ...found, children: found.children.slice(1) }, sig, parts }),
  ];

  // Assert
  assert.deepEqual(stale, [false, true, true, true, true]);
  assert.equal(parts, 6);
});

test('Отчёт спринта: место — под нижним краем графика, по левому краю заголовка; чужие группы не в счёт', () => {
  // Arrange
  const objects = [...chartObjects(), { id: 'mobile', type: 'simple-text', parentId: 'other', position: { x: 0, y: 5000 }, lines: ['Чужой график'], textScale: 2 }];
  const framed = [...objects, { id: 'frame', type: 'shape', parentId: 'g', position: { x: 0, y: -300 }, width: 2000, height: 900, zIndex: 0 }];

  // Act
  const place = H.holstReportPlace({ objects, group: 'g', chart: { labels: 'scale' } });
  const below = H.holstReportPlace({ objects: framed, group: 'g', chart: { labels: 'scale' } });

  // Assert
  assert.deepEqual(place, { x: 30, y: 400 + 1.5 * 16 * 2 + 24 * 2, textScale: 2, zIndex: 3.5, problem: null });
  assert.equal(below.y, 600 + 24 * 2);
});

test('Отчёт спринта: шкалы графика нет — места нет, объясняю почему', () => {
  const objects = chartObjects().filter((item) => item.id !== 'scale');
  assert.deepEqual(H.holstReportPlace({ objects, group: 'g', chart: {} }), { problem: 'не нашёл на доске шкалу графика «100 … 0»' });
});

test('Стикер: длинный список — шрифт мельче, место на доске то же; короткий — не трогаю', () => {
  // Arrange
  const long = Array.from({ length: 30 }, (_, index) => li(text(`Задача номер ${index} про длинное название карты в спринте`)));
  const short = [p(text('To Do')), li(text('Короткая карта'))];

  // Act
  const fit = H.stickerFit({ items: long, width: 384, height: 192, textScale: 4 });

  // Assert
  assert.ok(fit.width > 384);
  assert.equal(fit.grow, false);
  assert.ok(Math.abs(fit.width * fit.textScale - 384 * 4) < 4);
  assert.ok(Math.abs(fit.height * fit.textScale - 192 * 4) < 4);
  assert.ok(H.stickerFont({ items: long, width: fit.width, height: fit.height }) >= H.HOLST_FIT.fine);
  assert.equal(H.stickerFit({ items: long, width: fit.width, height: fit.height, textScale: fit.textScale, k: fit.k }), null);
  assert.equal(H.stickerFit({ items: short, width: 384, height: 192, textScale: 4 }), null);
});

test('Стикер: список стал короче — шрифт снова крупнее, место на доске то же', () => {
  // Arrange
  const long = Array.from({ length: 40 }, (_, index) => li(text(`Задача номер ${index} про длинное название карты в спринте`)));
  const medium = long.slice(0, 20);
  const short = long.slice(0, 3);
  const small = H.stickerFit({ items: long, width: 384, height: 192, textScale: 4 });

  // Act
  const middle = H.stickerFit({ items: medium, width: small.width, height: small.height, textScale: small.textScale, k: small.k });
  const back = H.stickerFit({ items: short, width: small.width, height: small.height, textScale: small.textScale, k: small.k });

  // Assert
  assert.ok(middle.grow);
  assert.ok(middle.k > 1 && middle.k < small.k);
  assert.ok(Math.abs(middle.width * middle.textScale - 384 * 4) < 4);
  assert.deepEqual(back, { k: 1, grow: true, width: 384, height: 192, textScale: 4 });
});

test('Стикер: во сколько раз уже увеличен — из своей пометки, у старых — по размеру', () => {
  // Arrange
  const stored = { t: 1, k: 2.5 };

  // Act
  const fromStored = H.stickerScale({ width: 1000, height: 480, stored });
  const fromSize = H.stickerScale({ width: 1344, height: 672, stored: { t: 1 } });
  const untouched = H.stickerScale({ width: 384, height: 192, stored: null });
  const dragged = H.stickerScale({ width: 1500, height: 672, stored: {} });
  const broken = H.stickerScale({ width: 384, height: 192, stored: { k: 7 } });

  // Assert
  assert.equal(fromStored, 2.5);
  assert.equal(fromSize, 3.5);
  assert.equal(untouched, 1);
  assert.equal(dragged, 1);
  assert.equal(broken, 1);
});

test('Payload для Holst: номера шкалы и оси берутся из настроек доски', () => {
  const report = buildReport({ cards: [], settings: defaultSettings(), config: SPRINT_CAPACITY });
  const payload = H.holstPayload({ cards: [], report, now: Date.parse('2026-09-30T10:00:00Z'), config: SPRINT_CAPACITY, holst: { board: 'b', group: 'g', sticker: 's', labels: 'l' }, kaiten: 'https://dodopizza.kaiten.ru', title: 'Staff Core' });
  assert.deepEqual(payload.chart, { labels: 'l' });
  assert.deepEqual(H.holstPayload({ cards: [], report, now: Date.parse('2026-09-30T10:00:00Z'), config: SPRINT_CAPACITY, holst: { board: 'b', group: 'g', sticker: 's' }, kaiten: 'https://dodopizza.kaiten.ru', title: 'Staff Core' }).chart, { labels: null });
});
