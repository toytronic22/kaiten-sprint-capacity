const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const root = path.join(__dirname, '..');
execFileSync(process.execPath, [path.join(root, 'build.mjs')], { cwd: root, stdio: 'pipe' });
const bundle = readFileSync(path.join(root, 'dist', 'sprint-capacity.js'), 'utf8').replace(/\bimport\(/g, 'holstImport(');

const HOLST = 'https://app.holst.so';
const KAITEN = 'https://dodopizza.kaiten.ru';
const TOKEN_KEY = 'sprintCapacity.v1.holstToken';
const TEAM_BOARD = '67165a75-56cd-40d4-aeb8-c6f05ae5c057';

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
    style: { setProperty() {} },
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

const page = ({ hostname, stored = {}, opener = null, clipboard = true, holst = 'ok', fetch = () => Promise.reject(new Error('нет сети в тесте')) }) => {
  const env = { stored: new Map(Object.entries(stored)), timers: [], listeners: {}, opened: [], alerts: [], copied: [], blockPopups: false, holst, sockets: [] };
  const shadow = remember(fakeElement(), new Map([['.holst-login', remember(Object.assign(fakeElement(), { hidden: true }))], ['.geese', null]]));
  const body = fakeElement();
  const document = {
    hidden: false,
    body,
    head: fakeElement(),
    createElement: (tag) => {
      const element = fakeElement();
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
    document,
    location: { hostname, origin: `https://${hostname}` },
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
    confirm: () => false,
    opener,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(bundle, context);
  env.$ = (selector) => shadow.querySelector(selector);
  env.click = (act) => (shadow.listeners.click || []).forEach((listener) => listener({ target: { closest: () => ({ dataset: { act } }) } }));
  env.message = (origin, data, source) => (env.listeners.message || []).slice().forEach((listener) => listener({ origin, data, source }));
  env.runTimers = (ms) => env.timers.filter((timer) => timer.ms === ms && !timer.cleared).forEach((timer) => {
    if (!timer.repeat) timer.cleared = true;
    timer.listener();
  });
  env.document = document;
  env.geese = () => shadow.children.filter((element) => element.className === 'geese').length;
  env.toast = () => {
    const box = document.getElementById('sprintcap-toast');
    return box ? box.children.map((element) => element.textContent).join('') : null;
  };
  return env;
};

const flush = () => new Promise((resolve) => setImmediate(resolve));
const plain = (value) => JSON.parse(JSON.stringify(value));

const overloadedKaiten = () => page({
  hostname: 'dodopizza.kaiten.ru',
  stored: {
    'sprintCapacity.v1.board': '68084',
    'sprintCapacity.v1.settings.68084': JSON.stringify({ team: { back: { people: 1 } } }),
    'sprintCapacity.v1.geese.68084': JSON.stringify('2026-10-02'),
  },
  fetch: (url) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(url.startsWith('/api/cards?') ? [{ id: 1, title: 'Карта 1', size: 30, properties: { id_499149: [16232407] }, state: 1 }] : []),
  }),
});

test('Перегруз: гуси бегут при каждом открытии панели, а обновление в открытой панели их не зовёт', async () => {
  // Arrange
  const first = overloadedKaiten();
  await flush();

  // Act
  first.click('refresh');
  await flush();
  const reopened = overloadedKaiten();
  await flush();

  // Assert
  assert.equal(first.geese(), 1);
  assert.equal(reopened.geese(), 1);
});

test('Панель на Kaiten: красная точка без входа открывает вход через Holst', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });

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

test('Вход из вкладки Holst: панель отвечает на приветствие, сохраняет и проверяет вход, точка зеленеет', async () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
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

test('Свежий вход из Holst не пустили — вкладка Holst узнаёт, что проверить, точка красная, вход не стёрт', async () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', holst: 'reject' });
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

test('Сохранённый вход работает — точка зелёная, а в окошке так и написано', async () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-5') } });
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

test('Holst не пускает с сохранённым входом — точка красная, в окошке подсказка, вход не стёрт', async () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-6') }, holst: 'reject' });

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

test('Проверить вход не вышло — серое кольцо, нажатие на точку проверяет ещё раз', async () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-7') }, holst: 'offline' });
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

test('Вход вставили вручную — панель проверяет его, сохраняет и красит точку зелёным', async () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
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
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
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
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
  kaiten.click('holst-login');

  // Act
  kaiten.click('holst-open');
  kaiten.runTimers(500);
  const waiting = kaiten.$('.holst-login').innerHTML;
  kaiten.opened[0].closed = true;
  kaiten.runTimers(500);

  // Assert
  assert.equal(kaiten.opened[0].url, `${HOLST}/board/67165a75-56cd-40d4-aeb8-c6f05ae5c057`);
  assert.deepEqual(plain(kaiten.opened[0].sent), [{ message: { type: 'sprint-capacity:ping' }, origin: HOLST }]);
  assert.match(waiting, /Жду вход/);
  assert.match(kaiten.$('.holst-login').innerHTML, /Связь с вкладкой Holst пропала/);
  assert.equal(kaiten.timers.filter((timer) => timer.ms === 500 && !timer.cleared).length, 0);
});

test('Всплывающие окна запрещены — панель так и говорит', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
  kaiten.blockPopups = true;
  kaiten.click('holst-login');

  // Act
  kaiten.click('holst-open');

  // Assert
  assert.match(kaiten.$('.holst-login').innerHTML, /Браузер не дал открыть Holst/);
});

test('«В Holst» без входа: вход пришёл из открытой вкладки — панель сразу пишет, итог уходит в ту же вкладку', async () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
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
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-4') } });
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
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { [TOKEN_KEY]: JSON.stringify('test-login-5') } });
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
  holst.message(KAITEN, { type: 'sprint-capacity:result', text: 'Staff Core: записал', failed: false, meme: true }, kaitenTab);

  // Assert
  assert.deepEqual(plain(opener.sent), [{ message: { type: 'sprint-capacity:hello' }, origin: '*' }]);
  assert.deepEqual(stranger.sent, []);
  assert.deepEqual(plain(kaitenTab.sent), [{ message: { type: 'sprint-capacity:login', token: 'test-holst-1' }, origin: KAITEN }]);
  assert.equal(passed, 'Вход в Holst передан в Kaiten');
  assert.equal(holst.toast(), 'Staff Core: записал');
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
  done.message(KAITEN, { type: 'sprint-capacity:result', text: 'Staff Core: записал', failed: false, meme: true }, kaitenTab);
  failed.message(KAITEN, { type: 'sprint-capacity:result', text: 'В Holst не отправилось', failed: true, meme: true }, kaitenTab);

  // Act
  const before = done.toast();
  done.runTimers(20000);
  failed.runTimers(20000);

  // Assert
  assert.equal(before, 'Staff Core: записал');
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
  assert.match(holst.alerts[0], /Вставить вход вручную/);
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
