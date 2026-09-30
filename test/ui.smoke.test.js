const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const root = path.join(__dirname, '..');
execFileSync(process.execPath, [path.join(root, 'build.mjs')], { cwd: root, stdio: 'pipe' });
const bundle = readFileSync(path.join(root, 'dist', 'sprint-capacity.js'), 'utf8');

const HOLST = 'https://app.holst.so';
const KAITEN = 'https://dodopizza.kaiten.ru';
const TOKEN_KEY = 'sprintCapacity.v1.holstToken';

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

const page = ({ hostname, stored = {}, opener = null, clipboard = true }) => {
  const env = { stored: new Map(Object.entries(stored)), timers: [], listeners: {}, opened: [], alerts: [], copied: [], blockPopups: false };
  const shadowElements = new Map([['.holst-login', Object.assign(fakeElement(), { hidden: true })]]);
  const shadow = fakeElement();
  shadow.querySelector = (selector) => {
    if (!shadowElements.has(selector)) shadowElements.set(selector, fakeElement());
    return shadowElements.get(selector);
  };
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
    fetch: () => Promise.reject(new Error('нет сети в тесте')),
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
  env.toast = () => {
    const box = document.getElementById('sprintcap-toast');
    return box ? box.children.map((element) => element.textContent).join('') : null;
  };
  return env;
};

const flush = () => new Promise((resolve) => setImmediate(resolve));
const plain = (value) => JSON.parse(JSON.stringify(value));

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
  assert.equal(kaiten.$('[data-act="holst-login"]').classList.contains('saved'), false);
});

test('Вход из вкладки Holst: панель отвечает на приветствие, сохраняет вход и сообщает вкладке', () => {
  // Arrange
  const kaiten = page({ hostname: 'dodopizza.kaiten.ru' });
  const holstTab = fakeTab();

  // Act
  kaiten.message(HOLST, { type: 'sprint-capacity:hello' }, holstTab);
  kaiten.message(HOLST, { type: 'sprint-capacity:login', token: 'test-login-1' }, holstTab);

  // Assert
  assert.deepEqual(plain(holstTab.sent[0]), { message: { type: 'sprint-capacity:ping' }, origin: HOLST });
  assert.equal(kaiten.stored.get(TOKEN_KEY), JSON.stringify('test-login-1'));
  assert.equal(holstTab.sent[1].message.type, 'sprint-capacity:result');
  assert.equal(holstTab.sent[1].message.failed, false);
  assert.equal(holstTab.sent[1].origin, HOLST);
  assert.equal(kaiten.$('[data-act="holst-login"]').classList.contains('saved'), true);
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
