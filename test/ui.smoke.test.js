const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const core = require('../src/core.js');

const root = path.join(__dirname, '..');
execFileSync(process.execPath, [path.join(root, 'build.mjs')], { cwd: root, stdio: 'pipe' });
const bundle = readFileSync(path.join(root, 'dist', 'sprint-capacity.js'), 'utf8').replace(/\bimport\(/g, 'holstImport(');

const HOLST = 'https://app.holst.so';
const KAITEN = 'https://example.kaiten.ru';
const TOKEN_KEY = 'sprintCapacity.v1.holstToken';
const TEAM_BOARD = '972a8469-1641-4f82-8b9d-2434e465e150';

const toBytes = (values) => new TextEncoder().encode(JSON.stringify(values));
const fromBytes = (bytes) => JSON.parse(new TextDecoder().decode(Uint8Array.from(bytes)));

const codec = {
  yjs: { Doc: class {}, applyUpdateV2() {} },
  encoding: {
    createEncoder: () => ({ values: [] }),
    writeVarString: (encoder, value) => encoder.values.push(value),
    writeVarUint: (encoder, value) => encoder.values.push(value),
    writeVarUint8Array: (encoder, value) => encoder.values.push(Array.from(value)),
    toUint8Array: (encoder) => toBytes(encoder.values),
  },
  decoding: {
    createDecoder: (bytes) => ({ values: fromBytes(bytes), at: 0 }),
    hasContent: (decoder) => decoder.at < decoder.values.length,
    readVarString: (decoder) => decoder.values[decoder.at++],
    readVarUint: (decoder) => decoder.values[decoder.at++],
    readVarInt: (decoder) => decoder.values[decoder.at++],
    readVarUint8Array: (decoder) => Uint8Array.from(decoder.values[decoder.at++]),
  },
};

const holstImport = (url) => Promise.resolve(url.includes('/yjs@') ? codec.yjs : url.includes('/encoding/') ? codec.encoding : codec.decoding);

const fakeSocket = (env) => class {
  constructor(url) {
    this.url = url;
    this.closed = false;
    env.sockets.push(this);
    queueMicrotask(() => (env.holst === 'offline' ? this.onerror({}) : this.onopen()));
  }

  send(bytes) {
    const [board, , auth] = fromBytes(bytes);
    this.board = board;
    this.token = JSON.parse(auth).token;
    const reply = env.holst === 'reject' ? [board, 3, JSON.stringify({ error: 'internal-error' })] : [board, 0, 0, 0, 0, 0, []];
    queueMicrotask(() => this.onmessage({ data: toBytes(reply) }));
  }

  close() {
    this.closed = true;
  }
};

const fakeElement = () => {
  const classes = new Set();
  const element = {
    dataset: {},
    style: { props: {}, setProperty(name, value) { this.props[name] = value; }, removeProperty(name) { delete this.props[name]; } },
    hidden: false,
    innerHTML: '',
    textContent: '',
    children: [],
    listeners: {},
    classList: {
      toggle: (name, force) => {
        const on = force === undefined ? !classes.has(name) : Boolean(force);
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      },
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    addEventListener: (type, listener) => {
      (element.listeners[type] = element.listeners[type] || []).push(listener);
    },
    removeEventListener() {},
    appendChild: (child) => {
      child.parent = element;
      element.children.push(child);
      return child;
    },
    remove: () => {
      if (!element.parent) return;
      const list = element.parent.children;
      if (list.includes(element)) list.splice(list.indexOf(element), 1);
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    querySelector: () => fakeElement(),
    querySelectorAll: () => [],
    closest: () => null,
    setAttribute() {},
    focus() {},
  };
  return element;
};

const remember = (element, known = new Map()) => {
  element.querySelector = (selector) => {
    if (!known.has(selector)) known.set(selector, fakeElement());
    return known.get(selector);
  };
  return element;
};

const fakeTab = () => {
  const tab = {
    closed: false,
    sent: [],
    postMessage: (message, origin) => tab.sent.push({ message, origin }),
    close: () => {
      tab.closed = true;
    },
  };
  return tab;
};

const page = ({ hostname, stored = {}, opener = null, clipboard = true, holst = 'ok', confirm = () => false, fetch = () => Promise.reject(new Error('нет сети в тесте')), now = null, reduced = false, audio = null, fonts = null }) => {
  const env = { stored: new Map(Object.entries(stored)), timers: [], listeners: {}, opened: [], alerts: [], copied: [], blockPopups: false, holst, sockets: [] };
  const shadow = remember(fakeElement(), new Map([['.holst-login', remember(Object.assign(fakeElement(), { hidden: true }))], ['.daily', remember(Object.assign(fakeElement(), { hidden: true }))], ['.tabs', remember(Object.assign(fakeElement(), { hidden: true }))], ['.geese', null]]));
  const body = fakeElement();
  const document = {
    hidden: false,
    body,
    head: fakeElement(),
    createElement: (tag) => {
      const element = remember(fakeElement());
      element.tagName = tag.toUpperCase();
      element.attachShadow = () => shadow;
      return element;
    },
    getElementById: (id) => body.children.find((element) => element.id === id) || null,
    addEventListener() {},
    removeEventListener() {},
  };
  const addTimer = (listener, ms, repeat) => {
    env.timers.push({ listener, ms, repeat, cleared: false });
    return env.timers.length;
  };
  const clearTimer = (id) => {
    if (env.timers[id - 1]) env.timers[id - 1].cleared = true;
  };
  const context = {
    console,
    URL,
    document,
    location: { hostname, origin: `https://${hostname}` },
    innerWidth: 1440,
    innerHeight: 900,
    localStorage: {
      getItem: (key) => (env.stored.has(key) ? env.stored.get(key) : null),
      setItem: (key, value) => env.stored.set(key, String(value)),
      removeItem: (key) => env.stored.delete(key),
    },
    navigator: clipboard ? { clipboard: { writeText: (text) => { env.copied.push(text); return Promise.resolve(); } } } : {},
    fetch,
    holstImport,
    WebSocket: fakeSocket(env),
    setTimeout: (listener, ms) => addTimer(listener, ms, false),
    setInterval: (listener, ms) => addTimer(listener, ms, true),
    clearTimeout: clearTimer,
    clearInterval: clearTimer,
    addEventListener: (type, listener) => {
      (env.listeners[type] = env.listeners[type] || []).push(listener);
    },
    removeEventListener: (type, listener) => {
      env.listeners[type] = (env.listeners[type] || []).filter((item) => item !== listener);
    },
    open: (url) => {
      if (env.blockPopups) return null;
      const tab = fakeTab();
      tab.url = url;
      env.opened.push(tab);
      return tab;
    },
    alert: (text) => env.alerts.push(text),
    prompt: (text) => env.alerts.push(text),
    confirm,
    opener,
  };
  env.clock = now;
  if (now !== null) context.Date = class extends Date { constructor(...args) { super(...(args.length ? args : [env.clock])); } static now() { return env.clock; } };
  if (reduced) context.matchMedia = (query) => ({ matches: /reduce/.test(query) });
  if (audio) context.AudioContext = audio;
  if (fonts) {
    document.fonts = fonts;
    context.FontFace = class {
      constructor(family, source, descriptors = {}) {
        this.family = family;
        this.source = source;
        this.descriptors = descriptors;
      }

      load() {
        return Promise.resolve(this);
      }
    };
  }
  context.window = context;
  vm.createContext(context);
  vm.runInContext(bundle, context);
  env.$ = (selector) => shadow.querySelector(selector);
  env.click = (act) => (shadow.listeners.click || []).forEach((listener) => listener({ target: { closest: () => ({ dataset: { act } }) } }));
  env.type = (set, value) => (shadow.listeners.input || []).forEach((listener) => listener({ target: { dataset: { set }, value } }));
  env.message = (origin, data, source) => (env.listeners.message || []).slice().forEach((listener) => listener({ origin, data, source }));
  env.runTimers = (ms) => env.timers.filter((timer) => timer.ms === ms && !timer.cleared).forEach((timer) => {
    if (!timer.repeat) timer.cleared = true;
    timer.listener();
  });
  env.document = document;
  env.context = context;
  env.shadow = shadow;
  env.pick = (act, value) => (shadow.listeners.change || []).forEach((listener) => listener({ target: { dataset: { act }, value } }));
  env.geese = () => shadow.children.filter((element) => element.className === 'geese').length;
  env.scene = () => shadow.children.find((element) => element.className === 'geese')?.dataset.scene;
  env.toast = () => {
    const box = document.getElementById('sprintcap-toast');
    return box ? box.children.map((element) => element.textContent).join('') : null;
  };
  return env;
};

const flush = () => new Promise((resolve) => setImmediate(resolve));
const plain = (value) => JSON.parse(JSON.stringify(value));

const overloadedKaiten = (stored = {}, comments = []) => page({
  hostname: 'example.kaiten.ru',
  stored: {
    'sprintCapacity.v1.board': '303040',
    'sprintCapacity.v1.settings.303040': JSON.stringify({ team: { back: { people: 1 } } }),
    'sprintCapacity.v1.geese.303040': JSON.stringify('2026-10-02'),
    ...stored,
  },
  fetch: (url) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(url.startsWith('/api/cards?') ? [{ id: 1, title: 'Карта 1', size: 50, properties: { id_9004: [329378] }, state: 1 }] : url.endsWith('/comments') ? comments : []),
  }),
});

const planningStart = (takenAt) => ({
  text: `Снимок начала планирования, Core team. Осталось: Бэк 20 · Фронт 0 · QA 0.\n\n\`\`\`json\n${JSON.stringify({ boardId: 303040, takenAt, totals: { back: 20, front: 0, qa: 0 }, doneIds: [] })}\n\`\`\``,
  created: takenAt,
  author: { full_name: 'Тестировщик' },
});

test('Перегруз: гуси бегут при каждом открытии панели, а обновление в открытой панели их не зовёт', async () => {
  // Arrange
  const first = overloadedKaiten();
  await flush();

  // Act
  first.runTimers(60000);
  await flush();
  const reopened = overloadedKaiten();
  await flush();

  // Assert
  assert.equal(first.geese(), 1);
  assert.equal(reopened.geese(), 1);
});

test('Перегруз: при следующем открытии панели гуси играют другую сцену', async () => {
  // Arrange
  const first = overloadedKaiten();
  await flush();
  const shown = first.scene();

  // Act
  const next = overloadedKaiten({ 'sprintCapacity.v1.gooseScene': first.stored.get('sprintCapacity.v1.gooseScene') });
  await flush();

  // Assert
  assert.ok(shown);
  assert.ok(next.scene());
  assert.notEqual(next.scene(), shown);
});

test('Панель на Kaiten: красная буква H без входа открывает вход через Holst', () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru' });

  // Act
  kaiten.click('holst-login');

  // Assert
  const box = kaiten.$('.holst-login');
  assert.equal(box.hidden, false);
  assert.match(box.innerHTML, /Вход в Holst — один раз на этом компьютере/);
  assert.match(box.innerHTML, /Открыть Holst/);
  assert.equal(kaiten.$('[data-act="holst-login"]').dataset.state, 'none');
  assert.equal(kaiten.$('[data-act="holst-login"]').title, 'Вход в Holst: нет');
  assert.deepEqual(kaiten.sockets, []);
});

test('Вход из вкладки Holst: панель отвечает на приветствие, сохраняет и проверяет вход, буква H зеленеет', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru' });
  const holstTab = fakeTab();

  // Act
  kaiten.message(HOLST, { type: 'sprint-capacity:hello' }, holstTab);
  kaiten.message(HOLST, { type: 'sprint-capacity:login', token: 'test-login-1' }, holstTab);
  const checking = kaiten.$('[data-act="holst-login"]').dataset.state;
  await flush();

  // Assert
  assert.deepEqual(plain(holstTab.sent[0]), { message: { type: 'sprint-capacity:ping' }, origin: HOLST });
  assert.equal(kaiten.stored.get(TOKEN_KEY), JSON.stringify('test-login-1'));
  assert.equal(checking, 'checking');
  assert.deepEqual(kaiten.sockets.map((socket) => [socket.board, socket.token, socket.closed]), [[TEAM_BOARD, 'test-login-1', true]]);
  assert.deepEqual(plain(holstTab.sent[1]), { message: { type: 'sprint-capacity:result', text: 'Вход работает — эту вкладку можно закрыть', failed: false }, origin: HOLST });
  assert.equal(kaiten.$('[data-act="holst-login"]').dataset.state, 'ok');
  assert.equal(kaiten.toast(), 'Вход в Holst работает');
});

test('Свежий вход из Holst не пустили — вкладка Holst узнаёт, что проверить, буква H красная, вход не стёрт', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', holst: 'reject' });
  const holstTab = fakeTab();

  // Act
  kaiten.message(HOLST, { type: 'sprint-capacity:login', token: 'test-login-8' }, holstTab);
  await flush();

  // Assert
  const result = holstTab.sent.find((item) => item.message.type === 'sprint-capacity:result');
  assert.equal(result.message.failed, true);
  assert.match(result.message.text, /^Holst не пускает и со свежим входом .*проверьте, открывается ли у вас эта доска$/);
  assert.equal(kaiten.$('[data-act="holst-login"]').dataset.state, 'rejected');
  assert.equal(kaiten.stored.get(TOKEN_KEY), JSON.stringify('test-login-8'));
});

test('Сохранённый вход работает — буква H зелёная, а в окошке так и написано', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-5') } });
  const checking = kaiten.$('[data-act="holst-login"]').dataset.state;

  // Act
  await flush();
  kaiten.click('holst-login');

  // Assert
  const key = kaiten.$('[data-act="holst-login"]');
  assert.equal(checking, 'checking');
  assert.equal(key.dataset.state, 'ok');
  assert.equal(key.title, 'Вход в Holst: работает');
  assert.deepEqual(kaiten.sockets.map((socket) => [socket.token, socket.closed]), [['test-login-5', true]]);
  assert.match(kaiten.$('.holst-login').innerHTML, /Вход в Holst работает — входить заново не нужно/);
});

test('Holst не пускает с сохранённым входом — буква H красная, в окошке подсказка, вход не стёрт', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-6') }, holst: 'reject' });

  // Act
  await flush();
  kaiten.click('holst-login');

  // Assert
  const key = kaiten.$('[data-act="holst-login"]');
  assert.equal(key.dataset.state, 'rejected');
  assert.equal(key.title, 'Вход в Holst: Holst не пустил');
  assert.match(kaiten.$('.holst-login').innerHTML, /Holst не пустил с сохранённым входом — войдите заново/);
  assert.equal(kaiten.stored.get(TOKEN_KEY), JSON.stringify('test-login-6'));
});

test('Проверить вход не вышло — серая буква H, нажатие на неё проверяет ещё раз', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-7') }, holst: 'offline' });
  await flush();
  const offline = kaiten.$('[data-act="holst-login"]').dataset.state;
  kaiten.holst = 'ok';

  // Act
  kaiten.click('holst-login');
  const checking = kaiten.$('[data-act="holst-login"]').dataset.state;
  await flush();

  // Assert
  assert.equal(offline, 'error');
  assert.equal(checking, 'checking');
  assert.equal(kaiten.$('[data-act="holst-login"]').dataset.state, 'ok');
  assert.equal(kaiten.sockets.length, 2);
  assert.match(kaiten.$('.holst-login').querySelector('[data-holst-reason]').textContent, /^Вход в Holst работает/);
});

test('Вход вставили вручную — панель проверяет его, сохраняет и красит букву H зелёным', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru' });
  kaiten.click('holst-login');
  kaiten.$('[data-holst-token]').value = ' "test-login-9" ';

  // Act
  kaiten.click('holst-save');
  await flush();

  // Assert
  assert.equal(kaiten.stored.get(TOKEN_KEY), JSON.stringify('test-login-9'));
  assert.equal(kaiten.$('[data-act="holst-login"]').dataset.state, 'ok');
  assert.deepEqual(kaiten.sockets.map((socket) => socket.token), ['test-login-9']);
  assert.equal(kaiten.$('.holst-login').hidden, true);
  assert.equal(kaiten.toast(), 'Вход в Holst работает');
});

test('Вход с чужого сайта панель не принимает и не отвечает ему', () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru' });
  const stranger = fakeTab();

  // Act
  kaiten.message('https://evil.example', { type: 'sprint-capacity:hello' }, stranger);
  kaiten.message('https://evil.example', { type: 'sprint-capacity:login', token: 'test-login-2' }, stranger);

  // Assert
  assert.equal(kaiten.stored.has(TOKEN_KEY), false);
  assert.deepEqual(stranger.sent, []);
});

test('«Открыть Holst»: панель зовёт вкладку, а когда связь пропала — просит открыть ещё раз', () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru' });
  kaiten.click('holst-login');

  // Act
  kaiten.click('holst-open');
  kaiten.runTimers(500);
  const waiting = kaiten.$('.holst-login').innerHTML;
  kaiten.opened[0].closed = true;
  kaiten.runTimers(500);

  // Assert
  assert.equal(kaiten.opened[0].url, `${HOLST}/board/972a8469-1641-4f82-8b9d-2434e465e150`);
  assert.deepEqual(plain(kaiten.opened[0].sent), [{ message: { type: 'sprint-capacity:ping' }, origin: HOLST }]);
  assert.match(waiting, /Жду вход/);
  assert.match(kaiten.$('.holst-login').innerHTML, /Связь с вкладкой Holst пропала/);
  assert.equal(kaiten.timers.filter((timer) => timer.ms === 500 && !timer.cleared).length, 0);
});

test('Всплывающие окна запрещены — панель так и говорит', () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru' });
  kaiten.blockPopups = true;
  kaiten.click('holst-login');

  // Act
  kaiten.click('holst-open');

  // Assert
  assert.match(kaiten.$('.holst-login').innerHTML, /Браузер не дал открыть Holst/);
});

test('«В Holst» без входа: вход пришёл из открытой вкладки — панель сразу пишет, итог уходит в ту же вкладку', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru' });
  await flush();
  kaiten.click('to-holst');
  const asked = kaiten.$('.holst-login').innerHTML;
  kaiten.click('holst-open');
  const holstTab = kaiten.opened[0];

  // Act
  kaiten.message(HOLST, { type: 'sprint-capacity:login', token: 'test-login-3' }, holstTab);
  await flush();

  // Assert
  assert.match(asked, /Нужен вход в Holst/);
  assert.equal(kaiten.stored.get(TOKEN_KEY), JSON.stringify('test-login-3'));
  const result = holstTab.sent.find((item) => item.message.type === 'sprint-capacity:result');
  assert.equal(result.origin, HOLST);
  assert.equal(result.message.failed, true);
  assert.match(result.message.text, /^В Holst не отправилось: нет сети в тесте/);
  assert.equal(holstTab.closed, false);
  assert.equal(kaiten.opened.length, 1);
  assert.equal(kaiten.$('[data-act="holst-login"]').dataset.state, 'ok');
});

test('Сохранённый вход: «В Holst» не спрашивает вход, а сразу открывает Holst', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-4') } });
  await flush();

  // Act
  kaiten.click('to-holst');
  await flush();

  // Assert
  assert.equal(kaiten.$('.holst-login').innerHTML, '');
  assert.equal(kaiten.opened.length, 1);
  assert.match(kaiten.toast(), /^В Holst не отправилось: нет сети в тесте/);
  assert.equal(kaiten.stored.get(TOKEN_KEY), JSON.stringify('test-login-4'));
});

test('Мем в итоге «В Holst» пропадает сам через пять секунд, текст остаётся', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-5') } });
  await flush();
  kaiten.click('to-holst');
  await flush();
  const box = kaiten.document.getElementById('sprintcap-toast');
  assert.deepEqual(box.children.map((element) => element.tagName), ['IMG', 'DIV']);

  // Act
  kaiten.runTimers(5000);

  // Assert
  assert.deepEqual(box.children.map((element) => element.tagName), ['DIV']);
  assert.match(kaiten.toast(), /^В Holst не отправилось: нет сети в тесте/);
});

test('«В Holst» без выбора спринта: одна кнопка с подписью, старый выбор из хранилища не мешает', async () => {
  // Arrange
  const kaiten = overloadedKaiten({ 'sprintCapacity.v1.sprintPick.303040': JSON.stringify('last') });

  // Act
  await flush();

  // Assert
  const html = kaiten.$('.summary').innerHTML;
  assert.doesNotMatch(html, /<select data-act="holst-sprint"/);
  assert.match(html, /data-act="to-holst"[^>]*title="Процент, розовый список, отчёт идущего спринта и рядом — итоги прошлого"[^>]*>В Holst<\/button><span>процент, список и отчёт спринта<\/span>/);
  assert.doesNotMatch(html.match(/<button[^>]*data-act="to-holst"[^>]*>/)[0], /again/);
});

test('Кнопки планирования спрятаны в свёрнутой раскрывашке «Планирование», у «Начать» подсказка, когда нажимать', async () => {
  // Arrange
  const kaiten = overloadedKaiten();

  // Act
  await flush();

  // Assert
  const planning = kaiten.$('.planning');
  assert.equal(planning.hidden, false);
  assert.equal(planning.open, undefined);
  assert.match(planning.innerHTML, /^<summary>Планирование<\/summary><div class="inner">/);
  assert.match(planning.innerHTML, /<button type="button" data-act="start-planning" title="Когда: один раз за спринт — когда садитесь планировать следующий\. В середине спринта не нажимать\.\nЧто сделает: запомнит для всей команды, сколько SP осталось в работе\.[^"]*"\s*>Начать планирование<\/button>/);
  assert.match(planning.innerHTML, /обнулит «нет, чел\.-дн» и «праздников» и вернёт «рабочих дней» к 10 — впишите их на новый спринт\./);
  assert.doesNotMatch(planning.innerHTML, /end-planning/);
  assert.doesNotMatch(kaiten.$('.summary').innerHTML, /planning/);
});

test('После «Начать планирование» в раскрывашке появляется «Закончить планирование» с подсказкой, когда нажимать', async () => {
  // Arrange
  const kaiten = overloadedKaiten({}, [planningStart('2026-10-05T07:00:00.000Z')]);

  // Act
  await flush();

  // Assert
  const html = kaiten.$('.planning').innerHTML;
  assert.match(html, /data-act="start-planning" title="Когда: один раз за спринт[^"]*" class="again">Начать планирование<\/button><span title="Тестировщик">с /);
  assert.match(html, /<button type="button" data-act="end-planning" title="Когда: сразу после планирования, когда спринт собран\.\nЧто сделает: всё, что прилетит в спринт после, панель покажет жёлтым «сверху \+N»\.[^"]*">Закончить планирование<\/button>/);
  assert.doesNotMatch(kaiten.$('.summary').innerHTML, /planning/);
});

test('Закладка на доске Holst: здоровается с Kaiten и отдаёт вход только Kaiten', () => {
  // Arrange
  const opener = fakeTab();
  const holst = page({ hostname: 'app.holst.so', stored: { 'social-auth-store': JSON.stringify({ token: 'test-holst-1' }) }, opener });
  const kaitenTab = fakeTab();
  const stranger = fakeTab();

  // Act
  holst.message('https://evil.example', { type: 'sprint-capacity:ping' }, stranger);
  holst.message(KAITEN, { type: 'sprint-capacity:ping' }, kaitenTab);
  const passed = holst.toast();
  holst.message(KAITEN, { type: 'sprint-capacity:result', text: 'Core team: записал', failed: false, meme: true }, kaitenTab);

  // Assert
  assert.deepEqual(plain(opener.sent), [{ message: { type: 'sprint-capacity:hello' }, origin: '*' }]);
  assert.deepEqual(stranger.sent, []);
  assert.deepEqual(plain(kaitenTab.sent), [{ message: { type: 'sprint-capacity:login', token: 'test-holst-1' }, origin: KAITEN }]);
  assert.equal(passed, 'Вход в Holst передан в Kaiten');
  assert.equal(holst.toast(), 'Core team: записал');
  assert.deepEqual(holst.listeners.message, []);
  assert.deepEqual(holst.copied, []);
});

test('Итог «В Holst» пропадает сам через 20 секунд, ошибка остаётся до клика', () => {
  // Arrange
  const done = page({ hostname: 'app.holst.so', stored: { 'social-auth-store': JSON.stringify({ token: 'test-holst-2' }) }, opener: fakeTab() });
  const failed = page({ hostname: 'app.holst.so', stored: { 'social-auth-store': JSON.stringify({ token: 'test-holst-3' }) }, opener: fakeTab() });
  const kaitenTab = fakeTab();
  done.message(KAITEN, { type: 'sprint-capacity:ping' }, kaitenTab);
  failed.message(KAITEN, { type: 'sprint-capacity:ping' }, kaitenTab);
  done.message(KAITEN, { type: 'sprint-capacity:result', text: 'Core team: записал', failed: false, meme: true }, kaitenTab);
  failed.message(KAITEN, { type: 'sprint-capacity:result', text: 'В Holst не отправилось', failed: true, meme: true }, kaitenTab);

  // Act
  const before = done.toast();
  done.runTimers(20000);
  failed.runTimers(20000);

  // Assert
  assert.equal(before, 'Core team: записал');
  assert.equal(done.toast(), null);
  assert.equal(failed.toast(), 'В Holst не отправилось');
});

test('Закладка на Holst: Kaiten не ответил — вход копируется, и подсказано, куда вставить', async () => {
  // Arrange
  const holst = page({ hostname: 'app.holst.so', stored: { 'social-auth-store': JSON.stringify({ token: 'test-holst-2' }) }, opener: fakeTab() });

  // Act
  holst.runTimers(2500);
  await flush();

  // Assert
  assert.deepEqual(holst.copied, ['test-holst-2']);
  assert.match(holst.alerts[0], /нажмите красную букву H вверху → «Вставить вход вручную»/);
  assert.deepEqual(holst.listeners.message, []);
});

test('Закладка на Holst без входа в Holst — просит войти и ничего не шлёт', () => {
  // Arrange
  const opener = fakeTab();

  // Act
  const holst = page({ hostname: 'app.holst.so', opener });

  // Assert
  assert.match(holst.alerts[0], /вы не вошли в Holst/);
  assert.deepEqual(opener.sent, []);
});

const DAY = 86400000;
const SNAPSHOT = 'Снимок начала планирования';
const LATER = Date.parse('2026-10-14T12:00:00+03:00');
const ago = (ms, now = Date.now()) => new Date(now - ms).toISOString();
const mskMidnight = (days) => new Date(Math.floor((Date.now() + 10800000) / DAY) * DAY - 10800000 + days * DAY).toISOString();
const teamComment = (savedAt, settings, author = 'Тестировщик') => ({
  text: core.settingsComment({ boardId: 303040, savedAt, settings: core.normalizeSettings(settings) }),
  created: savedAt,
  author: { full_name: author },
});
const posted = (env, mark) => env.requests.filter((item) => item.method === 'POST' && item.body.text.startsWith(mark)).map((item) => JSON.parse(item.body.text.match(/```json\s*([\s\S]*?)```/)[1]));

const teamKaiten = ({ stored = {}, comments = [], sprint = null, sprintId = null, cards = null, confirm = () => false, fail = () => false, forbid = () => false, now = null } = {}) => {
  const requests = [];
  const env = page({
    hostname: 'example.kaiten.ru',
    stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.settings.303040': JSON.stringify({ team: { back: { people: 1 } } }), ...stored },
    confirm,
    now,
    fetch: (url, options = {}) => {
      const body = options.body ? JSON.parse(options.body) : null;
      requests.push({ url, method: options.method || 'GET', body });
      if (fail(body)) return Promise.reject(new Error('нет сети'));
      if (options.method === 'DELETE') {
        const id = Number(url.split('/').pop());
        if (forbid(id)) return Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) });
        comments.splice(comments.findIndex((comment) => comment.id === id), 1);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      let reply = [];
      if (url.startsWith('/api/cards?') && cards) reply = cards;
      else if (url.startsWith('/api/cards?')) reply = [{ id: 1, title: 'Карта 1', size: 30, properties: { id_9004: [329378] }, state: 1, ...(sprintId ? { sprint_id: sprintId } : {}) }];
      else if (url.endsWith('/comments') && body) {
        reply = { text: body.text, created: new Date(now === null ? Date.now() : now).toISOString(), author: { full_name: 'Михаил' } };
        comments.unshift(reply);
      } else if (url.endsWith('/comments')) reply = comments.slice();
      else if (url.startsWith('/api/sprints/') && sprint) reply = { data: sprint };
      return Promise.resolve({ ok: true, json: () => Promise.resolve(reply) });
    },
  });
  return Object.assign(env, { requests, comments });
};

test('«Команда и дни» общие: панель берёт их из служебной карты, а не вписанное в этом браузере', async () => {
  // Arrange
  const kaiten = teamKaiten({ now: LATER, comments: [teamComment(ago(3600000, LATER), { team: { back: { people: 3 }, front: { people: 2 } } })] });

  // Act
  await flush();

  // Assert
  assert.match(kaiten.$('.summary').innerHTML, /<span class="of"> \/ 30<\/span>/);
  assert.match(kaiten.$('.shared').textContent, /^Общие для команды · последняя правка: Тестировщик, \d\d\.\d\d, \d\d:\d\d$/);
  assert.equal(JSON.parse(kaiten.stored.get('sprintCapacity.v1.settings.303040')).team.back.people, 3);
  assert.deepEqual(posted(kaiten, core.SETTINGS_MARK), []);
});

test('Правка в «Команде и днях» через две секунды уходит всей команде и ложится поверх чужой правки, сделанной тем временем', async () => {
  // Arrange
  const kaiten = teamKaiten({ comments: [teamComment(ago(3600000), { team: { back: { people: 3 }, front: { people: 2 } } })] });
  await flush();

  // Act
  kaiten.type('team.qa.people', '1');
  const waiting = kaiten.$('.shared').textContent;
  kaiten.comments.unshift(teamComment(ago(60000), { team: { back: { people: 3 }, front: { people: 4 } } }, 'Коллега'));
  kaiten.runTimers(2000);
  await flush();

  // Assert
  const saved = posted(kaiten, core.SETTINGS_MARK);
  assert.equal(waiting, 'Сохраняю для всей команды…');
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0].settings.team, { back: { people: 3, absence: 0 }, front: { people: 4, absence: 0 }, qa: { people: 1, absence: 0 } });
  assert.match(kaiten.$('.shared').textContent, /^Общие для команды · последняя правка: Михаил, /);
  assert.deepEqual(JSON.parse(kaiten.stored.get('sprintCapacity.v1.edits.303040')), { at: 0, values: {} });
});

test('Неотправленная правка старше чужого сохранения при открытии выбрасывается, свежая — уходит команде', async () => {
  // Arrange
  const comments = () => [teamComment(ago(3600000, LATER), { team: { back: { people: 3 } } })];
  const edit = (at) => ({ 'sprintCapacity.v1.edits.303040': JSON.stringify({ at, values: { 'team.back.people': '5' } }) });

  // Act
  const stale = teamKaiten({ now: LATER, stored: edit(LATER - 2 * 3600000), comments: comments() });
  const fresh = teamKaiten({ now: LATER, stored: edit(LATER - 600000), comments: comments() });
  await flush();

  // Assert
  assert.deepEqual(posted(stale, core.SETTINGS_MARK), []);
  assert.match(stale.$('.summary').innerHTML, /<span class="of"> \/ 30<\/span>/);
  assert.deepEqual(JSON.parse(stale.stored.get('sprintCapacity.v1.edits.303040')), { at: 0, values: {} });
  assert.deepEqual(posted(fresh, core.SETTINGS_MARK).map((item) => item.settings.team.back.people), [5]);
});

test('«Начать планирование» нового цикла: снимок пишет «Команду и дни» как факт, потом у всех «нет, чел.-дн» и праздники обнуляются, рабочих дней снова 10', async () => {
  // Arrange
  const asked = [];
  const kaiten = teamKaiten({
    now: LATER,
    comments: [teamComment(ago(3600000, LATER), { workDays: 7, holidays: 1, team: { back: { people: 3, absence: 2 }, front: { people: 2, absence: 1 } } })],
    confirm: (text) => asked.push(text) > 0,
  });
  await flush();

  // Act
  kaiten.click('start-planning');
  await flush();

  // Assert
  const posts = kaiten.requests.filter((item) => item.method === 'POST').map((item) => item.body.text.split(',')[0]);
  assert.match(asked[0], /^Core team: начать планирование для всей команды\? .*Потом «нет, чел\.-дн» и «праздников» обнулятся, а «рабочих дней» вернутся к 10 — впишите их на новый спринт\.$/);
  assert.deepEqual(posts, ['Снимок начала планирования', 'Команда и дни']);
  assert.deepEqual(posted(kaiten, SNAPSHOT)[0].capacity, { back: 16, front: 11 });
  assert.deepEqual(posted(kaiten, core.SETTINGS_MARK)[0].settings, core.normalizeSettings({ team: { back: { people: 3 }, front: { people: 2 } } }));
  assert.deepEqual(kaiten.alerts, []);
});

test('После 12.10 «Команда и дни», сохранённые до 12.10, считаются с SP в день 2, и «Начать планирование» записывает 2 для всей команды', async () => {
  // Arrange
  const kaiten = teamKaiten({
    now: LATER,
    comments: [teamComment('2026-10-09T09:00:00.000Z', { team: { back: { people: 3 } } })],
    confirm: () => true,
  });
  await flush();
  const before = kaiten.$('.summary').innerHTML;

  // Act
  kaiten.click('start-planning');
  await flush();

  // Assert
  assert.match(before, /<span class="of"> \/ 60<\/span>/);
  assert.deepEqual(posted(kaiten, core.SETTINGS_MARK).map((item) => [item.settings.coefficient, item.settings.team.back.people]), [[2, 3]]);
  assert.deepEqual(kaiten.alerts, []);
});

test('«Начать планирование» ещё раз в течение трёх дней: снимок заменяется, «Команда и дни» не обнуляются', async () => {
  // Arrange
  const asked = [];
  const kaiten = teamKaiten({
    comments: [teamComment(ago(3600000), { team: { back: { people: 3, absence: 2 } } }), planningStart(ago(7200000))],
    confirm: (text) => asked.push(text) > 0,
  });
  await flush();

  // Act
  kaiten.click('start-planning');
  await flush();

  // Assert
  assert.match(asked[0], /^Core team: начать планирование заново\? Снимок от .* заменится текущей доской у всей команды\. «Команда и дни» не обнулятся\.$/);
  assert.equal(posted(kaiten, SNAPSHOT).length, 1);
  assert.deepEqual(posted(kaiten, core.SETTINGS_MARK), []);
});

test('Спринт в Kaiten закончился, а планирования не было — жёлтое напоминание, раскрывашки свёрнуты, «Начать» снова синяя', async () => {
  // Arrange
  const sprint = { id: 501, start_date: ago(14 * DAY, LATER), finish_date: ago(3600000, LATER), actual_finish_date: ago(1800000, LATER) };
  const kaiten = teamKaiten({ now: LATER, sprintId: 501, sprint, comments: [planningStart(ago(20 * DAY, LATER))] });

  // Act
  await flush();

  // Assert
  assert.equal(kaiten.$('.remind').innerHTML, '<div class="tip">Пора планировать спринт. 1) Проверьте «Команда и дни»: это факт уходящего спринта. 2) Нажмите «Начать планирование».</div>');
  assert.deepEqual([Boolean(kaiten.$('.planning').open), Boolean(kaiten.$('.settings').open)], [false, false]);
  assert.match(kaiten.$('.planning').innerHTML, /title="Когда: один раз за спринт[^"]*">Начать планирование<\/button>/);
  assert.equal(JSON.parse(kaiten.stored.get('sprintCapacity.v1.sprint.303040')), 501);
});

test('После обновления страницы все раскрывашки свёрнуты во всех скинах: «Команда и дни», «Планирование», «Проверить», «Очередь» и «Настройки» дейлика — даже если их раскрыли, висит напоминание или в команде никого', async () => {
  // Arrange
  const sprint = { id: 501, start_date: ago(14 * DAY, LATER), finish_date: ago(3600000, LATER), actual_finish_date: ago(1800000, LATER) };
  const comments = [planningStart(ago(20 * DAY, LATER))];
  const first = teamKaiten({ now: LATER, sprintId: 501, sprint, comments });
  await flush();
  for (const name of ['settings', 'planning', 'warnings']) turn(first, first.$(`.${name}`), true);
  first.click('daily');
  await flush();
  turn(first, dailyPart(first, 'line'), true);
  turn(first, dailyPart(first, 'edit'), true);
  const stored = { ...Object.fromEntries(first.stored), 'sprintCapacity.v1.open': JSON.stringify({ settings: true, planning: true, warnings: true, line: true, edit: true }) };

  // Act
  const again = ['dungeon', 'classic', 'unicorn'].map((skin) => teamKaiten({ now: LATER, sprintId: 501, sprint, comments, stored: { ...stored, 'sprintCapacity.v1.skin': JSON.stringify(skin) } }));
  const empty = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();

  // Assert
  for (const kaiten of again) {
    assert.match(kaiten.$('.remind').innerHTML, /Пора планировать спринт/);
    assert.equal(kaiten.$('.tabs').dataset.mode, 'daily');
    assert.deepEqual(['settings', 'planning', 'warnings'].map((name) => Boolean(kaiten.$(`.${name}`).open)), [false, false, false]);
    assert.deepEqual(['line', 'edit'].map((name) => Boolean(dailyPart(kaiten, name).open)), [false, false]);
  }
  assert.equal(Boolean(empty.$('.settings').open), false);
  assert.deepEqual([...first.stored.keys()].filter((key) => /\.(open|remind\.\d+)$/.test(key)), []);
});

test('Спринт закончился по датам, а в Kaiten не завершён — жёлтая подсказка с датой и числом карт в колонке Done, без Waiting for release', async () => {
  // Arrange
  const card = (id, column, state) => ({ id, title: `Карта ${id}`, size: 3, properties: { id_9002: 3, id_9004: [329378] }, state, sprint_id: 503, column: { title: column } });
  const sprint = { id: 503, start_date: ago(14 * DAY, LATER), finish_date: ago(2 * DAY, LATER), actual_finish_date: null };
  const kaiten = teamKaiten({ now: LATER, sprintId: 503, sprint, cards: [card(1, 'Done', 3), card(2, 'Waiting for release', 2), card(3, 'Done', 3), card(4, 'Test', 2)], comments: [planningStart(ago(20 * DAY, LATER))] });

  // Act
  await flush();

  // Assert
  assert.equal(kaiten.$('.remind').innerHTML, '<div class="tip">Пора планировать спринт. 1) Проверьте «Команда и дни»: это факт уходящего спринта. 2) Нажмите «Начать планирование».</div><div class="tip">Спринт закончился 12.10, в Kaiten не завершён. В Done — 2 карты</div>');
  assert.equal(kaiten.$('.status').innerHTML, '');
});

test('Спринт в Kaiten завершён — подсказки «не завершён» нет', async () => {
  // Arrange
  const sprint = { id: 504, start_date: ago(14 * DAY, LATER), finish_date: ago(2 * DAY, LATER), actual_finish_date: ago(DAY, LATER) };
  const kaiten = teamKaiten({ now: LATER, sprintId: 504, sprint, comments: [planningStart(ago(20 * DAY, LATER))] });

  // Act
  await flush();

  // Assert
  assert.doesNotMatch(kaiten.$('.remind').innerHTML, /не завершён/);
});

test('Посреди спринта напоминания нет, а даты спринта панель берёт из Kaiten не на каждом обновлении', async () => {
  // Arrange
  const sprint = { id: 502, start_date: ago(5 * DAY), finish_date: ago(-9 * DAY), actual_finish_date: null };
  const kaiten = teamKaiten({ sprintId: 502, sprint });
  await flush();

  // Act
  kaiten.runTimers(60000);
  await flush();

  // Assert
  assert.equal(kaiten.$('.remind').innerHTML, '');
  assert.equal(kaiten.$('.planning').open, undefined);
  assert.equal(kaiten.requests.filter((item) => item.url.startsWith('/api/sprints/')).length, 1);
});

test('Подсказка у «рабочих дней»: будни по датам спринта в Kaiten; у закончившегося спринта и без спринта её нет', async () => {
  // Arrange
  const running = { id: 502, start_date: mskMidnight(-5), finish_date: mskMidnight(9), actual_finish_date: null };
  const ended = { id: 501, start_date: ago(16 * DAY), finish_date: ago(2 * DAY), actual_finish_date: null };

  // Act
  const kaitens = [teamKaiten({ sprintId: 502, sprint: running }), teamKaiten({ sprintId: 501, sprint: ended }), teamKaiten()];
  await flush();

  // Assert
  const hints = kaitens.map((kaiten) => [kaiten.$('.days-hint').hidden, kaiten.$('.days-hint').textContent, kaiten.$('.days-hint').classList.contains('off')]);
  assert.equal(hints[0][0], false);
  assert.match(hints[0][1], /^по датам в Kaiten \(\d\d\.\d\d–\d\d\.\d\d\) — 10 будних дней$/);
  assert.deepEqual(hints.slice(1), [[true, '', false], [true, '', false]]);
  assert.equal(hints[0][2], false);
});

test('Подсказка у «рабочих дней» желтеет, когда вписано не столько, сколько будней по датам спринта, и гаснет после правки', async () => {
  // Arrange
  const sprint = { id: 502, start_date: mskMidnight(-5), finish_date: mskMidnight(9), actual_finish_date: null };
  const kaiten = teamKaiten({ sprintId: 502, sprint, comments: [teamComment(ago(3600000), { workDays: 8, team: { back: { people: 3 } } })] });
  await flush();
  const wrong = [kaiten.$('.days-hint').textContent, kaiten.$('.days-hint').classList.contains('off')];

  // Act
  kaiten.type('workDays', '10');

  // Assert
  assert.match(wrong[0], /^по датам в Kaiten \(\d\d\.\d\d–\d\d\.\d\d\) — 10 будних дней, а вписано 8$/);
  assert.equal(wrong[1], true);
  assert.match(kaiten.$('.days-hint').textContent, /^по датам в Kaiten \(\d\d\.\d\d–\d\d\.\d\d\) — 10 будних дней$/);
  assert.equal(kaiten.$('.days-hint').classList.contains('off'), false);
});

test('Подсказки у «рабочих дней» нет, если «Начать планирование» нажали во второй половине спринта: поля уже про следующий', async () => {
  // Arrange
  const sprint = { id: 502, start_date: mskMidnight(-10), finish_date: mskMidnight(4), actual_finish_date: null };

  // Act
  const kaitens = [planningStart(mskMidnight(-11)), planningStart(ago(3600000))].map((comment) => teamKaiten({ sprintId: 502, sprint, comments: [comment] }));
  await flush();

  // Assert
  assert.deepEqual(kaitens.map((kaiten) => kaiten.$('.days-hint').hidden), [false, true]);
});

test('Подсказка у «рабочих дней» видна сразу, когда даты спринта панель помнит с прошлого открытия', async () => {
  // Arrange
  const dates = { id: 502, start: Date.parse(mskMidnight(-5)), finish: Date.parse(mskMidnight(9)) - 1, closedAt: null, at: Date.now() - 3600000 };

  // Act
  const kaiten = teamKaiten({ sprintId: 502, stored: { 'sprintCapacity.v1.sprintDates.502': JSON.stringify(dates) } });
  await flush();

  // Assert
  assert.match(kaiten.$('.days-hint').textContent, /^по датам в Kaiten \(\d\d\.\d\d–\d\d\.\d\d\) — 10 будних дней$/);
  assert.equal(kaiten.requests.filter((item) => item.url.startsWith('/api/sprints/')).length, 0);
});

test('После «Начать планирование» напоминание просит вписать новый спринт и нажать «Закончить»', async () => {
  // Arrange
  const sprint = { id: 503, start_date: ago(14 * DAY), finish_date: ago(3600000), actual_finish_date: ago(1800000) };

  // Act
  const kaiten = teamKaiten({ sprintId: 503, sprint, comments: [planningStart(ago(600000))] });
  await flush();

  // Assert
  assert.match(kaiten.$('.remind').innerHTML, /^<div class="tip">Планирование идёт\. 1\) Впишите «Команда и дни» на новый спринт: людей, отпуска и отгулы, праздники, рабочие дни\. 2\) Нажмите «Закончить планирование»\.<\/div>$/);
  assert.match(kaiten.$('.planning').innerHTML, /class="again">Начать планирование<\/button>/);
});

test('Снимок записан, а обнулить «Команду и дни» не вышло — панель просит вписать новый спринт вручную и не обещает повторить', async () => {
  // Arrange
  const kaiten = teamKaiten({
    comments: [teamComment(ago(3600000), { team: { back: { people: 3, absence: 2 } } })],
    confirm: () => true,
    fail: (body) => Boolean(body && body.text.startsWith('Команда и дни')),
  });
  await flush();

  // Act
  kaiten.click('start-planning');
  await flush();

  // Assert
  assert.deepEqual(kaiten.alerts, ['«Команда и дни» не обнулились: нет сети. Впишите их на новый спринт вручную: «нет, чел.-дн», «праздников» и «рабочих дней».']);
  assert.equal(kaiten.requests.filter((item) => item.method === 'POST' && item.body.text.startsWith(SNAPSHOT)).length, 1);
  assert.doesNotMatch(kaiten.$('.status').innerHTML, /повторю/);
});

const dailyAct = (kaiten, act, data = {}) => (kaiten.$('.daily').listeners.click || []).forEach((listener) => listener({ target: { closest: () => ({ dataset: { daily: act, ...data }, disabled: false }) } }));
const dailyPart = (kaiten, name) => kaiten.$('.daily').querySelector(`[data-part="${name}"]`);

const dailySide = (kaiten) => kaiten.shadow.children.find((element) => element.className === 'daily-side');
const flyCard = (kaiten) => dailySide(kaiten).children.find((element) => element.className === 'fly');
const dailyDay = (kaiten, key) => JSON.parse(kaiten.stored.get(`sprintCapacity.v1.daily.${key}.day`));
const pullLever = (kaiten) => (dailySide(kaiten).listeners.keydown || []).forEach((listener) => listener({ key: 'Enter', preventDefault() {}, target: { closest: () => dailySide(kaiten).querySelector('.knob') } }));
const pickSkin = (kaiten, skin) => (kaiten.shadow.listeners.click || []).forEach((listener) => listener({ target: { closest: () => ({ dataset: { act: 'skin', skin } }) } }));
const styles = (kaiten) => kaiten.shadow.children.filter((element) => element.tagName === 'STYLE').map((element) => element.textContent);

const CLIP_SIZES = { 'gear.mp3': 1, 'lever.mp3': 2 };
const clipFetch = (fetched) => (url) => {
  fetched.push(url);
  const file = url.split('/').pop();
  return CLIP_SIZES[file] ? Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(CLIP_SIZES[file])) }) : Promise.reject(new Error('нет сети в тесте'));
};

const fakeAudio = (heard) => class {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }

  resume() {
    return Promise.resolve();
  }

  decodeAudioData(data) {
    return Promise.resolve({ clip: data.byteLength === CLIP_SIZES['gear.mp3'] ? 'gear' : 'lever' });
  }

  createBufferSource() {
    const level = (node) => (node === this.destination ? 1 : node && node.gain ? node.gain.value * level(node.next) : 0);
    const source = {
      buffer: null,
      playbackRate: { value: 1 },
      connect: (amp) => {
        source.amp = amp;
      },
      start: (when) => heard.push({ clip: source.buffer.clip, when, rate: source.playbackRate.value, gain: source.amp.gain.value, level: level(source.amp) }),
    };
    return source;
  }

  createGain() {
    const node = {
      gain: { value: 1 },
      connect: (next) => {
        node.next = next;
      },
    };
    return node;
  }
};

const settle = async () => {
  for (let index = 0; index < 6; index += 1) await flush();
};

test('Дейлик: вкладка есть у Core team; без входа в Holst дейлик сразу показывает первого по списку, рычаг ждёт рывка и к Holst не подключается', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  const shown = !kaiten.$('.tabs').hidden;

  // Act
  kaiten.click('daily');
  await flush();

  // Assert
  assert.equal(shown, true);
  assert.equal(kaiten.$('.daily').hidden, false);
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Михаил Н.');
  assert.equal(dailySide(kaiten).classList.contains('ready'), true);
  assert.deepEqual(kaiten.sockets, []);
});

test('Дейлик: на виду факелы с огнём и барабан, кнопки рывка нет — рычаг дёргает ведущий; очередь и «Сбросить очередь» — в свёрнутой «Очереди», ведущий, список и «Назад» — в свёрнутых «Настройках»; между ними «Проверить», спрятанная, пока нечего проверять', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();

  // Act
  kaiten.click('daily');
  await flush();
  const [main, line = '', check = '', settings = ''] = kaiten.$('.daily').innerHTML.split('<details');

  // Assert
  assert.doesNotMatch(main, /data-daily="pull"|class="go"/);
  assert.match(settings, /<div class="hint">Рычаг дёргает ведущий у себя/);
  assert.match(main, /data-part="reel"/);
  assert.doesNotMatch(main, /data-part="queue"|data-daily="reset"/);
  assert.match(line, /^ data-part="line">\s*<summary>Очередь<\/summary>\s*<div class="queue-head"><button type="button" class="reset" data-daily="reset"[^>]*>Сбросить очередь<\/button><\/div>\s*<div class="queue" data-part="queue"><\/div>\s*<\/details>\s*$/);
  assert.equal((main.match(/class="torch"/g) || []).length, 2);
  assert.equal((main.match(/<canvas class="fire" width="30" height="56"><\/canvas>/g) || []).length, 2);
  assert.doesNotMatch(main, /data-daily="(host|undo|people-save|people-default)"|data-part="(people|host)"/);
  assert.match(settings, /^ data-part="edit">\s*<summary>Настройки<\/summary>/);
  assert.match(check, /^ data-part="check" hidden>\s*<summary>Проверить <span class="count" data-part="check-count"><\/span><\/summary>\s*<div class="check" data-part="check-list"><\/div>/);
  assert.equal(dailyPart(kaiten, 'check').hidden, true);
  for (const part of ['data-daily="host"', 'data-daily="undo"', 'data-part="people"', 'data-daily="people-save"']) assert.ok(settings.includes(part), part);
  assert.doesNotMatch(settings, /data-daily="reset"/);
  assert.doesNotMatch(kaiten.$('.daily').innerHTML, /host-here|Я ведущий/);
});

test('Дейлик: при «уменьшить движение» в системе рычаг, свет факелов, сурок и надпись стоят, а угли, дым и искры не летят', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();

  // Act
  const css = kaiten.shadow.children.filter((element) => element.tagName === 'STYLE').map((element) => element.textContent).join('\n');
  const media = css.split('\n').find((line) => line.startsWith('@media (prefers-reduced-motion: reduce)') && line.includes('.daily'));
  const [, still, gone] = media.match(/^@media \(prefers-reduced-motion: reduce\) \{ ([^{}]*) \{ animation: none; \} ([^{}]*) \{ display: none; \} \}$/);

  // Assert
  for (const selector of ['.daily-side .knob', '.daily-side .fly', '.daily-side .roast', '.daily-side .roast b', '.daily .torch .glow', '.daily .light::before', '.daily .light::after']) assert.ok(still.split(', ').includes(selector), selector);
  for (const selector of ['.daily-side .spark', '.daily .torch .ember', '.daily .torch .smoke']) assert.ok(gone.split(', ').includes(selector), selector);
});

const fakeFire = (painted) => ({
  getContext: () => ({
    createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: (image) => painted.push(image.data.some((value, index) => index % 4 === 3 && value > 0)),
  }),
});

test('Дейлик: огонь факелов горит, пока дейлик открыт, и гаснет на вкладке «Спринт»; при «уменьшить движение» — один неподвижный кадр', async () => {
  // Arrange
  const open = (reduced) => {
    const painted = [];
    const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), reduced, stored: { 'sprintCapacity.v1.board': '303040' } });
    kaiten.$('.daily').querySelectorAll = (selector) => (selector === 'canvas.fire' ? [fakeFire(painted), fakeFire(painted)] : []);
    return { kaiten, painted };
  };
  const live = open(false);
  const still = open(true);
  await flush();

  // Act
  for (const { kaiten } of [live, still]) {
    kaiten.click('daily');
    kaiten.clock += 40;
    kaiten.runTimers(16);
  }
  const lit = live.painted.length;
  live.kaiten.click('sprint');
  live.kaiten.clock += 40;
  live.kaiten.runTimers(16);

  // Assert
  assert.equal(lit, 4);
  assert.equal(live.painted.length, 4);
  assert.ok(live.painted.every(Boolean));
  assert.equal(live.kaiten.timers.filter((timer) => timer.ms === 16 && !timer.cleared).length, 0);
  assert.equal(still.painted.length, 2);
});

test('Дейлик: ведущего отметили «нет сегодня» — начинает следующий за ним по кругу, в «Настройках» так и написано', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.daily.core.host': JSON.stringify('Михаил В.'), 'sprintCapacity.v1.daily.core.day': JSON.stringify({ day: '2026-10-19', current: null, done: [], away: { 'Михаил В.': true }, seq: 1 }) } });
  await flush();

  // Act
  kaiten.click('daily');
  await flush();

  // Assert
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Павел Т.');
  assert.equal(dailyPart(kaiten, 'host').innerHTML, 'Ведущего Михаил В. сегодня нет — начинает следующий за ним по кругу');
  assert.equal(dailyPart(kaiten, 'host').hidden, false);
});

test('Дейлик: рычаг сдвигает очередь по кругу, очередь хранится в панели — ушли на «Спринт» и вернулись, говорит тот же', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.daily.core.host': JSON.stringify('Михаил Т.') } });
  await flush();
  kaiten.click('daily');
  await flush();
  const first = dailyPart(kaiten, 'reel').textContent;

  // Act
  pullLever(kaiten);
  kaiten.click('sprint');
  kaiten.click('daily');

  // Assert
  const day = JSON.parse(kaiten.stored.get('sprintCapacity.v1.daily.core.day'));
  assert.equal(first, 'Михаил Т.');
  assert.deepEqual(day.done, ['Михаил Т.']);
  assert.equal(day.current, 'Павел Р.');
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Павел Р.');
  assert.equal(kaiten.stored.has('sprintCapacity.v1.daily.mobile.day'), false);
});

test('Дейлик: переключили на Mobile team — дейлик открыт, на нём список и ведущий Mobile; вернули Core team — снова очередь Core', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.daily.mobile.host': JSON.stringify('Лена Н.') } });
  await flush();
  kaiten.click('daily');
  await flush();
  const coreFirst = dailyPart(kaiten, 'reel').textContent;

  // Act
  kaiten.pick('board', '319248');
  await flush();
  const mobile = { hidden: kaiten.$('.daily').hidden, reel: dailyPart(kaiten, 'reel').textContent, people: dailyPart(kaiten, 'people').value, host: kaiten.$('.daily').querySelector('[data-daily="host"]').innerHTML };
  kaiten.pick('board', '303040');
  await flush();

  // Assert
  assert.equal(coreFirst, 'Михаил Н.');
  assert.equal(mobile.hidden, false);
  assert.equal(mobile.reel, 'Лена Н.');
  assert.equal(mobile.people, core.SPRINT_CAPACITY.daily[319248].people.join('\n'));
  assert.match(mobile.host, /<option value="Лена Н." selected>Лена Н.<\/option>/);
  assert.equal(kaiten.$('.daily').hidden, false);
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Михаил Н.');
  assert.equal(dailyPart(kaiten, 'people').value, core.SPRINT_CAPACITY.daily[303040].people.join('\n'));
});

test('Дейлик: все рассказали — на барабане «Теперь inbox», рычаг заперт и очередь не трогает', async () => {
  // Arrange
  const people = core.SPRINT_CAPACITY.daily[303040].people;
  const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.daily.core.day': JSON.stringify({ day: '2026-10-19', current: null, done: people, away: {}, seq: 10 }) } });
  await flush();

  // Act
  kaiten.click('daily');
  await flush();
  pullLever(kaiten);

  // Assert
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Теперь inbox');
  assert.equal(dailySide(kaiten).classList.contains('locked'), true);
  assert.equal(dailySide(kaiten).classList.contains('ready'), false);
  assert.equal(JSON.parse(kaiten.stored.get('sprintCapacity.v1.daily.core.day')).seq, 10);
});

test('Дейлик: при «уменьшить движение» барабан показывает нового говорящего, а не прошлого, табличка у рычага не вылетает', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', reduced: true, stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  kaiten.click('daily');
  await flush();

  // Act
  pullLever(kaiten);

  // Assert
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Михаил В.');
  assert.equal(flyCard(kaiten), undefined);
});

test('Дейлик: на вкладке дейлика рычаг двигает очередь, а табличка «Говорит …» у рычага не вылетает — имя уже в барабане', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), audio: fakeAudio([]), fetch: clipFetch([]), stored: { 'sprintCapacity.v1.board': '319248' } });
  await flush();
  kaiten.click('daily');
  await flush();

  // Act
  pullLever(kaiten);
  await settle();
  kaiten.runTimers(1450);

  // Assert
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Артём Л.');
  assert.deepEqual([dailyDay(kaiten, 'mobile').current, dailyDay(kaiten, 'mobile').done], ['Артём Л.', ['Михаил В.']]);
  assert.equal(flyCard(kaiten), undefined);
});

test('Дейлик: сохранённый список сокращает фамилии до буквы и хранится в панели у своей команды', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  kaiten.click('daily');
  await flush();
  dailyPart(kaiten, 'people').value = 'Пётр Иванов\nАнна Смирнова\nТимур';

  // Act
  dailyAct(kaiten, 'people-save');

  // Assert
  assert.deepEqual(JSON.parse(kaiten.stored.get('sprintCapacity.v1.daily.core.people')), ['Пётр И.', 'Анна С.', 'Тимур']);
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Пётр И.');
  assert.equal(dailyPart(kaiten, 'people').value, 'Пётр И.\nАнна С.\nТимур');
  assert.equal(kaiten.stored.has('sprintCapacity.v1.daily.mobile.people'), false);
});

const dailyShared = (savedAt, record, author = 'Тестировщик', boardId = 303040) => ({ text: core.dailyComment({ boardId, savedAt, people: null, host: '', ...record }), created: savedAt, author: { full_name: author } });
const pickHost = (kaiten, value) => (kaiten.$('.daily').listeners.change || []).forEach((listener) => listener({ target: { dataset: { daily: 'host' }, value } }));
const dailyStored = (kaiten, name) => JSON.parse(kaiten.stored.get(`sprintCapacity.v1.daily.core.${name}`));

test('Дейлик: ведущий и список общие — панель берёт их из служебной карты, а не выбранные в этом браузере; ведущий Mobile из карты Core не трогает', async () => {
  // Arrange
  const kaiten = teamKaiten({
    now: LATER,
    stored: { 'sprintCapacity.v1.daily.core.host': JSON.stringify('Михаил Т.'), 'sprintCapacity.v1.daily.core.at': JSON.stringify(ago(7200000, LATER)) },
    comments: [dailyShared(ago(3600000, LATER), { host: 'Михаил В.', people: ['Михаил В.', 'Денис', 'Вика'] }), dailyShared(ago(60000, LATER), { host: 'Лена Н.' }, 'Коллега', 319248)],
  });
  await settle();

  // Act
  kaiten.click('daily');
  await flush();

  // Assert
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Михаил В.');
  assert.equal(dailyPart(kaiten, 'people').value, 'Михаил В.\nДенис\nВика');
  assert.equal(dailyStored(kaiten, 'host'), 'Михаил В.');
  assert.match(dailyPart(kaiten, 'shared').textContent, /^Общие для команды · последняя правка: Тестировщик, \d\d\.\d\d, \d\d:\d\d$/);
  assert.deepEqual(posted(kaiten, core.DAILY_MARK), []);
});

test('Дейлик: выбрали ведущего или сохранили список — уходит всей команде комментарием «Дейлик, Core team» в служебную карту; второй выбор, пока первый в пути, уходит следом', async () => {
  // Arrange
  const kaiten = teamKaiten({ now: LATER });
  await settle();
  kaiten.click('daily');
  await flush();
  const before = dailyPart(kaiten, 'shared').textContent;

  // Act
  pickHost(kaiten, 'Михаил В.');
  const waiting = dailyPart(kaiten, 'shared').textContent;
  pickHost(kaiten, 'Денис');
  await settle();
  dailyPart(kaiten, 'people').value = 'Михаил Волков\nДенис';
  dailyAct(kaiten, 'people-save');
  await settle();

  // Assert
  const saved = posted(kaiten, core.DAILY_MARK);
  assert.equal(before, 'Общих ещё нет — выберите ведущего или сохраните список, и они уйдут всей команде');
  assert.equal(waiting, 'Сохраняю для всей команды…');
  assert.deepEqual(saved.map((item) => [item.boardId, item.host, item.people]), [[303040, 'Михаил В.', null], [303040, 'Денис', null], [303040, 'Денис', ['Михаил В.', 'Денис']]]);
  assert.match(kaiten.requests.find((item) => item.method === 'POST').body.text, /^Дейлик, Core team\. Ведущий: Михаил В\.; список: по умолчанию\n/);
  assert.match(dailyPart(kaiten, 'shared').textContent, /^Общие для команды · последняя правка: Михаил, /);
  assert.equal(dailyStored(kaiten, 'pending'), false);
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Денис');
});

test('Дейлик: ведущий не ушёл команде — остался в этом браузере, панель так и пишет и отправляет при обновлении поверх более старого общего; у коллеги появилось свежее — панель берёт его и своё не отправляет', async () => {
  // Arrange
  let down = true;
  const kaiten = teamKaiten({ now: LATER, fail: (body) => down && Boolean(body), comments: [dailyShared(ago(3600000, LATER), { host: 'Роман Д.' })] });
  const other = teamKaiten({ now: LATER, fail: (body) => Boolean(body) });
  await settle();
  for (const env of [kaiten, other]) {
    env.click('daily');
    await flush();
    pickHost(env, 'Михаил В.');
  }
  await settle();
  const failed = { shared: dailyPart(kaiten, 'shared').textContent, toast: dailyPart(kaiten, 'toast').textContent, host: dailyStored(kaiten, 'host'), pending: dailyStored(kaiten, 'pending') };
  other.comments.unshift(dailyShared(new Date(LATER + 60000).toISOString(), { host: 'Денис О.' }, 'Коллега'));

  // Act
  down = false;
  kaiten.runTimers(60000);
  other.runTimers(60000);
  await settle();

  // Assert
  assert.deepEqual(failed, { shared: 'Не ушло команде — повторю при обновлении панели', toast: 'Ведущий и список не ушли команде: нет сети — в этом браузере сохранила, повторю при обновлении', host: 'Михаил В.', pending: true });
  assert.deepEqual(posted(kaiten, core.DAILY_MARK).map((item) => item.host), ['Михаил В.', 'Михаил В.']);
  assert.match(dailyPart(kaiten, 'shared').textContent, /^Общие для команды · последняя правка: Михаил, /);
  assert.equal(dailyStored(kaiten, 'pending'), false);
  assert.deepEqual(posted(other, core.DAILY_MARK).map((item) => item.host), ['Михаил В.']);
  assert.equal(dailyStored(other, 'host'), 'Денис О.');
  assert.equal(dailyStored(other, 'pending'), false);
  assert.equal(dailyPart(other, 'reel').textContent, 'Денис О.');
  assert.match(dailyPart(other, 'shared').textContent, /^Общие для команды · последняя правка: Коллега, /);
});

const removed = (kaiten) => kaiten.requests.filter((item) => item.method === 'DELETE').map((item) => item.url);

test('Сохранили «Команду и дни» или дейлик — панель удаляет из служебной карты комментарии того же вида и той же доски старше четырёх дней; свежие, другую доску, снимки и пояснение не трогает, отказ Kaiten удалить сохранению не мешает', async () => {
  // Arrange
  const old = ago(4 * DAY + 60000, LATER);
  const young = ago(4 * DAY - 60000, LATER);
  const comments = [
    { ...teamComment(young, { team: { back: { people: 3 } } }), id: 11 },
    { ...teamComment(old, { team: { back: { people: 2 } } }, 'Коллега'), id: 12 },
    { ...teamComment(ago(9 * DAY, LATER), { team: { back: { people: 4 } } }), id: 13 },
    { text: core.settingsComment({ boardId: 319248, savedAt: old, settings: core.normalizeSettings({ team: { back: { people: 7 } } }) }), created: old, author: { full_name: 'Коллега' }, id: 14 },
    { ...dailyShared(young, { host: 'Тимур Л.' }), id: 21 },
    { ...dailyShared(old, { host: 'Денис О.' }), id: 22 },
    { ...dailyShared(old, { host: 'Лена Н.' }, 'Коллега', 319248), id: 23 },
    { ...planningStart(ago(20 * DAY, LATER)), id: 31 },
    { text: 'Здесь панель «Ёмкость спринта» хранит снимки начала планирования', created: ago(30 * DAY, LATER), id: 32 },
  ];
  const kaiten = teamKaiten({ now: LATER, comments, forbid: (id) => id === 12 });
  await settle();

  // Act
  kaiten.type('team.qa.people', '1');
  kaiten.runTimers(2000);
  await settle();
  const afterTeam = removed(kaiten);
  kaiten.click('daily');
  await flush();
  pickHost(kaiten, 'Павел Р.');
  await settle();

  // Assert
  assert.deepEqual(afterTeam, ['/api/cards/363820/comments/12', '/api/cards/363820/comments/13']);
  assert.deepEqual(removed(kaiten), [...afterTeam, '/api/cards/363820/comments/22']);
  assert.deepEqual(kaiten.comments.map((comment) => comment.id).filter(Boolean), [11, 12, 14, 21, 23, 31, 32]);
  assert.deepEqual(posted(kaiten, core.SETTINGS_MARK).map((item) => item.settings.team.qa.people), [1]);
  assert.deepEqual(posted(kaiten, core.DAILY_MARK).map((item) => item.host), ['Павел Р.']);
  assert.match(kaiten.$('.shared').textContent, /^Общие для команды · последняя правка: Михаил, /);
  assert.match(dailyPart(kaiten, 'shared').textContent, /^Общие для команды · последняя правка: Михаил, /);
});

test('«Команда и дни» или дейлик не ушли в Kaiten — старые комментарии остаются, панель ничего не удаляет', async () => {
  // Arrange
  const old = ago(9 * DAY, LATER);
  const kaiten = teamKaiten({ now: LATER, fail: (body) => Boolean(body), comments: [{ ...teamComment(old, { team: { back: { people: 2 } } }), id: 12 }, { ...dailyShared(old, { host: 'Денис О.' }), id: 22 }] });
  await settle();

  // Act
  kaiten.type('team.qa.people', '1');
  kaiten.runTimers(2000);
  await settle();
  kaiten.click('daily');
  await flush();
  pickHost(kaiten, 'Павел Р.');
  await settle();

  // Assert
  assert.equal(kaiten.requests.filter((item) => item.method === 'POST').length, 2);
  assert.deepEqual(removed(kaiten), []);
  assert.deepEqual(kaiten.comments.map((comment) => comment.id), [12, 22]);
});

test('Дейлик: рычаг звучит файлами с Pages — сначала треск шестерён, каждый щелчок двойной, потом один раз рубильник', async () => {
  // Arrange
  const heard = [];
  const fetched = [];
  const kaiten = page({ hostname: 'example.kaiten.ru', audio: fakeAudio(heard), fetch: clipFetch(fetched), stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  kaiten.click('daily');
  await settle();

  // Act
  pullLever(kaiten);
  await settle();

  // Assert
  const levers = heard.filter((item) => item.clip === 'lever');
  const gears = heard.filter((item) => item.clip === 'gear');
  const teeth = gears.filter((item) => item.rate >= 0.97);
  const meshes = gears.filter((item) => item.rate < 0.97);
  assert.ok(['gear.mp3', 'lever.mp3'].every((file) => fetched.includes(`https://toytronic22.github.io/kaiten-sprint-capacity/daily/${file}`)), fetched.join(' '));
  assert.equal(levers.length, 1);
  assert.equal(levers[0].when, 0.75);
  assert.equal(teeth.length, 15);
  assert.equal(meshes.length, 15);
  assert.ok(gears.every((item) => item.when > 0.1 && item.when < levers[0].when), gears.map((item) => item.when).join(' '));
  for (const mesh of meshes) assert.ok(teeth.some((tooth) => mesh.when - tooth.when > 0.01 && mesh.when - tooth.when < 0.03 && mesh.gain < tooth.gain), String(mesh.when));
});

test('Дейлик: рычаг ещё вдвое тише — рубильник доходит до колонок с громкостью 0,2–0,3 вместо 0,5, шестерни стихают так же', async () => {
  // Arrange
  const heard = [];
  const kaiten = page({ hostname: 'example.kaiten.ru', audio: fakeAudio(heard), fetch: clipFetch([]), stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  kaiten.click('daily');
  await settle();

  // Act
  pullLever(kaiten);
  await settle();

  // Assert
  const lever = heard.find((item) => item.clip === 'lever');
  const gears = heard.filter((item) => item.clip === 'gear');
  assert.ok(Math.abs(lever.level - 0.5 / 2) <= 0.05, String(lever.level));
  assert.equal(gears.length, 30);
  assert.ok(gears.every((item) => Math.abs(item.level - item.gain * lever.level) < 1e-9), gears.map((item) => item.level).join(' '));
});

const dragLever = (kaiten) => ['pointerdown', 'pointermove', 'pointerup'].forEach((type, index) => (dailySide(kaiten).listeners[type] || []).forEach((listener) => listener({ button: 0, clientY: index ? 600 : 100, pointerId: 1, preventDefault() {}, target: { closest: () => dailySide(kaiten).querySelector('.knob') } })));

test('Рычаг на вкладке «Спринт» звучит как в дейлике, двигает очередь и выпускает карточку с тем, кто говорит; дейлик не открывается', async () => {
  // Arrange
  const heard = [];
  const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), audio: fakeAudio(heard), fetch: clipFetch([]), stored: { 'sprintCapacity.v1.board': '319248' } });
  await flush();
  const side = { hidden: dailySide(kaiten).hidden, ready: dailySide(kaiten).classList.contains('ready'), locked: dailySide(kaiten).classList.contains('locked') };

  // Act
  pullLever(kaiten);
  await settle();
  const early = flyCard(kaiten);
  kaiten.runTimers(1450);

  // Assert
  assert.deepEqual(side, { hidden: false, ready: false, locked: false });
  assert.deepEqual([kaiten.$('.daily').hidden, kaiten.$('.tabs').dataset.mode], [true, 'sprint']);
  assert.equal(heard.filter((item) => item.clip === 'lever').length, 1);
  assert.equal(heard.filter((item) => item.clip === 'gear').length, 30);
  assert.equal(early, undefined);
  assert.match(flyCard(kaiten).innerHTML, /^<small>Говорит<\/small><b>Артём Л\.<\/b><i class="spark"/);
  assert.deepEqual([dailyDay(kaiten, 'mobile').current, dailyDay(kaiten, 'mobile').done], ['Артём Л.', ['Михаил В.']]);
});

test('Рычаг на вкладке «Спринт» ведёт ту же очередь, что и дейлик: после рывка дейлик показывает того же говорящего', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', reduced: true, now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.daily.core.day': JSON.stringify({ day: '2026-10-19', current: 'Михаил Н.', done: [], away: {}, seq: 1 }) } });
  await flush();

  // Act
  pullLever(kaiten);
  const card = flyCard(kaiten).innerHTML;
  kaiten.click('daily');
  await flush();

  // Assert
  assert.equal(card, '<small>Говорит</small><b>Михаил В.</b>');
  assert.deepEqual([dailyDay(kaiten, 'core').current, dailyDay(kaiten, 'core').done], ['Михаил В.', ['Михаил Н.']]);
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Михаил В.');
});

test('Рычаг на вкладке «Спринт» каждый раз берёт очередь из браузера — её могли сдвинуть в дейлике на другой вкладке Kaiten', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', reduced: true, now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  pullLever(kaiten);
  kaiten.stored.set('sprintCapacity.v1.daily.core.day', JSON.stringify({ day: '2026-10-19', current: 'Павел Т.', done: ['Михаил Н.', 'Михаил В.'], away: {}, seq: 3 }));

  // Act
  pullLever(kaiten);

  // Assert
  assert.equal(flyCard(kaiten).innerHTML, '<small>Говорит</small><b>Михаил Т.</b>');
  assert.deepEqual(dailyDay(kaiten, 'core').done, ['Михаил Н.', 'Михаил В.', 'Павел Т.']);
});

test('Рычаг на вкладке «Спринт» после последнего рассказчика выпускает «Теперь inbox», дальше очередь не трогает', async () => {
  // Arrange
  const told = ['Михаил Н.', 'Михаил В.', 'Павел Т.', 'Михаил Т.', 'Павел Р.', 'Роман Д.', 'Тимур Л.', 'Денис О.', 'Ксения Ш.'];
  const kaiten = page({ hostname: 'example.kaiten.ru', reduced: true, now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.daily.core.day': JSON.stringify({ day: '2026-10-19', current: 'Глеб Л.', done: told, away: {}, seq: 10 }) } });
  await flush();

  // Act
  pullLever(kaiten);
  const first = flyCard(kaiten);
  const last = first.innerHTML;
  const finished = kaiten.stored.get('sprintCapacity.v1.daily.core.day');
  pullLever(kaiten);

  // Assert
  assert.deepEqual([last, flyCard(kaiten).innerHTML], ['<b>Теперь inbox</b>', '<b>Теперь inbox</b>']);
  assert.notEqual(flyCard(kaiten), first);
  assert.deepEqual([dailyDay(kaiten, 'core').current, dailyDay(kaiten, 'core').done], [null, told.concat('Глеб Л.')]);
  assert.equal(kaiten.stored.get('sprintCapacity.v1.daily.core.day'), finished);
});

test('Рог единорога на вкладке «Спринт» тянется мышью: дотянули до щелчка — очередь сдвинулась и вылетела карточка', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', reduced: true, now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  pickSkin(kaiten, 'unicorn');

  // Act
  dragLever(kaiten);

  // Assert
  assert.equal(kaiten.$('.daily').hidden, true);
  assert.equal(flyCard(kaiten).innerHTML, '<small>Говорит</small><b>Михаил В.</b>');
  assert.equal(dailyDay(kaiten, 'core').current, 'Михаил В.');
});

test('Дейлик: «Сбросить очередь» с первого нажатия переспрашивает, со второго возвращает очередь к началу; без второго нажатия через три секунды — отбой', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.daily.core.day': JSON.stringify({ day: '2026-10-19', current: 'Павел Т.', done: ['Михаил Н.', 'Михаил В.'], away: { 'Роман Д.': true }, seq: 3 }) } });
  await flush();
  kaiten.click('daily');
  await flush();
  const reset = kaiten.$('.daily').querySelector('[data-daily="reset"]');
  const before = { disabled: reset.disabled, text: reset.textContent };

  // Act
  dailyAct(kaiten, 'reset');
  const asked = { text: reset.textContent, armed: reset.classList.contains('armed'), done: JSON.parse(kaiten.stored.get('sprintCapacity.v1.daily.core.day')).done };
  kaiten.runTimers(3000);
  const calmed = { text: reset.textContent, armed: reset.classList.contains('armed') };
  dailyAct(kaiten, 'reset');
  dailyAct(kaiten, 'reset');

  // Assert
  const day = JSON.parse(kaiten.stored.get('sprintCapacity.v1.daily.core.day'));
  assert.deepEqual(before, { disabled: false, text: 'Сбросить очередь' });
  assert.deepEqual(asked, { text: 'Точно сбросить?', armed: true, done: ['Михаил Н.', 'Михаил В.'] });
  assert.deepEqual(calmed, { text: 'Сбросить очередь', armed: false });
  assert.deepEqual(day.done, []);
  assert.equal(day.current, null);
  assert.deepEqual(day.away, { 'Роман Д.': true });
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Михаил Н.');
  assert.equal(reset.disabled, true);
});

const roasts = (kaiten) => kaiten.shadow.children.find((element) => element.className === 'daily-side').children.filter((element) => /^roast/.test(element.className));

test('Дейлик: говорящий не дёргает рычаг пять минут — рядом с панелью сурок кричит «ПРОЖАРКААА»; дёрнули рычаг — сурок пропал', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  kaiten.click('daily');
  await flush();

  // Act
  kaiten.clock += 5 * 60 * 1000 - 1000;
  kaiten.runTimers(5000);
  const early = roasts(kaiten).length;
  kaiten.clock += 2000;
  kaiten.runTimers(5000);
  const shouted = roasts(kaiten).map((element) => ({ className: element.className, html: element.innerHTML }));
  pullLever(kaiten);

  // Assert
  assert.equal(early, 0);
  assert.equal(shouted.length, 1);
  assert.equal(shouted[0].className, 'roast');
  assert.match(shouted[0].html, /^<b>ПРОЖАРКААА<\/b><img src="https:\/\/toytronic22\.github\.io\/kaiten-sprint-capacity\/daily\/roast\.gif"/);
  assert.equal(roasts(kaiten).length, 0);
});

test('Дейлик: сурок закрывается кликом, а если тот же говорящий молчит ещё пять минут — кричит снова', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  kaiten.click('daily');
  await flush();
  kaiten.clock += 5 * 60 * 1000 + 1000;
  kaiten.runTimers(5000);
  const [roast] = roasts(kaiten);

  // Act
  (roast.listeners.click || []).forEach((listener) => listener({}));
  const closed = roasts(kaiten).length;
  kaiten.clock += 5 * 60 * 1000 - 1000;
  kaiten.runTimers(5000);
  const early = roasts(kaiten).length;
  kaiten.clock += 2000;
  kaiten.runTimers(5000);

  // Assert
  assert.equal(roast.title, 'Нажмите, чтобы закрыть');
  assert.equal(closed, 0);
  assert.equal(early, 0);
  assert.equal(roasts(kaiten).length, 1);
  assert.equal(dailyPart(kaiten, 'reel').textContent, 'Михаил Н.');
});

test('Дейлик: после «Теперь inbox» сурок молчит; при «уменьшить движение» вместо гифки одна надпись', async () => {
  // Arrange
  const people = core.SPRINT_CAPACITY.daily[303040].people;
  const at = Date.parse('2026-10-19T07:00:00.000Z');
  const finished = page({ hostname: 'example.kaiten.ru', now: at, stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.daily.core.day': JSON.stringify({ day: '2026-10-19', current: null, done: people, away: {}, seq: 10 }) } });
  const calm = page({ hostname: 'example.kaiten.ru', now: at, reduced: true, stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();

  // Act
  for (const kaiten of [finished, calm]) {
    kaiten.click('daily');
    kaiten.clock += 6 * 60 * 1000;
    kaiten.runTimers(5000);
  }

  // Assert
  assert.equal(roasts(finished).length, 0);
  assert.deepEqual(roasts(calm).map((element) => [element.className, element.innerHTML]), [['roast still', '<b>ПРОЖАРКААА</b>']]);
});

test('Дейлик: картинки и звуки рычага берутся с Pages и лежат в assets/daily, сборка кладёт их рядом с панелью', () => {
  // Arrange
  const pages = bundle.match(/const DAILY_ART = '([^']+)';/);
  const clips = bundle.match(/const DAILY_CLIPS = \{([^}]*)\};/)[1];

  // Act
  const named = [...bundle.matchAll(/\$\{DAILY_ART\}([\w.-]+)/g), ...clips.matchAll(/'([\w.-]+)'/g)].map((match) => match[1]);
  const files = [...new Set(named)].sort();

  // Assert
  assert.equal(pages[1], 'https://toytronic22.github.io/kaiten-sprint-capacity/daily/');
  assert.deepEqual(files, ['frame.jpg', 'gear.mp3', 'lever.mp3', 'roast.gif', 'skull.jpg']);
  for (const file of files) {
    assert.ok(existsSync(path.join(root, 'assets', 'daily', file)), file);
    assert.ok(existsSync(path.join(root, 'dist', 'daily', file)), file);
  }
});

test('Страница установки ведёт к букве H правее времени — кнопки «↻» в панели нет', () => {
  // Arrange
  const install = readFileSync(path.join(root, 'dist', 'install.html'), 'utf8');

  // Act
  const step = install.split('<li>').find((item) => item.includes('«Открыть Holst»'));

  // Assert
  assert.match(step, /^Вернитесь в Kaiten\. Вверху панели, правее времени, нажмите красную букву H/);
  assert.doesNotMatch(install, /↻/);
});

test('Дейлик не подключается к Holst даже со входом; вкладка «Спринт» закрывает его', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', [TOKEN_KEY]: JSON.stringify('test-login-7') } });
  await flush();
  await flush();
  const before = kaiten.sockets.length;

  // Act
  kaiten.click('daily');
  await flush();
  await flush();
  const opened = kaiten.sockets.length - before;
  kaiten.click('sprint');

  // Assert
  assert.equal(opened, 0);
  assert.equal(kaiten.$('.daily').hidden, true);
});

test('Подземелье пишет системным Palatino: в открытой копии своего шрифта нет, панель ничего не подключает', async () => {
  // Arrange
  const added = [];
  const fonts = { add: (face) => added.push(face), [Symbol.iterator]: () => added[Symbol.iterator]() };

  // Act
  const kaiten = page({ hostname: 'example.kaiten.ru', fonts, stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  kaiten.click('close');
  vm.runInContext(bundle, kaiten.context);
  await flush();

  // Assert
  assert.deepEqual(added, []);
  assert.ok(bundle.split('\n').filter((line) => line.startsWith('.panel { --bg')).some((line) => line.includes('font: 16px/1.4 ${DAILY_FONT}; font-synthesis: none; -webkit-text-stroke-width: .4px;')));
  assert.match(bundle, /const DAILY_FONT = `"\$\{DAILY_FONT_FACE\}", "Palatino Linotype", Palatino, Georgia, serif`;/);
});

test('Панель читается в Kaiten: в подземелье и у единорогов текст панели и дейлика не мельче 12,5 px, панель шире 330 px — время обновления в шапке влезает', async () => {
  // Arrange
  const looks = ['dungeon', 'unicorn'].map((skin) => page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify(skin) } }));
  await flush();

  // Act
  const measured = looks.map((kaiten) => {
    const rules = styles(kaiten).flatMap((css) => css.split('\n')).filter((line) => /^[.:a-z]/.test(line) && !line.includes('geese') && !line.includes('clamp('));
    const sizes = new Map();
    for (const line of rules) {
      const size = [...line.matchAll(/font-size: ([\d.]+)px|font: (?:\d00 |italic \d00 )?([\d.]+)px[/ ]/g)].map((match) => Number(match[1] || match[2])).pop();
      if (size !== undefined) for (const selector of line.slice(0, line.indexOf(' {')).split(', ')) sizes.set(selector, size);
    }
    const width = Number(rules.filter((line) => line.startsWith('.panel { --bg')).pop().match(/ width: var\(--panel-w, (\d+)px\);/)[1]);
    return { sizes: [...sizes.values()], width };
  });

  // Assert
  for (const { sizes, width } of measured) {
    assert.ok(sizes.length > 30, String(sizes.length));
    assert.ok(Math.min(...sizes) >= 12.5, String(Math.min(...sizes)));
    assert.ok(width > 330, String(width));
  }
});

const luminance = (hex) => {
  const full = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, (digit) => digit + digit) : hex;
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(full.slice(at, at + 2), 16) / 255).map((part) => (part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (one, two) => {
  const [dark, light] = [luminance(one), luminance(two)].sort((a, b) => a - b);
  return (light + 0.05) / (dark + 0.05);
};

test('Единороги: «Точно сбросить?» читается и под мышью сразу после нажатия, и когда мышь ушла — контраст текста с фоном кнопки не ниже 4,5', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify('unicorn') } });
  await flush();
  const rules = styles(kaiten).flatMap((css) => css.split('\n'));
  const rule = (selector) => Object.fromEntries(rules.filter((line) => line.startsWith(`${selector} {`)).flatMap((line) => line.slice(line.indexOf('{') + 1, line.lastIndexOf('}')).split(';').map((part) => part.trim()).filter(Boolean).map((part) => [part.slice(0, part.indexOf(':')).trim(), part.slice(part.indexOf(':') + 1).trim()])));

  // Act
  const base = rule('.daily .reset');
  const armed = rule('.daily .reset.armed');
  const hover = rule('.daily .reset:hover:not(:disabled)');
  const looks = { 'мышь ушла': { ...base, ...armed }, 'под мышью': { ...base, ...armed, ...hover } };
  const worst = Object.entries(looks).map(([name, look]) => {
    const backs = look.background.match(/#[0-9a-f]{3,6}\b/gi);
    return [name, Math.min(...backs.map((back) => contrast(look.color, back))), `${look.color} на ${backs.join(', ')}`];
  });

  // Assert
  for (const [name, value, colors] of worst) assert.ok(value >= 4.5, `${name}: ${value.toFixed(2)} — ${colors}`);
});

test('Подземелье: череп за цифрами спринта — целиком при любом размере панели и без прямоугольника: картинка — маска по яркости, края гаснут, рамки вокруг нет', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  const lines = styles(kaiten).flatMap((css) => css.split('\n'));

  // Act
  const plain = lines.filter((line) => line.startsWith('.summary::before {') || line.startsWith('.summary::after {'));
  const masked = lines.filter((line) => line.startsWith('@supports (mask-mode: luminance) { .summary::before {'));

  // Assert
  assert.deepEqual(plain.map((line) => line.slice(0, line.indexOf(' {'))), ['.summary::before']);
  assert.doesNotMatch(plain[0], /url\(|cover/);
  assert.equal(masked.length, 1);
  assert.match(masked[0], /mask: url\("[^"]*skull\.jpg"\) center \/ contain no-repeat luminance, radial-gradient\(closest-side, #fff \d+%, #000\) luminance;/);
  assert.match(masked[0], /mask-composite: intersect;/);
  assert.doesNotMatch(masked[0], /cover/);
});

const cssRule = (kaiten, selector) => Object.fromEntries(styles(kaiten).flatMap((css) => css.split('\n')).filter((line) => line.startsWith(`${selector} {`)).flatMap((line) => line.slice(line.indexOf('{') + 1, line.lastIndexOf('}')).split(';').map((part) => part.trim()).filter(Boolean).map((part) => [part.slice(0, part.indexOf(':')).trim(), part.slice(part.indexOf(':') + 1).trim()])));
const closesAt = (html) => {
  let depth = 0;
  for (const match of html.matchAll(/<div\b|<\/div>/g)) {
    depth += match[0] === '</div>' ? -1 : 1;
    if (depth < 0) return match.index + match[0].length;
  }
  return -1;
};

test('Дейлик — во всю панель без пустого места: фон и рамка до самого низа, не влезло — листается внутри рамки; во всех скинах', async () => {
  // Arrange
  const looks = ['dungeon', 'classic', 'unicorn'].map((skin) => page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify(skin) } }));
  await flush();

  // Act
  const measured = looks.map((kaiten) => ({ panel: cssRule(kaiten, '.panel.daily-on:not(.collapsed)'), rest: cssRule(kaiten, '.panel.daily-on:not(.collapsed) > *'), daily: cssRule(kaiten, '.panel.daily-on:not(.collapsed) > .daily') }));

  // Assert
  for (const { panel, rest, daily } of measured) {
    assert.deepEqual([panel.display, panel['flex-direction'], panel.overflow], ['flex', 'column', 'hidden']);
    assert.equal(rest.flex, 'none');
    assert.deepEqual([daily.flex, daily['min-height'], daily.display, daily['flex-direction']], ['1 1 auto', '0', 'flex', 'column']);
  }
});

test('Дейлик не скачет, когда раскрывают «Очередь»: рамка и череп стоят на месте — череп на одной высоте от верха при любой высоте дейлика, очередь листается внутри рамки, место под полосу прокрутки занято заранее', async () => {
  // Arrange
  const open = (skin, size) => page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify(skin), 'sprintCapacity.v1.tab': JSON.stringify('daily'), ...(size ? { 'sprintCapacity.v1.size': JSON.stringify(size) } : {}) } });
  const dungeon = open('dungeon', { width: 460, height: 700 });
  const unicorn = open('unicorn', null);
  await flush();

  // Act
  const [stage, room] = dungeon.$('.daily').innerHTML.split('<div class="room">');
  const [sky, cloud] = unicorn.$('.daily').innerHTML.split('<div class="room">');
  const scroller = cssRule(dungeon, '.daily .room');
  const skull = cssRule(dungeon, '.daily::before');

  // Assert
  assert.deepEqual([scroller['overflow-y'], scroller['min-height'], scroller.flex, scroller['scrollbar-gutter']], ['auto', '0', '1 1 auto', 'stable both-edges']);
  assert.match(stage, /class="light"/);
  assert.match(stage, /class="frame"/);
  for (const name of ['reel', 'line', 'queue', 'edit', 'send']) assert.match(room, new RegExp(`data-part="${name}"`));
  assert.equal(closesAt(room), room.trimEnd().length);
  assert.doesNotMatch(sky, /class="sky"/);
  assert.match(cloud, /class="sky"/);
  assert.match(skull.top, /^\d+px$/);
  assert.equal(skull.transform, 'translateY(-50%)');
  assert.equal(skull['aspect-ratio'], '1');
});

const turn = (kaiten, element, open) => {
  element.open = open;
  (kaiten.shadow.listeners.toggle || []).forEach((listener) => listener({ target: element }));
};

test('Вкладку панель помнит в этом браузере: остановились на дейлике — в следующий раз откроется дейлик, вернулись на «Спринт» — «Спринт»', async () => {
  // Arrange
  const first = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  first.click('daily');
  await flush();

  // Act
  const again = page({ hostname: 'example.kaiten.ru', stored: Object.fromEntries(first.stored) });
  await flush();
  const daily = [again.$('.daily').hidden, again.$('.tabs').dataset.mode];
  again.click('sprint');
  await flush();
  const back = page({ hostname: 'example.kaiten.ru', stored: Object.fromEntries(again.stored) });
  await flush();

  // Assert
  assert.deepEqual(daily, [false, 'daily']);
  assert.deepEqual([back.$('.daily').hidden, back.$('.tabs').dataset.mode], [true, 'sprint']);
});

test('Скины: по умолчанию подземелье; выбранный скин панель помнит, незнакомый — снова подземелье', async () => {
  // Arrange
  const first = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  const before = first.$('.panel').dataset.skin;

  // Act
  pickSkin(first, 'unicorn');
  pickSkin(first, 'disco');
  const again = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': first.stored.get('sprintCapacity.v1.skin') } });
  const broken = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify('disco') } });
  await flush();

  // Assert
  assert.equal(before, 'dungeon');
  assert.equal(first.stored.get('sprintCapacity.v1.skin'), '"unicorn"');
  assert.equal(first.$('.panel').dataset.skin, 'unicorn');
  assert.equal(again.$('.panel').dataset.skin, 'unicorn');
  assert.equal(broken.$('.panel').dataset.skin, 'dungeon');
});

test('Размер панели: уголок слева внизу тянет панель шире и выше, размер панель помнит; уже 340 px и выше окна не тянется; двойной клик возвращает как было', async () => {
  // Arrange
  const first = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  const host = first.document.getElementById('sprint-capacity-panel');
  const grip = first.$('.grip');
  first.$('.panel').getBoundingClientRect = () => ({ left: 1006, top: 72, right: 1346, bottom: 572, width: 340, height: 500 });
  const drag = (from, to) => ['pointerdown', 'pointermove', 'pointerup'].forEach((type, index) => grip.listeners[type].forEach((listener) => listener({ clientX: (index ? to : from)[0], clientY: (index ? to : from)[1], pointerId: 1, preventDefault() {} })));
  const before = { ...host.style.props };

  // Act
  drag([1015, 560], [895, 620]);
  const wide = { ...host.style.props };
  const saved = first.stored.get('sprintCapacity.v1.size');
  const again = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.size': saved } });
  await flush();
  const reopened = { ...again.document.getElementById('sprint-capacity-panel').style.props };
  drag([1015, 560], [1300, 2000]);
  const squeezed = { ...host.style.props };
  grip.listeners.dblclick.forEach((listener) => listener({}));

  // Assert
  assert.deepEqual(before, {});
  assert.deepEqual(wide, { '--panel-w': '460px', '--panel-h': '560px' });
  assert.equal(saved, '{"width":460,"height":560}');
  assert.deepEqual(reopened, wide);
  assert.deepEqual(squeezed, { '--panel-w': '340px', '--panel-h': '812px' });
  assert.deepEqual({ ...host.style.props }, {});
  assert.equal(first.stored.get('sprintCapacity.v1.size'), 'null');
  assert.deepEqual([grip.style.left, grip.style.top], ['1009px', '551px']);
});

test('Размер панели одинаковый во всех скинах и после смены скина: ширина 340 px или растянутая, высота — по содержимому, растянутая только ограничивает её сверху; сурок держится у края панели', async () => {
  // Arrange
  const looks = ['dungeon', 'classic', 'unicorn'].map((skin) => page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify(skin), 'sprintCapacity.v1.size': JSON.stringify({ width: 460, height: 700 }) } }));
  const switched = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.size': JSON.stringify({ width: 460, height: 700 }) } });
  await flush();
  const measure = (kaiten) => {
    const rules = styles(kaiten).flatMap((css) => css.split('\n'));
    const last = (pattern) => rules.filter((line) => line.startsWith('.panel {') && pattern.test(line)).pop().match(pattern)[1];
    const roast = rules.filter((line) => line.startsWith('.daily-side .roast {')).pop().match(/ right: ([^;]+);/)[1];
    const grow = rules.filter((line) => line.startsWith('.panel') && / (min-)?height: (?!auto;|0;)/.test(line.slice(line.indexOf('{'))) && !line.startsWith('.panel.collapsed'));
    return { width: last(/ width: ([^;]+);/), height: last(/ height: ([^;]+);/), most: last(/ max-height: ([^;]+);/), roast, grow };
  };

  // Act
  const measured = looks.map(measure);
  for (const skin of ['unicorn', 'classic', 'dungeon']) {
    pickSkin(switched, skin);
    measured.push(measure(switched));
  }

  // Assert
  for (const { width, height, most, roast, grow } of measured) {
    assert.equal(width, 'var(--panel-w, 340px)');
    assert.equal(height, 'auto');
    assert.equal(most, 'min(var(--panel-h, 100vh), 100vh - 88px)');
    assert.deepEqual(grow, []);
    assert.match(roast, /^calc\(min\(var\(--panel-w, 340px\), 100vw - 110px\) \+ \d+px\)$/);
  }
  assert.deepEqual(looks.map((kaiten) => kaiten.document.getElementById('sprint-capacity-panel').style.props['--panel-h']), ['700px', '700px', '700px']);
});

test('Раскрыли «Команду и дни» или «Настройки» дейлика — панель растёт под них до края окна, растянутая высота не мешает; остальные раскрывашки — до растянутой высоты, во всех скинах', async () => {
  // Arrange
  const looks = ['dungeon', 'classic', 'unicorn'].map((skin) => page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify(skin), 'sprintCapacity.v1.size': JSON.stringify({ width: 460, height: 450 }) } }));
  await flush();
  for (const kaiten of looks) kaiten.click('daily');
  await flush();

  // Act
  const lifted = looks.map((kaiten) => styles(kaiten).flatMap((css) => css.split('\n')).filter((line) => / max-height: /.test(line) && !/ max-height: min\(var\(--panel-h, 100vh\), 100vh - 88px\);/.test(line) && line.startsWith('.panel')));

  // Assert
  for (const rules of lifted) assert.deepEqual(rules, ['.panel:not(.daily-on):has(> .body > details.settings[open]), .panel.daily-on:has(> .daily details[data-part="edit"][open]) { max-height: calc(100vh - 88px); }']);
  for (const kaiten of looks) {
    assert.match(kaiten.shadow.innerHTML, /<div class="daily" hidden><\/div>\s*<div class="body">\s*<details class="settings">\s*<summary>Команда и дни<\/summary>/);
    assert.match(kaiten.$('.daily').innerHTML, /<details data-part="edit">\s*<summary>Настройки<\/summary>/);
  }
});

test('«Проверить» на обеих вкладках, пока есть что проверить: в дейлике та же раскрывашка со счётчиком и ссылками на карты; починили карту — пропадает с обеих без обновления страницы', async () => {
  // Arrange
  const clean = { id: 1, title: 'Карта 1', size: 3, properties: { id_9004: [329378] }, state: 1 };
  const cards = [clean, { id: 7, title: 'Карта без платформы', size: 3, properties: {}, state: 1 }];
  const flagged = teamKaiten({ cards });
  const fine = teamKaiten({ cards: [clean] });
  await flush();
  for (const kaiten of [flagged, fine]) kaiten.click('daily');
  await flush();
  const seen = (kaiten) => ({ sprint: !kaiten.$('.warnings').hidden, daily: !dailyPart(kaiten, 'check').hidden, count: dailyPart(kaiten, 'check-count').textContent });
  const before = seen(flagged);
  const list = dailyPart(flagged, 'check-list').innerHTML;
  const sprint = flagged.$('.warnings').innerHTML;

  // Act
  cards.pop();
  flagged.runTimers(60000);
  await flush();

  // Assert
  assert.deepEqual(before, { sprint: true, daily: true, count: '1' });
  assert.match(sprint, /^<summary>Проверить <span class="count">1<\/span><\/summary><div class="inner">/);
  assert.ok(sprint.includes(`<div class="inner">${list}</div>`), list);
  assert.match(list, /Карта без платформы/);
  assert.match(list, /href="https:\/\/example\.kaiten\.ru\/7"/);
  assert.deepEqual([seen(fine).sprint, seen(fine).daily], [false, false]);
  assert.deepEqual([seen(flagged).sprint, seen(flagged).daily], [false, false]);
  assert.equal(dailyPart(flagged, 'check-list').innerHTML, '');
});

test('Кнопки «↻» нет ни в одном скине — панель сама снова берёт карты из Kaiten раз в минуту, пока вкладка видна', async () => {
  // Arrange
  const looks = ['dungeon', 'classic', 'unicorn'].map((skin) => teamKaiten({ stored: { 'sprintCapacity.v1.skin': JSON.stringify(skin) } }));
  await flush();
  const kaiten = looks[0];
  const cards = () => kaiten.requests.filter((item) => item.url.startsWith('/api/cards?board_id=')).length;
  const first = cards();

  // Act
  kaiten.runTimers(60000);
  await flush();
  const visible = cards();
  kaiten.document.hidden = true;
  kaiten.runTimers(60000);
  await flush();
  const hidden = cards();

  // Assert
  assert.deepEqual(looks.map((look) => [look.shadow.innerHTML.includes('data-act="refresh"'), look.shadow.innerHTML.includes('↻')]), Array(3).fill([false, false]));
  assert.ok(first > 0, String(first));
  assert.deepEqual([visible, hidden], [first * 2, first * 2]);
});

test('«Свернуть» оставляет только шапку и вкладки на «Спринте» и в дейлике, во всех скинах и после смены скина: итог, «В Holst», плашка, раскрывашки, барабан и рычаг спрятаны', async () => {
  // Arrange
  const looks = ['dungeon', 'classic', 'unicorn'].map((skin) => page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify(skin) } }));
  const switched = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  const hides = (kaiten) => {
    const rules = styles(kaiten).flatMap((css) => css.split('\n')).filter((line) => line.startsWith('.panel.collapsed') && / display: /.test(line));
    return { all: rules.some((line) => line.startsWith('.panel.collapsed > :not(header):not(.modes) { display: none; }')), shown: rules.filter((line) => !/ display: none;/.test(line)), side: rules.some((line) => line.startsWith('.panel.collapsed ~ .daily-side { display: none; }')) };
  };

  // Act
  looks.forEach((kaiten) => kaiten.click('collapse'));
  const measured = looks.map(hides);
  for (const skin of ['unicorn', 'classic', 'dungeon']) {
    pickSkin(switched, skin);
    measured.push(hides(switched));
  }

  // Assert
  assert.deepEqual(looks.map((kaiten) => [kaiten.$('.panel').classList.contains('collapsed'), kaiten.stored.get('sprintCapacity.v1.collapsed')]), Array(3).fill([true, 'true']));
  assert.deepEqual(measured, Array(6).fill({ all: true, shown: [], side: true }));
});

test('Скин «Подземелье»: рычаг горит — шар из лавы переливается, над ним языки пламени; все рассказали — огонь гаснет', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();

  // Act
  const daily = styles(kaiten).pop();

  // Assert
  assert.match(dailySide(kaiten).innerHTML, /<div class="knob"[^>]*><i class="halo"><\/i>(<i class="flame"><\/i>){3}<i class="core"><\/i><i class="lava"><\/i><i class="lava"><\/i><\/div>$/);
  assert.match(daily, /^\.daily-side \.knob \.lava \{[^}]*animation: daily-swirl/m);
  assert.match(daily, /^\.daily-side \.knob \.flame \{[^}]*animation: daily-lick/m);
  assert.match(daily, /^\.daily-side \.arm::before \{[^}]*animation: daily-flow/m);
  assert.match(daily, /^\.daily-side\.locked \.knob \.halo, \.daily-side\.locked \.knob \.flame \{ display: none; \}$/m);
  assert.match(daily, /^@media \(prefers-reduced-motion: reduce\) \{[^\n]*\.daily-side \.knob i, \.daily-side \.arm::before[^\n]*animation: none/m);
});

test('Скин «Классика» — панель как до подземелья: тёмная таблица без Диабло, обычный рычаг с красным шаром', async () => {
  // Arrange
  const added = [];
  const fonts = { add: (face) => added.push(face), [Symbol.iterator]: () => added[Symbol.iterator]() };
  const kaiten = page({ hostname: 'example.kaiten.ru', fonts, stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify('classic') } });
  await flush();

  // Act
  const [sheet, daily] = styles(kaiten);
  const start = bundle.indexOf('const PANEL_CSS = `') + 'const PANEL_CSS = `'.length;

  // Assert
  assert.equal(sheet, bundle.slice(start, bundle.indexOf('`;', start)));
  assert.doesNotMatch(sheet + daily, /Sprint Dungeon|Sprint Balsamiq/);
  assert.match(daily, /^\.daily-side \.knob \{[^}]*#ff5252/m);
  assert.match(dailySide(kaiten).innerHTML, /^<div class="plate"><\/div><div class="axle"><\/div><div class="arm"><\/div><div class="hub"><\/div><div class="knob" role="button"/);
  assert.deepEqual(added, []);
});

test('Скин «Единороги» пишет шрифтом Balsamiq Sans: четыре файла с jsDelivr — кириллица и латиница, обычный и жирный — один раз; подземелье ничего не грузит', async () => {
  // Arrange
  const load = (skin) => {
    const added = [];
    const fonts = { add: (face) => added.push(face), [Symbol.iterator]: () => added[Symbol.iterator]() };
    return { added, kaiten: page({ hostname: 'example.kaiten.ru', fonts, stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify(skin) } }) };
  };
  const unicorn = load('unicorn');
  const dungeon = load('dungeon');
  await flush();

  // Act
  unicorn.kaiten.click('close');
  vm.runInContext(bundle, unicorn.kaiten.context);
  await flush();

  // Assert
  const files = 'https://cdn.jsdelivr.net/npm/@fontsource/balsamiq-sans@5.3.0/files/balsamiq-sans-';
  assert.deepEqual(unicorn.added.map((face) => [face.family, face.source, face.descriptors.weight, face.descriptors.unicodeRange.split(',')[0]]), [
    ['Sprint Balsamiq', `url("${files}cyrillic-400-normal.woff2") format("woff2")`, '400', 'U+0301'],
    ['Sprint Balsamiq', `url("${files}latin-400-normal.woff2") format("woff2")`, '400', 'U+0000-00FF'],
    ['Sprint Balsamiq', `url("${files}cyrillic-700-normal.woff2") format("woff2")`, '700', 'U+0301'],
    ['Sprint Balsamiq', `url("${files}latin-700-normal.woff2") format("woff2")`, '700', 'U+0000-00FF'],
  ]);
  assert.deepEqual(dungeon.added.map((face) => face.family), []);
});

test('Вкладки «Спринт» и «Дейлик» переключают режим: дейлик прячет таблицу спринта, «Спринт» возвращает её', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  const mode = () => [kaiten.$('.tabs').dataset.mode, kaiten.$('.panel').classList.contains('daily-on'), kaiten.$('.daily').hidden];
  const before = mode();

  // Act
  kaiten.click('daily');
  const daily = mode();
  kaiten.click('daily');
  const twice = mode();
  kaiten.click('sprint');

  // Assert
  assert.equal(kaiten.$('.tabs').hidden, false);
  assert.deepEqual(before, ['sprint', false, true]);
  assert.deepEqual(daily, ['daily', true, false]);
  assert.deepEqual(twice, ['daily', true, false]);
  assert.deepEqual(mode(), ['sprint', false, true]);
});

test('Дейлик: внизу кнопка «В Holst» — без входа открывает вход, а пока панель пишет в Holst, выключена', async () => {
  // Arrange
  const guest = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040' } });
  const signed = page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', [TOKEN_KEY]: JSON.stringify('test-login-7') } });
  await flush();
  for (const kaiten of [guest, signed]) kaiten.click('daily');
  const send = (kaiten) => ({ hidden: dailyPart(kaiten, 'send').hidden, disabled: kaiten.$('.daily').querySelector('[data-act="to-holst"]').disabled });
  const before = send(signed);

  // Act
  guest.click('to-holst');
  signed.click('to-holst');
  const sending = send(signed);
  await settle();

  // Assert
  assert.match(guest.$('.daily').innerHTML, /<div class="plan send" data-part="send" hidden><button type="button" data-act="to-holst"[^>]*>В Holst<\/button>/);
  assert.equal(guest.$('.holst-login').hidden, false);
  assert.deepEqual(before, { hidden: false, disabled: false });
  assert.deepEqual(sending, { hidden: false, disabled: true });
  assert.deepEqual(send(signed), { hidden: false, disabled: false });
});

test('Скин «Единороги»: рычаг — рог единорога, торчит влево; рывок поворачивает рог вниз, голова кивает и жмурится', async () => {
  // Arrange
  const kaiten = page({ hostname: 'example.kaiten.ru', now: Date.parse('2026-10-19T07:00:00.000Z'), stored: { 'sprintCapacity.v1.board': '303040' } });
  await flush();
  pickSkin(kaiten, 'unicorn');
  kaiten.click('daily');
  const side = dailySide(kaiten);
  const horn = side.querySelector('.knob');
  const head = side.querySelector('.head');
  const rest = [horn.style.transform, head.style.transform, head.classList.contains('squint')];

  // Act
  pullLever(kaiten);
  kaiten.clock += 750;
  kaiten.runTimers(16);

  // Assert
  assert.match(side.innerHTML, /^<div class="head">[\s\S]*<div class="knob" role="button" tabindex="0" aria-label="Рог-рычаг: тяните рог вниз до щелчка или нажмите Enter"/);
  assert.match(styles(kaiten)[1], /^\.daily-side \.knob \{[^}]* transform-origin: 100% 50%; transform: rotate\(38deg\);/m);
  assert.deepEqual(rest, ['rotate(38.0deg)', 'rotate(0.0deg)', false]);
  assert.deepEqual([horn.style.transform, head.style.transform, head.classList.contains('squint')], ['rotate(-38.0deg)', 'rotate(-6.0deg)', true]);
  assert.equal(JSON.parse(kaiten.stored.get('sprintCapacity.v1.daily.core.day')).current, 'Михаил В.');
});

test('Заметка сверху страницы — в цвет скина: подземелье пишет Диабло, классика — системным шрифтом, единороги — Balsamiq', async () => {
  // Arrange
  const looks = ['dungeon', 'classic', 'dungeon'].map((skin) => page({ hostname: 'example.kaiten.ru', stored: { 'sprintCapacity.v1.board': '303040', 'sprintCapacity.v1.skin': JSON.stringify(skin), [TOKEN_KEY]: JSON.stringify('test-login-7') } }));
  await flush();
  pickSkin(looks[2], 'unicorn');

  // Act
  const fonts = looks.map((kaiten) => {
    kaiten.blockPopups = true;
    kaiten.click('to-holst');
    return kaiten.document.getElementById('sprintcap-toast').children.at(-1).style.cssText.match(/font:[^,;]+/)[0];
  });

  // Assert
  assert.deepEqual(fonts, ['font:17px/1.45 "Sprint Dungeon"', 'font:14px/1.45 -apple-system', 'font:16px/1.45 "Sprint Balsamiq"']);
});
