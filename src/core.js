const SPRINT_CAPACITY = {
  boardId: 68084,
  fields: { devEstimate: 'id_396449', platform: 'id_499149', testType: 'id_505017' },
  platform: { back: 16232407, front: 16232408 },
  needQa: 16238652,
  doneState: 3,
  bugTypeIds: [446247],
  bugTypeName: /bug|баг/i,
};

const DIRECTIONS = ['back', 'front', 'qa'];

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

function buildReport({ cards, settings, snapshot = null, config = SPRINT_CAPACITY }) {
  const sums = {};
  for (const direction of DIRECTIONS) sums[direction] = 0;
  const report = {
    warnings: [],
    notCounted: { points: 0, cards: [] },
    bugs: { cards: [], points: 0 },
    board: { cards: [], points: 0 },
    done: { cards: [], points: 0, count: 0, of: 0, percent: null },
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
  report.rows = DIRECTIONS.map((direction) => {
    const total = round1(sums[direction]);
    const people = settings.team[direction].people;
    const capacity = people > 0 ? round1(capacityOf(settings, direction)) : null;
    const base = snapshot ? snapshot.totals[direction] : null;
    const added = base === null ? null : round1(total - base);
    return { direction, base, added, total, capacity, over: capacity !== null && total > capacity };
  });
  report.done.percent = percentOf(report.done.count, report.done.of);
  report.notCounted.points = round1(report.notCounted.points);
  report.bugs.points = round1(report.bugs.points);
  report.board.points = round1(report.board.points);
  report.done.points = round1(report.done.points);
  return report;
}

function formatRow(row) {
  const capacity = row.capacity === null ? '—' : formatNumber(row.capacity);
  const hasBase = row.base !== null && row.base !== undefined;
  const change = hasBase ? `${formatNumber(row.base)} ${row.added < 0 ? '−' : '+'} ${formatNumber(Math.abs(row.added))} = ` : '';
  return `${DIRECTION_LABELS[row.direction]}: ${change}${formatNumber(row.total)} из ${capacity}`;
}

function takeSnapshot({ cards, settings, now, config = SPRINT_CAPACITY }) {
  const inWork = cards.filter((card) => card.state !== config.doneState);
  const report = buildReport({ cards: inWork, settings, config });
  const totals = {};
  for (const row of report.rows) totals[row.direction] = row.total;
  const doneIds = cards.filter((card) => card.state === config.doneState).map((card) => card.id);
  return { takenAt: new Date(now).toISOString(), totals, doneIds };
}

function normalizeSnapshot(raw) {
  if (!raw || typeof raw !== 'object' || !raw.totals || !Number.isFinite(Date.parse(raw.takenAt))) return null;
  const totals = {};
  for (const direction of DIRECTIONS) {
    const number = toNumber(raw.totals[direction]);
    if (number === null) return null;
    totals[direction] = number;
  }
  const doneIds = Array.isArray(raw.doneIds) ? raw.doneIds.filter((id) => Number.isInteger(id)) : [];
  return { takenAt: raw.takenAt, totals, doneIds };
}

if (typeof module !== 'undefined') module.exports = { SPRINT_CAPACITY, DIRECTIONS, DIRECTION_LABELS, toNumber, round1, formatNumber, plural, readEstimate, platformOf, needsQa, isBug, splitEstimate, estimateIssues, defaultSettings, normalizeSettings, capacityOf, buildReport, formatRow, takeSnapshot, normalizeSnapshot };
