const DAILY = { mskMs: 10800000 };

function dailyToday(now) {
  return new Date(now + DAILY.mskMs).toISOString().slice(0, 10);
}

function dailyPeople(stored, fallback) {
  if (!Array.isArray(stored)) return fallback.slice();
  const people = [];
  for (const item of stored) {
    if (typeof item !== 'string') continue;
    const name = item.replace(/\s+/g, ' ').trim();
    if (name && !people.includes(name)) people.push(name);
  }
  return people.length ? people : fallback.slice();
}

function dailyShort(name) {
  const words = String(name).replace(/\s+/g, ' ').trim().split(' ');
  if (words.length < 2 || !/^\p{L}/u.test(words[1])) return words.join(' ');
  return `${words[0]} ${words[1][0].toUpperCase()}.`;
}

function dailyShortNames(people) {
  const short = people.map(dailyShort);
  return people.map((name, index) => (short.filter((item) => item === short[index]).length > 1 ? name : short[index]));
}

function dailyParsePeople(text) {
  return dailyPeople(dailyShortNames(dailyPeople(String(text || '').split('\n'), [])), []);
}

function dailyHost(host, people) {
  return typeof host === 'string' && people.includes(host) ? host : null;
}

function dailyFresh(stored, today) {
  const seq = stored && Number.isFinite(stored.seq) ? stored.seq : 0;
  const empty = { day: today, current: null, done: [], away: {}, seq };
  if (!stored || stored.day !== today) return empty;
  const away = {};
  if (stored.away && typeof stored.away === 'object' && !Array.isArray(stored.away)) {
    for (const [name, value] of Object.entries(stored.away)) if (value === true) away[name] = true;
  }
  const done = Array.isArray(stored.done) ? stored.done.filter((name) => typeof name === 'string') : [];
  const current = typeof stored.current === 'string' && stored.current ? stored.current : null;
  return { day: today, current, done, away, seq };
}

function dailyOrder(people, host) {
  const start = host ? people.indexOf(host) : -1;
  return start < 0 ? people.slice() : people.slice(start).concat(people.slice(0, start));
}

function dailyQueue({ people, host, state }) {
  const order = dailyOrder(people, host);
  const done = state.done.filter((name) => people.includes(name));
  const away = order.filter((name) => state.away[name] === true);
  const free = (name) => people.includes(name) && !state.done.includes(name) && state.away[name] !== true;
  let current = null;
  if (state.current && free(state.current)) current = state.current;
  else if (!state.current && !state.done.length) current = order.find(free) || null;
  const waiting = order.filter((name) => name !== current && free(name));
  const left = waiting.length + (current ? 1 : 0);
  return { current, done, waiting, away, left, finished: !left && done.length > 0 };
}

function dailyNext(state, change) {
  return { ...state, ...change, seq: state.seq + 1 };
}

function dailyPull(state, { people, host, expect }) {
  const { current, waiting } = dailyQueue({ people, host, state });
  if (expect !== undefined && expect !== current) return null;
  if (!current && !waiting.length) return null;
  return dailyNext(state, { done: current ? state.done.concat(current) : state.done, current: waiting[0] || null });
}

function dailyUndo(state) {
  if (!state.done.length) return null;
  return dailyNext(state, { done: state.done.slice(0, -1), current: state.done[state.done.length - 1] });
}

function dailyToggleAway(state, name) {
  const away = { ...state.away };
  if (away[name]) delete away[name];
  else away[name] = true;
  return dailyNext(state, { away });
}

function dailyReset(state) {
  return dailyNext(state, { done: [], current: null });
}

if (typeof module !== 'undefined') module.exports = { DAILY, dailyToday, dailyPeople, dailyShort, dailyShortNames, dailyParsePeople, dailyHost, dailyFresh, dailyOrder, dailyQueue, dailyPull, dailyUndo, dailyToggleAway, dailyReset };
