const REPORT_CONFIG = {
  team: 'P2P',
  boards: { 68084: 'Development', 1524136: 'Expedite' },
  development: 68084,
  expedite: 1524136,
  backlog: 1108490,
  space: 19143,
  bugType: 446247,
  fields: { source: 'id_425359', priority: 'id_205', testType: 'id_505017' },
  testType: { 16238652: 'needQa', 16238651: 'selfTest' },
  escapeSources: [217075, 16194797, 217080],
  featureSource: 217076,
  notEscape: [69403781, 69525693],
  forward: ['Waiting for release', 'Done'],
  back: ['Doing', 'Review', 'To Do'],
  test: 'Test',
  done: 'Done',
  doing: 'Doing',
  longDays: 7,
  offsetHours: 5,
  sprintAnchor: '2026-09-14',
  sprintDays: 14,
};

const REPORT_DAY_MS = 86400000;

function reportTime(value) {
  return Date.parse(`${String(value).slice(0, 19)}Z`);
}

function reportEventTime(event) {
  return reportTime(event.changed || event.created);
}

function reportSorted(events) {
  return (events || []).slice().sort((a, b) => {
    const left = a.changed || a.created || '';
    const right = b.changed || b.created || '';
    return left < right ? -1 : left > right ? 1 : 0;
  });
}

function reportWorkdays(from, to, cfg = REPORT_CONFIG) {
  const shift = cfg.offsetHours * 3600000;
  let day = from + shift;
  const last = to + shift;
  let total = 0;
  while (day < last) {
    const next = Math.min(last, (Math.floor(day / REPORT_DAY_MS) + 1) * REPORT_DAY_MS);
    const weekday = new Date(day).getUTCDay();
    if (weekday >= 1 && weekday <= 5) total += next - day;
    day = next;
  }
  return total / REPORT_DAY_MS;
}

function reportProp(card, key) {
  const value = (card.properties || {})[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first === undefined || first === null ? null : Number(first);
}

function reportOnFlow(boardId, cfg) {
  return Object.prototype.hasOwnProperty.call(cfg.boards, boardId);
}

function reportFlow({ cards, histories, columns, start, end, cfg = REPORT_CONFIG }) {
  const passes = [];
  const done = new Set();
  for (const card of Object.values(cards)) {
    const bug = card.type_id === cfg.bugType;
    let current = null;
    let previous = null;
    for (const event of reportSorted(histories[card.id])) {
      const when = reportEventTime(event);
      const title = columns[event.column_id] || '?';
      const onFlow = reportOnFlow(event.board_id, cfg);
      if (current && event.column_id !== current.column) {
        if (start <= when && when < end && !current.placed) {
          const exit = cfg.forward.includes(title) ? 'forward' : cfg.back.includes(title) ? 'back' : 'other';
          passes.push({ card: card.id, bug, board: current.board, days: reportWorkdays(current.in, when, cfg), exit });
        }
        current = null;
      }
      if (onFlow && title === cfg.test && !current) {
        current = { column: event.column_id, in: when, board: event.board_id, placed: !previous || previous.board_id !== event.board_id };
      }
      const moved = !previous || previous.board_id !== event.board_id || previous.column_id !== event.column_id;
      if (onFlow && title === cfg.done && moved && start <= when && when < end) done.add(card.id);
      previous = event;
    }
  }
  return { passes, done: [...done].sort((a, b) => a - b) };
}

function reportDevelopment({ cards, histories, columns, start, end, cfg = REPORT_CONFIG }) {
  const finished = [];
  for (const card of Object.values(cards)) {
    if (card.type_id === cfg.bugType) continue;
    const events = reportSorted(histories[card.id]);
    for (const board of Object.keys(cfg.boards).map(Number)) {
      let began = null;
      for (const event of events) {
        if (event.board_id !== board) continue;
        const title = columns[event.column_id] || '?';
        const when = reportEventTime(event);
        if (title === cfg.doing && began === null) began = when;
        if (began !== null && cfg.forward.includes(title)) {
          if (start <= when && when < end) finished.push({ card: card.id, board, days: reportWorkdays(began, when, cfg) });
          break;
        }
      }
    }
  }
  return finished;
}

function reportBugs({ bugCards, histories, columns, start, end, cfg = REPORT_CONFIG }) {
  const bugs = [];
  for (const card of Object.values(bugCards)) {
    const events = reportSorted(histories[card.id]);
    const first = events.find((event) => reportOnFlow(event.board_id, cfg));
    const created = reportTime(card.created);
    if (!first || created < start || created >= end) continue;
    const reached = events.some((event) => columns[event.column_id] === cfg.done) || events.some((event) => event.board_id === cfg.backlog);
    if (!reached) continue;
    const source = reportProp(card, cfg.fields.source);
    const childOfBug = (card.parents || []).some((parent) => parent.type_id === cfg.bugType);
    bugs.push({
      id: card.id,
      board: first.board_id,
      feature: source === cfg.featureSource,
      escape: cfg.escapeSources.includes(source) && !cfg.notEscape.includes(card.id) && !childOfBug,
    });
  }
  return bugs;
}

function reportMean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function reportSummarize({ cards, bugCards, histories, columns, start, end, cfg = REPORT_CONFIG }) {
  const input = { cards, bugCards, histories, columns, start, end, cfg };
  const { passes, done } = reportFlow(input);
  const finished = reportDevelopment(input);
  const bugs = reportBugs(input);
  const kind = (id) => cfg.testType[reportProp(cards[id], cfg.fields.testType)] || 'none';
  const kinds = { needQa: 0, selfTest: 0, none: 0 };
  for (const item of finished) kinds[kind(item.card)] += 1;
  const perCard = new Map();
  for (const pass of passes) {
    if (pass.board !== cfg.development) continue;
    perCard.set(pass.card, (perCard.get(pass.card) || 0) + pass.days);
  }
  const inTest = [...perCard.values()].filter((days) => days <= cfg.longDays);
  const long = [...perCard.entries()].filter(([, days]) => days > cfg.longDays).map(([card, days]) => ({ card, days })).sort((a, b) => a.card - b.card);
  const dev = finished.filter((item) => item.board === cfg.development).map((item) => item.days);
  const boardBugs = (board) => {
    const mine = bugs.filter((bug) => bug.board === board);
    return { count: mine.length, feature: mine.filter((bug) => bug.feature).length, escape: mine.filter((bug) => bug.escape).length };
  };
  const doneBugs = done.filter((id) => cards[id].type_id === cfg.bugType).length;
  return {
    finished: { count: finished.length, ...kinds },
    development: { mean: reportMean(dev), count: dev.length },
    test: { mean: reportMean(inTest), count: inTest.length, long },
    tested: {
      tasks: new Set(passes.filter((pass) => !pass.bug).map((pass) => pass.card)).size,
      bugs: new Set(passes.filter((pass) => pass.bug).map((pass) => pass.card)).size,
    },
    returned: [...new Set(passes.filter((pass) => !pass.bug && pass.exit === 'back').map((pass) => pass.card))].sort((a, b) => a - b),
    bugs: { development: boardBugs(cfg.development), expedite: boardBugs(cfg.expedite) },
    escapeIds: bugs.filter((bug) => bug.escape).map((bug) => bug.id).sort((a, b) => a - b),
    done: { count: done.length, tasks: done.length - doneBugs, bugs: doneBugs },
  };
}

function reportDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function reportSprints(now, count = 6, cfg = REPORT_CONFIG) {
  const anchor = Date.parse(`${cfg.sprintAnchor}T00:00:00Z`);
  const length = cfg.sprintDays * REPORT_DAY_MS;
  const today = Math.floor((now + cfg.offsetHours * 3600000) / REPORT_DAY_MS) * REPORT_DAY_MS;
  const index = Math.floor((today - anchor) / length);
  const sprints = [];
  for (let step = 0; step < count; step += 1) {
    const start = anchor + (index - step) * length;
    sprints.push({ from: reportDate(start), to: reportDate(start + length - REPORT_DAY_MS), current: step === 0 });
  }
  return sprints;
}

function reportPeriod(sprint) {
  const start = Date.parse(`${sprint.from}T00:00:00Z`);
  const end = Date.parse(`${sprint.to}T00:00:00Z`) + REPORT_DAY_MS;
  return { start, end, previousStart: start - (end - start) };
}

function reportShortDate(iso) {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

function reportForm(count, forms) {
  const tens = Math.abs(count) % 100;
  const last = tens % 10;
  if (tens > 10 && tens < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

function reportCount(count, forms) {
  return `${count} ${reportForm(count, forms)}`;
}

function reportDays(value, working) {
  if (value === null) return 'нет данных';
  const rounded = Math.round(value * 10) / 10;
  const text = String(rounded).replace('.', ',');
  if (!Number.isInteger(rounded)) return `${text} ${working ? 'рабочего дня' : 'дня'}`;
  return `${text} ${reportForm(rounded, working ? ['рабочий день', 'рабочих дня', 'рабочих дней'] : ['день', 'дня', 'дней'])}`;
}

function reportText({ sprint, current, previous, cfg = REPORT_CONFIG }) {
  const task = ['задачи', 'задач', 'задач'];
  const taskCount = ['задача', 'задачи', 'задач'];
  const taskDone = ['задачу', 'задачи', 'задач'];
  const kinds = (item) => `${item.needQa} с Need QA, ${item.selfTest} с Self-test, ${item.none} без пометки`;
  const returned = (count) => (reportForm(count, ['вернулся', 'вернулись', 'вернулось']));
  const lines = [
    `Разработка ${cfg.team} за спринт ${reportShortDate(sprint.from)}–${reportShortDate(sprint.to)}`,
    `Завершена разработка ${reportCount(current.finished.count, task)}: ${current.finished.needQa} с пометкой Need QA, ${current.finished.selfTest} с Self-test, ${current.finished.none} без пометки. В прошлом спринте — ${reportCount(previous.finished.count, taskCount)}: ${kinds(previous.finished)}.`,
    `Средняя скорость разработки задачи — ${reportDays(current.development.mean, true)} (от колонки Doing до Waiting for release), в прошлом спринте — ${reportDays(previous.development.mean, false)}.\nСредняя скорость тестирования задачи — ${reportDays(current.test.mean, true)}, в прошлом спринте — ${reportDays(previous.test.mean, false)}.`,
    `Протестировали ${reportCount(current.tested.tasks, taskDone)} и перепроверили ${reportCount(current.tested.bugs, ['исправленный баг', 'исправленных бага', 'исправленных багов'])}. В прошлом спринте — ${reportCount(previous.tested.tasks, taskDone)} и ${reportCount(previous.tested.bugs, ['баг', 'бага', 'багов'])}.`,
    `Заведено багов: ${current.bugs.development.count} на основной доске Development и ${current.bugs.expedite.count} на дежурной Expedite. В прошлом спринте — ${previous.bugs.development.count} и ${previous.bugs.expedite.count}.`,
    `Из прода ${returned(current.escapeIds.length)} ${reportCount(current.escapeIds.length, ['баг', 'бага', 'багов'])}, в прошлом спринте — ${previous.escapeIds.length}.`,
  ];
  return [lines[0], ...lines.slice(1).map((line, index) => `${index + 1}. ${line}`)].join('\n');
}

function reportNotes(summary) {
  return [
    { label: 'Вернулись из прода', items: summary.escapeIds.map((id) => ({ id })) },
    { label: 'Дольше недели в Test — не вошли в среднее', items: summary.test.long.map((item) => ({ id: item.card, note: reportDays(item.days, true) })) },
  ].filter((group) => group.items.length);
}

if (typeof module !== 'undefined') module.exports = { REPORT_CONFIG, reportTime, reportWorkdays, reportFlow, reportDevelopment, reportBugs, reportSummarize, reportSprints, reportPeriod, reportShortDate, reportDays, reportText, reportNotes };
