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
  const wanted = new Set([chart.labels].filter(Boolean));
  const list = [];
  objects.forEach((object, id) => {
    if (!(object instanceof Y.Map)) return;
    const type = object.get('type');
    const parentId = object.get('parentId') || null;
    if (!wanted.has(id) && (!payload.group || parentId !== payload.group)) return;
    const item = { id, type, parentId, position: object.get('position') || null, width: object.get('width') || null, height: object.get('height') || null, zIndex: object.get('zIndex') || 0 };
    if (type === 'simple-text') {
      item.lines = holstLines(Y, documents, object).map((line) => runsText(line.runs));
      item.textScale = object.get('textScale') || 1;
      item.lineHeight = object.get('lineHeight') || '150%';
    }
    list.push(item);
  });
  return list;
}

function holstLeftovers(Y, objects) {
  const found = { lines: [], labels: [], bombs: [] };
  objects.forEach((object, id) => {
    if (!(object instanceof Y.Map)) return;
    const stored = object.get('sprintcap');
    if (!stored) return;
    if (object.get('type') === 'arrow' && stored.line) found.lines.push(id);
    if (object.get('type') !== 'stamp') return;
    found.bombs.push(object);
    if (stored.label && objects.get(stored.label) instanceof Y.Map) found.labels.push(stored.label);
  });
  return found;
}

function holstCreateText({ Y, objects, documents, x, y, scale, zIndex, author, now, items, extra = {} }) {
  const id = crypto.randomUUID();
  const documentId = crypto.randomUUID();
  const root = new Y.XmlText();
  documents.set(documentId, root);
  root.applyDelta(items.map((item) => ({ insert: holstItemNode(Y, item) })), { sanitize: false });
  const object = new Y.Map();
  objects.set(id, object);
  const fields = { id, type: 'simple-text', documentId, position: { x, y }, textScale: scale, lineHeight: '150%', fontFamily: 'Inter', zIndex, ...extra, created: { a: author, t: now }, updated: { a: author, t: now } };
  for (const [key, value] of Object.entries(fields)) object.set(key, value);
  return id;
}

function holstCreateShape({ Y, objects, documents, part, author, now, extra = {} }) {
  const id = crypto.randomUUID();
  const documentId = crypto.randomUUID();
  documents.set(documentId, new Y.XmlText());
  const object = new Y.Map();
  objects.set(id, object);
  const fields = { id, type: 'shape', shapeType: part.shape, documentId, position: { x: part.x, y: part.y }, width: part.width, height: part.height, fixedSize: true, fillColor: { color: part.color, opacity: 1 }, strokeWidth: 0, zIndex: part.zIndex, ...extra, created: { a: author, t: now }, updated: { a: author, t: now } };
  for (const [key, value] of Object.entries(fields)) object.set(key, value);
  return id;
}

function holstDeleteObject(objects, documents, id) {
  const object = objects.get(id);
  const documentId = object && object.get('documentId');
  objects.delete(id);
  if (documentId) documents.delete(documentId);
}

function holstReportFind(Y, objects, id) {
  const object = id ? objects.get(id) : null;
  if (!(object instanceof Y.Map)) return null;
  if (object.get('type') !== 'group') return { old: true, object, children: [], anchor: object.get('position'), textScale: object.get('textScale') || 1, zIndex: object.get('zIndex') || 0, sig: null, footer: null };
  const children = [];
  objects.forEach((child, childId) => {
    if (child instanceof Y.Map && child.get('parentId') === id && (child.get('sprintcap') || {}).part) children.push(childId);
  });
  const partOf = (childId) => objects.get(childId).get('sprintcap').part;
  const panel = children.find((childId) => partOf(childId) === 'panel');
  const stored = object.get('sprintcap') || {};
  return { old: false, object, children, anchor: (panel ? objects.get(panel) : object).get('position'), textScale: stored.scale || 1, zIndex: stored.z || 0, sig: stored.sig || null, footer: children.find((childId) => partOf(childId) === 'footer') || null };
}

function holstWriteReport({ Y, objects, documents, found, place, report, sig, author, now }) {
  const anchor = found ? found.anchor : place;
  const scale = found ? found.textScale : place.textScale;
  const z = found ? found.zIndex : place.zIndex;
  if (found) for (const childId of found.children) holstDeleteObject(objects, documents, childId);
  let group = found && !found.old ? found.object : null;
  if (found && found.old) holstDeleteObject(objects, documents, found.object.get('id'));
  if (!group) {
    group = new Y.Map();
    const groupId = crypto.randomUUID();
    objects.set(groupId, group);
    group.set('id', groupId);
    group.set('type', 'group');
    group.set('ignoreZIndex', true);
    group.set('created', { a: author, t: now });
  }
  const groupId = group.get('id');
  group.set('position', { x: anchor.x, y: anchor.y });
  group.set('zIndex', z);
  group.set('sprintcap', { report: true, sig, scale, z });
  group.set('updated', { a: author, t: now });
  for (const part of holstReportLayout({ report, x: anchor.x, y: anchor.y, textScale: scale, zIndex: z, now })) {
    const extra = { parentId: groupId, sprintcap: { part: part.part } };
    if (part.kind === 'shape') holstCreateShape({ Y, objects, documents, part, author, now, extra });
    else holstCreateText({ Y, objects, documents, x: part.x, y: part.y, scale: part.textScale, zIndex: part.zIndex, author, now, items: part.items, extra: { ...extra, fixedWidth: true, width: part.width, lineHeight: `${Math.round(HOLST_REPORT.line * 100)}%` } });
  }
  return groupId;
}

function holstReplaceText({ Y, object, root, items, author, now }) {
  root.delete(0, root.length);
  root.applyDelta(items.map((item) => ({ insert: holstItemNode(Y, item) })), { sanitize: false });
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
    const now = Date.now();
    const listRun = sticker.get('sprintcap') || {};
    const lastRun = listRun.t || null;
    const since = payload.since;
    const cards = payload.cards;
    const root = documents.get(sticker.get('documentId'));
    const before = holstDocItems(Y, root);
    const plan = planSticker({ items: before, cards, lastRun, cardUrl: (id) => `${payload.kaiten}/${id}` });
    const listChanged = stickerSignature(plan.items) !== stickerSignature(before);
    const finalItems = [...plan.items, updatedLine(now)];
    const stickerSize = { width: sticker.get('width') || HOLST_FIT.base[0], height: sticker.get('height') || HOLST_FIT.base[1] };
    const scale = stickerScale({ ...stickerSize, stored: listRun });
    const fit = stickerFit({ items: finalItems, ...stickerSize, textScale: sticker.get('textScale') || 1, k: scale });
    const forcedFont = sticker.get('fontSize') !== undefined;
    const label = listRun.label ? objects.get(listRun.label) : null;
    const labelRoot = label instanceof Y.Map ? documents.get(label.get('documentId')) || null : null;
    const labelItems = payload.percent === null ? null : percentLabelItems({ percent: payload.percent, now });
    const labelChanged = Boolean(labelItems) && (!labelRoot || runsText((holstDocItems(Y, labelRoot)[0] || { runs: [] }).runs) !== runsText(labelItems[0].runs));
    const moveLabel = Boolean(labelRoot) && !listRun.placed;
    const chart = (labelChanged && !labelRoot) || moveLabel ? holstChart({ objects: holstChartObjects({ Y, objects, documents, payload }), group: payload.group, chart: payload.chart }) : null;
    const place = chart && !chart.problem ? percentLabelPlace(chart) : null;
    const percentProblem = !labelRoot && chart && chart.problem ? chart.problem : null;
    const labelMove = moveLabel && Boolean(place);
    const labelWrite = labelChanged && !percentProblem;
    const sprintReport = payload.sprint || null;
    const reportData = sprintReport && sprintReport.report ? sprintReport.report : null;
    const reportFound = reportData ? holstReportFind(Y, objects, listRun.report) : null;
    const reportPlace = reportData && !reportFound ? holstReportPlace({ objects: holstChartObjects({ Y, objects, documents, payload }), group: payload.group, chart: payload.chart }) : null;
    const reportWrite = Boolean(reportData) && !(reportPlace && reportPlace.problem);
    const reportSig = reportData ? holstReportSignature(reportData) : null;
    const reportChanged = reportWrite && holstReportStale({ found: reportFound, sig: reportSig, parts: holstReportParts(reportData).length });
    const reportProblem = !sprintReport ? null
      : sprintReport.problem ? `Отчёт спринта не посчитал: ${sprintReport.problem}`
      : reportPlace && reportPlace.problem ? `Отчёт спринта не написал: ${reportPlace.problem}`
      : null;
    const leftovers = holstLeftovers(Y, objects);
    const cleanup = leftovers.lines.length + leftovers.labels.length + leftovers.bombs.length > 0;
    const marked = cards.filter((item) => item.mark);
    const movedSince = lastRun === null ? null : marked.filter((item) => item.movedAt > lastRun).length;
    const markedText = `Подсвечено карт: ${marked.length} — подвинулись с ${HOLST_STYLE.weekdays[new Date(since).getDay()]} ${shortTime(since).slice(0, 5)}${movedSince === null ? '' : `, из них с прошлого обновления: ${movedSince}`}`;
    const unknown = unknownColumnsText(payload.unknown);
    const percentLine = payload.percent === null ? 'Процент не написал: в спринте нет карт'
      : percentProblem ? `Процент не написал: ${percentProblem}`
      : `Спринт: ${payload.percent}%${labelWrite ? ' — написал над графиком' : ''}, в Done ${payload.done} из ${payload.of}`;
    if (!listChanged && !labelWrite && !labelMove && !cleanup && !fit && !forcedFont && !reportChanged) {
      const why = `${payload.percent === null ? 'список как в Kaiten' : `над графиком уже ${payload.percent}%, список как в Kaiten`}${reportWrite ? ', отчёт спринта тот же' : ''}`;
      return { ok: !percentProblem, calm: !percentProblem && !reportProblem, text: [`${payload.title}: обновлять нечего — ${why}`, ...(percentProblem ? [percentLine] : []), ...(reportProblem ? [reportProblem] : []), ...(unknown ? [`Прогресс: ${unknown}`] : [])].join('\n') };
    }
    const author = (sticker.get('updated') || sticker.get('created')).a;
    const updates = [];
    const listen = (update, origin) => {
      if (origin !== 'server') updates.push(update);
    };
    let labelId = labelRoot ? listRun.label : null;
    let reportId = listRun.report && objects.get(listRun.report) instanceof Y.Map ? listRun.report : null;
    doc.on('updateV2', listen);
    doc.transact(() => {
      if (labelWrite && labelRoot) holstReplaceText({ Y, object: label, root: labelRoot, items: labelItems, author, now });
      else if (labelWrite) labelId = holstCreateText({ Y, objects, documents, x: place.x, y: place.y, scale: place.textScale, zIndex: place.zIndex, author, now, items: labelItems });
      if (labelMove) label.set('position', { x: place.x, y: place.y });
      if (reportChanged) reportId = holstWriteReport({ Y, objects, documents, found: reportFound, place: reportPlace, report: reportData, sig: reportSig, author, now });
      else if (reportWrite) {
        const footer = objects.get(reportFound.footer);
        holstReplaceText({ Y, object: footer, root: documents.get(footer.get('documentId')), items: holstFooterItems(reportData.problem, now), author, now });
      }
      for (const id of leftovers.lines) objects.delete(id);
      for (const id of leftovers.labels) {
        const documentId = objects.get(id).get('documentId');
        objects.delete(id);
        if (documentId) documents.delete(documentId);
      }
      for (const bomb of leftovers.bombs) bomb.delete('sprintcap');
      const nodes = finalItems.map((item) => holstItemNode(Y, item));
      root.delete(0, root.length);
      root.applyDelta(nodes.map((node) => ({ insert: node })), { sanitize: false });
      sticker.set('horizontalAlign', 'left');
      if (forcedFont) sticker.delete('fontSize');
      if (fit) {
        sticker.set('width', fit.width);
        sticker.set('height', fit.height);
        sticker.set('textScale', fit.textScale);
      }
      sticker.set('sprintcap', { t: payload.generatedAt, k: fit ? fit.k : scale, ...(labelId ? { label: labelId, placed: !moveLabel || labelMove } : {}), ...(reportId ? { report: reportId } : {}) });
      sticker.set('updated', { a: author, t: now });
    }, 'local');
    doc.off('updateV2', listen);
    for (const update of updates) await send(update);
    const result = [`${payload.title}: готово`, percentLine];
    if (reportProblem) result.push(reportProblem);
    else if (reportWrite) result.push(!reportFound ? 'Отчёт спринта: написал под графиком' : reportFound.old ? 'Отчёт спринта: переделал в блоки на том же месте' : reportChanged ? 'Отчёт спринта: обновил' : 'Отчёт спринта: цифры те же');
    result.push(markedText);
    result.push(`Список: ${plan.stats.cards} карт, оставил на месте ${plan.stats.kept}`);
    if (labelMove) result.push('Передвинул процент под заголовок графика');
    if (moveLabel && !labelMove) result.push(`Процент не передвинул: ${chart.problem}`);
    if (forcedFont) result.push('У стикера стоял шрифт, выбранный вручную, — вернул подбор под размер стикера');
    if (fit) result.push(fit.grow ? 'Список стал короче — сделал шрифт крупнее, стикер тот же' : 'Список не влезал в стикер — сделал шрифт мельче, стикер тот же');
    if (unknown) result.push(`Прогресс: ${unknown}`);
    if (plan.stats.renamed) result.push(`Обновил названия: ${plan.stats.renamed}`);
    if (plan.stats.gone) result.push(`Убрал карт не из спринта: ${plan.stats.gone}`);
    if (plan.stats.manual) result.push(`Строк без карты не тронул: ${plan.stats.manual}`);
    return { ok: !percentProblem, text: result.join('\n') };
  } finally {
    connection.ws.close();
  }
}
