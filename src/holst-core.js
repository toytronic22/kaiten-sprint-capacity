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
  bug: '🐞',
  percentScale: 1.5,
  percentLine: 19.1,
  percentFill: 0.75,
  percentNote: 0.3,
  percentDigit: 6.9,
  percentSign: 10.6,
  percentNoteGap: 6,
  percentFont: 'OpenSans',
  percentLayout: 2,
  weekdays: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
};

const HOLST_NULL_DOC = '00000000-0000-0000-0000-000000000000';

const HOLST_FIT = { base: [384, 192], pad: 32, bottom: 36, fill: 0.9, line: 1.25, wrap: 0.92, indent: 2, bold: 1.05, min: 4, max: 64, fine: 5, target: 8, steps: [1.25, 1.5, 2, 2.5, 3, 3.5, 4] };

const HOLST_BURN = { text: '💣', size: 43.2865, top: 12.59, bottom: 515.43, floor: 486, reach: 1000, days: 5, near: 1, row: 'Лимит встреч', label: { width: 60, rise: 25.7, color: 0xC62828, font: 'OpenSans', line: '140%' } };

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

function localDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function shortTime(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function holstWorkday(day, calendar) {
  const pad = (number) => String(number).padStart(2, '0');
  const key = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
  if ((calendar.workSaturdays || []).includes(key)) return true;
  return day.getDay() !== 0 && day.getDay() !== 6 && !(calendar.holidays || []).includes(key);
}

function holstLookback(now, calendar = {}) {
  const day = localDay(now);
  do day.setDate(day.getDate() - 1); while (!holstWorkday(day, calendar));
  return day.getTime();
}

function holstCards({ cards, doneAtStart = [], bugs = [], histories = {}, columns = {}, boards = {}, renames = {}, now, config, calendar = {} }) {
  const bugIds = new Set(bugs);
  const skip = new Set(doneAtStart);
  const since = holstLookback(now, calendar);
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
      if (movedAt !== null && movedAt >= since && history.length) {
        let column = columnAt(history, since - 1);
        for (const entry of history) {
          if (new Date(entry.changed).getTime() < since) continue;
          if (entry.column_id !== column) item.mark = card.state === config.doneState ? 'done' : 'work';
          column = entry.column_id;
        }
        const previous = history.filter((entry) => entry.column_id !== card.column_id).pop();
        if (item.mark && previous) item.from = previous.board_id && previous.board_id !== card.board_id && boards[previous.board_id] ? boards[previous.board_id] : title(previous.column_id);
      }
      return item;
    });
}

function holstHistoryIds(cards, since) {
  return cards.filter((card) => card.column_changed_at && new Date(card.column_changed_at).getTime() >= since).map((card) => card.id);
}

function holstPayload({ cards, report, doneAtStart = [], histories = {}, columns = {}, boards = {}, renames = {}, now, config, holst, kaiten, title, calendar = {} }) {
  return {
    v: 1,
    board: holst.board,
    group: holst.group,
    sticker: holst.sticker,
    chart: { labels: holst.labels || null },
    goal: holst.goal || null,
    checklist: holst.checklist || null,
    star: holst.star || null,
    flag: holst.flag || null,
    title,
    kaiten,
    generatedAt: now,
    since: holstLookback(now, calendar),
    percent: report.progress.percent,
    done: report.done.count,
    of: report.done.of,
    unknown: report.progress.unknown.map((item) => item.column),
    cards: holstCards({ cards, doneAtStart, bugs: report.bugs.cards.map((item) => item.id), histories, columns, boards, renames, now, config, calendar }),
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
  // Слова экранированы и склеены через \s+ — вложенных повторов нет, ReDoS невозможен.
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
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

function percentLabelItems({ percent }) {
  return [{ type: 'paragraph', runs: [{ text: `${percent}%`, marks: { bold: true } }] }];
}

function percentNoteItems({ now }) {
  const marks = { color: HOLST_STYLE.note };
  return [
    { type: 'paragraph', runs: [{ text: 'Прогресс спринта по колонкам Kaiten', marks }] },
    { type: 'paragraph', runs: [{ text: `Обновлено ${shortTime(now)} · кнопка «В Holst»`, marks }] },
  ];
}

function percentLabelPlace({ top, left, textScale, zIndex = 0, titleBottom = null, titleScale = null, percent = 100 }) {
  const { percentScale, percentLine, percentFill, percentNote, percentDigit, percentSign, percentNoteGap } = HOLST_STYLE;
  const noteAt = percentSign + percentDigit * String(percent).length + percentNoteGap;
  const round3 = (value) => Math.round(value * 1000) / 1000;
  const band = titleBottom === null ? 0 : top - titleBottom;
  const wanted = (titleScale || textScale) * percentScale;
  const scale = round3(band > 0 ? Math.min(wanted, (band * percentFill) / percentLine) : wanted);
  const height = percentLine * scale;
  const y = Math.round(band > 0 ? titleBottom + (band - height) / 2 : top - height * 1.1);
  const note = { x: Math.round(left + noteAt * scale), y: Math.round(y + (height * (1 - 2 * percentNote)) / 2), textScale: round3(scale * percentNote) };
  return { x: Math.round(left), y, textScale: scale, zIndex: zIndex + 0.5, note };
}

function holstForeignBoards(cards, histories) {
  const own = new Set(cards.map((card) => card.board_id));
  const ids = new Set();
  for (const history of Object.values(histories)) {
    for (const entry of history) if (entry.board_id && !own.has(entry.board_id)) ids.add(entry.board_id);
  }
  return [...ids];
}

function holstColumns(board) {
  const columns = {};
  for (const column of (board && board.columns) || []) {
    columns[column.id] = column.title;
    for (const sub of column.subcolumns || []) columns[sub.id] = sub.title;
  }
  return columns;
}

function holstReadMessages(dec, bytes, board) {
  const decoder = dec.createDecoder(bytes);
  const messages = [];
  while (dec.hasContent(decoder)) {
    let name = dec.readVarString(decoder);
    let v2 = false;
    if (name === 'encV2') {
      v2 = true;
      name = dec.readVarString(decoder);
    }
    if (name !== board && name !== HOLST_NULL_DOC) break;
    const type = dec.readVarUint(decoder);
    if (type === 3) {
      messages.push({ type: 'response', response: JSON.parse(dec.readVarString(decoder)) });
    } else if (type === 2) {
      dec.readVarUint(decoder);
      messages.push({ type: 'ack' });
    } else if (type === 0) {
      dec.readVarUint(decoder);
      const left = dec.readVarInt(decoder);
      dec.readVarUint(decoder);
      if (v2) dec.readVarUint8Array(decoder);
      const kind = dec.readVarUint(decoder);
      if (kind === 0) messages.push({ type: 'update', left, data: dec.readVarUint8Array(decoder) });
      else if (kind === 1) messages.push({ type: 'update', left, link: dec.readVarString(decoder) });
      else throw new Error(`Holst прислал непонятное обновление доски (${kind})`);
    } else {
      throw new Error(`Holst прислал непонятное сообщение (${type})`);
    }
  }
  return messages;
}

function holstSyncQueue({ apply, fetchLink, onResponse, onAck, onSynced, onError }) {
  let chain = Promise.resolve();
  let broken = false;
  return (messages) => {
    const jobs = messages.map((message) => {
      if (message.type !== 'update' || !message.link) return { message, data: Promise.resolve(message.data) };
      const data = Promise.resolve().then(() => fetchLink(message.link));
      data.catch(() => {});
      return { message, data };
    });
    chain = chain.then(async () => {
      for (const { message, data } of jobs) {
        if (broken) return;
        if (message.type === 'response') {
          onResponse(message.response);
        } else if (message.type === 'ack') {
          onAck();
        } else {
          const bytes = await data;
          if (bytes && bytes.length) apply(bytes);
          if (message.left === 0) onSynced();
        }
      }
    }).catch((error) => {
      broken = true;
      onError(error);
    });
    return chain;
  };
}

function holstChart({ objects, group, chart = {} }) {
  const byId = new Map(objects.map((item) => [item.id, item]));
  const isText = (item) => Boolean(item && item.type === 'simple-text' && item.position && item.lines);
  const isScale = (item) => isText(item) && item.lines.length > 1;
  const scale = isScale(byId.get(chart.labels)) ? byId.get(chart.labels) : objects.find((item) => Boolean(group) && item.parentId === group && isScale(item) && item.lines[0].trim() === '100') || null;
  if (!scale) return { problem: 'не нашёл на доске шкалу графика «100 … 0»' };
  const home = scale.parentId || group;
  const title = objects.filter((item) => item !== scale && isText(item) && !item.sprintcap && Boolean(home) && item.parentId === home && item.position.y < scale.position.y).sort((a, b) => b.position.y - a.position.y)[0] || null;
  const titleScale = title ? title.textScale || 1 : null;
  const titleBottom = title ? title.position.y + (title.height || title.lines.length * HOLST_STYLE.percentLine) * titleScale : null;
  return { top: scale.position.y, left: title ? title.position.x : scale.position.x, textScale: scale.textScale || 1, zIndex: scale.zIndex || 0, titleBottom, titleScale, problem: null };
}

const HOLST_REPORT = {
  width: 680,
  pad: 24,
  gap: 12,
  inner: 16,
  sectionGap: 28,
  pastGap: 40,
  groupGap: 20,
  columns: 2,
  line: 1.4,
  wrap: 0.92,
  panel: 0x12151C,
  card: 0x222834,
  color: { head: 0xFFFFFF, group: 0x8AB4FF, label: 0x9AA3B5, value: 0xFFFFFF, text: 0xC9CED8, strong: 0xFFFFFF, note: 0x8B93A3, warn: 0xFFC66D, link: 0xA8C7FA },
  size: { head: 20, headNote: 13, group: 14, groupNote: 12, label: 10, value: 24, caption: 12, text: 12, strong: 15, note: 11, legend: 11, updated: 10 },
};

function holstReportMarks(tone) {
  const { color, size } = HOLST_REPORT;
  if (tone === 'strong') return { bold: true, color: color.strong, fontSize: size.strong };
  if (tone === 'note') return { color: color.note, fontSize: size.note };
  if (tone === 'warn') return { color: color.warn, fontSize: size.text };
  return { color: color.text, fontSize: size.text };
}

function holstReportParagraph(runs) {
  return { type: 'paragraph', runs };
}

function holstBlockItems(block) {
  const { color, size } = HOLST_REPORT;
  const items = [holstReportParagraph([{ text: block.title.toUpperCase(), marks: { bold: true, color: color.label, fontSize: size.label } }])];
  if (block.value !== undefined) {
    const runs = [{ text: block.value, marks: { bold: true, color: color.value, fontSize: size.value } }];
    if (block.caption) runs.push({ text: `  ${block.caption}`, marks: { color: color.text, fontSize: size.caption } });
    items.push(holstReportParagraph(runs));
  }
  for (const line of block.lines || []) {
    if (line.link) items.push(holstReportParagraph([{ text: line.text, marks: { ...holstReportMarks(line.tone), color: color.link }, link: line.link }]));
    else items.push(holstReportParagraph([{ text: line.text, marks: holstReportMarks(line.tone) }]));
  }
  return items;
}

function holstSectionItems(section) {
  const { color, size } = HOLST_REPORT;
  const items = [holstReportParagraph([{ text: section.title, marks: { bold: true, color: color.head, fontSize: size.head } }])];
  if (section.note) items.push(holstReportParagraph([{ text: section.note, marks: { color: section.tone === 'warn' ? color.warn : color.note, fontSize: size.headNote } }]));
  if (section.link) items.push(holstReportParagraph([{ text: section.link.text, marks: { color: color.link, fontSize: size.headNote }, ...(section.link.url ? { link: section.link.url } : {}) }]));
  return items;
}

function holstGroupItems(group) {
  const { color, size } = HOLST_REPORT;
  const runs = [{ text: group.title, marks: { bold: true, color: color.group, fontSize: size.group } }];
  if (group.note) runs.push({ text: ` — ${group.note}`, marks: { color: color.note, fontSize: size.groupNote } });
  return [holstReportParagraph(runs)];
}

function holstLegendItems(legend) {
  const { color, size } = HOLST_REPORT;
  return legend ? [holstReportParagraph([{ text: legend, marks: { color: color.note, fontSize: size.legend } }])] : [];
}

function holstFooterItems(problem, now) {
  const { color, size } = HOLST_REPORT;
  const items = problem ? [holstReportParagraph([{ text: problem, marks: holstReportMarks('warn') }])] : [];
  items.push(holstReportParagraph([{ text: `Обновлено ${shortTime(now)}`, marks: { color: color.note, italic: true, fontSize: size.updated } }]));
  return items;
}

function holstItemsHeight(items, width) {
  let total = 0;
  for (const item of items) {
    const sizeOf = (run) => (run.marks && run.marks.fontSize) || 16;
    const size = Math.max(...item.runs.map(sizeOf));
    const length = item.runs.reduce((sum, run) => sum + runsEm([run]) * sizeOf(run), 0);
    total += Math.max(1, Math.ceil(length / (width * HOLST_REPORT.wrap))) * size * HOLST_REPORT.line;
  }
  return total;
}

function holstReportRows(blocks, columns = HOLST_REPORT.columns) {
  const rows = [];
  let row = [];
  for (const block of blocks) {
    if (block.wide) {
      if (row.length) rows.push(row);
      rows.push([block]);
      row = [];
      continue;
    }
    row.push(block);
    if (row.length === columns) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  return rows;
}

function holstReportLayout({ report, x, y, textScale, zIndex, now }) {
  const R = HOLST_REPORT;
  const content = R.width - 2 * R.pad;
  const parts = [];
  const at = (left, top) => ({ x: Math.round(x + left * textScale), y: Math.round(y + top * textScale) });
  const text = (part, left, top, width, items) => parts.push({ part, kind: 'text', ...at(left, top), width, textScale, zIndex: zIndex + 0.02, items });
  let top = R.pad;
  const legend = holstLegendItems(report.legend);
  if (legend.length) {
    text('legend', R.pad, top, content, legend);
    top += holstItemsHeight(legend, content) + R.gap;
  }
  for (const section of report.sections) {
    const head = holstSectionItems(section);
    text('head', R.pad, top, content, head);
    top += holstItemsHeight(head, content) + R.gap;
    section.groups.forEach((group, groupIndex) => {
      if (groupIndex) top += R.groupGap - R.gap;
      const title = holstGroupItems(group);
      text('group', R.pad, top, content, title);
      top += holstItemsHeight(title, content) + R.gap / 2;
      for (const row of holstReportRows(group.blocks)) {
        const width = (content - R.gap * (row.length - 1)) / row.length;
        const inner = width - 2 * R.inner;
        const items = row.map(holstBlockItems);
        const height = Math.max(...items.map((list) => holstItemsHeight(list, inner))) + 2 * R.inner;
        row.forEach((block, index) => {
          const left = R.pad + index * (width + R.gap);
          parts.push({ part: 'card', kind: 'shape', ...at(left, top), width: Math.round(width * textScale), height: Math.round(height * textScale), color: R.card, shape: 'roundedRectangle', zIndex: zIndex + 0.01 });
          text('block', left + R.inner, top + R.inner, inner, items[index]);
        });
        top += height + R.gap;
      }
    });
    top += R.sectionGap - R.gap;
  }
  const footer = holstFooterItems(report.problem, now);
  text('footer', R.pad, top, content, footer);
  top += holstItemsHeight(footer, content) + R.pad;
  parts.unshift({ part: 'panel', kind: 'shape', ...at(0, 0), width: Math.round(R.width * textScale), height: Math.round(top * textScale), color: R.panel, shape: 'rectangle', zIndex });
  return parts;
}

function holstReportParts(report) {
  return holstReportLayout({ report, x: 0, y: 0, textScale: 1, zIndex: 0, now: 0 });
}

function holstReportSignature(report) {
  const text = JSON.stringify(holstReportParts(report));
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function holstReportStale({ found, sig, parts }) {
  return !found || found.sig !== sig || !found.footer || found.children.length !== parts;
}

function holstReportLinked(report, urls) {
  if (!report) return null;
  const { past, ...rest } = report;
  return { ...rest, sections: report.sections.map((section) => (section.link ? { ...section, link: { ...section.link, url: urls[section.link.to] || null } } : section)) };
}

function holstObjectUrl(origin, board, id) {
  return `${origin}/share/b/${board}?objectId=${id}`;
}

function holstPastPlace(anchor, textScale, zIndex) {
  return { x: Math.round(anchor.x + (HOLST_REPORT.width + HOLST_REPORT.pastGap) * textScale), y: anchor.y, textScale, zIndex, problem: null };
}

function holstReportPlace({ objects, group, chart = {} }) {
  const base = holstChart({ objects, group, chart });
  if (base.problem) return { problem: base.problem };
  const homes = new Set([group, ...objects.filter((item) => item.id === chart.labels).map((item) => item.parentId)].filter(Boolean));
  const bottoms = objects.filter((item) => item.position && (item.id === chart.labels || homes.has(item.parentId))).map((item) => item.position.y + (item.type === 'simple-text' && item.lines ? item.lines.length * 1.5 * 16 * (item.textScale || 1) : item.height || 0));
  return { x: Math.round(base.left), y: Math.round(Math.max(...bottoms) + 24 * base.textScale), textScale: base.textScale, zIndex: base.zIndex + 0.5, problem: null };
}

function holstBurnRound(value) {
  return Math.round(value * 100) / 100;
}

function holstBurnIndex(key) {
  return Math.round(Date.parse(`${key}T00:00:00Z`) / 86400000);
}

function holstBurnSize(item) {
  const scale = item.textScale || 1;
  return { width: (item.width || 0) * scale, height: (item.height || 0) * scale };
}

function holstBurnColumns({ rows, base }) {
  const label = rows.labels
    .filter((item) => item.position && item.position.y > base.top && Math.hypot(item.position.x - base.left, item.position.y - base.top) <= HOLST_BURN.reach * base.textScale)
    .sort((a, b) => Math.hypot(a.position.x - base.left, a.position.y - base.top) - Math.hypot(b.position.x - base.left, b.position.y - base.top))[0];
  if (!label) return { problem: `не нашёл под графиком ряд «${HOLST_BURN.row}»` };
  const middle = label.position.y + holstBurnSize(label).height / 2;
  const cells = rows.stickers
    .filter((item) => item.position && item.position.x > label.position.x && item.position.y <= middle && item.position.y + holstBurnSize(item).height >= middle)
    .sort((a, b) => a.position.x - b.position.x);
  const run = cells.slice(0, 1);
  for (const cell of cells.slice(1)) {
    const first = run[0];
    const step = run.length > 1 ? run[1].position.x - first.position.x : cell.position.x - first.position.x;
    const same = Math.abs(holstBurnSize(cell).width - holstBurnSize(first).width) < 1 && Math.abs(holstBurnSize(cell).height - holstBurnSize(first).height) < 1 && Math.abs(cell.position.y - first.position.y) < 1;
    if (!same || cell.position.x - run[run.length - 1].position.x > 2 * step) break;
    run.push(cell);
  }
  if (!run.length || run.length % HOLST_BURN.days) return { problem: `в ряду «${HOLST_BURN.row}» под графиком ${run.length} клеток, а нужно по ${HOLST_BURN.days} на неделю` };
  const centres = run.map((cell) => cell.position.x + holstBurnSize(cell).width / 2);
  const weeks = [];
  for (let index = 0; index < centres.length; index += HOLST_BURN.days) weeks.push(centres.slice(index, index + HOLST_BURN.days));
  const half = (centres.length > 1 ? centres[1] - centres[0] : holstBurnSize(run[0]).width) / 2;
  return { problem: null, weeks, left: centres[0] - half, right: centres[centres.length - 1] + half, bottom: Math.min(...run.map((cell) => cell.position.y)) };
}

function holstBurnY({ percent, height, top, textScale }) {
  const value = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const centre = Math.min(HOLST_BURN.top + ((100 - value) * (HOLST_BURN.bottom - HOLST_BURN.top)) / 100, HOLST_BURN.floor - height / textScale / 2);
  return holstBurnRound(top + centre * textScale - height / 2);
}

function holstBurnTargets({ burn, weeks, top, textScale }) {
  const today = holstBurnIndex(burn.today);
  const monday = today - ((today + 3) % 7);
  const size = HOLST_BURN.size * textScale;
  const targets = [];
  const skipped = { saturday: [] };
  const items = [...burn.days, ...(burn.ahead || []).map((day) => ({ day, percent: null }))];
  for (const item of items) {
    const slot = holstBurnIndex(item.day) - monday;
    if (slot < 1 || slot > 6 || item.day === burn.start) continue;
    if (slot >= HOLST_BURN.days) {
      if (item.percent !== null) skipped.saturday.push(item.day);
      continue;
    }
    targets.push({ day: item.day, percent: item.percent, x: holstBurnRound(weeks[0][slot] - size / 2), y: holstBurnY({ percent: item.percent, height: size, top, textScale }), size: holstBurnRound(size) });
  }
  const slot = holstBurnIndex(burn.start) - monday;
  const first = burn.days.find((item) => item.day === burn.start);
  const week = burn.week && holstBurnIndex(burn.week.day) === monday ? { day: burn.week.day, percent: burn.week.percent, x: weeks[0][0], week: true } : null;
  const start = slot >= 0 && slot < HOLST_BURN.days ? { day: burn.start, percent: first ? first.percent : null, x: weeks[0][slot] } : week;
  return { targets, skipped, start };
}

function holstFlagPlan({ start, flag, top, textScale }) {
  if (!start) return { problem: null, away: true };
  if (!flag || !flag.position || !flag.width || !flag.height) return { problem: 'на доске нет флажка START — проверьте его номер в настройках калькулятора' };
  const x = holstBurnRound(start.x - flag.width / 2);
  const y = holstBurnY({ percent: start.percent, height: flag.height, top, textScale });
  const changed = Math.abs(x - flag.position.x) >= HOLST_BURN.near || Math.abs(y - flag.position.y) >= HOLST_BURN.near;
  return { problem: null, away: false, day: start.day, percent: start.percent, week: Boolean(start.week), x, y, size: flag.width, changed };
}

function holstBurnLabelItems(percent) {
  return [{ type: 'paragraph', runs: [{ text: `${percent}%`, marks: { bold: true } }] }];
}

function holstBurnLabels({ targets, texts, homes, textScale, zIndex }) {
  const near = (a, b) => Math.abs(a - b) < HOLST_BURN.near;
  const own = texts.filter((text) => text.sprintcap && text.sprintcap.bombLabel && homes.has(text.parentId));
  const free = new Set(own.map((text) => text.id));
  const keep = [];
  const create = [];
  for (const target of targets.filter((item) => item.percent !== null)) {
    const width = HOLST_BURN.label.width * textScale;
    const want = { day: target.day, percent: target.percent, x: holstBurnRound(target.x + target.size / 2 - width / 2), y: holstBurnRound(target.y - HOLST_BURN.label.rise * textScale), width: HOLST_BURN.label.width, textScale, zIndex: zIndex + 1 };
    const match = own.find((text) => free.has(text.id) && text.sprintcap.bombLabel === want.day && text.sprintcap.percent === want.percent && text.position && near(text.position.x, want.x) && near(text.position.y, want.y));
    if (match) {
      free.delete(match.id);
      keep.push(match.id);
    } else create.push(want);
  }
  return { keep, remove: [...free], create };
}

function holstBurnPlan({ objects, rows, stamps, texts = [], group, chart = {}, burn, flag }) {
  const base = holstChart({ objects, group, chart });
  if (base.problem) return { problem: base.problem };
  const homes = new Set([group, ...objects.filter((item) => item.id === chart.labels).map((item) => item.parentId)].filter(Boolean));
  const columns = holstBurnColumns({ rows, base });
  if (columns.problem) return { problem: columns.problem };
  const { targets, skipped, start } = holstBurnTargets({ burn, weeks: columns.weeks, top: base.top, textScale: base.textScale });
  const flagPlan = flag === undefined ? null : holstFlagPlan({ start, flag, top: base.top, textScale: base.textScale });
  const inside = (stamp) => {
    const x = stamp.position.x + (stamp.width || 0) / 2;
    const y = stamp.position.y + (stamp.height || 0) / 2;
    return x >= columns.left && x <= columns.right && y >= base.top && y <= columns.bottom;
  };
  const isOwn = (stamp) => Boolean(stamp.sprintcap && stamp.sprintcap.bomb);
  const own = stamps.filter((stamp) => isOwn(stamp) && homes.has(stamp.parentId));
  const manual = stamps.filter((stamp) => !isOwn(stamp) && stamp.text === HOLST_BURN.text && stamp.position && inside(stamp));
  const free = new Set(own.map((stamp) => stamp.id));
  const keep = [];
  const missing = [];
  for (const target of targets) {
    const match = own.find((stamp) => free.has(stamp.id) && stamp.position && stamp.sprintcap.bomb === target.day && stamp.sprintcap.percent === target.percent && Math.abs(stamp.position.x - target.x) < HOLST_BURN.near && Math.abs(stamp.position.y - target.y) < HOLST_BURN.near);
    if (match) {
      free.delete(match.id);
      keep.push(match.id);
    } else missing.push(target);
  }
  const zIndex = Math.max(base.zIndex + 1, ...own.concat(manual).map((stamp) => stamp.zIndex || 0));
  const flagged = flagPlan && !flagPlan.problem && !flagPlan.away ? [flagPlan] : [];
  const labels = holstBurnLabels({ targets: targets.concat(flagged), texts, homes, textScale: base.textScale, zIndex });
  return { problem: null, parent: [...homes][0], dated: targets.filter((target) => target.percent !== null).length, keep, manual: manual.length, remove: [...manual.map((stamp) => stamp.id), ...free], create: missing.map((target) => ({ ...target, zIndex })), labels, skipped, flag: flagPlan };
}

function holstBurnDay(day) {
  return `${day.slice(8, 10)}.${day.slice(5, 7)}`;
}

function holstBurnLine(plan) {
  if (plan.problem) return `Бомбы не поставил: ${plan.problem}`;
  const ahead = plan.keep.length + plan.create.length - plan.dated;
  const removed = plan.remove.length - plan.manual;
  const parts = [`Бомбы: ${plan.dated} за прошедшие дни недели${ahead ? `, ${ahead} внизу — эти дни ещё впереди` : ''}`];
  if (plan.create.length) parts.push(`поставил ${plan.create.length}`);
  if (removed) parts.push(`убрал прежние: ${removed}`);
  if (!plan.create.length && !removed) parts.push('все на месте');
  if (plan.labels.create.length) parts.push(`подписал процент над бомбами: ${plan.labels.create.length}`);
  if (plan.flag && plan.flag.problem) parts.push(`флажок START не передвинул: ${plan.flag.problem}`);
  else if (plan.flag && plan.flag.away) parts.push('флажок START не трогал: спринт начнётся после этой недели');
  else if (plan.flag && plan.flag.week) parts.push(`флажок START — на понедельнике ${holstBurnDay(plan.flag.day)} (спринт в Kaiten начался раньше), ${plan.flag.percent === null ? 'внизу, процента на утро нет' : `${plan.flag.percent}% на утро`}, ${plan.flag.changed ? 'передвинул' : 'на месте'}`);
  else if (plan.flag) parts.push(`флажок START — ${plan.flag.percent === null ? 'внизу, процента за день старта нет' : `${plan.flag.percent}%`}, ${plan.flag.changed ? 'передвинул' : 'на месте'}`);
  if (plan.manual) parts.push(`убрал поставленных руками: ${plan.manual}`);
  if (plan.skipped.saturday.length) parts.push(`рабочей субботе ${plan.skipped.saturday.map(holstBurnDay).join(', ')} нет места на графике`);
  return parts.join(', ');
}

const HOLST_STAR = { least: 77, full: 190, near: 1 };

function holstStarPlan({ star, percent, textScale }) {
  if (!star || !star.position || !star.width || !star.height) return { problem: 'на доске нет звезды у заголовка графика — проверьте её номер в настройках калькулятора' };
  const value = Math.max(0, Math.min(100, percent));
  const width = holstBurnRound((HOLST_STAR.least + ((HOLST_STAR.full - HOLST_STAR.least) * value) / 100) * textScale);
  const height = holstBurnRound((width * star.height) / star.width);
  const x = holstBurnRound(star.position.x + star.width / 2 - width / 2);
  const y = holstBurnRound(star.position.y + star.height / 2 - height / 2);
  const changed = Math.abs(width - star.width) >= HOLST_STAR.near;
  return { problem: null, changed, percent: value, before: holstBurnRound(star.width), width, height, x, y };
}

function holstStarLine(plan) {
  if (plan.problem) return `Звезду не изменил: ${plan.problem}`;
  return plan.changed ? `Звезда: ${Math.round(plan.width)} при ${plan.percent}% (было ${Math.round(plan.before)})` : `Звезда: размер под ${plan.percent}% уже стоит`;
}

function charEm(char) {
  if (char === '️' || char === '‍') return 0;
  if (/\p{Ll}/u.test(char)) return 0.58;
  if (/\p{Lu}/u.test(char)) return 0.7;
  if (/\p{N}/u.test(char)) return 0.62;
  if (/\s/u.test(char)) return 0.28;
  if (/\p{Extended_Pictographic}/u.test(char)) return 1.3;
  if (/[\p{P}\p{S}]/u.test(char)) return 0.35;
  return 0.6;
}

function runsEm(runs) {
  let total = 0;
  for (const run of runs || []) {
    let width = 0;
    for (const char of run.text || '') width += charEm(char);
    total += run.marks && run.marks.bold ? width * HOLST_FIT.bold : width;
  }
  return total;
}

function stickerFont({ items, width, height }) {
  const rows = items.map((item) => ({ em: runsEm(item.runs), indent: item.type === 'ol-list-item' ? HOLST_FIT.indent : 0 }));
  const room = (height - HOLST_FIT.pad - HOLST_FIT.bottom) * HOLST_FIT.fill;
  for (let font = HOLST_FIT.max; font >= HOLST_FIT.min; font -= 1) {
    let lines = 0;
    for (const row of rows) {
      const line = Math.max((width - HOLST_FIT.pad - row.indent * font) * HOLST_FIT.wrap, font);
      lines += Math.max(1, Math.ceil((row.em * font) / line));
    }
    if (lines * HOLST_FIT.line * font <= room) return font;
  }
  return null;
}

function stickerScale({ width, height, stored }) {
  if (stored && HOLST_FIT.steps.concat(1).includes(stored.k)) return stored.k;
  return HOLST_FIT.steps.find((step) => Math.abs(width - HOLST_FIT.base[0] * step) <= 1 && Math.abs(height - HOLST_FIT.base[1] * step) <= 1) || 1;
}

function stickerFit({ items, width, height, textScale = 1, k = 1 }) {
  const base = { width: width / k, height: height / k };
  const font = stickerFont({ items, ...base });
  const steps = HOLST_FIT.steps;
  const want = font !== null && font >= HOLST_FIT.fine ? 1 : steps.find((step) => (stickerFont({ items, width: base.width * step, height: base.height * step }) || 0) >= HOLST_FIT.target) || steps[steps.length - 1];
  if (want === k) return null;
  return { k: want, grow: want < k, width: Math.round(base.width * want), height: Math.round(base.height * want), textScale: (textScale * k) / want };
}

const HOLST_FINISH = { color: 16774064, gap: 0.2, mark: '⚠️ ' };

function finishHintItems(hint) {
  return [{ type: 'paragraph', runs: [{ text: `${HOLST_FINISH.mark}${hint.head}`, marks: { bold: true } }] }, { type: 'paragraph', runs: [{ text: hint.tail }] }];
}

function finishHintPlace({ position, width, height, textScale = 1, zIndex = 0 }) {
  return { x: position.x, y: Math.round(position.y - height * textScale * (1 + HOLST_FINISH.gap)), width, height, textScale, zIndex: zIndex + 1 };
}

function finishHintLine(plan) {
  if (plan.problem) return `Подсказку у «Завершаешь спринт?» не поставил: ${plan.problem}`;
  if (plan.hint) return `Подсказка у «Завершаешь спринт?»: ${plan.hint.text}`;
  return plan.remove.length ? 'Убрал подсказку у «Завершаешь спринт?» — спринт в Kaiten завершён или ещё идёт' : null;
}

const HOLST_GOAL = { lines: 3, indent: 3, min: 12, item: 'ul-list-item', charWidth: { SourceCodePro: 8.4 }, otherWidth: 6.6 };

function goalLines(goal) {
  const rows = String(goal || '').split('\n').map((line) => line.replace(/^\s*(?:[-–—•*]|\d+[.)])\s+/, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const items = rows.length === 1 ? rows[0].split(/\.\s+(?=[A-ZА-ЯЁ0-9«"])/u) : rows;
  return items.map((line) => line.replace(/[\s.;]+$/, '').trim()).filter(Boolean);
}

function goalChars({ title, scale, font }) {
  const width = (name) => HOLST_GOAL.charWidth[name] || HOLST_GOAL.otherWidth;
  return Math.max(HOLST_GOAL.min, Math.floor((title.text.length * width(title.font) * title.scale) / (width(font) * scale)) - HOLST_GOAL.indent);
}

function goalCut(line, chars) {
  if (line.length <= chars) return line;
  const head = line.slice(0, chars - 1);
  const space = head.lastIndexOf(' ');
  return `${(space > chars / 2 ? head.slice(0, space) : head).replace(/[\s,.;:–—-]+$/, '')}…`;
}

function holstGoalPlan({ goal, items, title = null, scale = 1, font = null }) {
  const lines = goalLines(goal);
  if (!lines.length) return { empty: true };
  const keep = items.length && items[0].type !== HOLST_GOAL.item ? 1 : 0;
  const head = keep ? { text: runsText(items[0].runs), scale, font } : title;
  const chars = head && head.text ? goalChars({ title: head, scale, font }) : null;
  const sample = items.find((item) => item.type === HOLST_GOAL.item) || items[0];
  const marks = sample && sample.runs.length && sample.runs[0].marks ? { ...sample.runs[0].marks } : {};
  const shown = lines.slice(0, HOLST_GOAL.lines).map((line) => (chars ? goalCut(line, chars) : line));
  const add = shown.map((text) => ({ type: HOLST_GOAL.item, runs: [{ text, marks }] }));
  const old = items.slice(keep);
  const changed = old.length !== add.length || add.some((item, index) => old[index].type !== item.type || runsText(old[index].runs) !== item.runs[0].text);
  return { keep, add, changed, chars, cut: { of: lines.length > HOLST_GOAL.lines ? lines.length : 0, long: shown.filter((text, index) => text !== lines[index]).length } };
}

function holstGoalLine(plan) {
  if (plan.problem) return `Цель спринта не написал: ${plan.problem}`;
  if (plan.empty) return 'Цель спринта: в Kaiten пустая — картинку «Астрологи» не трогал';
  const parts = [plan.changed ? 'Цель спринта: написал на картинку «Астрологи» из Kaiten' : 'Цель спринта на картинке как в Kaiten'];
  if (plan.cut.of) parts.push(`пунктов в Kaiten ${plan.cut.of} — на картинке первые ${HOLST_GOAL.lines}, остальные смотрите в Kaiten`);
  if (plan.cut.long) parts.push(`длинных строк обрезал: ${plan.cut.long}`);
  return parts.join(', ');
}


if (typeof module !== 'undefined') module.exports = { HOLST_BLOCKS, HOLST_STYLE, normalizeTitle, blockOfColumn, blockInfo, blockOrder, shortTime, columnAt, holstLookback, holstCards, holstHistoryIds, holstPayload, unknownColumnsText, holstForeignBoards, holstColumns, holstOldTitles, readStickerLines, planSticker, kaitenCardId, stripMarker, updatedLine, stickerSignature, HOLST_NULL_DOC, HOLST_FIT, holstReadMessages, holstSyncQueue, holstChart, percentLabelItems, percentNoteItems, percentLabelPlace, HOLST_REPORT, holstBlockItems, holstItemsHeight, holstReportRows, holstGroupItems, holstLegendItems, holstReportLayout, holstReportParts, holstReportSignature, holstReportStale, holstFooterItems, holstReportPlace, holstReportLinked, holstObjectUrl, holstPastPlace, HOLST_BURN, holstBurnPlan, holstFlagPlan, holstBurnLabelItems, holstBurnDay, holstBurnLine, HOLST_STAR, holstStarPlan, holstStarLine, HOLST_GOAL, goalLines, goalChars, goalCut, holstGoalPlan, holstGoalLine, HOLST_FINISH, finishHintItems, finishHintPlace, finishHintLine, runsEm, stickerFont, stickerScale, stickerFit, runsText };
