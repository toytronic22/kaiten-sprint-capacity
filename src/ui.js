const PANEL_CSS = `
:host { all: initial; }
.panel { position: fixed; top: 72px; right: 16px; width: 380px; max-width: calc(100vw - 32px); max-height: calc(100vh - 88px); overflow: auto; z-index: 2147483000; box-sizing: border-box; background: #fff; color: #1f2328; border: 1px solid #d0d7de; border-radius: 10px; box-shadow: 0 8px 28px rgba(0, 0, 0, .18); font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
header { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 6px; padding: 8px 10px 8px 12px; background: #f6f8fa; border-bottom: 1px solid #d0d7de; }
header b { flex: 1; font-size: 14px; }
button { font: inherit; color: inherit; background: #fff; border: 1px solid #d0d7de; border-radius: 6px; padding: 2px 8px; cursor: pointer; }
button:hover { background: #eef1f4; }
button:disabled { opacity: .5; cursor: default; }
.status { padding: 8px 12px 0; color: #57606a; font-size: 12px; }
.error { margin: 6px 0 0; padding: 6px 8px; background: #ffebe9; color: #a40e26; border-radius: 6px; font-size: 12px; }
.summary { padding: 8px 12px 10px; }
.summary.stale { opacity: .55; }
.line { font-size: 16px; font-weight: 600; padding: 1px 0; font-variant-numeric: tabular-nums; }
.line.over { color: #cf222e; }
.line.done { margin-top: 8px; }
.legend, .hint { color: #57606a; font-size: 12px; }
.warn { margin-top: 6px; color: #9a6700; font-size: 12px; }
.panel.collapsed .body { display: none; }
section, details { border-top: 1px solid #eaeef2; padding: 8px 12px; }
summary { cursor: pointer; font-weight: 600; }
h4 { margin: 0 0 4px; font-size: 13px; }
table { border-collapse: collapse; }
th { text-align: left; font-weight: 500; color: #57606a; font-size: 12px; padding: 0 8px 2px 0; }
td { padding: 2px 8px 2px 0; }
.grid { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 6px; font-size: 12px; color: #57606a; }
input[type=text] { width: 48px; box-sizing: border-box; font: inherit; color: inherit; padding: 2px 6px; border: 1px solid #d0d7de; border-radius: 6px; background: #fff; }
input[type=text]::placeholder { color: #8c959f; }
ul { list-style: none; margin: 4px 0 0; padding: 0; }
ul.compact li { padding: 2px 0; border: 0; }
.group { margin-top: 6px; }
.group-title { font-size: 12px; color: #57606a; }
a { color: #0969da; text-decoration: none; }
a:hover { text-decoration: underline; }
`;

const PANEL_INPUT = (path, placeholder) => `<input type="text" inputmode="decimal" autocomplete="off" data-set="${path}" placeholder="${placeholder}">`;

const PANEL_HTML = `
<div class="panel">
  <header>
    <b>Ёмкость спринта</b>
    <button type="button" data-act="refresh">Обновить</button>
    <button type="button" data-act="collapse" title="Свернуть">–</button>
    <button type="button" data-act="close" title="Закрыть">×</button>
  </header>
  <div class="status"></div>
  <div class="summary"></div>
  <div class="body">
    <section class="settings">
      <h4>Люди и дни</h4>
      <table>
        <tr><th></th><th>Людей</th><th title="Отпуска, отгулы, дежурства за спринт">Отсутствия, чел.-дни</th></tr>
        <tr><td>Бэк</td><td>${PANEL_INPUT('team.back.people', '0')}</td><td>${PANEL_INPUT('team.back.absence', '0')}</td></tr>
        <tr><td>Фронт</td><td>${PANEL_INPUT('team.front.people', '0')}</td><td>${PANEL_INPUT('team.front.absence', '0')}</td></tr>
        <tr><td>QA</td><td>${PANEL_INPUT('team.qa.people', '0')}</td><td>${PANEL_INPUT('team.qa.absence', '0')}</td></tr>
      </table>
      <div class="grid">
        <label>Рабочих дней ${PANEL_INPUT('workDays', '10')}</label>
        <label>Праздников ${PANEL_INPUT('holidays', '0')}</label>
        <label>SP на чел.-день ${PANEL_INPUT('coefficient', '1')}</label>
      </div>
    </section>
    <details class="warnings" open></details>
  </div>
</div>`;

const ISSUE_LABELS = {
  noPlatform: 'Нет платформы Backend или Frontend — разработку не считаю',
  needQaWithoutQa: 'Test type — Need QA, а на QA 0 SP',
  noEstimate: 'Без оценок',
};

function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, (char) => map[char]);
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
  const cardsWord = (count) => `${count} ${plural(count, ['карта', 'карты', 'карт'])}`;

  const recompute = () => {
    report = data.cards ? buildReport({ cards: data.cards, settings, config }) : null;
  };

  const renderStatus = () => {
    let when = 'загружаю…';
    if (data.loadedAt) when = `обновлено в ${clockTime(data.loadedAt)}${data.busy ? ', обновляю…' : ', дальше само раз в минуту'}`;
    else if (data.error && !data.busy) when = 'не загрузилось';
    const line = when + (storageBroken ? ' · браузер не сохраняет вписанное' : '');
    const error = data.error
      ? `<div class="error">${escapeHtml(data.error.message || data.error)}${data.loadedAt ? ` — цифры на ${clockTime(data.loadedAt)}` : ''}</div>`
      : '';
    const problems = report ? report.problems.map((problem) => `<div class="error">${escapeHtml(problem)}</div>`).join('') : '';
    $('.status').innerHTML = `<div>${line}</div>${error}${problems}`;
    $('[data-act="refresh"]').disabled = data.busy;
  };

  const renderSummary = () => {
    const box = $('.summary');
    box.classList.toggle('stale', Boolean(data.error));
    if (!report) {
      box.innerHTML = '';
      return;
    }
    const rows = report.rows.map((row) => `<div class="line${row.over ? ' over' : ''}">${escapeHtml(formatRow(row))}</div>`).join('');
    const legend = '<div class="legend">нагрузка из возможных</div>';
    const missing = report.rows.some((row) => row.capacity === null) ? '<div class="hint">«из —» — впишите людей ниже</div>' : '';
    const percent = report.done.percent === null ? '—' : `${report.done.percent}%`;
    const boardCount = report.board.cards.length;
    const done = `<div class="line done">В Done: ${percent}</div>`
      + `<div class="hint">${formatNumber(report.done.points)} из ${formatNumber(report.board.points)} SP · ${report.done.cards.length} из ${boardCount} ${plural(boardCount, ['карты', 'карт', 'карт'])}</div>`;
    const count = report.notCounted.cards.length;
    const notCounted = count
      ? `<div class="warn">Не посчитано: ${formatNumber(report.notCounted.points)} SP в ${count} ${plural(count, ['карте', 'картах', 'картах'])} — см. «Проверить»</div>`
      : '';
    const bugCount = report.bugs.cards.length;
    const bugs = bugCount ? `<div class="hint">Баги не считаю: ${cardsWord(bugCount)}, ${formatNumber(report.bugs.points)} SP</div>` : '';
    box.innerHTML = rows + legend + missing + done + notCounted + bugs;
  };

  const renderWarnings = () => {
    const box = $('.warnings');
    if (!report) {
      box.innerHTML = '';
      return;
    }
    const groups = Object.keys(ISSUE_LABELS).map((issue) => {
      const items = report.warnings.filter((warning) => warning.issue === issue).map((warning) => warning.item);
      if (!items.length) return '';
      const links = items.map((item) => `<li>${cardLink(item)}</li>`).join('');
      return `<div class="group"><div class="group-title">${ISSUE_LABELS[issue]} (${items.length})</div><ul class="compact">${links}</ul></div>`;
    }).join('');
    box.innerHTML = `<summary>Проверить: ${report.warnings.length}</summary>${groups || '<div class="hint">Замечаний нет</div>'}`;
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
  render();
  refresh();
}
