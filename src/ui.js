const PANEL_CSS = `
:host { all: initial; }
.panel { --bg: #26282c; --fg: #e4e6ea; --muted: #9399a3; --line: #383b41; --soft: #30333a; --field: #1e2024; --accent: #5b9cf6; --accent-soft: #34507c; --bad: #f47174; --bad-soft: #7a3438; color-scheme: dark; position: fixed; top: 72px; right: 16px; width: 300px; max-width: calc(100vw - 32px); max-height: calc(100vh - 88px); overflow: auto; z-index: 2147483000; box-sizing: border-box; background: var(--bg); color: var(--fg); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 16px 40px rgba(0, 0, 0, .45); font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
header { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 2px; padding: 10px 8px 10px 14px; background: var(--bg); border-bottom: 1px solid var(--line); }
header b { font-size: 14px; }
.time { flex: 1; margin-left: 8px; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; border-radius: 8px; cursor: pointer; }
.icon { width: 28px; height: 28px; font-size: 16px; line-height: 28px; color: var(--muted); }
.icon:hover { background: var(--soft); color: var(--fg); }
.icon:disabled { cursor: default; }
.icon:disabled span { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
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
    <b>Ёмкость спринта</b>
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
          <span>Фронт</span>${PANEL_INPUT('team.front.people', '0')}${PANEL_INPUT('team.front.absence', '0')}
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

const ISSUE_LABELS = {
  noPlatform: 'Нет Backend или Frontend — не считаю',
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

  let settings = normalizeSettings(readStored('settings', null));
  let collapsed = readStored('collapsed', false) === true;
  let snapshot = normalizeSnapshot(readStored('snapshot', null));
  let report = null;
  let closed = false;
  const data = { cards: null, loadedAt: null, error: null, busy: false };

  const host = document.createElement('div');
  host.id = 'sprint-capacity-panel';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${PANEL_CSS}</style>${PANEL_HTML}`;
  document.body.appendChild(host);
  const $ = (selector) => shadow.querySelector(selector);

  const cardLink = (item) => `<a href="${window.location.origin}/${item.id}" target="_blank" rel="noopener">${escapeHtml(item.title || item.id)}</a>`;

  const recompute = () => {
    report = data.cards ? buildReport({ cards: data.cards, settings, snapshot, config }) : null;
  };

  const renderStatus = () => {
    let when = 'загружаю…';
    if (data.loadedAt) when = clockTime(data.loadedAt);
    else if (data.error && !data.busy) when = 'не загрузилось';
    $('.time').textContent = when;
    const messages = [];
    if (data.error) messages.push(`${data.error.message || data.error}${data.loadedAt ? ` — цифры на ${clockTime(data.loadedAt)}` : ''}`);
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
      + `<div class="row-head"><span class="name">${DIRECTION_LABELS[row.direction]}</span>`
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
    const done = `<div class="done"><span>Done</span><b>${percent}</b><span class="of">${formatNumber(report.done.points)} из ${formatNumber(report.board.points)} SP</span></div>`;
    const since = snapshot ? `<span>с ${snapshotTime(snapshot.takenAt)}</span>` : '';
    const plan = `<div class="plan"><button type="button" data-act="start-planning"${snapshot ? ' class="again"' : ''}>Начать планирование</button>${since}</div>`;
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
      return `<div class="group"><div class="group-title">${ISSUE_LABELS[issue]}</div><ul>${links}</ul></div>`;
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
    writeStored('settings', settings);
  };

  const refresh = async () => {
    if (data.busy || closed) return;
    data.busy = true;
    renderStatus();
    try {
      data.cards = await kaitenBoardCards(config.boardId);
      data.loadedAt = new Date();
      data.error = null;
    } catch (error) {
      data.error = error;
    }
    data.busy = false;
    if (closed) return;
    recompute();
    render();
  };

  const timer = window.setInterval(() => {
    if (!document.hidden) refresh();
  }, REFRESH_MS);

  const onVisible = () => {
    if (!document.hidden && data.loadedAt && Date.now() - data.loadedAt.getTime() > REFRESH_MS) refresh();
  };
  document.addEventListener('visibilitychange', onVisible);

  const close = () => {
    closed = true;
    window.clearInterval(timer);
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
    if (act === 'start-planning' && data.cards) {
      const text = snapshot
        ? `Начать планирование заново? Снимок от ${snapshotTime(snapshot.takenAt)} заменится текущей доской.`
        : 'Запомнить, сколько сейчас осталось в работе? Карты в Done дальше не считаются.';
      if (window.confirm(text)) {
        snapshot = takeSnapshot({ cards: data.cards, settings, now: Date.now(), config });
        writeStored('snapshot', snapshot);
        recompute();
        render();
      }
    }
    if (act === 'collapse') {
      collapsed = !collapsed;
      writeStored('collapsed', collapsed);
      applyCollapsed();
    }
  });

  shadow.addEventListener('input', (event) => {
    const target = event.target;
    if (!target.dataset.set) return;
    setSetting(target.dataset.set, target.value);
    recompute();
    render();
  });

  for (const type of ['keydown', 'keyup', 'keypress']) {
    shadow.addEventListener(type, (event) => event.stopPropagation());
  }

  window.__sprintCapacity = { close, refresh };
  applyCollapsed();
  fillSettings();
  $('.settings').open = DIRECTIONS.some((direction) => settings.team[direction].people === 0);
  render();
  refresh();
}
