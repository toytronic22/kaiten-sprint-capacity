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

function holstReadOnlyError() {
  const error = holstAuthError('Holst пустил на доску только читать — попросите права на редактирование');
  error.readOnly = true;
  return error;
}

async function holstFetchUpdate(link) {
  let response = null;
  try {
    response = await fetch(new URL(link, HOLST_ORIGIN).href);
  } catch (error) {
    response = null;
  }
  if (!response || !response.ok) throw new Error('Holst не отдал доску целиком — проверьте интернет и нажмите ещё раз');
  return new Uint8Array(await response.arrayBuffer());
}

async function holstConnect(board, token) {
  if (!token) throw holstAuthError('нет входа в Holst');
  const [Y, enc, dec] = await Promise.all([import(HOLST_LIBS.yjs), import(HOLST_LIBS.encoding), import(HOLST_LIBS.decoding)]);
  const doc = new Y.Doc();
  const ws = new WebSocket('wss://app.holst.so/hud/ws');
  ws.binaryType = 'arraybuffer';
  let failure = null;
  let ready = false;
  let readOnly = false;
  let pending = null;
  let settle = null;
  let timer = null;
  const synced = new Promise((resolve, reject) => {
    settle = { resolve, reject };
  });
  const fail = (error) => {
    if (failure) return;
    failure = error;
    clearTimeout(timer);
    settle.reject(error);
    if (pending) pending.reject(error);
  };
  timer = setTimeout(() => fail(new Error('Holst не прислал доску за 20 секунд')), 20000);
  const push = holstSyncQueue({
    apply: (data) => Y.applyUpdateV2(doc, data, 'server'),
    fetchLink: holstFetchUpdate,
    onResponse: (response) => {
      if (response.error) fail(ready ? new Error(`Holst: ${response.error}`) : holstAuthError(`Holst не пустил на доску: ${response.error}`));
      else if (response.status === 'ok' && response.readOnly !== undefined) readOnly = response.readOnly === true;
    },
    onAck: () => {
      if (pending) pending.resolve();
    },
    onSynced: () => {
      if (ready || failure) return;
      ready = true;
      clearTimeout(timer);
      settle.resolve();
    },
    onError: fail,
  });
  ws.onopen = () => {
    const e = enc.createEncoder();
    enc.writeVarString(e, board);
    enc.writeVarUint(e, 1);
    enc.writeVarString(e, JSON.stringify({ token }));
    enc.writeVarUint(e, 0);
    ws.send(enc.toUint8Array(e));
  };
  ws.onerror = () => fail(new Error('Соединение с Holst оборвалось'));
  ws.onclose = (event) => fail(ready ? new Error(`Holst закрыл соединение (${event.code})`) : holstAuthError(`Holst закрыл соединение, не отдав доску (${event.code})`));
  ws.onmessage = (event) => {
    if (failure) return;
    try {
      push(holstReadMessages(dec, new Uint8Array(event.data), board));
    } catch (error) {
      fail(error);
    }
  };
  try {
    await synced;
  } catch (error) {
    ws.close();
    throw error;
  }
  const send = (update) => new Promise((resolve, reject) => {
    if (failure) {
      reject(failure);
      return;
    }
    let wait = null;
    const done = (error) => {
      clearTimeout(wait);
      pending = null;
      if (error) reject(error);
      else resolve();
    };
    wait = setTimeout(() => done(new Error('Holst не подтвердил запись за 15 секунд')), 15000);
    pending = { resolve: () => done(null), reject: done };
    const e = enc.createEncoder();
    enc.writeVarString(e, board);
    enc.writeVarUint(e, 0);
    enc.writeVarUint(e, Math.floor(Math.random() * 2 ** 50));
    enc.writeVarUint(e, 0);
    enc.writeVarUint8Array(e, update);
    ws.send(enc.toUint8Array(e));
  });
  return { Y, doc, ws, send, readOnly };
}

async function holstCheck(board, token) {
  const connection = await holstConnect(board, token);
  connection.ws.close();
  if (connection.readOnly) throw holstReadOnlyError();
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

function holstChartObjects({ Y, objects, documents, payload }) {
  const chart = payload.chart || {};
  const wanted = new Set([chart.labels, chart.axis, ...(chart.bombs || [])].filter(Boolean));
  const list = [];
  objects.forEach((object, id) => {
    if (!(object instanceof Y.Map)) return;
    const type = object.get('type');
    const parentId = object.get('parentId') || null;
    if (type !== 'stamp' && !wanted.has(id) && (!payload.group || parentId !== payload.group)) return;
    const item = { id, type, parentId, position: object.get('position') || null, width: object.get('width') || null, height: object.get('height') || null, zIndex: object.get('zIndex') || 0 };
    if (type === 'stamp') item.text = (object.get('data') || {}).text || null;
    if (type === 'arrow') {
      item.start = (object.get('start') || {}).point || null;
      item.end = (object.get('end') || {}).point || null;
      item.mine = Boolean(object.get('sprintcap'));
    }
    if (type === 'simple-text') {
      item.lines = holstLines(Y, documents, object).map((line) => runsText(line.runs));
      item.textScale = object.get('textScale') || 1;
      item.lineHeight = object.get('lineHeight') || '150%';
    }
    list.push(item);
  });
  return list;
}

function holstCenter(object) {
  const position = object.get('position') || { x: 0, y: 0 };
  const width = object.get('width') || object.get('height') || 169;
  const height = object.get('height') || width;
  return { x: Math.round(position.x + width / 2), y: Math.round(position.y + height / 2) };
}

function holstBombLine(Y, objects, object) {
  const stored = object.get('sprintcap') || {};
  const line = stored.line ? objects.get(stored.line) : null;
  if (!(line instanceof Y.Map)) return null;
  return { id: stored.line, from: (line.get('start') || {}).objectId || null, to: (line.get('end') || {}).objectId || null };
}

function holstCreateLine({ Y, objects, from, to, author, now }) {
  const id = crypto.randomUUID();
  const object = new Y.Map();
  objects.set(id, object);
  const fields = {
    id,
    type: 'arrow',
    position: { x: 0, y: 0 },
    arrowType: 'straight',
    arrowheadStart: 'none',
    arrowheadEnd: 'none',
    strokeWidth: HOLST_STYLE.lineWidth,
    strokeColor: { color: HOLST_STYLE.line, opacity: 1 },
    start: { point: holstCenter(from), objectId: from.get('id') },
    end: { point: holstCenter(to), objectId: to.get('id') },
    zIndex: Math.min(from.get('zIndex') || 0, to.get('zIndex') || 0) - 0.5,
    created: { a: author, t: now },
    updated: { a: author, t: now },
    sprintcap: { line: true },
  };
  if (from.get('parentId')) fields.parentId = from.get('parentId');
  for (const [key, value] of Object.entries(fields)) object.set(key, value);
  return id;
}

function holstSetStored(object, changes) {
  const stored = { ...(object.get('sprintcap') || {}), ...changes };
  for (const key of Object.keys(stored)) if (stored[key] === undefined) delete stored[key];
  object.set('sprintcap', stored);
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
    if (connection.readOnly) throw holstReadOnlyError();
    const objects = doc.getMap('objects');
    const documents = doc.getMap('documents');
    const sticker = objects.get(payload.sticker);
    if (!sticker || !documents.get(sticker.get('documentId'))) throw new Error('На доске нет розового стикера — проверьте его номер в настройках калькулятора');
    const chart = holstChart({ objects: holstChartObjects({ Y, objects, documents, payload }), group: payload.group, chart: payload.chart });
    const now = Date.now();
    const weekend = isWeekend(now);
    const day = workingDayIndex(payload.sprintStart, now);
    const expectedBombs = sprintBombCount(payload.sprintStart, payload.sprintFinish);
    const bombsMatch = !chart.problem && (expectedBombs === null || chart.bombs.length === expectedBombs);
    const bombObjects = chart.bombs.map((item) => objects.get(item.id));
    const target = !weekend && bombsMatch && day >= 1 && payload.percent !== null ? chart.bombs[day - 1] || null : null;
    const bomb = target ? { id: target.id, object: objects.get(target.id) } : null;
    const listRun = sticker.get('sprintcap') || {};
    const lastRun = listRun.t || null;
    const since = payload.since;
    const cards = payload.cards;
    const root = documents.get(sticker.get('documentId'));
    const before = holstDocItems(Y, root);
    const plan = planSticker({ items: before, cards, lastRun, cardUrl: (id) => `${payload.kaiten}/${id}` });
    const listChanged = stickerSignature(plan.items) !== stickerSignature(before);
    const finalItems = [...plan.items, updatedLine(now)];
    const fit = stickerFit({ items: finalItems, width: sticker.get('width') || 384, height: sticker.get('height') || 192, textScale: sticker.get('textScale') || 1 });
    const topOf = (percent, size) => bombTop({ percent, labels: chart.labels, axisY: chart.axisY, size });
    const percentOf = (object) => {
      const stored = object.get('sprintcap');
      const size = object.get('height') || 169;
      const top = object.get('position').y;
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
      const previous = day >= 2 && bombObjects[day - 2] ? percentOf(bombObjects[day - 2]) : 0;
      bombPlan = { size, x: position.x, y, previous, delta: payload.percent - previous, label: labelAlive ? label : null, changed: y !== position.y || !labelAlive || stored.percent !== payload.percent };
    }
    const upTo = bombsMatch ? day - 1 - (bombPlan || weekend ? 0 : 1) : null;
    const lines = upTo === null ? { create: [], remove: [] } : bombLinePlan({ bombs: chart.bombs.map((item, index) => ({ id: item.id, line: holstBombLine(Y, objects, bombObjects[index]) })), upTo });
    const linesChanged = lines.create.length > 0 || lines.remove.length > 0;
    const weekday = HOLST_STYLE.weekdays[new Date(now).getDay()];
    const marked = cards.filter((item) => item.mark);
    const movedSince = lastRun === null ? null : marked.filter((item) => item.movedAt > lastRun).length;
    const markedText = `Подсвечено карт: ${marked.length} — подвинулись с ${HOLST_STYLE.weekdays[new Date(since).getDay()]} ${shortTime(since).slice(0, 5)}${movedSince === null ? '' : `, из них с прошлого обновления: ${movedSince}`}`;
    const unknown = unknownColumnsText(payload.unknown);
    const chartLines = [...(chart.problem ? [`Бомбу не двигал: ${chart.problem}`] : []), ...chart.notes];
    if (!listChanged && !(bombPlan && bombPlan.changed) && !linesChanged && !fit) {
      const why = !bombPlan ? 'список как в Kaiten'
        : `бомба ${weekday} уже на ${payload.percent}%, список как в Kaiten`;
      return { ok: false, text: [`${payload.title}: обновлять нечего — ${why}`, ...chartLines, ...(unknown ? [`Прогресс: ${unknown}`] : [])].join('\n') };
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
        holstSetStored(bomb.object, { percent: payload.percent, t: now, label: labelId });
        bomb.object.set('updated', { a: (bomb.object.get('updated') || bomb.object.get('created')).a, t: now });
      }
      for (const item of lines.remove) {
        objects.delete(item.id);
        holstSetStored(bombObjects[item.index], { line: undefined });
      }
      for (const item of lines.create) {
        const id = holstCreateLine({ Y, objects, from: bombObjects[item.index - 1], to: bombObjects[item.index], author, now });
        holstSetStored(bombObjects[item.index], { line: id });
      }
      if (bombPlan && bombPlan.changed) {
        bombObjects.forEach((object, index) => {
          const line = index >= 1 ? holstBombLine(Y, objects, object) : null;
          if (!line || (line.from !== bomb.id && line.to !== bomb.id)) return;
          const arrow = objects.get(line.id);
          arrow.set('start', { ...arrow.get('start'), point: holstCenter(bombObjects[index - 1]) });
          arrow.set('end', { ...arrow.get('end'), point: holstCenter(object) });
        });
      }
      const nodes = finalItems.map((item) => holstItemNode(Y, item));
      root.delete(0, root.length);
      root.applyDelta(nodes.map((node) => ({ insert: node })), { sanitize: false });
      sticker.set('horizontalAlign', 'left');
      if (fit) {
        sticker.set('width', fit.width);
        sticker.set('height', fit.height);
        sticker.set('textScale', fit.textScale);
      }
      sticker.set('sprintcap', { t: payload.generatedAt });
      sticker.set('updated', { a: author, t: now });
    }, 'local');
    doc.off('updateV2', listen);
    for (const update of updates) await send(update);
    const result = [`${payload.title}: готово`];
    if (chart.problem) result.push(`Бомбу не двигал: ${chart.problem}`);
    else if (bombPlan && bombPlan.changed) result.push(`Спринт: ${bombPlan.previous}% → ${payload.percent}% (${signed(bombPlan.delta)} за день), бомба ${weekday}, в Done ${payload.done} из ${payload.of}`);
    else if (bombPlan) result.push(`Спринт: ${payload.percent}%, бомба ${weekday} уже на месте`);
    else if (weekend) result.push('Бомбу не двигал: выходной');
    else if (payload.percent === null) result.push('Бомбу не двигал: в спринте нет карт');
    else if (day < 1) result.push('Бомбу не двигал: сегодня первый день спринта');
    else if (!bombsMatch) result.push(`Бомбу не двигал: на графике ${chart.bombs.length} бомб, а должно быть ${expectedBombs} — по одной на каждый рабочий день спринта, кроме первого. Проверьте, не удалена ли бомба или не добавлена ли лишняя`);
    else result.push(`Бомбу не двигал: на графике ${chart.bombs.length} бомб, а сегодня ${day}-й рабочий день`);
    result.push(...chart.notes);
    if (lines.create.length === 1 && lines.create[0].index === day - 1) result.push('Провёл линию от вчерашней бомбы');
    else if (lines.create.length) result.push(`Провёл линий между бомбами: ${lines.create.length}`);
    if (lines.remove.length) result.push(`Убрал старых линий между бомбами: ${lines.remove.length}`);
    result.push(markedText);
    result.push(`Список: ${plan.stats.cards} карт, оставил на месте ${plan.stats.kept}`);
    if (fit) result.push('Список не влезал в стикер — сделал шрифт мельче, стикер тот же');
    if (unknown) result.push(`Прогресс: ${unknown}`);
    if (plan.stats.renamed) result.push(`Обновил названия: ${plan.stats.renamed}`);
    if (plan.stats.gone) result.push(`Убрал карт не из спринта: ${plan.stats.gone}`);
    if (plan.stats.manual) result.push(`Строк без карты не тронул: ${plan.stats.manual}`);
    return { ok: !chart.problem, text: result.join('\n') };
  } finally {
    connection.ws.close();
  }
}
