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
  if (sp === null) return { dev: null, qa: null };
  if (size === null) return { dev: sp, qa: null };
  return { dev: sp, qa: Math.max(0, size - sp) };
}

function estimateIssues(estimate, platform, needQa) {
  const { size, sp } = estimate;
  const issues = [];
  if (size === null && sp === null) issues.push('noEstimate');
  else if (sp === null) issues.push('noDevEstimate');
  else if (size === null) issues.push('noSize');
  else if (size < sp) issues.push('sizeBelowDev');
  if (sp !== null && platform === null) issues.push('noPlatform');
  if (needQa && size !== null && sp !== null && size <= sp) issues.push('needQaWithoutQa');
  return issues;
}

function sprintBoundary(sprint) {
  const times = [sprint.finish_date, sprint.actual_finish_date]
    .filter(Boolean)
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);
  return times.length ? Math.min(...times) : Infinity;
}

function snapshotsAtSprintEnd(sprint) {
  const boundary = sprintBoundary(sprint);
  const latest = new Map();
  for (const version of sprint.cardUpdates || []) {
    if (version.sprint_id !== sprint.id) continue;
    const at = Date.parse(version.updated);
    if (!(at <= boundary)) continue;
    const known = latest.get(version.id);
    const newer = !known || at > known.at || (at === known.at && (version.version || 0) > (known.version.version || 0));
    if (newer) latest.set(version.id, { at, version });
  }
  const result = new Map();
  for (const [id, entry] of latest) result.set(id, entry.version);
  return result;
}

function currentSprintId(cards) {
  let best = null;
  for (const card of cards) {
    if (card.sprint_id && (best === null || card.sprint_id > best)) best = card.sprint_id;
  }
  return best;
}

function isSprintRunning(head, now) {
  if (!head || !head.active || head.actual_finish_date) return false;
  const finish = Date.parse(head.finish_date);
  return !Number.isFinite(finish) || now <= finish;
}

function previousSprintPlan(currentId, head, now) {
  if (currentId === null) return { source: 'history', below: null };
  if (!isSprintRunning(head, now)) return { source: 'current', id: currentId };
  return { source: 'history', below: currentId };
}

function latestSprintId(records, boardId, below) {
  let best = null;
  for (const record of records) {
    const id = record && record.sprint_id;
    if (!id || record.board_id !== boardId) continue;
    if (below !== null && below !== undefined && id >= below) continue;
    if (best === null || id > best) best = id;
  }
  return best;
}

function newerSprintInUpdates(sprint, boardId, below) {
  const newer = latestSprintId(sprint.cardUpdates || [], boardId, below);
  return newer !== null && newer > sprint.id ? newer : null;
}

function sprintHeadFrom(text) {
  const cut = text.indexOf(',"cards":');
  if (cut === -1) return { found: false, head: null };
  try {
    return { found: true, head: JSON.parse(`${text.slice(0, cut)}}`) };
  } catch (error) {
    return { found: true, head: null };
  }
}

function defaultSettings() {
  const team = {};
  for (const direction of DIRECTIONS) team[direction] = { people: 0, absence: 0 };
  return { workDays: 10, holidays: 0, coefficient: 1, includeDone: false, team };
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
    includeDone: source.includeDone === true,
    team,
  };
}

function capacityOf(settings, direction) {
  const days = Math.max(0, settings.workDays - settings.holidays);
  const team = settings.team[direction];
  return Math.max(0, team.people * days - team.absence) * settings.coefficient;
}

function pickRemainder(entered, fallback) {
  const number = toNumber(entered);
  return number === null ? fallback : number;
}

function addToSums(sums, notCounted, kind, item, counted) {
  if (counted.dev === null && counted.qa === null) {
    if (item.estimate.size !== null) {
      notCounted.points += item.estimate.size;
      notCounted.cards.push(item);
    }
    return;
  }
  if (counted.dev !== null) {
    if (item.platform) {
      sums[item.platform][kind] += counted.dev;
    } else {
      notCounted.points += counted.dev;
      notCounted.cards.push(item);
    }
  }
  if (counted.qa !== null) sums.qa[kind] += counted.qa;
}

function buildReport({ cards, previous, settings, remainders = {}, config = SPRINT_CAPACITY }) {
  const snapshots = previous ? snapshotsAtSprintEnd(previous) : new Map();
  const sums = {};
  for (const direction of DIRECTIONS) sums[direction] = { tail: 0, added: 0 };
  const report = {
    tails: [],
    added: [],
    warnings: [],
    notCounted: { points: 0, cards: [] },
    bugs: { cards: [], points: 0 },
    done: { cards: [], size: 0, counted: settings.includeDone },
    problems: [],
  };
  let hasDevField = false;
  let hasPlatformField = false;
  for (const card of cards) {
    const properties = card.properties || {};
    if (config.fields.devEstimate in properties) hasDevField = true;
    if (config.fields.platform in properties) hasPlatformField = true;
    const estimate = readEstimate(card, config);
    const platform = platformOf(card, config);
    const full = splitEstimate(estimate);
    const item = { id: card.id, title: card.title || '', columnId: card.column_id, platform, estimate, full };
    if (isBug(card, config)) {
      report.bugs.cards.push(item);
      report.bugs.points += estimate.size !== null ? estimate.size : estimate.sp || 0;
      continue;
    }
    if (card.state === config.doneState) {
      report.done.cards.push(item);
      report.done.size += estimate.size || 0;
      if (!settings.includeDone) continue;
    }
    for (const issue of estimateIssues(estimate, platform, needsQa(card, config))) {
      report.warnings.push({ issue, item });
    }
    const snapshot = snapshots.get(card.id);
    const before = snapshot ? readEstimate(snapshot, config) : null;
    if (before && before.size === estimate.size && before.sp === estimate.sp) {
      const entered = remainders[card.id] || {};
      const counted = { dev: pickRemainder(entered.dev, full.dev), qa: pickRemainder(entered.qa, full.qa) };
      report.tails.push({ ...item, counted, entered: { dev: toNumber(entered.dev), qa: toNumber(entered.qa) } });
      addToSums(sums, report.notCounted, 'tail', item, counted);
    } else {
      report.added.push({ ...item, counted: full, before });
      addToSums(sums, report.notCounted, 'added', item, full);
    }
  }
  if (cards.length && !hasDevField) report.problems.push('Ни в одной карте нет поля Story Points — разработку посчитать не из чего');
  if (cards.length && !hasPlatformField) report.problems.push('Ни в одной карте нет поля Platform — бэк и фронт не разделить');
  report.rows = DIRECTIONS.map((direction) => {
    const tail = round1(sums[direction].tail);
    const added = round1(sums[direction].added);
    const people = settings.team[direction].people;
    const capacity = people > 0 ? round1(capacityOf(settings, direction)) : null;
    const total = round1(tail + added);
    return { direction, tail, added, total, capacity, over: capacity !== null && total > capacity };
  });
  report.notCounted.points = round1(report.notCounted.points);
  report.bugs.points = round1(report.bugs.points);
  report.done.size = round1(report.done.size);
  return report;
}

function formatRow(row) {
  const capacity = row.capacity === null ? '—' : formatNumber(row.capacity);
  return `${DIRECTION_LABELS[row.direction]}: ${formatNumber(row.tail)} + ${formatNumber(row.added)} = ${formatNumber(row.total)} из ${capacity}`;
}

if (typeof module !== 'undefined') module.exports = { SPRINT_CAPACITY, DIRECTIONS, DIRECTION_LABELS, toNumber, round1, formatNumber, plural, readEstimate, platformOf, needsQa, isBug, splitEstimate, estimateIssues, sprintBoundary, snapshotsAtSprintEnd, currentSprintId, isSprintRunning, previousSprintPlan, latestSprintId, newerSprintInUpdates, sprintHeadFrom, defaultSettings, normalizeSettings, capacityOf, buildReport, formatRow };
