const HOLST_LIBS = {
  yjs: 'https://cdn.jsdelivr.net/npm/yjs@13.6/+esm',
  encoding: 'https://cdn.jsdelivr.net/npm/lib0@0.2/encoding/+esm',
  decoding: 'https://cdn.jsdelivr.net/npm/lib0@0.2/decoding/+esm',
};

async function holstConnect(board) {
  const [Y, enc, dec] = await Promise.all([import(HOLST_LIBS.yjs), import(HOLST_LIBS.encoding), import(HOLST_LIBS.decoding)]);
  let token = null;
  try {
    token = JSON.parse(localStorage.getItem('social-auth-store') || '{}').token;
  } catch (error) {
    token = null;
  }
  if (!token) throw new Error('Нет входа в Holst — войдите и нажмите закладку ещё раз');
  const doc = new Y.Doc();
  const ws = new WebSocket('wss://app.holst.so/hud/ws');
  ws.binaryType = 'arraybuffer';
  let onAck = null;
  let failure = null;
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
      if (!failure) failure = new Error(`Holst закрыл соединение (${event.code})`);
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
            if (response.error) fail(new Error(`Holst: ${response.error}`));
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

async function holstSprintRun() {
  if (window.sprintcapRunning) {
    sprintToast('Ёмкость спринта: уже обновляю доску, подождите');
    return;
  }
  window.sprintcapRunning = true;
  try {
    await holstSprintWork();
  } finally {
    window.sprintcapRunning = false;
  }
}

async function holstSprintWork() {
  let payload;
  try {
    payload = decodeHolstPayload(location.hash);
  } catch (error) {
    sprintToast('Ёмкость спринта: данные в адресе повреждены — нажмите «В Holst» в калькуляторе ещё раз', true, 'fail');
    return;
  }
  if (!payload) {
    sprintToast('Ёмкость спринта: сначала нажмите «В Holst» в калькуляторе Kaiten — он откроет эту доску с данными', true, 'fail');
    return;
  }
  if (!location.pathname.includes(payload.board)) {
    sprintToast('Ёмкость спринта: это не та доска Holst, которую открыл калькулятор', true, 'fail');
    return;
  }
  const stale = holstPayloadStale(payload, Date.now());
  if (stale) {
    sprintToast(`Ёмкость спринта: ${stale} — нажмите «В Holst» в калькуляторе ещё раз`, true, 'fail');
    return;
  }
  sprintToast('Ёмкость спринта: обновляю доску…');
  const connection = await holstConnect(payload.board);
  const { Y, doc, send } = connection;
  try {
    const objects = doc.getMap('objects');
    const documents = doc.getMap('documents');
    const chart = holstFindChart({ Y, objects, documents, group: payload.group });
    const sticker = objects.get(payload.sticker);
    if (!sticker || !documents.get(sticker.get('documentId'))) throw new Error('На доске нет розового стикера — проверьте его номер в настройках калькулятора');
    const now = Date.now();
    const day = workingDayIndex(payload.sprintStart, now);
    const bomb = day >= 1 && payload.percent !== null ? chart.bombs[day - 1] : null;
    const lastRun = (sticker.get('sprintcap') || {}).t || null;
    const root = documents.get(sticker.get('documentId'));
    const plan = planSticker({ items: holstDocItems(Y, root), cards: payload.cards, lastRun, cardUrl: (id) => `${payload.kaiten}/${id}` });
    let bombY = null;
    const updates = [];
    const listen = (update, origin) => {
      if (origin !== 'server') updates.push(update);
    };
    doc.on('updateV2', listen);
    doc.transact(() => {
      if (bomb) {
        const size = bomb.object.get('height') || 169;
        bombY = bombTop({ percent: payload.percent, labels: chart.labels, axisY: chart.axisY, size });
        bomb.object.set('position', { x: bomb.object.get('position').x, y: bombY });
        bomb.object.set('updated', { a: (bomb.object.get('updated') || bomb.object.get('created')).a, t: now });
      }
      const nodes = plan.items.map((item) => holstItemNode(Y, item));
      root.delete(0, root.length);
      root.applyDelta(nodes.map((node) => ({ insert: node })), { sanitize: false });
      sticker.set('horizontalAlign', 'left');
      sticker.set('sprintcap', { t: payload.generatedAt });
      sticker.set('updated', { a: (sticker.get('updated') || sticker.get('created')).a, t: now });
    }, 'local');
    doc.off('updateV2', listen);
    for (const update of updates) await send(update);
    history.replaceState(null, '', location.pathname + location.search);
    const weekday = HOLST_STYLE.weekdays[new Date(now).getDay()];
    const lines = [`${payload.title}: готово`];
    if (bomb) lines.push(`Бомба ${weekday} → ${payload.percent}% (${payload.done} из ${payload.of})`);
    else if (payload.percent === null) lines.push('Бомбу не двигал: в спринте нет карт');
    else if (day < 1) lines.push('Бомбу не двигал: сегодня первый день спринта');
    else lines.push(`Бомбу не двигал: на графике ${chart.bombs.length} бомб, а сегодня ${day}-й рабочий день`);
    lines.push(`Список: ${plan.stats.cards} карт, подсвечено ${plan.stats.marked}, оставил на месте ${plan.stats.kept}`);
    if (plan.stats.manual) lines.push(`Строк без карты не тронул: ${plan.stats.manual}`);
    if (plan.stats.gone) lines.push(`Карт уже не в спринте, оставил: ${plan.stats.gone}`);
    sprintToast(lines.join('\n'), false, 'ok');
  } finally {
    connection.ws.close();
  }
}
