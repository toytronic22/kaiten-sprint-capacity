const SPRINT_CAPACITY = {
  boards: [
    { id: 303040, title: 'Core team', holst: { board: '972a8469-1641-4f82-8b9d-2434e465e150', group: '17fc695a-07a0-4a6e-8822-e8f36c031199', sticker: 'bdd640fb-0667-4ad1-9c80-317fa3b1799d', labels: '23b8c1e9-3924-46de-beb1-3b9046685257', goal: { text: '5d1f4d94-4fed-4da5-b522-f4c443683e9a' }, checklist: '42fc1d2c-09af-438a-a29f-a13d067d919d', star: '069fa784-f7cd-42be-b9cc-7d19d811a6e4', flag: 'e8fc772d-afd7-48b3-974c-f89dd23ba980' } },
    { id: 319248, title: 'Mobile team', platform: { back: 329378, front: 331404 }, platformTags: { back: 'Backend', front: 'Mobile' }, labels: { front: 'Mobile' }, holst: { board: '972a8469-1641-4f82-8b9d-2434e465e150', group: 'bd9c66b3-ad3c-4d6d-9a3d-1fa7bc8960a9', sticker: 'b74d0fb1-32e7-4629-8fad-c1a606cb0fb3', labels: '9a1de644-815e-46d1-bb8f-aa1837f8a88b', goal: { text: 'f885662c-1b7e-4578-af4f-db021289bc73', title: '96923953-d7b9-4f81-bc70-339ae10df22d' }, checklist: '382fbe93-edc2-4b61-a3fc-a77a1982ea65', star: 'c8e9b607-9e08-4aae-a31b-b15f773b81a6', flag: '1bf8bfed-641f-4cae-af93-8902da2c52f4' } },
  ],
  snapshotCardId: 363820,
  fields: { devEstimate: 'id_9002', platform: 'id_9004', testType: 'id_9005' },
  platform: { back: 329378, front: 330391 },
  platformTags: { back: 'Backend', front: 'Frontend' },
  needQa: 333430,
  doneState: 3,
  bugTypeIds: [316209],
  bugTypeName: /bug|баг/i,
  bugSplit: { back: 0.85, front: 0.15 },
  progress: { stages: { 'to do': 0, doing: 0.3, review: 0.65, 'design review': 0.8, test: 0.8, 'waiting for release': 0.97, done: 1 }, emptyWeight: 1, bugEmptyWeight: 0 },
  scale: { since: Date.parse('2026-10-12T00:00:00+03:00'), spPerDay: 2 },
  daily: {
    303040: {
      key: 'core',
      people: ['Михаил Н.', 'Михаил В.', 'Павел Т.', 'Михаил Т.', 'Павел Р.', 'Роман Д.', 'Тимур Л.', 'Денис О.', 'Ксения Ш.', 'Глеб Л.'],
    },
    319248: {
      key: 'mobile',
      people: ['Михаил В.', 'Артём Л.', 'Павел Ч.', 'Павел Ю.', 'Лена Н.', 'Глеб Л.', 'Михаил Н.'],
    },
  },
};

const DIRECTIONS = ['back', 'front', 'qa'];

const SNAPSHOT_MARK = 'Снимок начала планирования';

const PLAN_END_MARK = 'Конец планирования';

const SETTINGS_MARK = 'Команда и дни';
const DAILY_MARK = 'Дейлик';

const SETTING_PATHS = ['workDays', 'holidays', 'coefficient', ...DIRECTIONS.flatMap((direction) => [`team.${direction}.people`, `team.${direction}.absence`])];

const PLAN_REPEAT_MS = 259200000;

const SHARED_KEEP_MS = 345600000;

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
  const parts = splitEstimate(readEstimate(card, config));
  if (parts.dev !== null) return Math.max(0, parts.dev + parts.qa);
  return isBug(card, config) ? config.progress.bugEmptyWeight : config.progress.emptyWeight;
}

function newScale(at, config = SPRINT_CAPACITY) {
  return Boolean(config.scale) && Number.isFinite(at) && at >= config.scale.since;
}

function estimateIssues(estimate, platform, needQa) {
  const parts = splitEstimate(estimate);
  if (parts.dev === null) return ['noEstimate'];
  const issues = [];
  if (platform === null) issues.push('noPlatform');
  if (needQa && parts.qa === 0) issues.push('needQaWithoutQa');
  return issues;
}

function defaultSettings(now = null, config = SPRINT_CAPACITY) {
  const team = {};
  for (const direction of DIRECTIONS) team[direction] = { people: 0, absence: 0 };
  return { workDays: 10, holidays: 0, coefficient: newScale(now, config) ? config.scale.spPerDay : 1, team };
}

function normalizeSettings(raw, now = null, config = SPRINT_CAPACITY) {
  const base = defaultSettings(now, config);
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

function scaledSettings(raw, savedAt, now, config = SPRINT_CAPACITY) {
  const settings = normalizeSettings(raw, now, config);
  if (newScale(now, config) && !newScale(Date.parse(savedAt), config)) settings.coefficient = config.scale.spPerDay;
  return settings;
}

function personDaysOf(settings, direction) {
  const days = Math.max(0, settings.workDays - settings.holidays);
  const team = settings.team[direction];
  return Math.max(0, team.people * days - team.absence);
}

function capacityOf(settings, direction) {
  return personDaysOf(settings, direction) * settings.coefficient;
}

function capacityDays(settings) {
  const directions = DIRECTIONS.filter((direction) => settings.team[direction].people > 0);
  return directions.length ? Object.fromEntries(directions.map((direction) => [direction, round1(personDaysOf(settings, direction))])) : null;
}

function percentOf(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

function buildReport({ cards, settings, snapshot = null, planEnd = null, now = null, config = SPRINT_CAPACITY }) {
  const bugPoints = newScale(now, config);
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
    const bug = isBug(card, config);
    if (bug) {
      report.bugs.cards.push(item);
      report.bugs.points += total;
      if (!bugPoints) continue;
    }
    report.board.cards.push(item);
    report.board.points += total;
    if (card.state === config.doneState) {
      report.done.cards.push(item);
      report.done.points += total;
    }
    const split = bug && !platform && config.bugSplit;
    const issues = bug && parts.dev === null ? [] : estimateIssues(estimate, platform, needsQa(card, config)).filter((issue) => !(split && issue === 'noPlatform'));
    for (const issue of issues) report.warnings.push({ issue, item });
    if (parts.dev !== null) {
      if (platform) {
        sums[platform] += parts.dev;
      } else if (split) {
        for (const [direction, share] of Object.entries(split)) sums[direction] += parts.dev * share;
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

function burnTime(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  return Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text}Z`);
}

function burnDayOf(ms, calendar) {
  return Math.floor((ms + calendar.mskMs) / calendar.dayMs);
}

function burnDayKey(day, calendar) {
  return new Date(day * calendar.dayMs).toISOString().slice(0, 10);
}

function burnWorkday(day, calendar) {
  const key = burnDayKey(day, calendar);
  const weekday = (day + 4) % 7;
  return (calendar.workSaturdays || []).includes(key) || (weekday >= 1 && weekday <= 5 && !(calendar.holidays || []).includes(key));
}

function burnVersions(sprint) {
  const byCard = new Map();
  for (const item of sprint.cardUpdates || []) {
    if (!byCard.has(item.id)) byCard.set(item.id, []);
    byCard.get(item.id).push({ ...item, at: burnTime(item.updated) });
  }
  for (const list of byCard.values()) list.sort((a, b) => a.at - b.at || (a.version || 0) - (b.version || 0));
  return byCard;
}

function burnAt(list, time) {
  let found = null;
  for (const item of list) {
    if (item.at > time) break;
    found = item;
  }
  return found;
}

function burnPercent({ byCard, types, columns, skip, boardId, time, config }) {
  let points = 0;
  let done = 0;
  for (const [id, list] of byCard) {
    const version = burnAt(list, time);
    if (!version || version.board_id !== boardId || version.archived || version.condition !== 1) continue;
    if (version.state === config.doneState && skip.has(id)) continue;
    const card = { ...types.get(id), id, size: version.size, properties: version.properties, state: version.state, column: { title: columns[version.column_id] || '' } };
    const weight = progressWeight(card, config);
    points += weight;
    done += weight * (progressStage(card, config) || 0);
  }
  return percentOf(done, points);
}

function burnDays({ sprint, columns = {}, doneAtStart = null, percent = null, now, config = SPRINT_CAPACITY, calendar }) {
  if (!(sprint.cardUpdates || []).length) return { problem: 'Kaiten не прислал историю карт спринта' };
  const byCard = burnVersions(sprint);
  const types = new Map((sprint.cards || []).map((card) => [card.id, { type_id: card.type_id, type: card.type }]));
  const skip = new Set(doneAtStart || []);
  const today = burnDayOf(now, calendar);
  const first = Math.round((burnTime(sprint.start_date) + calendar.mskMs) / calendar.dayMs);
  const days = [];
  for (let day = first; day <= today; day += 1) {
    if (!burnWorkday(day, calendar)) continue;
    const time = day === today ? now : (day + 1) * calendar.dayMs - calendar.mskMs - 1;
    const value = day === today && percent !== null ? percent : burnPercent({ byCard, types, columns, skip, boardId: sprint.board_id, time, config });
    if (value !== null) days.push({ day: burnDayKey(day, calendar), percent: value });
  }
  const monday = today - ((today + 3) % 7);
  const week = first < monday ? { day: burnDayKey(monday, calendar), percent: burnPercent({ byCard, types, columns, skip, boardId: sprint.board_id, time: monday * calendar.dayMs - calendar.mskMs - 1, config }) } : null;
  const last = Math.round((burnTime(sprint.finish_date) + 1 + calendar.mskMs) / calendar.dayMs) - 1;
  const ahead = [];
  for (let day = Math.max(today + 1, first); day <= Math.min(today + 6 - ((today + 3) % 7), last); day += 1) {
    if (burnWorkday(day, calendar)) ahead.push(burnDayKey(day, calendar));
  }
  return { start: burnDayKey(first, calendar), today: burnDayKey(today, calendar), days, ahead, week };
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

function chaosLabel(names) {
  if (!names.length) return 'Overload';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}`;
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
  const report = buildReport({ cards: inWork, settings, now, config });
  const totals = {};
  for (const row of report.rows) totals[row.direction] = row.total;
  const doneIds = cards.filter((card) => card.state === config.doneState).map((card) => card.id);
  const capacity = capacityDays(settings);
  return { boardId, takenAt: new Date(now).toISOString(), totals, doneIds, ...(capacity ? { capacity } : {}) };
}

function takePlanEnd({ cards, snapshot, settings = defaultSettings(), now, boardId, config = SPRINT_CAPACITY }) {
  const report = buildReport({ cards, settings: defaultSettings(), snapshot, now, config });
  const totals = {};
  for (const row of report.rows) totals[row.direction] = row.total;
  const capacity = capacityDays(settings);
  return { boardId, takenAt: new Date(now).toISOString(), startedAt: snapshot.takenAt, totals, ...(capacity ? { capacity } : {}) };
}

function normalizeCapacity(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const capacity = {};
  for (const direction of DIRECTIONS) {
    if (raw[direction] === undefined) continue;
    const number = toNumber(raw[direction]);
    if (number === null || number < 0) return null;
    capacity[direction] = number;
  }
  return Object.keys(capacity).length ? capacity : null;
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
  const capacity = normalizeCapacity(raw.capacity);
  return { boardId: raw.boardId, takenAt: raw.takenAt, totals, doneIds, ...(capacity ? { capacity } : {}) };
}

function boardTitle(boardId, config = SPRINT_CAPACITY) {
  const board = config.boards.find((item) => item.id === boardId);
  return board ? board.title : `доска ${boardId}`;
}

function capacityText(capacity, labels) {
  if (!capacity) return '';
  return ` Capacity, чел.-дн.: ${DIRECTIONS.filter((direction) => capacity[direction] !== undefined).map((direction) => `${labels[direction]} ${formatNumber(capacity[direction])}`).join(' · ')}.`;
}

function snapshotComment(snapshot, config = SPRINT_CAPACITY) {
  const { labels } = boardConfig(snapshot.boardId, config);
  const left = DIRECTIONS.map((direction) => `${labels[direction]} ${formatNumber(snapshot.totals[direction])}`).join(' · ');
  return `${SNAPSHOT_MARK}, ${boardTitle(snapshot.boardId, config)}. Осталось: ${left}.${capacityText(snapshot.capacity, labels)}\n\n\`\`\`json\n${JSON.stringify(snapshot)}\n\`\`\``;
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
      return { raw, author: (comment.author && comment.author.full_name) || '', id: comment.id, created: comment.created };
    });
}

function staleComments(comments, mark, boardId, now) {
  if (mark !== SETTINGS_MARK && mark !== DAILY_MARK) return [];
  return commentsWithJson(comments, mark)
    .filter(({ raw, id, created }) => raw && typeof raw === 'object' && raw.boardId === boardId && id !== undefined && id !== null && now - Date.parse(created) > SHARED_KEEP_MS)
    .map(({ id }) => id);
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
  return `${PLAN_END_MARK}, ${boardTitle(planEnd.boardId, config)}. После планирования: ${total}.${capacityText(planEnd.capacity, labels)}\n\n\`\`\`json\n${JSON.stringify(planEnd)}\n\`\`\``;
}

function planEndFromComments(comments, snapshot) {
  if (!snapshot) return null;
  for (const { raw, author } of commentsWithJson(comments, PLAN_END_MARK)) {
    const planEnd = normalizeSnapshot(raw);
    if (planEnd && planEnd.boardId === snapshot.boardId && raw.startedAt === snapshot.takenAt) return { boardId: planEnd.boardId, takenAt: planEnd.takenAt, startedAt: raw.startedAt, totals: planEnd.totals, author };
  }
  return null;
}

function capacityLogFromComments(comments) {
  const log = [];
  for (const [kind, mark] of [['start', SNAPSHOT_MARK], ['end', PLAN_END_MARK]]) {
    for (const { raw } of commentsWithJson(comments, mark)) {
      const record = normalizeSnapshot(raw);
      if (record && record.capacity) log.push({ kind, at: Date.parse(record.takenAt), boardId: record.boardId, days: record.capacity });
    }
  }
  return log;
}

function withSettingEdits(base, values, now = null, config = SPRINT_CAPACITY) {
  const next = normalizeSettings(base, now, config);
  for (const [path, raw] of Object.entries(values && typeof values === 'object' ? values : {})) {
    if (!SETTING_PATHS.includes(path)) continue;
    const keys = path.split('.');
    keys.slice(0, -1).reduce((node, key) => node[key], next)[keys[keys.length - 1]] = raw;
  }
  return normalizeSettings(next, now, config);
}

function resetForNewSprint(settings) {
  const next = normalizeSettings(settings);
  next.workDays = defaultSettings().workDays;
  next.holidays = 0;
  for (const direction of DIRECTIONS) next.team[direction].absence = 0;
  return next;
}

function settingsText(settings, labels) {
  const team = DIRECTIONS.filter((direction) => settings.team[direction].people > 0 || settings.team[direction].absence > 0)
    .map((direction) => `${labels[direction]} ${formatNumber(settings.team[direction].people)}${settings.team[direction].absence > 0 ? `, нет ${formatNumber(settings.team[direction].absence)}` : ''}`);
  return `Людей: ${team.length ? team.join(' · ') : 'не вписано'}. Рабочих дней ${formatNumber(settings.workDays)}, праздников ${formatNumber(settings.holidays)}, SP в день ${formatNumber(settings.coefficient)}.`;
}

function settingsComment(record, config = SPRINT_CAPACITY) {
  const { labels } = boardConfig(record.boardId, config);
  const settings = normalizeSettings(record.settings);
  const json = { boardId: record.boardId, savedAt: record.savedAt, settings };
  return `${SETTINGS_MARK}, ${boardTitle(record.boardId, config)}. ${settingsText(settings, labels)}${capacityText(capacityDays(settings), labels)}\n\n\`\`\`json\n${JSON.stringify(json)}\n\`\`\``;
}

function settingsFromComments(comments, boardId) {
  for (const { raw, author } of commentsWithJson(comments, SETTINGS_MARK)) {
    if (!raw || typeof raw !== 'object' || raw.boardId !== boardId || !Number.isFinite(Date.parse(raw.savedAt)) || !raw.settings || typeof raw.settings !== 'object') continue;
    return { boardId, savedAt: raw.savedAt, settings: normalizeSettings(raw.settings), author };
  }
  return null;
}

function dailyComment(record, config = SPRINT_CAPACITY) {
  const people = Array.isArray(record.people) && record.people.length ? record.people : null;
  const host = typeof record.host === 'string' ? record.host : '';
  const json = { boardId: record.boardId, savedAt: record.savedAt, people, host };
  return `${DAILY_MARK}, ${boardTitle(record.boardId, config)}. Ведущий: ${host || 'не выбран'}; список: ${people ? people.join(', ') : 'по умолчанию'}\n\n\`\`\`json\n${JSON.stringify(json)}\n\`\`\``;
}

function dailyFromComments(comments, boardId) {
  for (const { raw, author } of commentsWithJson(comments, DAILY_MARK)) {
    if (!raw || typeof raw !== 'object' || raw.boardId !== boardId || !Number.isFinite(Date.parse(raw.savedAt))) continue;
    const people = Array.isArray(raw.people) ? raw.people.filter((name) => typeof name === 'string' && name.trim()) : [];
    return { boardId, savedAt: raw.savedAt, people: people.length ? people : null, host: typeof raw.host === 'string' ? raw.host : '', author };
  }
  return null;
}

function planningFresh(snapshot, now) {
  return !snapshot || now - Date.parse(snapshot.takenAt) > PLAN_REPEAT_MS;
}

function planningReminder({ sprint = null, snapshot = null, planEnd = null, now }) {
  const day = 86400000;
  if (!planningFresh(snapshot, now) && !planEnd) return 'end';
  if (!sprint) return null;
  const end = sprint.closedAt === null || sprint.closedAt === undefined ? sprint.finish : Math.min(sprint.finish, sprint.closedAt);
  let boundary = null;
  if (now >= end - day && now < end + 7 * day) boundary = end;
  else if (now >= sprint.start - day && now < sprint.start + 3 * day) boundary = sprint.start;
  if (boundary === null) return null;
  return !snapshot || Date.parse(snapshot.takenAt) < boundary - 4 * day ? 'start' : null;
}

if (typeof module !== 'undefined') module.exports = { SPRINT_CAPACITY, DIRECTIONS, DIRECTION_LABELS, SETTINGS_MARK, DAILY_MARK, SETTING_PATHS, toNumber, round1, formatNumber, plural, readEstimate, platformOf, needsQa, isBug, splitEstimate, progressStage, progressWeight, burnDays, newScale, estimateIssues, defaultSettings, normalizeSettings, scaledSettings, personDaysOf, capacityOf, capacityDays, buildReport, boardConfig, isChaos, chaosNames, chaosLabel, formatRow, takeSnapshot, takePlanEnd, normalizeCapacity, normalizeSnapshot, boardTitle, snapshotComment, snapshotFromComments, planEndComment, planEndFromComments, capacityLogFromComments, withSettingEdits, resetForNewSprint, settingsComment, settingsFromComments, staleComments, planningFresh, planningReminder, dailyComment, dailyFromComments };
