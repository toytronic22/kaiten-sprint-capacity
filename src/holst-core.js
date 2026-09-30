const HOLST_BLOCKS = [
  { key: 'todo', emoji: '📋', title: 'To Do', columns: ['to do'] },
  { key: 'doing', emoji: '🔨', title: 'Doing', columns: ['doing'] },
  { key: 'review', emoji: '👀', title: 'Review', columns: ['review'] },
  { key: 'test', emoji: '🧪', title: 'Design Review / Test', columns: ['design review', 'test'] },
  { key: 'release', emoji: '🚀', title: 'Waiting for release', columns: ['waiting for release'] },
  { key: 'done', emoji: '✅', title: 'Done', columns: ['done'] },
];

const HOLST_STYLE = {
  link: 1671390,
  work: 0xFFE8A3,
  done: 0xBFEBC4,
  note: 0x8A8A8A,
  noteSize: 10,
  bomb: '💣',
  bug: '🐞',
  weekdays: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
};

const HOLST_HASH = 'sprintcap';

const HOLST_UPDATED = /^\s*Обновлено\s+\d{2}\.\d{2}/;

function normalizeTitle(text) {
  return String(text || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

function blockOfColumn(title) {
  const name = normalizeTitle(title);
  const known = HOLST_BLOCKS.find((block) => block.columns.includes(name));
  if (known) return known.key;
  return name ? `column:${String(title).trim()}` : 'column:?';
}

function blockInfo(key) {
  const known = HOLST_BLOCKS.find((block) => block.key === key);
  if (known) return known;
  return { key, emoji: '📌', title: key.replace(/^column:/, '') };
}

function blockOrder(keys) {
  const standard = HOLST_BLOCKS.map((block) => block.key).filter((key) => keys.includes(key));
  const extra = keys.filter((key) => !standard.includes(key));
  return [...standard, ...extra];
}

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

const HOLST_PAYLOAD_TTL = 60 * 60 * 1000;

function encodeHolstPayload(payload) {
  return toBase64Url(JSON.stringify(payload));
}

function decodeHolstPayload(hash) {
  const match = String(hash || '').match(new RegExp(`${HOLST_HASH}=([A-Za-z0-9_-]+)`));
  if (!match) return null;
  return JSON.parse(fromBase64Url(match[1]));
}

function localDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sprintFirstDay(start) {
  return localDay(new Date(start).getTime() + 12 * 3600000);
}

function workingDayIndex(start, now) {
  const first = sprintFirstDay(start);
  const today = localDay(now);
  if (today < first) return -1;
  let index = 0;
  for (let day = new Date(first); day < today; day.setDate(day.getDate() + 1)) {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    if (next.getDay() !== 0 && next.getDay() !== 6) index += 1;
  }
  return index;
}

function sprintBombCount(start, finish) {
  if (!start || !finish) return null;
  const length = Math.round((new Date(finish) - new Date(start)) / 86400000);
  const day = sprintFirstDay(start);
  let count = 0;
  for (let index = 1; index < length; index += 1) {
    day.setDate(day.getDate() + 1);
    if (day.getDay() !== 0 && day.getDay() !== 6) count += 1;
  }
  return count;
}

function shortTime(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function bombTop({ percent, labels, axisY, size }) {
  const rows = labels.lines;
  const row = ((100 - Math.min(Math.max(percent, 0), 100)) / 100) * (rows - 1);
  const center = labels.top + ((row + 0.5) * labels.height) / rows;
  const lowest = axisY - 21;
  return Math.round(Math.min(center, lowest) - size / 2);
}

function columnAt(history, time) {
  let column = null;
  for (const entry of history) {
    if (new Date(entry.changed).getTime() <= time) column = entry.column_id;
  }
  return column;
}

function holstOldTitles(activity, title) {
  const current = normalizeTitle(title);
  const seen = new Set([current]);
  const result = [];
  for (const entry of activity || []) {
    if (!entry || entry.changed_field !== 'title' || !entry.old_title) continue;
    const name = normalizeTitle(entry.old_title);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(String(entry.old_title).trim());
  }
  return result;
}

function holstLookback(sprintStart, now) {
  const dayStart = localDay(now).getTime();
  return sprintStart ? Math.min(sprintFirstDay(sprintStart).getTime(), dayStart) : dayStart;
}

function holstMarkWindow({ stored, sprintStart, now }) {
  const dayStart = localDay(now).getTime();
  let since = dayStart;
  if (stored && typeof stored.t === 'number') {
    if (stored.t < dayStart) since = stored.t;
    else if (typeof stored.since === 'number') since = Math.min(stored.since, dayStart);
  }
  return Math.max(since, holstLookback(sprintStart, now));
}

function holstMarkAt(item, since) {
  if (!item.moves) return item.mark || null;
  let column = null;
  for (const [time, id] of item.moves) if (time < since) column = id;
  return column === item.column ? null : item.kind;
}

function holstMarkSince(cards, since, now) {
  const dayStart = localDay(now).getTime();
  return cards.map((card) => (card.moves ? { ...card, mark: holstMarkAt(card, dayStart) || holstMarkAt(card, since) } : card));
}

function holstCards({ cards, doneAtStart = [], bugs = [], histories = {}, columns = {}, boards = {}, renames = {}, since = null, now, config }) {
  const bugIds = new Set(bugs);
  const skip = new Set(doneAtStart);
  const dayStart = localDay(now).getTime();
  const lookback = since === null ? dayStart : Math.min(since, dayStart);
  const title = (id) => columns[id] || `колонка ${id}`;
  return cards
    .filter((card) => !(card.state === config.doneState && skip.has(card.id)))
    .map((card) => {
      const movedAt = card.column_changed_at ? new Date(card.column_changed_at).getTime() : null;
      const item = {
        id: card.id,
        title: card.title || '',
        block: blockOfColumn(card.column && card.column.title ? card.column.title : title(card.column_id)),
        movedAt,
        mark: null,
        from: null,
      };
      if (bugIds.has(card.id)) item.bug = true;
      const old = holstOldTitles(renames[card.id], card.title);
      if (old.length) item.old = old;
      const history = [...(histories[card.id] || [])].sort((a, b) => new Date(a.changed) - new Date(b.changed));
      if (movedAt !== null && movedAt >= lookback && history.length) {
        const start = columnAt(history, lookback - 1);
        item.moves = start === null ? [] : [[lookback - 1, start]];
        for (const entry of history) {
          const time = new Date(entry.changed).getTime();
          if (time >= lookback) item.moves.push([time, entry.column_id]);
        }
        item.column = card.column_id;
        item.kind = card.state === config.doneState ? 'done' : 'work';
        const previous = history.filter((entry) => entry.column_id !== card.column_id).pop();
        if (previous) item.from = previous.board_id && previous.board_id !== card.board_id && boards[previous.board_id] ? boards[previous.board_id] : title(previous.column_id);
        item.mark = holstMarkAt(item, dayStart);
      }
      return item;
    });
}

function holstHistoryIds(cards, since) {
  return cards.filter((card) => card.column_changed_at && new Date(card.column_changed_at).getTime() >= since).map((card) => card.id);
}

function holstPayload({ cards, report, doneAtStart = [], histories = {}, columns = {}, boards = {}, renames = {}, since = null, sprintStart, sprintFinish, now, config, holst, kaiten, title }) {
  return {
    v: 1,
    board: holst.board,
    group: holst.group,
    sticker: holst.sticker,
    title,
    kaiten,
    sprintStart,
    sprintFinish,
    generatedAt: now,
    percent: report.progress.percent,
    done: report.done.count,
    of: report.done.of,
    unknown: report.progress.unknown.map((item) => item.column),
    cards: holstCards({ cards, doneAtStart, bugs: report.bugs.cards.map((item) => item.id), histories, columns, boards, renames, since, now, config }),
  };
}

function unknownColumnsText(columns) {
  const counts = new Map();
  for (const column of columns || []) counts.set(column || '?', (counts.get(column || '?') || 0) + 1);
  if (!counts.size) return null;
  const list = [...counts].map(([column, count]) => `«${column}» (карт: ${count})`).join(', ');
  return `не знаю ${counts.size > 1 ? 'колонки' : 'колонку'} ${list} — считаю как To Do, 0%`;
}

function runsText(runs) {
  return runs.map((run) => run.text).join('');
}

function isNoteRun(run) {
  return !run.link && ((run.marks && run.marks.color === HOLST_STYLE.note) || /^\s*←/.test(run.text));
}

function kaitenCardId(url) {
  const match = String(url || '').match(/kaiten\.ru\/(?:[^?#]*\/)?(\d{4,})(?:[/?#]|$)/);
  return match ? Number(match[1]) : null;
}

function trimRuns(runs, side) {
  const copy = runs.map((run) => ({ ...run }));
  if (side === 'end') {
    while (copy.length && !copy[copy.length - 1].text.trim()) copy.pop();
    if (copy.length) copy[copy.length - 1].text = copy[copy.length - 1].text.replace(/\s+$/, '');
  } else {
    while (copy.length && !copy[0].text.trim()) copy.shift();
    if (copy.length) copy[0].text = copy[0].text.replace(/^\s+/, ' ');
  }
  return copy.filter((run) => run.text);
}

function titlePattern(title) {
  const words = normalizeTitle(title).split(' ').filter(Boolean);
  const escape = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/е/g, '[её]');
  return new RegExp(words.map(escape).join('\\s+'), 'i');
}

function splitByTitle(runs, cardTitle) {
  const text = runsText(runs);
  const match = text.match(titlePattern(cardTitle));
  if (!match) return null;
  const prefix = text.slice(0, match.index);
  const suffix = text.slice(match.index + match[0].length).trim();
  return { prefix: prefix.trim() ? [{ text: prefix }] : [], suffix: suffix ? [{ text: ` ${suffix}` }] : [] };
}

function headerBlock(text, knownKeys) {
  const match = text.match(/^\s*\S+\s+(.+?)\s+·\s+\d+\s*$/);
  if (!match) return null;
  const name = normalizeTitle(match[1]);
  const known = HOLST_BLOCKS.find((block) => normalizeTitle(block.title) === name);
  if (known) return known.key;
  const extra = knownKeys.find((key) => normalizeTitle(blockInfo(key).title) === name);
  return extra || `column:${match[1].trim()}`;
}

function isUpdatedLine(item) {
  return item.type !== 'ol-list-item' && HOLST_UPDATED.test(runsText(item.runs));
}

function stripMarker(runs) {
  const copy = runs.map((run) => ({ ...run }));
  while (copy.length && !copy[0].link) {
    const cleaned = copy[0].text.replace(/^\s*(?:(?:[🐞🐛🪲]\uFE0F?|(?:\+\s*\/\s*-|\+)(?![\p{L}\p{N}]))\s*)+/u, '');
    if (cleaned === copy[0].text) break;
    copy[0].text = cleaned;
    if (cleaned) break;
    copy.shift();
    while (copy.length && !copy[0].link && !copy[0].text.trim()) copy.shift();
  }
  return copy.filter((run) => run.text);
}

function readStickerLines(items, cards) {
  const byTitle = cards
    .flatMap((card) => [card.title, ...(card.old || [])].filter(Boolean).map((title) => ({ card, title })))
    .sort((a, b) => normalizeTitle(b.title).length - normalizeTitle(a.title).length);
  const knownKeys = [...new Set(cards.map((card) => card.block))];
  const result = { preamble: [], lines: [] };
  let block = null;
  let started = false;
  for (const item of items) {
    const text = runsText(item.runs);
    if (isUpdatedLine(item)) continue;
    if (item.type !== 'ol-list-item') {
      const header = headerBlock(text, knownKeys);
      if (header) {
        block = header;
        started = true;
        continue;
      }
      if (!started) {
        result.preamble.push(item);
        continue;
      }
      if (!text.trim()) continue;
      result.lines.push({ block, cardId: null, item });
      continue;
    }
    const linkAt = item.runs.findIndex((run) => kaitenCardId(run.link));
    if (linkAt >= 0) {
      const tail = item.runs.slice(linkAt + 1);
      const noteAt = tail.findIndex(isNoteRun);
      const link = item.runs[linkAt].link;
      result.lines.push({
        block,
        cardId: kaitenCardId(link),
        matched: item.runs.filter((run) => run.link === link).map((run) => run.text).join(''),
        prefix: trimRuns(item.runs.slice(0, linkAt), 'end'),
        suffix: trimRuns(noteAt >= 0 ? tail.slice(0, noteAt) : tail, 'start'),
        item,
      });
      continue;
    }
    const hit = byTitle.find((candidate) => titlePattern(candidate.title).test(text));
    const parts = hit && splitByTitle(item.runs, hit.title);
    if (parts) {
      result.lines.push({ block, cardId: hit.card.id, matched: hit.title, prefix: trimRuns(parts.prefix, 'end'), suffix: parts.suffix, item });
      continue;
    }
    result.lines.push({ block, cardId: null, item });
  }
  return result;
}

function cardRuns(card, line, url) {
  const marks = { color: HOLST_STYLE.link };
  if (card.mark) marks.backgroundColor = HOLST_STYLE[card.mark];
  const runs = [];
  const prefix = line && line.prefix ? stripMarker(line.prefix) : [];
  if (card.bug) runs.push({ text: `${HOLST_STYLE.bug} ` });
  if (prefix.length) {
    runs.push(...prefix);
    runs.push({ text: ' ' });
  }
  runs.push({ text: card.title, marks, link: url });
  if (line && line.suffix && line.suffix.length) runs.push(...line.suffix);
  if (card.mark && card.from) {
    runs.push({ text: '  ' });
    runs.push({ text: `← из ${card.from}, ${shortTime(card.movedAt)}`, marks: { color: HOLST_STYLE.note, italic: true, fontSize: HOLST_STYLE.noteSize } });
  }
  return runs;
}

function planSticker({ items, cards, lastRun = null, cardUrl }) {
  const parsed = readStickerLines(items, cards);
  const byId = new Map(cards.map((card) => [card.id, card]));
  const seen = new Set();
  const blocks = new Map();
  const loose = [];
  const put = (key, entry) => {
    if (!blocks.has(key)) blocks.set(key, []);
    blocks.get(key).push(entry);
  };
  const stats = { cards: 0, kept: 0, marked: 0, manual: 0, gone: 0, renamed: 0 };
  const renamed = new Set();
  for (const line of parsed.lines) {
    if (line.cardId !== null && byId.has(line.cardId) && normalizeTitle(line.matched) !== normalizeTitle(byId.get(line.cardId).title)) renamed.add(line.cardId);
  }
  stats.renamed = renamed.size;
  for (const line of parsed.lines) {
    if (line.cardId !== null && !byId.has(line.cardId)) {
      if (!line.block) {
        loose.push({ item: line.item });
        continue;
      }
      if (seen.has(line.cardId)) continue;
      seen.add(line.cardId);
      stats.gone += 1;
      continue;
    }
    if (line.cardId === null) {
      stats.manual += 1;
      if (line.block) put(line.block, { item: line.item });
      else loose.push({ item: line.item });
      continue;
    }
    if (seen.has(line.cardId)) continue;
    const card = byId.get(line.cardId);
    const stays = line.block && lastRun !== null && card.movedAt !== null && card.movedAt <= lastRun;
    if (!stays) continue;
    seen.add(card.id);
    stats.kept += 1;
    put(line.block, { card, runs: cardRuns(card, line, cardUrl(card.id)) });
  }
  const lineOf = new Map();
  for (const line of parsed.lines) {
    if (line.cardId !== null && byId.has(line.cardId) && !lineOf.has(line.cardId)) lineOf.set(line.cardId, line);
  }
  for (const card of cards) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    put(card.block, { card, runs: cardRuns(card, lineOf.get(card.id), cardUrl(card.id)) });
  }
  const out = [...parsed.preamble];
  for (const entry of loose) out.push(entry.item);
  for (const key of blockOrder([...blocks.keys()])) {
    const entries = blocks.get(key);
    const info = blockInfo(key);
    const count = entries.filter((entry) => entry.card).length;
    out.push({ type: 'paragraph', runs: [{ text: `${info.emoji} ${info.title} · ${count}`, marks: { bold: true } }] });
    for (const entry of entries) {
      if (entry.card) {
        stats.cards += 1;
        if (entry.card.mark) stats.marked += 1;
        out.push({ type: 'ol-list-item', runs: entry.runs });
      } else {
        out.push(entry.item);
      }
    }
  }
  return { items: out, stats };
}

function updatedLine(now) {
  return { type: 'paragraph', runs: [{ text: `Обновлено ${shortTime(now)}`, marks: { color: HOLST_STYLE.note, italic: true, fontSize: HOLST_STYLE.noteSize } }] };
}

function canonicalMarks(marks) {
  return JSON.stringify(Object.keys(marks || {}).sort().filter((key) => marks[key] !== undefined && marks[key] !== null && marks[key] !== false).map((key) => [key, marks[key]]));
}

function stickerSignature(items) {
  return JSON.stringify(items.filter((item) => !isUpdatedLine(item)).map((item) => {
    const runs = [];
    for (const run of item.runs) {
      if (!run.text) continue;
      const link = run.link || null;
      const marks = canonicalMarks(run.marks);
      const last = runs[runs.length - 1];
      if (last && last[1] === link && last[2] === marks) last[0] += run.text;
      else runs.push([run.text, link, marks]);
    }
    return [item.type, runs];
  }));
}

function bombPercent({ top, labels, axisY, size }) {
  const lowest = axisY - 21;
  const center = top + size / 2;
  if (center >= lowest - 1) return 0;
  const row = ((center - labels.top) * labels.lines) / labels.height - 0.5;
  return Math.round(Math.min(Math.max(100 - (row / (labels.lines - 1)) * 100, 0), 100));
}

function isWeekend(now) {
  const day = new Date(now).getDay();
  return day === 0 || day === 6;
}

function bombStoredTrusted(stored, top, storedTop) {
  return Boolean(stored && typeof stored.percent === 'number' && Math.abs(top - storedTop) <= 2);
}

function sameDay(a, b) {
  return localDay(a).getTime() === localDay(b).getTime();
}

function signed(number) {
  return number > 0 ? `+${number}` : String(number);
}

function bombLabelItems({ previous, percent, now }) {
  return [
    { type: 'paragraph', runs: [{ text: `${previous}% → ${percent}% (${signed(percent - previous)})`, marks: { bold: true } }] },
    { type: 'paragraph', runs: [{ text: shortTime(now), marks: { color: HOLST_STYLE.note } }] },
  ];
}

function holstForeignBoards(cards, histories) {
  const own = new Set(cards.map((card) => card.board_id));
  const ids = new Set();
  for (const history of Object.values(histories)) {
    for (const entry of history) if (entry.board_id && !own.has(entry.board_id)) ids.add(entry.board_id);
  }
  return [...ids];
}

function holstPayloadStale(payload, now) {
  if (!payload.generatedAt) return 'в данных нет времени';
  if (localDay(payload.generatedAt).getTime() !== localDay(now).getTime()) return 'данные не сегодняшние';
  if (now - payload.generatedAt > HOLST_PAYLOAD_TTL) return 'данным больше часа';
  return null;
}

function holstColumns(board) {
  const columns = {};
  for (const column of (board && board.columns) || []) {
    columns[column.id] = column.title;
    for (const sub of column.subcolumns || []) columns[sub.id] = sub.title;
  }
  return columns;
}

function holstSprintId(cards) {
  const counts = new Map();
  for (const card of cards) if (card.sprint_id) counts.set(card.sprint_id, (counts.get(card.sprint_id) || 0) + 1);
  let best = null;
  for (const [id, count] of counts) if (best === null || count > counts.get(best)) best = id;
  return best;
}

if (typeof module !== 'undefined') module.exports = { HOLST_BLOCKS, HOLST_STYLE, HOLST_HASH, normalizeTitle, blockOfColumn, blockInfo, blockOrder, encodeHolstPayload, decodeHolstPayload, workingDayIndex, sprintBombCount, shortTime, bombTop, columnAt, holstLookback, holstMarkWindow, holstMarkAt, holstMarkSince, holstCards, holstHistoryIds, holstPayload, unknownColumnsText, holstForeignBoards, holstColumns, holstSprintId, holstPayloadStale, holstOldTitles, readStickerLines, planSticker, kaitenCardId, stripMarker, updatedLine, stickerSignature, bombPercent, isWeekend, signed, bombLabelItems, bombStoredTrusted, sameDay };
