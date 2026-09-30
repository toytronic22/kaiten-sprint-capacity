const HOLST_LIBS = {
  yjs: 'https://cdn.jsdelivr.net/npm/yjs@13.6/+esm',
  encoding: 'https://cdn.jsdelivr.net/npm/lib0@0.2/encoding/+esm',
  decoding: 'https://cdn.jsdelivr.net/npm/lib0@0.2/decoding/+esm',
};

function holstAuthError(text) {
  const error = new Error(text);
  error.auth = true;
  return error;
}

async function holstConnect(board, token) {
  if (!token) throw holstAuthError('нет входа в Holst');
  const [Y, enc, dec] = await Promise.all([import(HOLST_LIBS.yjs), import(HOLST_LIBS.encoding), import(HOLST_LIBS.decoding)]);
  const doc = new Y.Doc();
  const ws = new WebSocket('wss://app.holst.so/hud/ws');
  ws.binaryType = 'arraybuffer';
  let onAck = null;
  let failure = null;
  let ready = false;
  const synced = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Holst не прислал доску за 20 секунд')), 20000);
    const fail = (error) => {
      failure = error;
      clearTimeout(timer);
      reject(error);
    };
    ws.onopen = () => {
      const e = enc.createEncoder();
      enc.writeVarString(e, board);
      enc.writeVarUint(e, 1);
      enc.writeVarString(e, JSON.stringify({ token }));
      enc.writeVarUint(e, 0);
      ws.send(enc.toUint8Array(e));
    };
    ws.onerror = () => fail(new Error('Соединение с Holst оборвалось'));
    ws.onclose = (event) => {
      if (failure) return;
      if (ready) failure = new Error(`Holst закрыл соединение (${event.code})`);
      else fail(holstAuthError(`Holst закрыл соединение, не отдав доску (${event.code})`));
    };
    ws.onmessage = async (event) => {
      try {
        const d = dec.createDecoder(new Uint8Array(event.data));
        while (dec.hasContent(d)) {
          let name = dec.readVarString(d);
          let v2 = false;
          if (name === 'encV2') {
            v2 = true;
            name = dec.readVarString(d);
          }
          const type = dec.readVarUint(d);
          if (type === 3) {
            const response = JSON.parse(dec.readVarString(d));
            if (response.error) fail(ready ? new Error(`Holst: ${response.error}`) : holstAuthError(`Holst не пустил на доску: ${response.error}`));
          } else if (type === 2) {
            dec.readVarUint(d);
            if (onAck) onAck();
          } else if (type === 0) {
            dec.readVarUint(d);
            const left = dec.readVarInt(d);
            dec.readVarUint(d);
            if (v2) dec.readVarUint8Array(d);
            const kind = dec.readVarUint(d);
            let data;
            if (kind === 0) data = dec.readVarUint8Array(d);
            else data = new Uint8Array(await (await fetch(dec.readVarString(d))).arrayBuffer());
            if (data.length) Y.applyUpdateV2(doc, data, 'server');
            if (left === 0) {
              ready = true;
              clearTimeout(timer);
              resolve();
            }
          } else {
            return;
          }
        }
      } catch (error) {
        fail(error);
      }
    };
  });
  await synced;
  const send = (update) => new Promise((resolve, reject) => {
    if (failure) {
      reject(failure);
      return;
    }
    const timer = setTimeout(() => reject(new Error('Holst не подтвердил запись за 15 секунд')), 15000);
    onAck = () => {
      clearTimeout(timer);
      onAck = null;
      resolve();
    };
    const e = enc.createEncoder();
    enc.writeVarString(e, board);
    enc.writeVarUint(e, 0);
    enc.writeVarUint(e, Math.floor(Math.random() * 2 ** 50));
    enc.writeVarUint(e, 0);
    enc.writeVarUint8Array(e, update);
    ws.send(enc.toUint8Array(e));
  });
  return { Y, doc, ws, send };
}

async function holstCheck(board, token) {
  const connection = await holstConnect(board, token);
  connection.ws.close();
}

function holstDocItems(Y, root) {
  const items = [];
  for (const op of root.toDelta()) {
    if (!(op.insert instanceof Y.XmlText)) continue;
    const inner = op.insert.toDelta().find((child) => child.insert instanceof Y.XmlText);
    const node = inner ? inner.insert : null;
    const runs = [];
    const collect = (x, link) => {
      for (const child of x.toDelta()) {
        if (typeof child.insert === 'string') runs.push({ text: child.insert, marks: child.attributes || undefined, link: link || undefined });
        else if (child.insert instanceof Y.XmlText) collect(child.insert, child.insert.getAttribute('type') === 'link' ? child.insert.getAttribute('link') : link);
      }
    };
    if (node) collect(node, null);
    items.push({ type: node ? node.getAttribute('type') : 'paragraph', runs, source: op.insert });
  }
  return items;
}

function holstCloneX(Y, x) {
  const copy = new Y.XmlText();
  for (const [key, value] of Object.entries(x.getAttributes())) copy.setAttribute(key, key === 'key' ? crypto.randomUUID() : value);
  const delta = x.toDelta().map((op) => (op.insert instanceof Y.XmlText ? { insert: holstCloneX(Y, op.insert), attributes: op.attributes } : op));
  if (delta.length) copy.applyDelta(delta, { sanitize: false });
  return copy;
}

function holstElement(Y, attributes, children) {
  const x = new Y.XmlText();
  for (const [key, value] of Object.entries({ ...attributes, key: crypto.randomUUID() })) x.setAttribute(key, value);
  const delta = children.filter((child) => child instanceof Y.XmlText || child.text).map((child) => (child instanceof Y.XmlText ? { insert: child } : { insert: child.text, attributes: child.marks || {} }));
  if (delta.length) x.applyDelta(delta, { sanitize: false });
  return x;
}

function holstItemNode(Y, item) {
  if (item.source) return holstCloneX(Y, item.source);
  const children = [];
  for (const run of item.runs) {
    const last = children[children.length - 1];
    if (run.link && last && last.link === run.link) last.runs.push(run);
    else if (run.link) children.push({ link: run.link, runs: [run] });
    else children.push(run);
  }
  const nodes = children.map((child) => (child.link ? holstElement(Y, { type: 'link', link: child.link }, child.runs) : child));
  return holstElement(Y, { type: 'wrapper' }, [holstElement(Y, { type: item.type }, nodes)]);
}

function holstLines(Y, documents, object) {
  const root = documents.get(object.get('documentId'));
  if (!root) return [];
  return holstDocItems(Y, root);
}

function holstFindChart({ Y, objects, documents, group }) {
  if (!objects.get(group)) throw new Error('На доске нет группы графика — проверьте её номер в настройках калькулятора');
  const children = [];
  objects.forEach((object, id) => {
    if (object instanceof Y.Map && object.get('parentId') === group) children.push({ id, object });
  });
  const labels = children.find(({ object }) => {
    if (object.get('type') !== 'simple-text') return false;
    const lines = holstLines(Y, documents, object);
    return lines.length > 1 && lines[0].runs.map((run) => run.text).join('').trim() === '100';
  });
  if (!labels) throw new Error('В группе графика не нашлась шкала «100 … 0»');
  const lineCount = holstLines(Y, documents, labels.object).length;
  const scale = labels.object.get('textScale') || 1;
  const lineHeight = parseFloat(labels.object.get('lineHeight') || '150') / 100;
  const labelBox = { top: labels.object.get('position').y, height: lineCount * 14 * scale * lineHeight, lines: lineCount };
  const axis = children
    .map(({ object }) => object)
    .filter((object) => object.get('type') === 'arrow')
    .map((object) => ({ start: (object.get('start') || {}).point, end: (object.get('end') || {}).point }))
    .find(({ start, end }) => start && end && Math.abs(start.y - end.y) < 1);
  if (!axis) throw new Error('В группе графика не нашлась горизонтальная ось');
  const axisY = axis.start.y;
  const left = Math.min(axis.start.x, axis.end.x);
  const right = Math.max(axis.start.x, axis.end.x);
  const bombs = [];
  objects.forEach((object, id) => {
    if (!(object instanceof Y.Map) || object.get('type') !== 'stamp') return;
    const data = object.get('data') || {};
    const position = object.get('position') || {};
    if (data.text !== HOLST_STYLE.bomb) return;
    if (position.x < left - 100 || position.x > right + 100) return;
    if (position.y < labelBox.top - 400 || position.y > axisY + 100) return;
    bombs.push({ id, object, x: position.x });
  });
  bombs.sort((a, b) => a.x - b.x);
  return { labels: labelBox, axisY, bombs };
}

function holstCreateText({ Y, objects, documents, x, y, scale, zIndex, author, now, items }) {
  const id = crypto.randomUUID();
  const documentId = crypto.randomUUID();
  const root = new Y.XmlText();
  documents.set(documentId, root);
  root.applyDelta(items.map((item) => ({ insert: holstItemNode(Y, item) })), { sanitize: false });
  const object = new Y.Map();
  objects.set(id, object);
  const fields = { id, type: 'simple-text', documentId, position: { x, y }, textScale: scale, lineHeight: '150%', fontFamily: 'Inter', zIndex, created: { a: author, t: now }, updated: { a: author, t: now } };
  for (const [key, value] of Object.entries(fields)) object.set(key, value);
  return id;
}

function holstReplaceText({ Y, object, documents, items, x, y, author, now }) {
  const root = documents.get(object.get('documentId'));
  root.delete(0, root.length);
  root.applyDelta(items.map((item) => ({ insert: holstItemNode(Y, item) })), { sanitize: false });
  object.set('position', { x, y });
  object.set('updated', { a: author, t: now });
}

async function holstApply(payload, token) {
  const connection = await holstConnect(payload.board, token);
  const { Y, doc, send } = connection;
  try {
    const objects = doc.getMap('objects');
    const documents = doc.getMap('documents');
    const chart = holstFindChart({ Y, objects, documents, group: payload.group });
    const sticker = objects.get(payload.sticker);
    if (!sticker || !documents.get(sticker.get('documentId'))) throw new Error('На доске нет розового стикера — проверьте его номер в настройках калькулятора');
    const now = Date.now();
    const weekend = isWeekend(now);
    const day = workingDayIndex(payload.sprintStart, now);
    const expectedBombs = sprintBombCount(payload.sprintStart, payload.sprintFinish);
    const bombsMatch = expectedBombs === null || chart.bombs.length === expectedBombs;
    const bomb = !weekend && bombsMatch && day >= 1 && payload.percent !== null ? chart.bombs[day - 1] || null : null;
    const listRun = sticker.get('sprintcap') || {};
    const lastRun = listRun.t || null;
    const since = payload.since;
    const cards = payload.cards;
    const root = documents.get(sticker.get('documentId'));
    const before = holstDocItems(Y, root);
    const plan = planSticker({ items: before, cards, lastRun, cardUrl: (id) => `${payload.kaiten}/${id}` });
    const listChanged = stickerSignature(plan.items) !== stickerSignature(before);
    const topOf = (percent, size) => bombTop({ percent, labels: chart.labels, axisY: chart.axisY, size });
    const percentOf = (target) => {
      const stored = target.object.get('sprintcap');
      const size = target.object.get('height') || 169;
      const top = target.object.get('position').y;
      if (stored && bombStoredTrusted(stored, top, topOf(stored.percent, size))) return stored.percent;
      return bombPercent({ top, labels: chart.labels, axisY: chart.axisY, size });
    };
    let bombPlan = null;
    if (bomb) {
      const size = bomb.object.get('height') || 169;
      const position = bomb.object.get('position');
      const y = topOf(payload.percent, size);
      const stored = bomb.object.get('sprintcap') || {};
      const label = stored.label ? objects.get(stored.label) : null;
      const labelAlive = Boolean(label && documents.get(label.get('documentId')));
      const previous = day >= 2 && chart.bombs[day - 2] ? percentOf(chart.bombs[day - 2]) : 0;
      bombPlan = { size, x: position.x, y, previous, delta: payload.percent - previous, label: labelAlive ? label : null, changed: y !== position.y || !labelAlive || stored.percent !== payload.percent };
    }
    const weekday = HOLST_STYLE.weekdays[new Date(now).getDay()];
    const marked = cards.filter((item) => item.mark);
    const movedSince = lastRun === null ? null : marked.filter((item) => item.movedAt > lastRun).length;
    const markedText = `Подсвечено карт: ${marked.length} — подвинулись с ${HOLST_STYLE.weekdays[new Date(since).getDay()]} ${shortTime(since).slice(0, 5)}${movedSince === null ? '' : `, из них с прошлого обновления: ${movedSince}`}`;
    const unknown = unknownColumnsText(payload.unknown);
    if (!listChanged && !(bombPlan && bombPlan.changed)) {
      const why = !bombPlan ? 'список как в Kaiten'
        : `бомба ${weekday} уже на ${payload.percent}%, список как в Kaiten`;
      return { ok: false, text: `${payload.title}: обновлять нечего — ${why}${unknown ? `\nПрогресс: ${unknown}` : ''}` };
    }
    const author = (sticker.get('updated') || sticker.get('created')).a;
    const updates = [];
    const listen = (update, origin) => {
      if (origin !== 'server') updates.push(update);
    };
    doc.on('updateV2', listen);
    doc.transact(() => {
      if (bombPlan && bombPlan.changed) {
        bomb.object.set('position', { x: bombPlan.x, y: bombPlan.y });
        const items = bombLabelItems({ previous: bombPlan.previous, percent: payload.percent, now });
        const scale = 2;
        const labelX = bombPlan.x + bombPlan.size + 12;
        const labelY = Math.round(bombPlan.y + bombPlan.size / 2 - 2 * 14 * scale * 1.5 / 2);
        let labelId;
        if (bombPlan.label) {
          holstReplaceText({ Y, object: bombPlan.label, documents, items, x: labelX, y: labelY, author, now });
          labelId = bombPlan.label.get('id');
        } else {
          labelId = holstCreateText({ Y, objects, documents, x: labelX, y: labelY, scale, zIndex: (bomb.object.get('zIndex') || 0) + 0.5, author, now, items });
        }
        bomb.object.set('sprintcap', { percent: payload.percent, t: now, label: labelId });
        bomb.object.set('updated', { a: (bomb.object.get('updated') || bomb.object.get('created')).a, t: now });
      }
      const nodes = [...plan.items, updatedLine(now)].map((item) => holstItemNode(Y, item));
      root.delete(0, root.length);
      root.applyDelta(nodes.map((node) => ({ insert: node })), { sanitize: false });
      sticker.set('horizontalAlign', 'left');
      sticker.set('sprintcap', { t: payload.generatedAt });
      sticker.set('updated', { a: author, t: now });
    }, 'local');
    doc.off('updateV2', listen);
    for (const update of updates) await send(update);
    const lines = [`${payload.title}: готово`];
    if (bombPlan && bombPlan.changed) lines.push(`Спринт: ${bombPlan.previous}% → ${payload.percent}% (${signed(bombPlan.delta)} за день), бомба ${weekday}, в Done ${payload.done} из ${payload.of}`);
    else if (bombPlan) lines.push(`Спринт: ${payload.percent}%, бомба ${weekday} уже на месте`);
    else if (weekend) lines.push('Бомбу не двигал: выходной');
    else if (payload.percent === null) lines.push('Бомбу не двигал: в спринте нет карт');
    else if (day < 1) lines.push('Бомбу не двигал: сегодня первый день спринта');
    else if (!bombsMatch) lines.push(`Бомбу не двигал: на графике ${chart.bombs.length} бомб, а должно быть ${expectedBombs} — по одной на каждый рабочий день спринта, кроме первого. Проверьте, не удалена ли бомба или не добавлена ли лишняя`);
    else lines.push(`Бомбу не двигал: на графике ${chart.bombs.length} бомб, а сегодня ${day}-й рабочий день`);
    lines.push(markedText);
    lines.push(`Список: ${plan.stats.cards} карт, оставил на месте ${plan.stats.kept}`);
    if (unknown) lines.push(`Прогресс: ${unknown}`);
    if (plan.stats.renamed) lines.push(`Обновил названия: ${plan.stats.renamed}`);
    if (plan.stats.gone) lines.push(`Убрал карт не из спринта: ${plan.stats.gone}`);
    if (plan.stats.manual) lines.push(`Строк без карты не тронул: ${plan.stats.manual}`);
    return { ok: true, text: lines.join('\n') };
  } finally {
    connection.ws.close();
  }
}
