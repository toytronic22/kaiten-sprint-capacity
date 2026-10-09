const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const core = require('../src/core.js');

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

const page = ({ hostname, stored = {}, opener = null, clipboard = true, holst = 'ok', confirm = () => false, fetch = () => Promise.reject(new Error('нет сети в тесте')), now = null }) => {
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
    confirm,
    opener,
  };
  if (now !== null) context.Date = class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } };
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
  hostname: 'dodopizza.kaiten.ru',
  stored: {
    'sprintCapacity.v1.board': '68084',
    'sprintCapacity.v1.settings.68084': JSON.stringify({ team: { back: { people: 1 } } }),
    'sprintCapacity.v1.geese.68084': JSON.stringify('2026-10-02'),
    ...stored,
  },
  fetch: (url) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(url.startsWith('/api/cards?') ? [{ id: 1, title: 'Карта 1', size: 50, properties: { id_499149: [16232407] }, state: 1 }] : url.endsWith('/comments') ? comments : []),
  }),
});

const planningStart = (takenAt) => ({
  text: `Снимок начала планирования, Staff Core. Осталось: Бэк 20 · Фронт 0 · QA 0.\n\n\`\`\`json\n${JSON.stringify({ boardId: 68084, takenAt, totals: { back: 20, front: 0, qa: 0 }, doneIds: [] })}\n\`\`\``,
  created: takenAt,
  author: { full_name: 'Тестировщик' },
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

test('«В Holst» без выбора спринта: одна кнопка с подписью, старый выбор из хранилища не мешает', async () => {
  // Arrange
  const kaiten = overloadedKaiten({ 'sprintCapacity.v1.sprintPick.68084': JSON.stringify('last') });

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

const DAY = 86400000;
const SNAPSHOT = 'Снимок начала планирования';
const LATER = Date.parse('2026-10-14T12:00:00+03:00');
const ago = (ms, now = Date.now()) => new Date(now - ms).toISOString();
const mskMidnight = (days) => new Date(Math.floor((Date.now() + 10800000) / DAY) * DAY - 10800000 + days * DAY).toISOString();
const teamComment = (savedAt, settings, author = 'Тестировщик') => ({
  text: core.settingsComment({ boardId: 68084, savedAt, settings: core.normalizeSettings(settings) }),
  created: savedAt,
  author: { full_name: author },
});
const posted = (env, mark) => env.requests.filter((item) => item.method === 'POST' && item.body.text.startsWith(mark)).map((item) => JSON.parse(item.body.text.match(/```json\s*([\s\S]*?)```/)[1]));

const teamKaiten = ({ stored = {}, comments = [], sprint = null, sprintId = null, confirm = () => false, fail = () => false, now = null } = {}) => {
  const requests = [];
  const env = page({
    hostname: 'dodopizza.kaiten.ru',
    stored: { 'sprintCapacity.v1.board': '68084', 'sprintCapacity.v1.settings.68084': JSON.stringify({ team: { back: { people: 1 } } }), ...stored },
    confirm,
    now,
    fetch: (url, options = {}) => {
      const body = options.body ? JSON.parse(options.body) : null;
      requests.push({ url, method: options.method || 'GET', body });
      if (fail(body)) return Promise.reject(new Error('нет сети'));
      let reply = [];
      if (url.startsWith('/api/cards?')) reply = [{ id: 1, title: 'Карта 1', size: 30, properties: { id_499149: [16232407] }, state: 1, ...(sprintId ? { sprint_id: sprintId } : {}) }];
      else if (url.endsWith('/comments') && body) {
        reply = { text: body.text, created: new Date(now === null ? Date.now() : now).toISOString(), author: { full_name: 'Алексей' } };
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
  assert.equal(JSON.parse(kaiten.stored.get('sprintCapacity.v1.settings.68084')).team.back.people, 3);
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
  assert.match(kaiten.$('.shared').textContent, /^Общие для команды · последняя правка: Алексей, /);
  assert.deepEqual(JSON.parse(kaiten.stored.get('sprintCapacity.v1.edits.68084')), { at: 0, values: {} });
});

test('Неотправленная правка старше чужого сохранения при открытии выбрасывается, свежая — уходит команде', async () => {
  // Arrange
  const comments = () => [teamComment(ago(3600000, LATER), { team: { back: { people: 3 } } })];
  const edit = (at) => ({ 'sprintCapacity.v1.edits.68084': JSON.stringify({ at, values: { 'team.back.people': '5' } }) });

  // Act
  const stale = teamKaiten({ now: LATER, stored: edit(LATER - 2 * 3600000), comments: comments() });
  const fresh = teamKaiten({ now: LATER, stored: edit(LATER - 600000), comments: comments() });
  await flush();

  // Assert
  assert.deepEqual(posted(stale, core.SETTINGS_MARK), []);
  assert.match(stale.$('.summary').innerHTML, /<span class="of"> \/ 30<\/span>/);
  assert.deepEqual(JSON.parse(stale.stored.get('sprintCapacity.v1.edits.68084')), { at: 0, values: {} });
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
  assert.match(asked[0], /^Staff Core: начать планирование для всей команды\? .*Потом «нет, чел\.-дн» и «праздников» обнулятся, а «рабочих дней» вернутся к 10 — впишите их на новый спринт\.$/);
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
  assert.match(asked[0], /^Staff Core: начать планирование заново\? Снимок от .* заменится текущей доской у всей команды\. «Команда и дни» не обнулятся\.$/);
  assert.equal(posted(kaiten, SNAPSHOT).length, 1);
  assert.deepEqual(posted(kaiten, core.SETTINGS_MARK), []);
});

test('Спринт в Kaiten закончился, а планирования не было — жёлтое напоминание, раскрывашки открыты, «Начать» снова синяя', async () => {
  // Arrange
  const sprint = { id: 501, start_date: ago(14 * DAY), finish_date: ago(3600000), actual_finish_date: null };
  const kaiten = teamKaiten({ sprintId: 501, sprint, comments: [planningStart(ago(20 * DAY))] });

  // Act
  await flush();

  // Assert
  assert.equal(kaiten.$('.remind').innerHTML, '<div class="tip">Пора планировать спринт. 1) Проверьте «Команда и дни»: это факт уходящего спринта. 2) Нажмите «Начать планирование».</div>');
  assert.equal(kaiten.$('.planning').open, true);
  assert.equal(kaiten.$('.settings').open, true);
  assert.match(kaiten.$('.planning').innerHTML, /title="Когда: один раз за спринт[^"]*">Начать планирование<\/button>/);
  assert.equal(JSON.parse(kaiten.stored.get('sprintCapacity.v1.sprint.68084')), 501);
});

test('Посреди спринта напоминания нет, а даты спринта панель берёт из Kaiten не на каждом обновлении', async () => {
  // Arrange
  const sprint = { id: 502, start_date: ago(5 * DAY), finish_date: ago(-9 * DAY), actual_finish_date: null };
  const kaiten = teamKaiten({ sprintId: 502, sprint });
  await flush();

  // Act
  kaiten.click('refresh');
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
