const SPRINT_CAPACITY = {
  boards: [
    { id: 68084, title: 'Staff Core', holst: { board: '67165a75-56cd-40d4-aeb8-c6f05ae5c057', group: '8686c163-2c4c-4dd4-b86a-9272dde08876', sticker: '48d1ad3f-be39-4601-9680-fca941dbf8cb', labels: '5011ab61-2907-426f-ad03-04bc4e62d43b' } },
    { id: 1321013, title: 'Staff Mobile', platform: { back: 16232407, front: 16237830 }, platformTags: { back: 'Backend', front: 'Mobile' }, labels: { front: 'Mobile' }, holst: { board: '67165a75-56cd-40d4-aeb8-c6f05ae5c057', group: '5e307012-f88c-4d6e-ab3f-559114026ebd', sticker: 'f78f383c-1b8a-4adf-be02-b9971043f4d0', labels: 'a607f507-027d-41b9-aa7d-6f791a52f052' } },
  ],
  snapshotCardId: 71238243,
  fields: { devEstimate: 'id_396449', platform: 'id_499149', testType: 'id_505017' },
  platform: { back: 16232407, front: 16232408 },
  platformTags: { back: 'Backend', front: 'Frontend' },
  needQa: 16238652,
  doneState: 3,
  bugTypeIds: [446247],
  bugTypeName: /bug|баг/i,
  progress: { stages: { 'to do': 0, doing: 0.3, review: 0.65, 'design review': 0.8, test: 0.8, 'waiting for release': 0.97, done: 1 }, bugWeight: 1, emptyWeight: 1 },
};

const DIRECTIONS = ['back', 'front', 'qa'];

const SNAPSHOT_MARK = 'Снимок начала планирования';

const PLAN_END_MARK = 'Конец планирования';

const DIRECTION_LABELS = { back: 'Бэк', front: 'Фронт', qa: 'QA' };

function toNumber(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return null;
  const text = String(value).trim().replace(',', '.');
  if (text === '') return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value) {
  return String(round1(value)).replace('.', ',');
}

function plural(count, forms) {
  const tens = Math.abs(count) % 100;
  const last = tens % 10;
  if (tens > 10 && tens < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

function propertyValues(card, key) {
  const value = (card.properties || {})[key];
  if (value === null || value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map(Number);
}

function readEstimate(card, config = SPRINT_CAPACITY) {
  return {
    size: toNumber(card.size),
    sp: toNumber((card.properties || {})[config.fields.devEstimate]),
  };
}

function platformOf(card, config = SPRINT_CAPACITY) {
  const values = propertyValues(card, config.fields.platform);
  if (values.includes(config.platform.back)) return 'back';
  if (values.includes(config.platform.front)) return 'front';
  return null;
}

function needsQa(card, config = SPRINT_CAPACITY) {
  return propertyValues(card, config.fields.testType).includes(config.needQa);
}

function isBug(card, config = SPRINT_CAPACITY) {
  if ((config.bugTypeIds || []).includes(Number(card.type_id))) return true;
  const name = card.type && card.type.name;
  return Boolean(name && config.bugTypeName && config.bugTypeName.test(name));
}

function splitEstimate({ size, sp }) {
  if (size === null && sp === null) return { dev: null, qa: null };
  if (size === null || sp === null) return { dev: size === null ? sp : size, qa: 0 };
  return { dev: Math.min(size, sp), qa: Math.abs(size - sp) };
}

function columnTitle(card) {
  return String((card.column && card.column.title) || '').trim();
}

function progressStage(card, config = SPRINT_CAPACITY) {
  if (card.state === config.doneState) return 1;
  const name = columnTitle(card).toLowerCase().replace(/\s+/g, ' ');
  return Object.prototype.hasOwnProperty.call(config.progress.stages, name) ? config.progress.stages[name] : null;
}

function progressWeight(card, config = SPRINT_CAPACITY) {
  if (isBug(card, config)) return config.progress.bugWeight;
  const parts = splitEstimate(readEstimate(card, config));
  return parts.dev === null ? config.progress.emptyWeight : Math.max(0, parts.dev + parts.qa);
}

function estimateIssues(estimate, platform, needQa) {
  const parts = splitEstimate(estimate);
  if (parts.dev === null) return ['noEstimate'];
  const issues = [];
  if (platform === null) issues.push('noPlatform');
  if (needQa && parts.qa === 0) issues.push('needQaWithoutQa');
  return issues;
}

function defaultSettings() {
  const team = {};
  for (const direction of DIRECTIONS) team[direction] = { people: 0, absence: 0 };
  return { workDays: 10, holidays: 0, coefficient: 1, team };
}

function normalizeSettings(raw) {
  const base = defaultSettings();
  const source = raw && typeof raw === 'object' ? raw : {};
  const pick = (value, fallback) => {
    const number = toNumber(value);
    return number === null || number < 0 ? fallback : number;
  };
  const team = {};
  for (const direction of DIRECTIONS) {
    const entry = (source.team && source.team[direction]) || {};
    team[direction] = { people: pick(entry.people, 0), absence: pick(entry.absence, 0) };
  }
  return {
    workDays: pick(source.workDays, base.workDays),
    holidays: pick(source.holidays, base.holidays),
    coefficient: pick(source.coefficient, base.coefficient),
    team,
  };
}

function capacityOf(settings, direction) {
  const days = Math.max(0, settings.workDays - settings.holidays);
  const team = settings.team[direction];
  return Math.max(0, team.people * days - team.absence) * settings.coefficient;
}

function percentOf(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

function buildReport({ cards, settings, snapshot = null, planEnd = null, config = SPRINT_CAPACITY }) {
  const sums = {};
  for (const direction of DIRECTIONS) sums[direction] = 0;
  const report = {
    warnings: [],
    notCounted: { points: 0, cards: [] },
    bugs: { cards: [], points: 0 },
    board: { cards: [], points: 0 },
    done: { cards: [], points: 0, count: 0, of: 0, percent: null },
    progress: { points: 0, done: 0, percent: null, unknown: [] },
    problems: [],
  };
  let hasDevField = false;
  let hasPlatformField = false;
  const doneAtStart = new Set(snapshot ? snapshot.doneIds : []);
  for (const card of cards) {
    if (card.state === config.doneState && doneAtStart.has(card.id)) continue;
    const properties = card.properties || {};
    if (config.fields.devEstimate in properties) hasDevField = true;
    if (config.fields.platform in properties) hasPlatformField = true;
    const estimate = readEstimate(card, config);
    const platform = platformOf(card, config);
    const parts = splitEstimate(estimate);
    const total = (parts.dev || 0) + (parts.qa || 0);
    const item = { id: card.id, title: card.title || '', platform, estimate, parts };
    report.done.of += 1;
    if (card.state === config.doneState) report.done.count += 1;
    const weight = progressWeight(card, config);
    const stage = progressStage(card, config);
    report.progress.points += weight;
    report.progress.done += weight * (stage || 0);
    if (stage === null) report.progress.unknown.push({ id: card.id, title: item.title, column: columnTitle(card) });
    if (isBug(card, config)) {
      report.bugs.cards.push(item);
      report.bugs.points += total;
      continue;
    }
    report.board.cards.push(item);
    report.board.points += total;
    if (card.state === config.doneState) {
      report.done.cards.push(item);
      report.done.points += total;
    }
    for (const issue of estimateIssues(estimate, platform, needsQa(card, config))) {
      report.warnings.push({ issue, item });
    }
    if (parts.dev !== null) {
      if (platform) {
        sums[platform] += parts.dev;
      } else {
        report.notCounted.points += parts.dev;
        report.notCounted.cards.push(item);
      }
    }
    if (parts.qa !== null) sums.qa += parts.qa;
  }
  if (cards.length && !hasDevField) report.problems.push('Ни в одной карте нет поля Story Points — всё считаю в разработку, QA не выделить');
  if (cards.length && !hasPlatformField) report.problems.push('Ни в одной карте нет поля Platform — бэк и фронт не разделить');
  const labels = { ...DIRECTION_LABELS, ...config.labels };
  report.rows = DIRECTIONS.map((direction) => {
    const total = round1(sums[direction]);
    const people = settings.team[direction].people;
    const capacity = people > 0 ? round1(capacityOf(settings, direction)) : null;
    const base = snapshot ? snapshot.totals[direction] : null;
    const added = base === null ? null : round1(total - base);
    const top = planEnd ? round1(total - planEnd.totals[direction]) : null;
    return { direction, label: labels[direction], base, added, top, total, capacity, over: capacity !== null && total > capacity };
  });
  report.done.percent = percentOf(report.done.count, report.done.of);
  report.done.pointsPercent = percentOf(report.done.points, report.board.points);
  report.progress.percent = percentOf(report.progress.done, report.progress.points);
  report.progress.points = round1(report.progress.points);
  report.progress.done = round1(report.progress.done);
  report.notCounted.points = round1(report.notCounted.points);
  report.bugs.points = round1(report.bugs.points);
  report.board.points = round1(report.board.points);
  report.done.points = round1(report.done.points);
  return report;
}

function boardConfig(boardId, config = SPRINT_CAPACITY) {
  const board = config.boards.find((item) => item.id === boardId) || {};
  return {
    ...config,
    platform: board.platform || config.platform,
    platformTags: board.platformTags || config.platformTags,
    labels: { ...DIRECTION_LABELS, ...config.labels, ...board.labels },
    holst: board.holst || null,
  };
}

function isChaos(row) {
  return row.capacity !== null && row.capacity > 0 && row.total >= row.capacity * 2;
}

function chaosNames(rows, config = SPRINT_CAPACITY) {
  const names = { ...config.platformTags, back: 'Бэк', qa: 'QA' };
  return rows.filter(isChaos).map((row) => names[row.direction]);
}

function localDay(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function geeseDue(lastDay, now) {
  return lastDay !== localDay(now);
}

function signed(value) {
  return `${value < 0 ? '−' : '+'}${formatNumber(Math.abs(value))}`;
}

function formatRow(row) {
  const capacity = row.capacity === null ? '—' : formatNumber(row.capacity);
  const hasBase = row.base !== null && row.base !== undefined;
  const change = hasBase ? `${formatNumber(row.base)} ${row.added < 0 ? '−' : '+'} ${formatNumber(Math.abs(row.added))} = ` : '';
  const top = row.top === null || row.top === undefined ? '' : `, сверху ${signed(row.top)}`;
  return `${row.label || DIRECTION_LABELS[row.direction]}: ${change}${formatNumber(row.total)} из ${capacity}${top}`;
}

function takeSnapshot({ cards, settings, now, boardId, config = SPRINT_CAPACITY }) {
  const inWork = cards.filter((card) => card.state !== config.doneState);
  const report = buildReport({ cards: inWork, settings, config });
  const totals = {};
  for (const row of report.rows) totals[row.direction] = row.total;
  const doneIds = cards.filter((card) => card.state === config.doneState).map((card) => card.id);
  return { boardId, takenAt: new Date(now).toISOString(), totals, doneIds };
}

function takePlanEnd({ cards, snapshot, now, boardId, config = SPRINT_CAPACITY }) {
  const report = buildReport({ cards, settings: defaultSettings(), snapshot, config });
  const totals = {};
  for (const row of report.rows) totals[row.direction] = row.total;
  return { boardId, takenAt: new Date(now).toISOString(), startedAt: snapshot.takenAt, totals };
}

function normalizeSnapshot(raw) {
  if (!raw || typeof raw !== 'object' || !raw.totals || !Number.isInteger(raw.boardId) || !Number.isFinite(Date.parse(raw.takenAt))) return null;
  const totals = {};
  for (const direction of DIRECTIONS) {
    const number = toNumber(raw.totals[direction]);
    if (number === null) return null;
    totals[direction] = number;
  }
  const doneIds = Array.isArray(raw.doneIds) ? raw.doneIds.filter((id) => Number.isInteger(id)) : [];
  return { boardId: raw.boardId, takenAt: raw.takenAt, totals, doneIds };
}

function boardTitle(boardId, config = SPRINT_CAPACITY) {
  const board = config.boards.find((item) => item.id === boardId);
  return board ? board.title : `доска ${boardId}`;
}

function snapshotComment(snapshot, config = SPRINT_CAPACITY) {
  const { labels } = boardConfig(snapshot.boardId, config);
  const left = DIRECTIONS.map((direction) => `${labels[direction]} ${formatNumber(snapshot.totals[direction])}`).join(' · ');
  return `${SNAPSHOT_MARK}, ${boardTitle(snapshot.boardId, config)}. Осталось: ${left}.\n\n\`\`\`json\n${JSON.stringify(snapshot)}\n\`\`\``;
}

function commentsWithJson(comments, mark) {
  return (Array.isArray(comments) ? comments : [])
    .filter((comment) => comment && !comment.deleted && typeof comment.text === 'string' && comment.text.startsWith(mark))
    .sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
    .map((comment) => {
      const match = comment.text.match(/```json\s*([\s\S]*?)```/);
      let raw = null;
      try {
        raw = match ? JSON.parse(match[1]) : null;
      } catch (error) {
        raw = null;
      }
      return { raw, author: (comment.author && comment.author.full_name) || '' };
    });
}

function snapshotFromComments(comments, boardId) {
  for (const { raw, author } of commentsWithJson(comments, SNAPSHOT_MARK)) {
    const snapshot = normalizeSnapshot(raw);
    if (snapshot && snapshot.boardId === boardId) return { ...snapshot, author };
  }
  return null;
}

function planEndComment(planEnd, config = SPRINT_CAPACITY) {
  const { labels } = boardConfig(planEnd.boardId, config);
  const total = DIRECTIONS.map((direction) => `${labels[direction]} ${formatNumber(planEnd.totals[direction])}`).join(' · ');
  return `${PLAN_END_MARK}, ${boardTitle(planEnd.boardId, config)}. После планирования: ${total}.\n\n\`\`\`json\n${JSON.stringify(planEnd)}\n\`\`\``;
}

function planEndFromComments(comments, snapshot) {
  if (!snapshot) return null;
  for (const { raw, author } of commentsWithJson(comments, PLAN_END_MARK)) {
    const planEnd = normalizeSnapshot(raw);
    if (planEnd && planEnd.boardId === snapshot.boardId && raw.startedAt === snapshot.takenAt) return { boardId: planEnd.boardId, takenAt: planEnd.takenAt, startedAt: raw.startedAt, totals: planEnd.totals, author };
  }
  return null;
}

if (typeof module !== 'undefined') module.exports = { SPRINT_CAPACITY, DIRECTIONS, DIRECTION_LABELS, toNumber, round1, formatNumber, plural, readEstimate, platformOf, needsQa, isBug, splitEstimate, progressStage, progressWeight, estimateIssues, defaultSettings, normalizeSettings, capacityOf, buildReport, boardConfig, isChaos, chaosNames, localDay, geeseDue, formatRow, takeSnapshot, takePlanEnd, normalizeSnapshot, boardTitle, snapshotComment, snapshotFromComments, planEndComment, planEndFromComments };
