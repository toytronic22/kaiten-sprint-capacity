const SPRINT_REPORT = {
  dayMs: 86400000,
  mskMs: 10800000,
  planGapMs: 120000,
  closeGapMs: 60000,
  doneState: 3,
  workState: 2,
  bugTypeIds: [446247],
  source: 'id_425359',
  escapeSources: [217075, 16194797, 217080],
  notEscape: [69403781, 69525693],
  history: 3,
  cacheVersion: 2,
  capacityBeforeMs: 259200000,
  capacityAfterMs: 604800000,
  labels: { back: 'Бэк', front: 'Фронт', qa: 'QA' },
  stageOrder: ['to do', 'doing', 'review', 'design review', 'test', 'waiting for release', 'done'],
  stageMin: 0.05,
  stageTop: 4,
  boards: { 68084: 'Development', 1321013: 'Mobile', 1108487: 'Inbox', 1321144: 'Inbox Mobile', 1108490: 'бэклог', 1322638: 'бэклог Mobile', 1524136: 'дежурка', 1524132: 'HR' },
};

const SPRINT_WORDS = {
  card: ['карта', 'карты', 'карт'],
  task: ['задача', 'задачи', 'задач'],
  bug: ['баг', 'бага', 'багов'],
  day: ['рабочий день', 'рабочих дня', 'рабочих дней'],
  previous: { 1: 'прошлого спринта', 2: 'двух прошлых спринтов', 3: 'трёх прошлых спринтов' },
};

function sprintTime(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  return Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text}Z`);
}

function sprintMonday(ms, cfg = SPRINT_REPORT) {
  const local = ms + cfg.mskMs;
  const day = Math.floor(local / cfg.dayMs);
  const week = 7 * cfg.dayMs;
  const before = (day - ((((day + 3) % 7) + 7) % 7)) * cfg.dayMs;
  return (local - before <= before + week - local ? before : before + week) - cfg.mskMs;
}

function sprintPeriod(sprint, cfg = SPRINT_REPORT) {
  return { start: sprintMonday(sprintTime(sprint.start_date), cfg), end: sprintMonday(sprintTime(sprint.finish_date), cfg) - 1 };
}

function sprintFinished(sprint, now, cfg = SPRINT_REPORT) {
  return Boolean(sprint.actual_finish_date) || now > sprintPeriod(sprint, cfg).end;
}

function sprintIsBug(card, cfg = SPRINT_REPORT) {
  return Boolean(card) && cfg.bugTypeIds.includes(card.type_id);
}

function sprintEscaped(card, cfg = SPRINT_REPORT) {
  const value = ((card && card.properties) || {})[cfg.source];
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return !cfg.notEscape.includes(card.id) && values.some((item) => cfg.escapeSources.includes(Number(item)));
}

function sprintTop(counts) {
  let best = null;
  for (const [key, count] of counts) if (best === null || count > counts.get(best) || (count === counts.get(best) && key > best)) best = key;
  return best;
}

function sprintCurrentId(cards) {
  const counts = new Map();
  for (const card of cards || []) if (card && card.sprint_id) counts.set(card.sprint_id, (counts.get(card.sprint_id) || 0) + 1);
  return sprintTop(counts);
}

function sprintVersions(sprint) {
  const byCard = new Map();
  for (const item of sprint.cardUpdates || []) {
    const version = { at: sprintTime(item.updated), sprint: item.sprint_id || null, board: item.board_id, column: item.column_id, state: item.state, size: Number(item.size) || 0, archived: Boolean(item.archived), order: item.version || 0 };
    if (!byCard.has(item.id)) byCard.set(item.id, []);
    byCard.get(item.id).push(version);
  }
  for (const list of byCard.values()) list.sort((a, b) => a.at - b.at || a.order - b.order);
  return byCard;
}

function sprintWorkdays(from, to, cfg = SPRINT_REPORT) {
  let day = from + cfg.mskMs;
  const last = to + cfg.mskMs;
  let total = 0;
  while (day < last) {
    const next = Math.min(last, (Math.floor(day / cfg.dayMs) + 1) * cfg.dayMs);
    const weekday = new Date(day).getUTCDay();
    if (weekday >= 1 && weekday <= 5) total += next - day;
    day = next;
  }
  return total / cfg.dayMs;
}

function sprintDaysLeft(now, end, cfg = SPRINT_REPORT) {
  let count = 0;
  const last = Math.floor((end + cfg.mskMs) / cfg.dayMs);
  for (let day = Math.floor((now + cfg.mskMs) / cfg.dayMs); day <= last; day += 1) {
    const weekday = (day + 4) % 7;
    if (weekday >= 1 && weekday <= 5) count += 1;
  }
  return count;
}

function sprintMedian(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sprintPercentile(values, share) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(share * sorted.length) - 1)];
}

function sprintOrigin({ previous, born, start, sprintId, boardId, cfg }) {
  if (!previous) return born !== null && born >= start ? 'создано в спринте' : 'без истории';
  if (previous.archived) return 'архив';
  if (previous.sprint && previous.sprint !== sprintId) return 'другой спринт';
  if (previous.board !== boardId) return cfg.boards[previous.board] || 'другая доска';
  return born !== null && born >= start ? 'создано в спринте' : 'доска без спринта';
}

function sprintTarget({ next, sprintId, boardId, cfg }) {
  if (!next) return 'снята со спринта';
  if (next.archived) return 'архив';
  if (next.board !== boardId) return cfg.boards[next.board] || 'другая доска';
  if (next.sprint && next.sprint !== sprintId) return 'другой спринт';
  return 'снята со спринта';
}

function sprintSummary({ sprint, now, columns = {}, cfg = SPRINT_REPORT }) {
  const id = sprint.id;
  const boardId = sprint.board_id;
  const { start, end } = sprintPeriod(sprint, cfg);
  const created = sprintTime(sprint.created) === null ? start : sprintTime(sprint.created);
  const closedAt = sprint.actual_finish_date ? sprintTime(sprint.actual_finish_date) : null;
  const close = closedAt === null ? now : closedAt - cfg.closeGapMs;
  const compCut = Math.min(end, close);
  const cards = new Map((sprint.cards || []).map((card) => [card.id, card]));
  const normal = (title) => String(title || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const rank = (title) => (cfg.stageOrder.includes(normal(title)) ? cfg.stageOrder.indexOf(normal(title)) : cfg.stageOrder.length);
  const bump = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);
  const result = {
    id,
    title: String(sprint.title || '').replace(/\s+/g, ' ').trim(),
    goal: String(sprint.goal || '').split('\n').map((line) => line.replace(/^\s*(?:[-–—•*]|\d+[.)])\s+/, '').replace(/\s+/g, ' ').trim()).filter(Boolean).join('; '),
    boardId,
    start,
    end,
    closedAt,
    finished: closedAt !== null || now > end,
    plan: { cards: 0, bugs: 0, sp: 0 },
    added: { tasks: 0, bugs: 0, sp: 0, from: [], related: { tasks: 0, sp: 0 } },
    left: { cards: 0, sp: 0, to: [] },
    reestimate: 0,
    done: { tasks: 0, bugs: 0, sp: 0, planSp: 0, planSp0: 0, addedSp: 0 },
    carry: { cards: 0, bugs: 0, sp: 0, columns: [], blocked: 0 },
    lead: { median: null, p85: null, n: 0 },
    stages: [],
    escaped: { count: 0, done: 0 },
    prevId: null,
  };
  const from = new Map();
  const to = new Map();
  const carryColumns = new Map();
  const planIds = new Set();
  const planParents = new Set();
  const addedTasks = [];
  const planVotes = new Map();
  const allVotes = new Map();
  const leads = [];
  const stageDays = new Map();
  for (const [cardId, list] of sprintVersions(sprint)) {
    const c = list.filter((version) => version.at <= close);
    const a = c.filter((version) => version.at <= compCut);
    const early = a.findIndex((version) => version.sprint === id);
    const fi = early >= 0 ? early : c.findIndex((version) => version.sprint === id);
    if (fi < 0) continue;
    let li = fi;
    for (let index = fi; index < a.length; index += 1) if (a[index].sprint === id) li = index;
    if (li >= a.length - 1) for (let index = li; index < c.length; index += 1) if (c[index].sprint === id) li = index;
    const inSprint = c[li];
    const exit = c[li + 1] || null;
    const stays = exit === null || (exit.archived && inSprint.state === cfg.doneState);
    const done = stays && inSprint.state === cfg.doneState;
    if (early < 0 && !done) continue;
    const card = cards.get(cardId) || { id: cardId };
    const bug = sprintIsBug(card, cfg);
    const first = c[fi];
    const plan = Math.abs(first.at - created) < cfg.planGapMs;
    const sp0 = first.size;
    const sp = inSprint.size;
    const before = c.slice(0, fi).reverse().find((version) => version.sprint && version.sprint !== id);
    if (before && before.sprint < id) {
      if (plan) bump(planVotes, before.sprint);
      bump(allVotes, before.sprint);
    }
    if (plan) {
      result.plan.cards += 1;
      if (bug) result.plan.bugs += 1;
      result.plan.sp += sp0;
      planIds.add(cardId);
      for (const parent of card.parents_ids || []) planParents.add(parent);
    } else {
      if (bug) result.added.bugs += 1;
      else {
        result.added.tasks += 1;
        addedTasks.push({ parents: card.parents_ids || [], sp });
      }
      result.added.sp += sp;
      bump(from, sprintOrigin({ previous: c[fi - 1] || null, born: sprintTime(card.created), start, sprintId: id, boardId, cfg }));
    }
    if (bug && sprintEscaped(card, cfg)) {
      result.escaped.count += 1;
      if (done) result.escaped.done += 1;
    }
    if (!stays) {
      result.left.cards += 1;
      result.left.sp += plan ? sp0 : sp;
      bump(to, sprintTarget({ next: exit, sprintId: id, boardId, cfg }));
      continue;
    }
    if (plan) result.reestimate += sp - sp0;
    if (!done) {
      result.carry.cards += 1;
      if (bug) result.carry.bugs += 1;
      result.carry.sp += sp;
      if (card.blocked) result.carry.blocked += 1;
      const title = columns[inSprint.column] || 'другая колонка';
      const column = carryColumns.get(title) || { title, cards: 0, sp: 0 };
      column.cards += 1;
      column.sp += sp;
      carryColumns.set(title, column);
      continue;
    }
    result.done.sp += sp;
    if (plan) {
      result.done.planSp += sp;
      result.done.planSp0 += sp0;
    } else {
      result.done.addedSp += sp;
    }
    if (bug) {
      result.done.bugs += 1;
      continue;
    }
    result.done.tasks += 1;
    const path = c.slice(0, li + 1);
    let doneIndex = path.length - 1;
    while (doneIndex > 0 && path[doneIndex - 1].state === cfg.doneState) doneIndex -= 1;
    const finishedAt = path[doneIndex].at;
    const startVersion = path.find((version) => version.state === cfg.workState);
    const startedAt = sprintTime(card.first_moved_to_in_progress_at) !== null ? sprintTime(card.first_moved_to_in_progress_at) : startVersion ? startVersion.at : null;
    if (startedAt === null || startedAt > finishedAt) continue;
    leads.push(sprintWorkdays(startedAt, finishedAt, cfg));
    for (let index = 0; index < doneIndex; index += 1) {
      const version = path[index];
      const since = Math.max(version.at, startedAt);
      const until = Math.min(path[index + 1].at, finishedAt);
      if (until <= since || version.board !== boardId || !columns[version.column]) continue;
      bump(stageDays, columns[version.column], sprintWorkdays(since, until, cfg));
    }
  }
  for (const task of addedTasks) {
    if (!task.parents.some((parent) => planIds.has(parent) || planParents.has(parent))) continue;
    result.added.related.tasks += 1;
    result.added.related.sp += task.sp;
  }
  const counted = (map) => [...map].map(([label, count]) => ({ label, count })).sort((x, y) => y.count - x.count);
  result.added.from = counted(from);
  result.left.to = counted(to);
  result.carry.columns = [...carryColumns.values()].sort((x, y) => rank(x.title) - rank(y.title));
  result.lead = { median: sprintMedian(leads), p85: sprintPercentile(leads, 0.85), n: leads.length };
  const stageTotal = [...stageDays.values()].reduce((sum, value) => sum + value, 0);
  result.stages = stageTotal > 0 ? [...stageDays].map(([title, days]) => ({ title, share: days / stageTotal })).filter((stage) => stage.share >= cfg.stageMin).sort((x, y) => y.share - x.share).slice(0, cfg.stageTop) : [];
  result.prevId = sprintTop(planVotes) || sprintTop(allVotes);
  return result;
}

function sprintForm(count, forms) {
  const tens = Math.abs(count) % 100;
  const last = tens % 10;
  if (tens > 10 && tens < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

function sprintNumber(value) {
  const rounded = Math.round(Math.abs(value) * 10) / 10;
  return `${value < 0 && rounded ? '−' : ''}${String(rounded).replace('.', ',')}`;
}

function sprintCount(count, forms) {
  return `${sprintNumber(count)} ${sprintForm(count, forms)}`;
}

function sprintDayWord(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? sprintForm(rounded, SPRINT_WORDS.day) : 'рабочего дня';
}

function sprintDays(value) {
  return `${sprintNumber(value)} ${sprintDayWord(value)}`;
}

function sprintDate(ms, cfg = SPRINT_REPORT) {
  const iso = new Date(ms + cfg.mskMs).toISOString();
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

function sprintCards(tasks, bugs) {
  const parts = [];
  if (tasks) parts.push(sprintCount(tasks, SPRINT_WORDS.task));
  if (bugs) parts.push(sprintCount(bugs, SPRINT_WORDS.bug));
  return parts.join(' и ');
}

function sprintLabels(list) {
  return list.map((item) => `${item.label} ${item.count}`).join(' · ');
}

function sprintPlanBlock(summary, previous) {
  const lines = [];
  if (previous.length) {
    const speeds = previous.map((item) => item.done.sp);
    const mean = speeds.reduce((sum, value) => sum + value, 0) / speeds.length;
    const label = SPRINT_WORDS.previous[previous.length] || `${previous.length} прошлых спринтов`;
    lines.push({ text: `velocity ${label}: ${speeds.map(sprintNumber).join(' · ')} SP` });
    if (speeds.length > 1) lines.push({ text: `в среднем ${sprintNumber(mean)} SP` });
  }
  return { key: 'plan', title: 'План', value: `${sprintNumber(summary.plan.sp)} SP`, caption: sprintCount(summary.plan.cards, SPRINT_WORDS.card), lines };
}

function sprintChangesBlock(summary) {
  const { added, left } = summary;
  const lines = [];
  if (added.tasks || added.bugs) {
    lines.push({ text: `Влетело: ${sprintCards(added.tasks, added.bugs)}, ${sprintNumber(added.sp)} SP` });
    lines.push({ text: `откуда: ${sprintLabels(added.from)}`, tone: 'note' });
    if (added.related.tasks) lines.push({ text: `из них части задач и эпиков плана: ${sprintCount(added.related.tasks, SPRINT_WORDS.task)}, ${sprintNumber(added.related.sp)} SP`, tone: 'note' });
  } else lines.push({ text: 'Влетело: ничего' });
  if (left.cards) {
    lines.push({ text: `Ушло: ${sprintCount(left.cards, SPRINT_WORDS.card)}, ${sprintNumber(left.sp)} SP` });
    lines.push({ text: `куда: ${sprintLabels(left.to)}`, tone: 'note' });
  } else lines.push({ text: 'Ушло: ничего' });
  lines.push({ text: `Переоценка карт плана: ${summary.reestimate > 0 ? '+' : ''}${sprintNumber(summary.reestimate)} SP` });
  return { key: 'changes', title: 'Изменения', value: `+${sprintNumber(added.sp)} / −${sprintNumber(left.sp)} SP`, caption: 'влетело / ушло', lines };
}

function sprintDoneBlock(summary) {
  const done = summary.done;
  const block = { key: 'done', title: 'В проде', value: `${sprintNumber(done.sp)} SP` };
  if (!done.tasks && !done.bugs) return { ...block, caption: 'ничего', lines: [] };
  return { ...block, caption: sprintCards(done.tasks, done.bugs), lines: [{ text: `из плана ${sprintNumber(done.planSp)} SP · из влёта ${sprintNumber(done.addedSp)} SP` }] };
}

function sprintStartBlock(summary) {
  const block = { key: 'start', title: 'Стартовый план' };
  if (!summary.plan.sp) return { ...block, value: '—', lines: [{ text: 'на старте в плане 0 SP', tone: 'note' }] };
  const done = summary.done;
  const growth = done.planSp - done.planSp0;
  const lines = [{ text: `${sprintNumber(done.planSp)} из ${sprintNumber(summary.plan.sp)} SP${growth ? ' по последней оценке' : ''}` }];
  if (growth) lines.push({ text: `оценка карт в проде ${growth > 0 ? 'выросла' : 'снизилась'} на ${sprintNumber(Math.abs(growth))} SP`, tone: 'note' });
  else if (done.planSp) lines.push({ text: 'оценка карт в проде не менялась', tone: 'note' });
  return { ...block, value: `${Math.round((100 * done.planSp) / summary.plan.sp)}%`, caption: 'выполнено', lines };
}

function sprintCarryBlock(summary, key, title, blocked) {
  const carry = summary.carry;
  const lines = carry.columns.map((column) => ({ text: `${column.title} — ${sprintCount(column.cards, SPRINT_WORDS.card)}${column.sp ? `, ${sprintNumber(column.sp)} SP` : ''}` }));
  if (blocked && carry.blocked) lines.push({ text: `с блокером: ${sprintCount(carry.blocked, SPRINT_WORDS.card)}`, tone: 'warn' });
  return { key, title, value: `${sprintNumber(carry.sp)} SP`, caption: sprintCount(carry.cards, SPRINT_WORDS.card), lines };
}

function sprintLeadBlock(summary, previous) {
  const lead = summary.lead;
  const block = { key: 'lead', title: 'Время до прода' };
  const stages = summary.stages.length ? [{ text: `по колонкам: ${summary.stages.map((stage) => `${stage.title} ${Math.round(stage.share * 100)}%`).join(' · ')}`, tone: 'note' }] : [];
  if (!lead.n) return { ...block, value: '—', lines: [{ text: summary.done.tasks ? 'у задач в проде нет даты начала работы' : 'задач в проде нет', tone: 'note' }, ...stages] };
  const series = [...previous.slice(-2), summary].map((item) => (item.lead.n ? sprintNumber(item.lead.median) : '—'));
    const lines = [{ text: `у 85% задач — до ${sprintNumber(lead.p85)}` }, { text: `${sprintCount(lead.n, SPRINT_WORDS.task)}, от Doing до Done`, tone: 'note' }];
  if (series.length > 1) lines.push({ text: `медиана по спринтам: ${series.join(' → ')}` });
  return { ...block, value: sprintNumber(lead.median), caption: `${sprintDayWord(lead.median)}, медиана`, lines: [...lines, ...stages] };
}

function sprintEscapedBlock(summary) {
  const escaped = summary.escaped;
  return { key: 'escaped', title: 'Баги из прода', value: sprintNumber(escaped.count), caption: escaped.count ? `исправлено ${sprintNumber(escaped.done)}` : 'нет', lines: [] };
}

function sprintCapacitySum(days) {
  return Object.values(days).reduce((sum, value) => sum + value, 0);
}

function sprintCapacityParts(days, labels) {
  return Object.keys(labels).filter((key) => days[key] !== undefined).map((key) => `${labels[key]} ${sprintNumber(days[key])}`).join(' · ');
}

function sprintCapacityChange(from, to, labels) {
  return Object.keys(labels)
    .filter((key) => from[key] !== undefined || to[key] !== undefined)
    .map((key) => {
      const before = from[key] || 0;
      const after = to[key] || 0;
      return `${labels[key]} ${sprintNumber(before)}${before === after ? '' : ` → ${sprintNumber(after)}`}`;
    })
    .join(' · ');
}

function sprintCapacityRecord(log, kind, boardId, around, latest, cfg = SPRINT_REPORT) {
  const found = log.filter((item) => item.kind === kind && item.boardId === boardId && item.at >= around - cfg.capacityBeforeMs && item.at < around + cfg.capacityAfterMs).sort((x, y) => x.at - y.at);
  return found.length ? found[latest ? found.length - 1 : 0] : null;
}

function sprintCapacityDoneBlock(summary, log, labels, cfg = SPRINT_REPORT) {
  const block = { key: 'capacity', title: 'Capacity, чел.-дн.' };
  if (!log) return { ...block, value: '—', lines: [{ text: 'записи из служебной карты не загрузились', tone: 'warn' }] };
  const plan = sprintCapacityRecord(log, 'end', summary.boardId, summary.start, true, cfg);
  const fact = sprintCapacityRecord(log, 'start', summary.boardId, summary.end, false, cfg);
  if (!plan && !fact) return { ...block, value: '—', lines: [{ text: 'план и факт не записаны — их пишут кнопки «Закончить планирование» и «Начать планирование»', tone: 'note' }] };
  if (!fact) return { ...block, value: sprintNumber(sprintCapacitySum(plan.days)), caption: 'план', lines: [{ text: sprintCapacityParts(plan.days, labels) }, { text: 'факт не записан — его пишет «Начать планирование» следующего спринта', tone: 'note' }] };
  if (!plan) return { ...block, value: sprintNumber(sprintCapacitySum(fact.days)), caption: 'факт', lines: [{ text: sprintCapacityParts(fact.days, labels) }, { text: 'план не записан — его пишет «Закончить планирование»', tone: 'note' }] };
  return { ...block, value: `${sprintNumber(sprintCapacitySum(plan.days))} → ${sprintNumber(sprintCapacitySum(fact.days))}`, caption: 'план → факт', lines: [{ text: sprintCapacityChange(plan.days, fact.days, labels) }] };
}

function sprintCapacityRunningBlock(summary, capacity, log, labels, cfg = SPRINT_REPORT) {
  const block = { key: 'capacity', title: 'Capacity, чел.-дн.' };
  const plan = log ? sprintCapacityRecord(log, 'end', summary.boardId, summary.start, true, cfg) : null;
  const lost = log ? [] : [{ text: 'план из служебной карты не загрузился', tone: 'warn' }];
  if (!plan && !capacity) return { ...block, value: '—', lines: [{ text: '«Команда и дни» в панели не заполнены', tone: 'note' }, ...lost] };
  if (!plan) return { ...block, value: sprintNumber(sprintCapacitySum(capacity)), caption: 'по «Команде и дням»', lines: [{ text: sprintCapacityParts(capacity, labels) }, ...lost] };
  if (!capacity) return { ...block, value: sprintNumber(sprintCapacitySum(plan.days)), caption: 'план', lines: [{ text: sprintCapacityParts(plan.days, labels) }, { text: 'сейчас «Команда и дни» в панели не заполнены', tone: 'note' }] };
  return { ...block, value: `${sprintNumber(sprintCapacitySum(plan.days))} → ${sprintNumber(sprintCapacitySum(capacity))}`, caption: 'план → сейчас по «Команде и дням»', lines: [{ text: sprintCapacityChange(plan.days, capacity, labels) }] };
}

function sprintNextBlock(capacity, labels) {
  const block = { key: 'next', title: 'Следующий спринт, capacity' };
  if (!capacity) return { ...block, value: '—', lines: [{ text: '«Команда и дни» в панели не заполнены', tone: 'note' }] };
  return { ...block, value: sprintNumber(sprintCapacitySum(capacity)), caption: 'чел.-дн. по «Команде и дням»', lines: [{ text: sprintCapacityParts(capacity, labels) }] };
}

function sprintGoalBlock(summary) {
  const block = { key: 'goal', title: 'Цель', wide: true };
  if (summary.goal) return { ...block, lines: [{ text: summary.goal, tone: 'strong' }] };
  if (summary.title) return { ...block, lines: [{ text: summary.title, tone: 'strong' }, { text: 'в Kaiten цель не заполнена — это название спринта', tone: 'note' }] };
  return { ...block, lines: [{ text: 'в Kaiten не заполнена', tone: 'note' }] };
}

function sprintRange(summary, cfg = SPRINT_REPORT) {
  return `${sprintDate(summary.start, cfg)}–${sprintDate(summary.end, cfg)}`;
}

function sprintReportBlocks({ last = null, running = null, history = [], historyProblem = null, capacity = null, capacityLog = null, labels = null, now, cfg = SPRINT_REPORT }) {
  const names = labels || cfg.labels;
  const older = history.slice().reverse();
  const sections = [];
  if (last) {
    const blocks = [
      sprintGoalBlock(last),
      sprintCapacityDoneBlock(last, capacityLog, names, cfg),
      sprintPlanBlock(last, older),
      sprintChangesBlock(last),
      sprintDoneBlock(last),
      sprintStartBlock(last),
      sprintCarryBlock(last, 'carry', 'Перенос', false),
      sprintLeadBlock(last, older),
      sprintEscapedBlock(last),
    ];
    if (!running) blocks.push(sprintNextBlock(capacity, names));
    sections.push({ key: 'last', title: `Итоги спринта ${sprintRange(last, cfg)}`, ...(last.closedAt === null ? { note: 'предварительные: в Kaiten ещё не завершён', tone: 'warn' } : {}), blocks });
  }
  if (running) {
    sections.push({
      key: 'running',
      title: `Идёт спринт ${sprintRange(running, cfg)}`,
      note: `осталось ${sprintCount(sprintDaysLeft(now, running.end, cfg), SPRINT_WORDS.day)} с сегодняшним`,
      tone: 'warn',
      blocks: [
        sprintGoalBlock(running),
        sprintCapacityRunningBlock(running, capacity, capacityLog, names, cfg),
        sprintPlanBlock(running, last ? [...older.slice(-2), last] : []),
        sprintChangesBlock(running),
        sprintDoneBlock(running),
        sprintCarryBlock(running, 'open', 'Не в проде', true),
        sprintEscapedBlock(running),
      ],
    });
  }
  return { sections, problem: historyProblem ? `Прошлые спринты не загрузились: ${historyProblem}` : null };
}

async function sprintReportLoad({ cards, boardId, now, columns, load, store, cfg = SPRINT_REPORT }) {
  const key = `sprint.${boardId}`;
  const currentId = sprintCurrentId(cards) || store.read(key);
  if (!currentId) throw new Error('у карт доски нет спринта — новый спринт в Kaiten ещё не начат');
  store.write(key, currentId);
  const summaryOf = async (id) => {
    const cached = store.read(`sprintSummary.${id}`);
    if (cached && cached.v === cfg.cacheVersion && cached.summary) return cached.summary;
    const raw = await load(id);
    const summary = sprintSummary({ sprint: (raw && raw.data) || raw, now, columns, cfg });
    if (summary.closedAt !== null) store.write(`sprintSummary.${id}`, { v: cfg.cacheVersion, summary });
    return summary;
  };
  const before = async (summary) => {
    if (!summary.prevId) return null;
    const previous = await summaryOf(summary.prevId);
    return previous.boardId === summary.boardId && previous.id < summary.id ? previous : null;
  };
  const current = await summaryOf(currentId);
  const running = current.finished ? null : current;
  let last = running ? null : current;
  const history = [];
  let historyProblem = null;
  try {
    if (running) last = await before(current);
    let item = last;
    while (item && history.length < cfg.history) {
      item = await before(item);
      if (item) history.push(item);
    }
  } catch (error) {
    historyProblem = error.message || String(error);
  }
  return { last, running, history, historyProblem, currentId };
}

if (typeof module !== 'undefined') module.exports = { SPRINT_REPORT, sprintTime, sprintMonday, sprintPeriod, sprintFinished, sprintIsBug, sprintEscaped, sprintCurrentId, sprintVersions, sprintWorkdays, sprintDaysLeft, sprintMedian, sprintPercentile, sprintSummary, sprintNumber, sprintDays, sprintDate, sprintReportBlocks, sprintReportLoad };
