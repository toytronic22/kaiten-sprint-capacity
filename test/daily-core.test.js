const test = require('node:test');
const assert = require('node:assert/strict');
const daily = require('../src/daily-core.js');
const { SPRINT_CAPACITY } = require('../src/core.js');

const PEOPLE = ['Михаил Н.', 'Михаил В.', 'Павел Т.', 'Михаил Т.', 'Павел Р.', 'Роман Д.', 'Тимур Л.', 'Денис О.', 'Ксения Ш.', 'Глеб Л.'];
const MOBILE = ['Михаил В.', 'Артём Л.', 'Павел Ч.', 'Павел Ю.', 'Лена Н.', 'Глеб Л.', 'Михаил Н.'];
const TEAM = ['Денис', 'Вика', 'Глеб', 'Женя'];
const HOST = 'Вика';

const state = (extra = {}) => ({ day: '2026-10-16', current: null, done: [], away: {}, seq: 0, ...extra });
const pull = (from, extra = {}) => daily.dailyPull(from, { people: TEAM, host: HOST, ...extra });

test('день считается по Москве', () => {
  // Act
  const after = daily.dailyToday(Date.parse('2026-10-15T21:30:00.000Z'));
  const before = daily.dailyToday(Date.parse('2026-10-15T20:30:00.000Z'));

  // Assert
  assert.equal(after, '2026-10-16');
  assert.equal(before, '2026-10-15');
});

test('до первого рычага говорит ведущий, он тоже в очереди', () => {
  // Act
  const queue = daily.dailyQueue({ people: TEAM, host: HOST, state: state() });

  // Assert
  assert.equal(queue.current, HOST);
  assert.deepEqual(queue.waiting, ['Глеб', 'Женя', 'Денис']);
  assert.equal(queue.left, 4);
  assert.equal(queue.finished, false);
});

test('ведущий не выбран или его нет в списке — первым говорит первый по списку', () => {
  // Act
  const noHost = daily.dailyQueue({ people: TEAM, host: null, state: state() });
  const gone = daily.dailyQueue({ people: TEAM, host: 'Лена', state: state() });
  const next = daily.dailyPull(state(), { people: TEAM, host: 'Лена', expect: 'Денис' });

  // Assert
  assert.equal(noHost.current, 'Денис');
  assert.deepEqual(noHost.waiting, ['Вика', 'Глеб', 'Женя']);
  assert.equal(gone.current, 'Денис');
  assert.deepEqual(next.done, ['Денис']);
  assert.equal(next.current, 'Вика');
});

test('рычаг отмечает говорящего и идёт по кругу: от ведущего вниз по списку, кто выше ведущего — после последнего', () => {
  // Act
  const one = pull(state(), { expect: HOST });
  const two = pull(one, { expect: 'Глеб' });
  const three = pull(two, { expect: 'Женя' });

  // Assert
  assert.deepEqual(one.done, [HOST]);
  assert.equal(one.current, 'Глеб');
  assert.equal(two.current, 'Женя');
  assert.equal(three.current, 'Денис');
  assert.deepEqual(three.done, [HOST, 'Глеб', 'Женя']);
  assert.equal(one.seq, 1);
});

test('за день каждый говорит ровно один раз: ведущий, потом весь круг по порядку', () => {
  // Arrange
  let now = state();
  const spoke = [];

  // Act
  for (let step = 0; step < 12; step += 1) {
    const queue = daily.dailyQueue({ people: PEOPLE, host: 'Михаил Т.', state: now });
    if (!queue.current) break;
    spoke.push(queue.current);
    now = daily.dailyPull(now, { people: PEOPLE, host: 'Михаил Т.', expect: queue.current });
  }

  // Assert
  assert.deepEqual(spoke, ['Михаил Т.', 'Павел Р.', 'Роман Д.', 'Тимур Л.', 'Денис О.', 'Ксения Ш.', 'Глеб Л.', 'Михаил Н.', 'Михаил В.', 'Павел Т.']);
  assert.deepEqual(now.done, spoke);
  assert.equal(daily.dailyQueue({ people: PEOPLE, host: 'Михаил Т.', state: now }).finished, true);
});

test('порядок говорящих — круг по списку: ведущий первым, последним — тот, кто в списке перед ним', () => {
  // Act
  const withHost = daily.dailyOrder(TEAM, 'Глеб');
  const noHost = daily.dailyOrder(TEAM, null);
  const core = daily.dailyOrder(PEOPLE, 'Михаил В.');

  // Assert
  assert.deepEqual(withHost, ['Глеб', 'Женя', 'Денис', 'Вика']);
  assert.deepEqual(noHost, TEAM);
  assert.deepEqual(core, ['Михаил В.', 'Павел Т.', 'Михаил Т.', 'Павел Р.', 'Роман Д.', 'Тимур Л.', 'Денис О.', 'Ксения Ш.', 'Глеб Л.', 'Михаил Н.']);
});

test('отмеченных «нет сегодня» рычаг пропускает и ставит следующего по списку', () => {
  // Arrange
  const start = state({ away: { 'Денис': true, 'Глеб': true } });

  // Act
  const next = pull(start, { expect: HOST });
  const queue = daily.dailyQueue({ people: TEAM, host: HOST, state: next });

  // Assert
  assert.equal(next.current, 'Женя');
  assert.deepEqual(queue.away, ['Глеб', 'Денис']);
  assert.equal(queue.left, 1);
});

test('ведущий отмечен «нет сегодня» — первым говорит следующий за ним по кругу', () => {
  // Act
  const queue = daily.dailyQueue({ people: TEAM, host: HOST, state: state({ away: { [HOST]: true } }) });
  const last = daily.dailyQueue({ people: TEAM, host: 'Женя', state: state({ away: { 'Женя': true } }) });

  // Assert
  assert.equal(queue.current, 'Глеб');
  assert.deepEqual(queue.waiting, ['Женя', 'Денис']);
  assert.equal(last.current, 'Денис');
  assert.deepEqual(last.waiting, ['Вика', 'Глеб']);
});

test('нажатие с устаревшим «сейчас» ничего не меняет — два нажатия сразу не пропускают человека', () => {
  // Arrange
  const first = pull(state(), { expect: HOST });

  // Act
  const second = pull(first, { expect: HOST });

  // Assert
  assert.equal(second, null);
});

test('последний рычаг — все высказались, дальше рычаг ничего не делает', () => {
  // Arrange
  const people = ['Денис', 'Вика'];
  const one = daily.dailyPull(state(), { people, host: 'Денис', expect: 'Денис' });

  // Act
  const two = daily.dailyPull(one, { people, host: 'Денис', expect: 'Вика' });
  const queue = daily.dailyQueue({ people, host: 'Денис', state: two });

  // Assert
  assert.equal(queue.current, null);
  assert.equal(queue.finished, true);
  assert.equal(queue.left, 0);
  assert.deepEqual(two.done, ['Денис', 'Вика']);
  assert.equal(daily.dailyPull(two, { people, host: 'Денис', expect: null }), null);
});

test('вернули человека из «нет сегодня» — он говорит следующим, если его место в круге уже прошли', () => {
  // Arrange
  const start = state({ away: { 'Глеб': true } });
  const talking = pull(start, { expect: HOST });
  const back = daily.dailyToggleAway(talking, 'Глеб');

  // Act
  const next = pull(back, { expect: 'Женя' });

  // Assert
  assert.equal(talking.current, 'Женя');
  assert.equal(next.current, 'Глеб');
});

test('если отсутствуют все — это не «все высказались»', () => {
  // Act
  const queue = daily.dailyQueue({ people: ['Денис', 'Вика'], host: 'Денис', state: state({ away: { 'Денис': true, 'Вика': true } }) });

  // Assert
  assert.equal(queue.current, null);
  assert.equal(queue.finished, false);
});

test('«назад» возвращает слово последнему рассказавшему', () => {
  // Arrange
  const once = pull(state(), { expect: HOST });
  const twice = pull(once, { expect: 'Глеб' });

  // Act
  const back = daily.dailyUndo(twice);

  // Assert
  assert.deepEqual(back.done, [HOST]);
  assert.equal(back.current, 'Глеб');
  assert.equal(back.seq, 3);
  assert.equal(daily.dailyUndo(state()), null);
});

test('клик по имени убирает человека на сегодня, второй клик возвращает', () => {
  // Act
  const off = daily.dailyToggleAway(state(), 'Денис');
  const back = daily.dailyToggleAway(off, 'Денис');

  // Assert
  assert.deepEqual(off.away, { 'Денис': true });
  assert.deepEqual(back.away, {});
  assert.equal(back.seq, 2);
});

test('убрали того, кто говорит, — рычаг ставит следующего по кругу, никого не отмечая', () => {
  // Arrange
  const talking = pull(state(), { expect: HOST });
  const off = daily.dailyToggleAway(talking, 'Глеб');

  // Act
  const queue = daily.dailyQueue({ people: TEAM, host: HOST, state: off });
  const next = pull(off, { expect: null });

  // Assert
  assert.equal(queue.current, null);
  assert.deepEqual(next.done, [HOST]);
  assert.equal(next.current, 'Женя');
});

test('«Начать заново» очищает рассказавших, снова начинает ведущий, отметки «нет сегодня» остаются', () => {
  // Arrange
  const talking = pull(state({ away: { 'Женя': true } }), { expect: HOST });

  // Act
  const reset = daily.dailyReset(talking);

  // Assert
  assert.deepEqual(reset.done, []);
  assert.equal(reset.current, null);
  assert.deepEqual(reset.away, { 'Женя': true });
  assert.equal(daily.dailyQueue({ people: TEAM, host: HOST, state: reset }).current, HOST);
});

test('новый день начинается с чистой очереди, вчерашние отметки не тянутся', () => {
  // Arrange
  const yesterday = state({ day: '2026-10-15', current: 'Глеб', done: ['Денис'], away: { 'Женя': true }, seq: 7 });

  // Act
  const fresh = daily.dailyFresh(yesterday, '2026-10-16');

  // Assert
  assert.deepEqual(fresh, state({ seq: 7 }));
  assert.deepEqual(daily.dailyFresh(null, '2026-10-16'), state());
  assert.deepEqual(daily.dailyFresh({ day: '2026-10-16', current: 5, done: 'мусор', away: [1] }, '2026-10-16'), state());
});

test('список поменяли посреди дня — убранные пропадают из очереди', () => {
  // Arrange
  const talking = pull(state(), { expect: HOST });
  const people = ['Денис', 'Вика', 'Женя'];

  // Act
  const queue = daily.dailyQueue({ people, host: HOST, state: talking });

  // Assert
  assert.equal(queue.current, null);
  assert.deepEqual(queue.done, [HOST]);
  assert.deepEqual(queue.waiting, ['Женя', 'Денис']);
});

test('ведущий годится, только если он есть в списке', () => {
  // Act
  const inList = daily.dailyHost('Женя', TEAM);
  const gone = daily.dailyHost('Лена', TEAM);
  const empty = daily.dailyHost('', TEAM);

  // Assert
  assert.equal(inList, 'Женя');
  assert.equal(gone, null);
  assert.equal(empty, null);
});

test('список людей: по строкам, без пустых и повторов; пустой — берётся список по умолчанию', () => {
  // Act
  const parsed = daily.dailyParsePeople('  Денис\n\nВика \nДенис\n');
  const stored = daily.dailyPeople(['Денис', '', 'Денис', 7, 'Вика'], PEOPLE);

  // Assert
  assert.deepEqual(parsed, ['Денис', 'Вика']);
  assert.deepEqual(stored, ['Денис', 'Вика']);
  assert.deepEqual(daily.dailyPeople([], PEOPLE), PEOPLE);
  assert.deepEqual(daily.dailyPeople('Денис', PEOPLE), PEOPLE);
});

test('у Core и Mobile свои списки, имена с фамилиями — «Имя Ф.»; к доске Holst дейлик не привязан', () => {
  // Arrange
  const core = SPRINT_CAPACITY.boards.find((board) => board.title === 'Core team');
  const mobile = SPRINT_CAPACITY.boards.find((board) => board.title === 'Mobile team');

  // Act
  const coreDaily = SPRINT_CAPACITY.daily[core.id];
  const mobileDaily = SPRINT_CAPACITY.daily[mobile.id];

  // Assert
  assert.deepEqual(coreDaily.people, PEOPLE);
  assert.deepEqual(mobileDaily.people, MOBILE);
  assert.equal(coreDaily.key, 'core');
  assert.equal(mobileDaily.key, 'mobile');
  assert.deepEqual(coreDaily.people.concat(mobileDaily.people).filter((name) => daily.dailyShort(name) !== name), []);
  assert.deepEqual(Object.keys(coreDaily).concat(Object.keys(mobileDaily)).filter((key) => key !== 'key' && key !== 'people'), []);
});

test('имя с фамилией сокращается до «Имя Ф.», одно имя и уже короткое не меняются', () => {
  // Act
  const names = ['Михаил Титов', '  Лена   Нестерова ', 'Тимур Л', 'Михаил Т.', 'Женя', 'Денис (QA)'].map(daily.dailyShort);

  // Assert
  assert.deepEqual(names, ['Михаил Т.', 'Лена Н.', 'Тимур Л.', 'Михаил Т.', 'Женя', 'Денис (QA)']);
});

test('сохранённый список сокращает фамилии; у тёзок с одной буквой фамилии остаются полными', () => {
  // Act
  const parsed = daily.dailyParsePeople('Пётр Иванов\nМихаил Титов\nМихаил Тихонов\nДенис\nПётр Иванов');

  // Assert
  assert.deepEqual(parsed, ['Пётр И.', 'Михаил Титов', 'Михаил Тихонов', 'Денис']);
});
