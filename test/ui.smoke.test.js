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

const page = ({ hostname, stored = {}, opener = null, clipboard = true, holst = 'ok', answer = false, cookie = '', fetch = () => Promise.reject(new Error('нет сети в тесте')) }) => {
  const env = { stored: new Map(Object.entries(stored)), timers: [], listeners: {}, opened: [], alerts: [], copied: [], confirms: [], blockPopups: false, holst, sockets: [] };
  const hiddenBox = () => remember(Object.assign(fakeElement(), { hidden: true }));
  const shadow = remember(fakeElement(), new Map([['.holst-login', hiddenBox()], ['.time-login', hiddenBox()], ['.geese', null]]));
  const body = fakeElement();
  const document = {
    hidden: false,
    cookie,
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
    URL,
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
    confirm: (text) => {
      env.confirms.push(text);
      return answer;
    },
    opener,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(bundle, context);
  env.$ = (selector) => shadow.querySelector(selector);
  env.click = (act) => (shadow.listeners.click || []).forEach((listener) => listener({ target: { closest: () => ({ dataset: { act } }) } }));
  env.change = (act, value) => (shadow.listeners.change || []).forEach((listener) => listener({ target: { dataset: { act }, value } }));
  env.message = (origin, data, source) => (env.listeners.message || []).slice().forEach((listener) => listener({ origin, data, source }));
  env.runTimers = (ms) => env.timers.filter((timer) => timer.ms === ms && !timer.cleared).forEach((timer) => {
    if (!timer.repeat) timer.cleared = true;
    timer.listener();
  });
  env.document = document;
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

const overloadedKaiten = (stored = {}) => page({
  hostname: 'dodopizza.kaiten.ru',
  stored: {
    'sprintCapacity.v1.board': '68084',
    'sprintCapacity.v1.settings.68084': JSON.stringify({ team: { back: { people: 1 } } }),
    'sprintCapacity.v1.geese.68084': JSON.stringify('2026-10-02'),
    ...stored,
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

test('Вход из вкладки Holst: панель отвечает на приветствие, сохраняет и проверяет вход, буква H зеленеет', async () => {
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

test('Свежий вход из Holst не пустили — вкладка Holst узнаёт, что проверить, буква H красная, вход не стёрт', async () => {
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

test('Сохранённый вход работает — буква H зелёная, а в окошке так и написано', async () => {
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

test('Holst не пускает с сохранённым входом — буква H красная, в окошке подсказка, вход не стёрт', async () => {
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

test('Проверить вход не вышло — серая буква H, нажатие на неё проверяет ещё раз', async () => {
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

test('Вход вставили вручную — панель проверяет его, сохраняет и красит букву H зелёным', async () => {
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

test('Выбор спринта у «В Holst»: список из прошлого запуска, выбранный отмечен, смена выбора запоминается для доски', async () => {
  // Arrange
  const options = [{ mode: 'running', label: 'Идёт 28.09–11.10' }, { mode: 'last', label: 'Итоги 14.09–27.09' }, { mode: 'history-0', label: 'Итоги 31.08–13.09' }];
  const kaiten = overloadedKaiten({ 'sprintCapacity.v1.sprintOptions.68084': JSON.stringify(options), 'sprintCapacity.v1.sprintPick.68084': JSON.stringify('last') });
  await flush();
  const fresh = overloadedKaiten();
  await flush();

  // Act
  kaiten.change('holst-sprint', 'history-0');

  // Assert
  assert.match(kaiten.$('.summary').innerHTML, /<select data-act="holst-sprint"[^>]*><option value="running">Идёт 28.09–11.10<\/option><option value="last" selected>Итоги 14.09–27.09<\/option><option value="history-0">Итоги 31.08–13.09<\/option><\/select>/);
  assert.match(fresh.$('.summary').innerHTML, /<option value="running" selected>Идущий спринт<\/option><option value="last">Прошлый спринт<\/option>/);
  assert.equal(kaiten.stored.get('sprintCapacity.v1.sprintPick.68084'), JSON.stringify('history-0'));
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

const TIME = 'https://team.time-messenger.ru';
const CHANNEL = `${TIME}/test-team/channels/test-channel`;
const CHANNEL_KEY = 'sprintCapacity.v1.timeChannel';

const timeKey = (env) => env.$('[data-act="time-login"]');

const connectedKaiten = (options = {}) => {
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { [CHANNEL_KEY]: JSON.stringify(CHANNEL) }, ...options });
  const timeTab = fakeTab();
  kaiten.message(TIME, { type: 'sprint-capacity:time-hello' }, timeTab);
  kaiten.message(TIME, { type: 'sprint-capacity:time-ready', user: 'tester', channel: 'Тестовый канал', url: CHANNEL }, timeTab);
  return { kaiten, timeTab };
};

test('Шапка панели: на Staff Core — буквы H и T, обе красные, пока ничего не подключено', () => {
  // Act
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });

  // Assert
  assert.equal(timeKey(kaiten).hidden, false);
  assert.equal(timeKey(kaiten).dataset.state, 'none');
  assert.equal(timeKey(kaiten).title, 'Time: не подключён');
  assert.equal(kaiten.$('[data-act="holst-login"]').dataset.state, 'none');
  assert.equal(kaiten.$('.report').hidden, false);
});

test('Шапка панели: на Staff Mobile сводки нет — буква T и блок сводки скрыты', () => {
  // Act
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { 'sprintCapacity.v1.board': '1321013' } });

  // Assert
  assert.equal(timeKey(kaiten).hidden, true);
  assert.equal(kaiten.$('.report').hidden, true);
});

test('Подключение Time: ссылка на канал → вкладка Time → приветствие → канал проверен, буква T зелёная', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
  kaiten.click('time-login');
  kaiten.$('[data-time-channel]').value = CHANNEL;

  // Act
  kaiten.click('time-open');
  const checking = timeKey(kaiten).dataset.state;
  const timeTab = kaiten.opened[0];
  kaiten.message(TIME, { type: 'sprint-capacity:time-hello' }, timeTab);
  kaiten.message(TIME, { type: 'sprint-capacity:time-ready', user: 'tester', channel: 'Тестовый канал', url: CHANNEL }, timeTab);

  // Assert
  assert.equal(timeTab.url, CHANNEL);
  assert.equal(checking, 'checking');
  assert.equal(kaiten.stored.get(CHANNEL_KEY), JSON.stringify(CHANNEL));
  assert.deepEqual(plain(timeTab.sent), [{ message: { type: 'sprint-capacity:time-ping', channel: CHANNEL }, origin: TIME }]);
  assert.equal(timeKey(kaiten).dataset.state, 'ok');
  assert.equal(timeKey(kaiten).title, 'Time: подключён');
  assert.equal(kaiten.$('.time-login').hidden, true);
  assert.equal(kaiten.toast(), 'Time подключён: канал «Тестовый канал»');
});

test('Подключение Time: не та ссылка — буква T красная с подсказкой, вкладка не открывается', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
  kaiten.click('time-login');
  kaiten.$('[data-time-channel]').value = 'https://team.time-messenger.ru/test-team/messages/@tester';

  // Act
  kaiten.click('time-open');

  // Assert
  assert.deepEqual(kaiten.opened, []);
  assert.equal(timeKey(kaiten).dataset.state, 'rejected');
  assert.equal(timeKey(kaiten).title, 'Time: не работает');
  assert.match(kaiten.$('.time-login').querySelector('[data-time-reason]').textContent, /^Нужна ссылка на канал Time вида/);
  assert.equal(kaiten.stored.has(CHANNEL_KEY), false);
});

test('Подключение Time: Time не пустил в канал — буква T красная, причина в окошке', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { [CHANNEL_KEY]: JSON.stringify(CHANNEL) } });
  const timeTab = fakeTab();

  // Act
  kaiten.message(TIME, { type: 'sprint-capacity:time-hello' }, timeTab);
  kaiten.message(TIME, { type: 'sprint-capacity:time-ready', error: 'Time не пускает в этот канал — проверьте, что вы в нём состоите', url: CHANNEL }, timeTab);
  kaiten.click('time-login');

  // Assert
  assert.equal(timeKey(kaiten).dataset.state, 'rejected');
  assert.match(kaiten.$('.time-login').innerHTML, /Time не пускает в этот канал/);
});

test('Подключение Time: приветствия с чужих сайтов панель не слушает', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', stored: { [CHANNEL_KEY]: JSON.stringify(CHANNEL) } });
  const stranger = fakeTab();

  // Act
  kaiten.message('https://example.com', { type: 'sprint-capacity:time-hello' }, stranger);
  kaiten.message('https://team.time-messenger.ru.example.com', { type: 'sprint-capacity:time-hello' }, stranger);
  kaiten.message('http://team.time-messenger.ru', { type: 'sprint-capacity:time-hello' }, stranger);

  // Assert
  assert.deepEqual(stranger.sent, []);
  assert.equal(timeKey(kaiten).dataset.state, 'none');
});

test('Подключение Time: вкладку Time закрыли — буква T снова красная', () => {
  // Arrange
  const { kaiten, timeTab } = connectedKaiten();

  // Act
  timeTab.closed = true;
  kaiten.runTimers(1000);

  // Assert
  assert.equal(timeKey(kaiten).dataset.state, 'none');
  kaiten.click('time-login');
  assert.match(kaiten.$('.time-login').innerHTML, /Вкладку Time закрыли — откройте Time ещё раз/);
});

test('«В Time»: спрашивает подтверждение с каналом, шлёт текст во вкладку Time, итог — в тосте', async () => {
  // Arrange
  const { kaiten, timeTab } = connectedKaiten({ answer: true });
  kaiten.$('[data-report-text]').value = 'Разработка P2P за спринт 14.09–27.09\n1. Тест';

  // Act
  kaiten.click('report-send');
  const send = timeTab.sent.find((item) => item.message.type === 'sprint-capacity:time-send');
  kaiten.message(TIME, { type: 'sprint-capacity:time-result', id: send.message.id, ok: true, text: 'Сводка отправлена в Time, канал «Тестовый канал»' }, timeTab);
  await flush();

  // Assert
  assert.deepEqual(kaiten.confirms, ['Отправить сводку в Time, в канал «Тестовый канал»?']);
  assert.deepEqual(plain(send), { message: { type: 'sprint-capacity:time-send', id: send.message.id, channel: CHANNEL, text: 'Разработка P2P за спринт 14.09–27.09\n1. Тест' }, origin: TIME });
  assert.equal(kaiten.toast(), 'Сводка отправлена в Time, канал «Тестовый канал»');
});

test('«В Time»: отказались в подтверждении — ничего не уходит', () => {
  // Arrange
  const { kaiten, timeTab } = connectedKaiten({ answer: false });
  kaiten.$('[data-report-text]').value = 'Разработка P2P за спринт 14.09–27.09';

  // Act
  kaiten.click('report-send');

  // Assert
  assert.equal(kaiten.confirms.length, 1);
  assert.equal(timeTab.sent.some((item) => item.message.type === 'sprint-capacity:time-send'), false);
});

test('«В Time»: вкладка Time молчит 30 секунд — тост просит заглянуть в канал перед повтором', async () => {
  // Arrange
  const { kaiten } = connectedKaiten({ answer: true });
  kaiten.$('[data-report-text]').value = 'Разработка P2P за спринт 14.09–27.09';

  // Act
  kaiten.click('report-send');
  kaiten.runTimers(30000);
  await flush();

  // Assert
  assert.equal(kaiten.toast(), 'Вкладка Time не ответила за 30 секунд — загляните в канал, прежде чем отправлять ещё раз');
});

test('«В Time» без подключения: открывает окошко T и подсказывает, ничего не спрашивает', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', answer: true });
  kaiten.$('[data-report-text]').value = 'Разработка P2P за спринт 14.09–27.09';

  // Act
  kaiten.click('report-send');

  // Assert
  assert.equal(kaiten.$('.time-login').hidden, false);
  assert.equal(kaiten.toast(), 'Сначала подключите Time — буква T вверху панели');
  assert.deepEqual(kaiten.confirms, []);
});

test('«В Time» и «Скопировать» с пустой сводкой — просят сначала посчитать', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', answer: true });

  // Act
  kaiten.click('report-send');
  const sent = kaiten.toast();
  kaiten.click('report-copy');

  // Assert
  assert.equal(sent, 'Сводка пустая — сначала нажмите «Посчитать»');
  assert.equal(kaiten.toast(), 'Сводка пустая — сначала нажмите «Посчитать»');
  assert.deepEqual(kaiten.copied, []);
});

test('«Посчитать»: прошлый спринт по умолчанию, карточки досок и баги пространства, текст в поле', async () => {
  // Arrange
  const requests = [];
  const kaiten = page({
    hostname: 'dodopizza.kaiten.ru',
    fetch: (url) => {
      requests.push(url);
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    },
  });
  await flush();

  // Act
  kaiten.click('report-run');
  await flush();

  // Assert
  const options = kaiten.$('[data-report-sprint]').innerHTML;
  assert.match(options, /<option value="0">[0-9.]+–[0-9.]+ — идёт<\/option><option value="1" selected>/);
  assert.match(kaiten.$('[data-report-text]').value, /^Разработка P2P за спринт \d\d\.\d\d–\d\d\.\d\d\n1\. Завершена разработка 0 задач/);
  assert.match(kaiten.$('[data-report-progress]').textContent, /^Посчитано в \d\d:\d\d\. Баги — на сегодня/);
  assert.ok(requests.some((url) => /^\/api\/cards\?board_id=68084&updated_after=\d{4}-\d\d-\d\dT\d\d%3A00%3A00\.000Z&condition=2&/.test(url)));
  assert.ok(requests.some((url) => url.startsWith('/api/cards?board_id=1524136&updated_after=')));
  assert.ok(requests.some((url) => url.startsWith('/api/cards?type_ids=446247&space_id=19143&updated_after=')));
});

test('«Посчитать»: Kaiten не пустил — причина под кнопкой, поле не тронуто', async () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru', fetch: () => Promise.resolve({ ok: false, status: 401 }) });
  await flush();

  // Act
  kaiten.click('report-run');
  await flush();

  // Assert
  assert.equal(kaiten.$('[data-report-progress]').textContent, 'Не посчиталось: Kaiten не пускает — войдите в Kaiten и нажмите ↻');
  assert.equal(kaiten.$('[data-report-progress]').className, 'error');
  assert.equal(kaiten.$('[data-report-text]').value, undefined);
});

const timeFetch = (calls, { status = 200 } = {}) => (url, options) => {
  calls.push({ url, options });
  const answers = {
    '/api/v4/users/me': { username: 'tester' },
    '/api/v4/teams/name/test-team/channels/name/test-channel': { id: 'channel-1', name: 'test-channel', display_name: 'Тестовый канал' },
    '/api/v4/posts': { id: 'post-1' },
  };
  return Promise.resolve({ ok: status === 200, status, json: () => Promise.resolve(answers[url]) });
};

test('Закладка во вкладке Time: здоровается с Kaiten и называет канал и отправителя', async () => {
  // Arrange
  const calls = [];
  const opener = fakeTab();
  const time = page({ hostname: 'team.time-messenger.ru', opener, fetch: timeFetch(calls) });
  const kaitenTab = fakeTab();

  // Act
  time.message(KAITEN, { type: 'sprint-capacity:time-ping', channel: CHANNEL }, kaitenTab);
  await flush();

  // Assert
  assert.deepEqual(plain(opener.sent), [{ message: { type: 'sprint-capacity:time-hello' }, origin: '*' }]);
  assert.equal(time.toast(), 'Time подключён к панели в Kaiten. Не закрывайте эту вкладку — через неё уходят сводки');
  assert.deepEqual(calls.map((call) => call.url), ['/api/v4/users/me', '/api/v4/teams/name/test-team/channels/name/test-channel']);
  assert.deepEqual(plain(kaitenTab.sent), [{ message: { type: 'sprint-capacity:time-ready', user: 'tester', channel: 'Тестовый канал', url: CHANNEL }, origin: KAITEN }]);
});

test('Закладка во вкладке Time: пишет в канал с защитой от подделки запроса и отвечает Kaiten', async () => {
  // Arrange
  const calls = [];
  const time = page({ hostname: 'team.time-messenger.ru', opener: fakeTab(), cookie: 'MMUSERID=u1; MMCSRF=csrf-test', fetch: timeFetch(calls) });
  const kaitenTab = fakeTab();

  // Act
  time.message(KAITEN, { type: 'sprint-capacity:time-send', id: 'send-1', channel: CHANNEL, text: '  Разработка P2P\n1. Тест  ' }, kaitenTab);
  await flush();

  // Assert
  const post = calls.find((call) => call.url === '/api/v4/posts');
  assert.equal(post.options.method, 'POST');
  assert.equal(post.options.credentials, 'include');
  assert.equal(post.options.headers['x-csrf-token'], 'csrf-test');
  assert.equal(post.options.headers['x-requested-with'], 'XMLHttpRequest');
  assert.deepEqual(JSON.parse(post.options.body), { channel_id: 'channel-1', message: 'Разработка P2P\n1. Тест' });
  assert.deepEqual(plain(kaitenTab.sent), [{ message: { type: 'sprint-capacity:time-result', id: 'send-1', ok: true, text: 'Сводка отправлена в Time, канал «Тестовый канал»' }, origin: KAITEN }]);
});

test('Закладка во вкладке Time: не вошли в Time — Kaiten узнаёт причину, пост не отправлен', async () => {
  // Arrange
  const calls = [];
  const time = page({ hostname: 'team.time-messenger.ru', opener: fakeTab(), fetch: timeFetch(calls, { status: 401 }) });
  const kaitenTab = fakeTab();

  // Act
  time.message(KAITEN, { type: 'sprint-capacity:time-send', id: 'send-2', channel: CHANNEL, text: 'Сводка' }, kaitenTab);
  await flush();

  // Assert
  assert.equal(calls.some((call) => call.url === '/api/v4/posts'), false);
  assert.deepEqual(plain(kaitenTab.sent), [{ message: { type: 'sprint-capacity:time-result', id: 'send-2', ok: false, text: 'В Time не отправилось: Вы не вошли в Time в этом браузере — войдите и нажмите закладку ещё раз' }, origin: KAITEN }]);
});

test('Закладка во вкладке Time: канал на другом Time — не пишет туда', async () => {
  // Arrange
  const calls = [];
  const time = page({ hostname: 'team.time-messenger.ru', opener: fakeTab(), fetch: timeFetch(calls) });
  const kaitenTab = fakeTab();

  // Act
  time.message(KAITEN, { type: 'sprint-capacity:time-send', id: 'send-3', channel: 'https://other.time-messenger.ru/test-team/channels/test-channel', text: 'Сводка' }, kaitenTab);
  await flush();

  // Assert
  assert.deepEqual(calls, []);
  assert.equal(kaitenTab.sent[0].message.ok, false);
  assert.match(kaitenTab.sent[0].message.text, /Канал в панели — на https:\/\/other\.time-messenger\.ru, а эта вкладка — https:\/\/team\.time-messenger\.ru/);
});

test('Закладка во вкладке Time: просьбы не из Kaiten не выполняет', async () => {
  // Arrange
  const calls = [];
  const time = page({ hostname: 'team.time-messenger.ru', opener: fakeTab(), fetch: timeFetch(calls) });
  const stranger = fakeTab();

  // Act
  time.message('https://example.com', { type: 'sprint-capacity:time-send', id: 'x', channel: CHANNEL, text: 'Чужое' }, stranger);
  time.message('https://kaiten.ru.example.com', { type: 'sprint-capacity:time-ping', channel: CHANNEL }, stranger);
  await flush();

  // Assert
  assert.deepEqual(calls, []);
  assert.deepEqual(stranger.sent, []);
});

test('Закладка во вкладке Time без панели Kaiten — подсказывает, откуда открыть', () => {
  // Act
  const time = page({ hostname: 'team.time-messenger.ru' });

  // Assert
  assert.equal(time.alerts.length, 1);
  assert.match(time.alerts[0], /откройте Time кнопкой «Открыть Time» в панели на Kaiten/);
});
