const PANEL_CSS = `
:host { all: initial; }
.panel { --bg: #26282c; --fg: #e4e6ea; --muted: #9399a3; --line: #383b41; --soft: #30333a; --field: #1e2024; --accent: #5b9cf6; --accent-soft: #34507c; --bad: #f47174; --bad-soft: #7a3438; color-scheme: dark; position: fixed; top: 72px; right: 16px; width: 300px; max-width: calc(100vw - 32px); max-height: calc(100vh - 88px); overflow: auto; z-index: 2147483000; box-sizing: border-box; background: var(--bg); color: var(--fg); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 16px 40px rgba(0, 0, 0, .45); font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
header { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 2px; padding: 10px 8px 10px 14px; background: var(--bg); border-bottom: 1px solid var(--line); }
header b { font-size: 14px; }
.board { max-width: 150px; padding: 3px 22px 3px 6px; margin-left: -6px; font: 600 14px/1.3 inherit; font-family: inherit; color: var(--fg); background: var(--bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%239399a3' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat right 6px center; border: 1px solid transparent; border-radius: 8px; appearance: none; cursor: pointer; }
.board:hover, .board:focus { border-color: var(--line); background-color: var(--soft); outline: none; }
.board option { background: var(--field); color: var(--fg); }
.time { flex: 1; margin-left: 8px; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; border-radius: 8px; cursor: pointer; }
.icon { width: 28px; height: 28px; font-size: 16px; line-height: 28px; color: var(--muted); }
.icon:hover { background: var(--soft); color: var(--fg); }
.icon:disabled { cursor: default; }
.icon:disabled span { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.geese { position: fixed; inset: 0; z-index: 2147483001; overflow: hidden; pointer-events: none; --w: clamp(60px, min(10vw, 16vh), 190px); }
.goose { position: absolute; left: 0; width: var(--w); animation: goose-run var(--speed) cubic-bezier(.35, .05, .65, .95) var(--delay) both; }
.goose .wave { animation: goose-wave var(--wave) ease-in-out var(--phase) infinite alternate; }
.goose .bob { transform-origin: 50% 100%; animation: goose-bob var(--step) ease-in-out infinite alternate; }
.goose svg { display: block; width: 100%; overflow: visible; filter: drop-shadow(0 .35em .25em rgba(0, 0, 0, .18)); }
.goose .leg { transform-box: fill-box; transform-origin: 50% 0; animation: goose-leg var(--step) ease-in-out infinite alternate; }
.goose .leg + .leg { animation-direction: alternate-reverse; }
.goose .wing { transform-box: fill-box; transform-origin: 88% 30%; animation: goose-wing calc(var(--step) * .7) ease-in-out infinite alternate; }
.goose .jaw { transform-box: fill-box; transform-origin: 0 0; animation: goose-jaw calc(var(--step) * 1.3) ease-in-out infinite alternate; }
.goose .say { position: absolute; left: 52%; bottom: 92%; padding: .28em .7em .32em; font: 800 max(11px, calc(var(--w) * .15))/1.1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #e0303a; background: #fff; border-radius: 1em; box-shadow: 0 .15em 0 rgba(0, 0, 0, .12), 0 .3em .9em rgba(0, 0, 0, .18); white-space: nowrap; transform-origin: 10% 100%; animation: goose-say .5s cubic-bezier(.2, 1.8, .4, 1) both, goose-shake .32s ease-in-out .5s infinite alternate; }
.goose .say::after { content: ""; position: absolute; left: .9em; bottom: -.5em; border: .3em solid transparent; border-top: .55em solid #fff; border-bottom: 0; transform: skewX(20deg); }
.boom { position: absolute; z-index: 20; left: 50%; top: max(12px, 12vh); width: min(820px, 90vw, 110vh); container-type: inline-size; aspect-ratio: 2.2; display: grid; place-items: center; transform: translateX(-50%) rotate(-6deg); animation: boom-in .45s cubic-bezier(.2, 1.7, .4, 1) both, boom-out .45s ease-in var(--boom-end) forwards; }
.boom::before, .boom::after { content: ""; position: absolute; inset: 0; clip-path: polygon(100.0% 50.0%, 87.0% 58.5%, 95.0% 71.7%, 79.7% 73.7%, 81.2% 89.1%, 66.5% 84.2%, 61.1% 98.7%, 50.0% 88.0%, 38.9% 98.7%, 33.5% 84.2%, 18.8% 89.1%, 20.3% 73.7%, 5.0% 71.7%, 13.0% 58.5%, 0.0% 50.0%, 13.0% 41.5%, 5.0% 28.3%, 20.3% 26.3%, 18.8% 10.9%, 33.5% 15.8%, 38.9% 1.3%, 50.0% 12.0%, 61.1% 1.3%, 66.5% 15.8%, 81.2% 10.9%, 79.7% 26.3%, 95.0% 28.3%, 87.0% 41.5%); }
.boom::before { background: #1b1c20; transform: scale(1.05) translate(1.2%, 2%); }
.boom::after { background: radial-gradient(circle at 50% 45%, #ff5a4a, #d8261d 70%); animation: boom-flash .5s steps(1) infinite; }
.boom span { position: relative; z-index: 1; max-width: 76%; text-align: center; font: italic 900 max(16px, 10.5cqw)/.95 Impact, "Arial Black", "Helvetica Neue", sans-serif; letter-spacing: .02em; color: #fff15c; -webkit-text-stroke: max(1px, .03em) #1b1c20; text-shadow: .06em .07em 0 #1b1c20; }
.boom span.pop { animation: boom-pop .3s cubic-bezier(.2, 1.9, .4, 1); }
@keyframes boom-in { from { transform: translateX(-50%) rotate(-24deg) scale(0); } to { transform: translateX(-50%) rotate(-6deg) scale(1); } }
@keyframes boom-out { to { opacity: 0; transform: translateX(-50%) rotate(-6deg) scale(1.3); } }
@keyframes boom-flash { 50% { background: radial-gradient(circle at 50% 45%, #ffe45c, #ffb21e 70%); } }
@keyframes boom-pop { from { transform: scale(.6) rotate(-4deg); } to { transform: scale(1) rotate(0); } }
@keyframes goose-run { from { transform: translateX(-130%) scale(var(--size)); } to { transform: translateX(calc(100vw + 40%)) scale(var(--size)); } }
@keyframes goose-wave { from { transform: translateY(calc(var(--amp) * -1)) rotate(var(--lean)); } to { transform: translateY(var(--amp)) rotate(calc(var(--lean) * -1)); } }
@keyframes goose-bob { from { transform: translateY(0) rotate(-3deg); } to { transform: translateY(-12%) rotate(4deg) scaleY(1.04); } }
@keyframes goose-leg { from { transform: rotate(-30deg); } to { transform: rotate(30deg); } }
@keyframes goose-wing { from { transform: rotate(0); } to { transform: rotate(24deg); } }
@keyframes goose-jaw { from { transform: rotate(0); } to { transform: rotate(22deg); } }
@keyframes goose-say { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: scale(1); } }
@keyframes goose-shake { from { transform: rotate(-4deg); } to { transform: rotate(4deg) scale(1.06); } }
.error { margin: 10px 14px 0; padding: 8px 10px; background: #4a2428; color: #ffb4b8; border-radius: 8px; font-size: 12px; }
.summary { padding: 12px 14px 14px; }
.summary.stale { opacity: .55; }
.row + .row { margin-top: 12px; }
.row-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-variant-numeric: tabular-nums; }
.name { font-weight: 600; }
.value { font-size: 15px; }
.value b { font-size: 18px; }
.value .of, .split { color: var(--muted); }
.split { font-size: 13px; }
.bar { position: relative; display: flex; height: 6px; margin-top: 5px; background: var(--soft); border-radius: 3px; overflow: hidden; }
.bar i { display: block; height: 100%; }
.bar .base { background: var(--accent); }
.bar .add { background: var(--accent-soft); }
.over .bar .base { background: var(--bad); }
.over .bar .add { background: var(--bad-soft); }
.over .value b { color: var(--bad); }
.bar .limit { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--fg); }
.legend { margin-top: 10px; color: var(--muted); font-size: 11px; }
.done { display: flex; align-items: baseline; gap: 8px; margin-top: 14px; padding: 10px 12px; background: var(--soft); border-radius: 10px; font-variant-numeric: tabular-nums; }
.done b { font-size: 20px; }
.done .of { margin-left: auto; color: var(--muted); font-size: 12px; }
.plan { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.plan button { padding: 7px 12px; border-radius: 8px; font-weight: 600; background: var(--accent); color: #10151d; }
.plan button:hover { filter: brightness(1.08); }
.plan button.again { background: var(--soft); color: var(--fg); font-weight: 500; }
.plan button.again:hover { background: var(--line); }
.plan span { color: var(--muted); font-size: 12px; }
.panel.collapsed .body { display: none; }
details { border-top: 1px solid var(--line); }
summary { display: flex; align-items: center; gap: 6px; padding: 10px 14px; cursor: pointer; list-style: none; font-weight: 600; }
summary::-webkit-details-marker { display: none; }
summary::after { content: "›"; margin-left: auto; color: var(--muted); transition: transform .15s; }
details[open] > summary::after { transform: rotate(90deg); }
.count { padding: 0 7px; border-radius: 9px; background: #4d3d12; color: #f3cd62; font-size: 11px; font-weight: 600; }
.inner { padding: 0 14px 12px; }
.team { display: grid; grid-template-columns: 1fr 64px 64px; gap: 6px 8px; align-items: center; }
.team .th { color: var(--muted); font-size: 11px; text-align: center; }
.days { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
.days label { display: flex; flex-direction: column; gap: 3px; color: var(--muted); font-size: 11px; }
input[type=text] { width: 100%; box-sizing: border-box; font: inherit; color: inherit; padding: 5px 8px; text-align: center; border: 1px solid var(--line); border-radius: 8px; background: var(--field); }
input[type=text]:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(91, 156, 246, .2); }
input[type=text]::placeholder { color: #666c75; }
.group + .group { margin-top: 8px; }
.group-title { color: var(--muted); font-size: 11px; }
ul { list-style: none; margin: 2px 0 0; padding: 0; }
li { padding: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.muted { color: var(--muted); font-size: 12px; }
`;

const PANEL_INPUT = (path, placeholder) => `<input type="text" inputmode="decimal" autocomplete="off" data-set="${path}" placeholder="${placeholder}">`;

const PANEL_HTML = `
<div class="panel">
  <header>
    <select class="board" data-act="board" title="Доска"></select>
    <span class="time"></span>
    <button type="button" class="icon" data-act="refresh" title="Обновить"><span>↻</span></button>
    <button type="button" class="icon" data-act="collapse" title="Свернуть">–</button>
    <button type="button" class="icon" data-act="close" title="Закрыть">×</button>
  </header>
  <div class="status"></div>
  <div class="summary"></div>
  <div class="body">
    <details class="settings">
      <summary>Команда и дни</summary>
      <div class="inner">
        <div class="team">
          <span></span><span class="th">людей</span><span class="th" title="Отпуска, отгулы, дежурства за спринт">нет, чел.-дн</span>
          <span>Бэк</span>${PANEL_INPUT('team.back.people', '0')}${PANEL_INPUT('team.back.absence', '0')}
          <span data-label="front">Фронт</span>${PANEL_INPUT('team.front.people', '0')}${PANEL_INPUT('team.front.absence', '0')}
          <span>QA</span>${PANEL_INPUT('team.qa.people', '0')}${PANEL_INPUT('team.qa.absence', '0')}
        </div>
        <div class="days">
          <label>рабочих дней ${PANEL_INPUT('workDays', '10')}</label>
          <label>праздников ${PANEL_INPUT('holidays', '0')}</label>
          <label>SP в день ${PANEL_INPUT('coefficient', '1')}</label>
        </div>
      </div>
    </details>
    <details class="warnings"></details>
  </div>
</div>`;

const GOOSE_SVG = `<svg viewBox="0 0 130 118" aria-hidden="true">
<g class="leg"><path d="M50 92 V106" stroke="#f28b24" stroke-width="5" stroke-linecap="round"/><path d="M47 105 Q46 112 53 112 H63 Q64 107 58 105 Z" fill="#f28b24"/></g>
<g class="leg"><path d="M66 92 V106" stroke="#f28b24" stroke-width="5" stroke-linecap="round"/><path d="M63 105 Q62 112 69 112 H79 Q80 107 74 105 Z" fill="#f28b24"/></g>
<g fill="#2b2d33" stroke="#2b2d33" stroke-width="6" stroke-linejoin="round"><path d="M30 70 Q12 60 14 48 Q26 54 38 62 Z"/><ellipse cx="58" cy="74" rx="36" ry="25"/><path d="M80 64 C92 54 86 40 96 30" fill="none" stroke-width="22" stroke-linecap="round"/><circle cx="97" cy="28" r="18"/></g>
<g fill="#fff"><path d="M30 70 Q12 60 14 48 Q26 54 38 62 Z"/><ellipse cx="58" cy="74" rx="36" ry="25"/><path d="M80 64 C92 54 86 40 96 30" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/><circle cx="97" cy="28" r="18"/></g>
<path d="M25 80 Q58 110 93 78 Q60 97 25 80 Z" fill="#e6ebf2"/>
<path class="wing" d="M79 65 C71 56 50 57 39 70 Q46 70 48 74 Q54 72 57 77 Q63 74 67 78 C75 76 81 71 79 65 Z" fill="#e4e9f0" stroke="#bfc7d3" stroke-width="2" stroke-linejoin="round"/>
<path class="jaw" d="M110 32 Q119 33 122 36 Q116 40 109 37 Z" fill="#ef8a1f" stroke="#2b2d33" stroke-width="2" stroke-linejoin="round"/>
<path d="M109 25 Q122 24 126 31 Q118 35 108 33 Z" fill="#ffa93a" stroke="#2b2d33" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="97" cy="37" rx="5" ry="3.2" fill="#ff9aac" opacity=".75"/>
<circle cx="102" cy="24" r="4.6" fill="#1b1c20"/><circle cx="103.6" cy="22.4" r="1.7" fill="#fff"/><circle cx="100.6" cy="26" r=".8" fill="#fff"/>
</svg>`;

const ISSUE_LABELS = {
  noPlatform: 'Нет {back} или {front} — не считаю',
  needQaWithoutQa: 'Need QA, а QA 0 SP',
  noEstimate: 'Без оценки',
};

function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, (char) => map[char]);
}

function snapshotTime(value) {
  return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function clockTime(date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function sprintCapacityMount(config) {
  if (window.__sprintCapacity) {
    window.__sprintCapacity.close();
    return;
  }
  if (!/(^|\.)kaiten\.ru$/.test(window.location.hostname)) {
    window.alert('Откройте Kaiten и нажмите закладку ещё раз');
    return;
  }

  const STORAGE_PREFIX = 'sprintCapacity.v1.';
  const REFRESH_MS = 60000;
  let storageBroken = false;
  const readStored = (key, fallback) => {
    let raw = null;
    try {
      raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    } catch (error) {
      storageBroken = true;
      return fallback;
    }
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  };
  const writeStored = (key, value) => {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      storageBroken = true;
    }
  };

  const knownBoard = (id) => config.boards.some((board) => board.id === id);
  let boardId = readStored('board', null);
  if (!knownBoard(boardId)) boardId = config.boards[0].id;
  const settingsKey = () => `settings.${boardId}`;
  const loadSettings = () => normalizeSettings(readStored(settingsKey(), boardId === config.boards[0].id ? readStored('settings', null) : null));
  let settings = loadSettings();
  let collapsed = readStored('collapsed', false) === true;
  let snapshot = null;
  let report = null;
  let closed = false;
  const data = { cards: null, loadedAt: null, error: null, snapshotError: null, busy: false };
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + 'snapshot');
  } catch (error) {
    storageBroken = true;
  }

  const host = document.createElement('div');
  host.id = 'sprint-capacity-panel';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${PANEL_CSS}</style>${PANEL_HTML}`;
  document.body.appendChild(host);
  const $ = (selector) => shadow.querySelector(selector);

  const cardLink = (item) => `<a href="${window.location.origin}/${item.id}" target="_blank" rel="noopener">${escapeHtml(item.title || item.id)}</a>`;

  const recompute = () => {
    report = data.cards ? buildReport({ cards: data.cards, settings, snapshot, config: boardConfig(boardId, config) }) : null;
  };

  const renderStatus = () => {
    let when = 'загружаю…';
    if (data.loadedAt) when = clockTime(data.loadedAt);
    else if (data.error && !data.busy) when = 'не загрузилось';
    $('.time').textContent = when;
    const messages = [];
    if (data.error) messages.push(`${data.error.message || data.error}${data.loadedAt ? ` — цифры на ${clockTime(data.loadedAt)}` : ''}`);
    if (data.snapshotError) messages.push(`Общий снимок: ${data.snapshotError.message || data.snapshotError}`);
    if (report) messages.push(...report.problems);
    if (storageBroken) messages.push('Браузер не сохраняет вписанное');
    $('.status').innerHTML = messages.map((message) => `<div class="error">${escapeHtml(message)}</div>`).join('');
    $('[data-act="refresh"]').disabled = data.busy;
  };

  const renderRow = (row) => {
    const scale = Math.max(row.total, row.capacity || 0, snapshot ? row.base : 0);
    const share = (value) => (scale > 0 ? `${(Math.max(value, 0) / scale) * 100}%` : '0');
    const base = snapshot ? Math.min(row.base, row.total) : row.total;
    const limit = row.over ? `<i class="limit" style="left:${share(row.capacity)}"></i>` : '';
    const split = snapshot ? `<span class="split">${formatNumber(row.base)} ${row.added < 0 ? '−' : '+'} ${formatNumber(Math.abs(row.added))} =</span> ` : '';
    const capacity = row.capacity === null ? '—' : formatNumber(row.capacity);
    return `<div class="row${row.over ? ' over' : ''}" title="${escapeHtml(formatRow(row))}">`
      + `<div class="row-head"><span class="name">${escapeHtml(row.label)}</span>`
      + `<span class="value">${split}<b>${formatNumber(row.total)}</b><span class="of"> / ${capacity}</span></span></div>`
      + `<div class="bar"><i class="base" style="width:${share(base)}"></i><i class="add" style="width:${share(row.total - base)}"></i>${limit}</div></div>`;
  };

  const renderSummary = () => {
    const box = $('.summary');
    box.classList.toggle('stale', Boolean(data.error));
    if (!report) {
      box.innerHTML = '';
      return;
    }
    const rows = report.rows.map(renderRow).join('');
    const legend = snapshot ? '<div class="legend">осталось + прибавилось = сейчас / можно</div>' : '';
    const percent = report.done.percent === null ? '—' : `${report.done.percent}%`;
    const done = `<div class="done"><span>Done</span><b>${percent}</b><span class="of">${report.done.count} из ${report.done.of} ${plural(report.done.of, ['карты', 'карт', 'карт'])} · ${formatNumber(report.done.points)} SP</span></div>`;
    const since = snapshot ? `<span title="${escapeHtml(snapshot.author)}">с ${snapshotTime(snapshot.takenAt)}</span>` : '';
    const plan = `<div class="plan"><button type="button" data-act="start-planning"${snapshot ? ' class="again"' : ''}${data.busy ? ' disabled' : ''}>Начать планирование</button>${since}</div>`;
    box.innerHTML = rows + legend + done + plan;
  };

  const renderWarnings = () => {
    const box = $('.warnings');
    const count = report ? report.warnings.length : 0;
    box.hidden = !count;
    if (!count) {
      box.innerHTML = '';
      return;
    }
    const groups = Object.keys(ISSUE_LABELS).map((issue) => {
      const items = report.warnings.filter((warning) => warning.issue === issue).map((warning) => warning.item);
      if (!items.length) return '';
      const links = items.map((item) => `<li>${cardLink(item)}</li>`).join('');
      return `<div class="group"><div class="group-title">${escapeHtml(ISSUE_LABELS[issue].replace(/\{(\w+)\}/g, (_, key) => boardConfig(boardId, config).platformTags[key]))}</div><ul>${links}</ul></div>`;
    }).join('');
    box.innerHTML = `<summary>Проверить <span class="count">${count}</span></summary><div class="inner">${groups}</div>`;
  };

  const render = () => {
    renderStatus();
    renderSummary();
    renderWarnings();
  };

  const applyCollapsed = () => {
    $('.panel').classList.toggle('collapsed', collapsed);
    const button = $('[data-act="collapse"]');
    button.textContent = collapsed ? '+' : '–';
    button.title = collapsed ? 'Развернуть' : 'Свернуть';
  };

  const fillSettings = () => {
    for (const label of shadow.querySelectorAll('[data-label]')) label.textContent = boardConfig(boardId, config).labels[label.dataset.label];
    for (const input of shadow.querySelectorAll('.settings input[data-set]')) {
      const value = input.dataset.set.split('.').reduce((node, key) => node[key], settings);
      input.value = value === 0 && input.placeholder === '0' ? '' : formatNumber(value);
    }
  };

  const setSetting = (path, raw) => {
    const next = JSON.parse(JSON.stringify(settings));
    const keys = path.split('.');
    const parent = keys.slice(0, -1).reduce((node, key) => node[key], next);
    parent[keys[keys.length - 1]] = raw;
    settings = normalizeSettings(next);
    writeStored(settingsKey(), settings);
  };

  const refresh = async () => {
    if (data.busy || closed) return;
    const board = boardId;
    data.busy = true;
    renderStatus();
    const loaded = {};
    try {
      loaded.cards = await kaitenBoardCards(board);
    } catch (error) {
      loaded.error = error;
    }
    try {
      loaded.snapshot = snapshotFromComments(await kaitenCardComments(config.snapshotCardId), board);
    } catch (error) {
      loaded.snapshotError = error;
    }
    data.busy = false;
    if (closed) return;
    if (board !== boardId) {
      refresh();
      return;
    }
    if (loaded.error) data.error = loaded.error;
    else {
      data.cards = loaded.cards;
      data.loadedAt = new Date();
      data.error = null;
    }
    if (loaded.snapshotError) data.snapshotError = loaded.snapshotError;
    else {
      snapshot = loaded.snapshot;
      data.snapshotError = null;
    }
    recompute();
    render();
    checkChaos();
  };

  const startPlanning = async () => {
    const text = snapshot
      ? `${boardTitle(boardId, config)}: начать планирование заново? Снимок от ${snapshotTime(snapshot.takenAt)} заменится текущей доской у всей команды.`
      : `${boardTitle(boardId, config)}: запомнить для всей команды, сколько сейчас осталось в работе? Карты в Done дальше не считаются.`;
    if (!window.confirm(text)) return;
    data.busy = true;
    render();
    const board = boardId;
    try {
      const cards = await kaitenBoardCards(board);
      await kaitenAddComment(config.snapshotCardId, snapshotComment(takeSnapshot({ cards, settings, now: Date.now(), boardId: board, config: boardConfig(board, config) }), config));
    } catch (error) {
      window.alert(`Снимок не сохранился: ${error.message || error}`);
    }
    data.busy = false;
    await refresh();
  };

  const timer = window.setInterval(() => {
    if (!document.hidden) refresh();
  }, REFRESH_MS);

  const onVisible = () => {
    if (!document.hidden && data.loadedAt && Date.now() - data.loadedAt.getTime() > REFRESH_MS) refresh();
  };
  document.addEventListener('visibilitychange', onVisible);

  let chaosBefore = false;
  let chaosTimer = null;
  let chaosWords = null;
  const releaseGeese = (names) => {
    if ($('.geese')) return;
    const count = 7;
    const lifetime = 5;
    const shouters = new Set(Array.from({ length: count }, (_, index) => index).sort(() => Math.random() - 0.5).slice(0, 3));
    const words = ['!!Overload!!', ...names.map((name) => `${name} трещит!`)];
    const random = (from, to) => from + Math.random() * (to - from);
    const flock = document.createElement('div');
    flock.className = 'geese';
    flock.innerHTML = `<div class="boom" style="--boom-end:${lifetime - 0.45}s"><span>${escapeHtml(words[0])}</span></div>` + Array.from({ length: count }, (_, index) => {
      const size = random(0.75, 1.2);
      const style = `--delay:${random(0, 1.2).toFixed(2)}s;--speed:${random(2.4, 3.5).toFixed(2)}s;--size:${size.toFixed(2)};--step:${random(0.16, 0.24).toFixed(2)}s;--wave:${random(0.5, 0.9).toFixed(2)}s;--phase:${random(-1, 0).toFixed(2)}s;--amp:${random(1.5, 5).toFixed(1)}vh;--lean:${random(-6, 6).toFixed(1)}deg;bottom:${random(3, 48).toFixed(1)}%;z-index:${Math.round(size * 10)}`;
      const say = shouters.has(index) ? '<span class="say">Беспредел!</span>' : '';
      return `<div class="goose" style="${style}"><div class="wave"><div class="bob">${GOOSE_SVG}</div>${say}</div></div>`;
    }).join('');
    shadow.appendChild(flock);
    const label = flock.querySelector('.boom span');
    let word = 0;
    window.clearInterval(chaosWords);
    chaosWords = window.setInterval(() => {
      word = (word + 1) % words.length;
      label.textContent = words[word];
      label.classList.remove('pop');
      void label.offsetWidth;
      label.classList.add('pop');
    }, 650);
    window.setTimeout(() => {
      window.clearInterval(chaosWords);
      flock.remove();
    }, lifetime * 1000);
  };
  const checkChaos = () => {
    const names = report ? chaosNames(report.rows, boardConfig(boardId, config)) : [];
    const chaos = names.length > 0;
    if (chaos && !chaosBefore) releaseGeese(names);
    chaosBefore = chaos;
  };
  const checkChaosLater = () => {
    window.clearTimeout(chaosTimer);
    chaosTimer = window.setTimeout(checkChaos, 1500);
  };

  const close = () => {
    closed = true;
    window.clearInterval(timer);
    window.clearTimeout(chaosTimer);
    window.clearInterval(chaosWords);
    document.removeEventListener('visibilitychange', onVisible);
    host.remove();
    delete window.__sprintCapacity;
  };

  shadow.addEventListener('click', (event) => {
    const button = event.target.closest('[data-act]');
    if (!button) return;
    const act = button.dataset.act;
    if (act === 'close') close();
    if (act === 'refresh') refresh();
    if (act === 'start-planning' && !data.busy) startPlanning();
    if (act === 'collapse') {
      collapsed = !collapsed;
      writeStored('collapsed', collapsed);
      applyCollapsed();
    }
  });

  const switchBoard = (id) => {
    if (!knownBoard(id) || id === boardId) return;
    boardId = id;
    writeStored('board', boardId);
    settings = loadSettings();
    snapshot = null;
    chaosBefore = false;
    Object.assign(data, { cards: null, loadedAt: null, error: null, snapshotError: null });
    fillSettings();
    $('.settings').open = DIRECTIONS.some((direction) => settings.team[direction].people === 0);
    recompute();
    render();
    refresh();
  };

  shadow.addEventListener('change', (event) => {
    if (event.target.dataset.act === 'board') switchBoard(Number(event.target.value));
  });

  shadow.addEventListener('input', (event) => {
    const target = event.target;
    if (!target.dataset.set) return;
    setSetting(target.dataset.set, target.value);
    recompute();
    render();
    checkChaosLater();
  });

  for (const type of ['keydown', 'keyup', 'keypress']) {
    shadow.addEventListener(type, (event) => event.stopPropagation());
  }

  window.__sprintCapacity = { close, refresh };
  $('.board').innerHTML = config.boards.map((board) => `<option value="${board.id}"${board.id === boardId ? ' selected' : ''}>${escapeHtml(board.title)}</option>`).join('');
  applyCollapsed();
  fillSettings();
  $('.settings').open = DIRECTIONS.some((direction) => settings.team[direction].people === 0);
  render();
  refresh();
}
