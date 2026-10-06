const PANEL_CSS = `
:host { all: initial; }
.panel { --bg: #26282c; --fg: #e4e6ea; --muted: #9399a3; --line: #383b41; --soft: #30333a; --field: #1e2024; --accent: #5b9cf6; --accent-soft: #34507c; --bad: #f47174; --bad-soft: #7a3438; --good: #4fc47a; --good-soft: #2d5a3c; color-scheme: dark; position: fixed; top: 72px; right: 16px; width: 300px; max-width: calc(100vw - 32px); max-height: calc(100vh - 88px); overflow: auto; z-index: 2147483000; box-sizing: border-box; background: var(--bg); color: var(--fg); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 16px 40px rgba(0, 0, 0, .45); font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
header { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 2px; padding: 10px 8px 10px 14px; background: var(--bg); border-bottom: 1px solid var(--line); }
header b { font-size: 14px; }
.board { max-width: 150px; padding: 3px 22px 3px 6px; margin-left: -6px; font: 600 14px/1.3 inherit; font-family: inherit; color: var(--fg); background: var(--bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%239399a3' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat right 6px center; border: 1px solid transparent; border-radius: 8px; appearance: none; cursor: pointer; }
.board:hover, .board:focus { border-color: var(--line); background-color: var(--soft); outline: none; }
.board option { background: var(--field); color: var(--fg); }
.time { flex: 1; min-width: 0; margin-left: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; border-radius: 8px; cursor: pointer; }
.icon { width: 28px; height: 28px; font-size: 16px; line-height: 28px; color: var(--muted); }
.icon:hover { background: var(--soft); color: var(--fg); }
.icon:disabled { cursor: default; }
.icon:disabled span { display: inline-block; animation: spin 1s linear infinite; }
.key { width: 24px; font-size: 13px; font-weight: 700; color: var(--bad); }
.key:hover { color: var(--bad); background: var(--bad-soft); }
.key[data-state="checking"], .key[data-state="error"] { color: var(--muted); }
.key[data-state="checking"] { animation: pulse .6s ease-in-out infinite alternate; }
.key[data-state="checking"]:hover, .key[data-state="error"]:hover { color: var(--fg); background: var(--line); }
.key[data-state="ok"] { color: var(--good); }
.key[data-state="ok"]:hover { color: var(--good); background: var(--good-soft); }
@keyframes pulse { to { opacity: .3; } }
@keyframes spin { to { transform: rotate(360deg); } }
.geese { position: fixed; inset: 0; z-index: 2147483001; overflow: hidden; pointer-events: none; --w: clamp(40px, min(7vw, 11vh), 120px); --sw: min(max(96vw, 70vh), 125vh); --top: calc(max(12px, 12vh) + min(820px, 90vw, 110vh) / 2.2 + 3vh); --gy: calc((var(--top) + 104vh) / 2); }
.goose { position: absolute; left: 0; width: var(--w); animation: goose-run var(--speed) cubic-bezier(.35, .05, .65, .95) var(--delay) both; }
.goose .wave { animation: goose-wave var(--wave) ease-in-out var(--phase) infinite alternate; }
.goose .bob { transform-origin: 50% 100%; animation: goose-bob var(--step) ease-in-out infinite alternate; }
.goose svg { display: block; width: 100%; overflow: visible; filter: drop-shadow(0 .35em .25em rgba(0, 0, 0, .18)); }
.goose .leg { transform-box: fill-box; transform-origin: 50% 0; animation: goose-leg var(--step) ease-in-out infinite alternate; }
.goose .leg + .leg { animation-direction: alternate-reverse; }
.goose .wing { transform-box: fill-box; transform-origin: 6% 30%; animation: goose-flap calc(var(--step) * 1.2) ease-in-out infinite alternate; }
.goose .far .wing { animation-delay: calc(var(--step) * -.4); }
.goose:not(.back) svg { transform: scaleX(-1); }
.goose.tag { aspect-ratio: 262 / 446; }
.goose .jaw { transform-box: fill-box; transform-origin: 100% 0; animation: goose-jaw calc(var(--step) * 1.3) ease-in-out infinite alternate; }
.goose .say { position: absolute; left: 62%; bottom: 97%; translate: -50% 0; padding: .28em .7em .32em; font: 800 max(12px, calc(var(--w) * .2))/1.1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #e0001a; background: #fff; border-radius: 1em; box-shadow: 0 .15em 0 rgba(0, 0, 0, .12), 0 .3em .9em rgba(0, 0, 0, .18); white-space: nowrap; transform-origin: 50% 100%; animation: goose-say .5s cubic-bezier(.2, 1.8, .4, 1) calc(var(--delay) + .3s) both, say-float 1.6s ease-in-out calc(var(--delay) + .8s) infinite alternate; }
.goose.back .say { left: 38%; }
.goose .say::after { content: ""; position: absolute; left: calc(50% - .3em); bottom: -.5em; border: .3em solid transparent; border-top: .55em solid #fff; border-bottom: 0; transform: skewX(20deg); }
.boom { position: absolute; z-index: 60; left: 50%; top: max(12px, 12vh); width: min(820px, 90vw, 110vh); container-type: inline-size; aspect-ratio: 2.2; display: grid; place-items: center; transform: translateX(-50%) rotate(-6deg); animation: boom-in .45s cubic-bezier(.2, 1.7, .4, 1) both, boom-out .45s ease-in var(--boom-end) forwards; }
.boom::before, .boom::after { content: ""; position: absolute; inset: 0; clip-path: polygon(100.0% 50.0%, 87.0% 58.5%, 95.0% 71.7%, 79.7% 73.7%, 81.2% 89.1%, 66.5% 84.2%, 61.1% 98.7%, 50.0% 88.0%, 38.9% 98.7%, 33.5% 84.2%, 18.8% 89.1%, 20.3% 73.7%, 5.0% 71.7%, 13.0% 58.5%, 0.0% 50.0%, 13.0% 41.5%, 5.0% 28.3%, 20.3% 26.3%, 18.8% 10.9%, 33.5% 15.8%, 38.9% 1.3%, 50.0% 12.0%, 61.1% 1.3%, 66.5% 15.8%, 81.2% 10.9%, 79.7% 26.3%, 95.0% 28.3%, 87.0% 41.5%); }
.boom::before { background: #1b1c20; transform: scale(1.05) translate(1.2%, 2%); }
.boom::after { background: radial-gradient(circle at 50% 45%, #ff5a4a, #d8261d 70%); animation: boom-flash .5s steps(1) infinite; }
.boom span { position: relative; z-index: 1; max-width: 76%; text-align: center; font: italic 900 max(16px, 10.5cqw)/.95 Impact, "Arial Black", "Helvetica Neue", sans-serif; letter-spacing: .02em; color: #fff15c; -webkit-text-stroke: max(1px, .03em) #1b1c20; text-shadow: .06em .07em 0 #1b1c20; }
.boom span.pop { animation: boom-pop .3s cubic-bezier(.2, 1.9, .4, 1); }
@keyframes boom-in { from { transform: translateX(-50%) rotate(-24deg) scale(0); } to { transform: translateX(-50%) rotate(-6deg) scale(1); } }
@keyframes boom-out { to { opacity: 0; transform: translateX(-50%) rotate(-6deg) scale(1.3); } }
@keyframes boom-flash { 50% { background: radial-gradient(circle at 50% 45%, #ffe45c, #ffb21e 70%); } }
@keyframes boom-pop { from { transform: scale(.6) rotate(-4deg); } to { transform: scale(1) rotate(0); } }
@keyframes goose-run { from { transform: translate(var(--x0), 0) scale(var(--size)); } to { transform: translate(var(--x1), var(--dy)) scale(var(--size)); } }
@keyframes goose-wave { from { transform: translateY(calc(var(--amp) * -1)) rotate(var(--lean)); } to { transform: translateY(var(--amp)) rotate(calc(var(--lean) * -1)); } }
@keyframes goose-bob { from { transform: translateY(0) rotate(-3deg); } to { transform: translateY(-12%) rotate(4deg) scaleY(1.04); } }
@keyframes goose-leg { from { transform: rotate(-30deg); } to { transform: rotate(30deg); } }
@keyframes goose-flap { from { transform: rotate(12deg); } to { transform: rotate(-62deg); } }
@keyframes goose-jaw { from { transform: rotate(0); } to { transform: rotate(-22deg); } }
@keyframes goose-say { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: scale(1); } }
@keyframes say-float { from { transform: translateY(-4%) rotate(-2deg); } to { transform: translateY(4%) rotate(2deg); } }
.geese { animation: geese-shake .4s linear var(--hit) both; }
.goose.crash { left: var(--x); top: var(--y); bottom: auto; z-index: 30; width: min(30vw, 22vh); animation: crash-fly .9s cubic-bezier(.6, 0, .9, .4) calc(var(--hit) - .9s) both, crash-hide .01s linear var(--hit) forwards; }
.splat { position: absolute; z-index: 40; left: var(--x); top: var(--y); width: var(--sw); aspect-ratio: 1; container-type: inline-size; animation: splat-hit .3s cubic-bezier(.2, 1.7, .4, 1) var(--hit) both, splat-slide 2.5s cubic-bezier(.5, 0, .8, .6) calc(var(--hit) + .5s) forwards; }
.splat svg, .flat svg { display: block; width: 100%; overflow: visible; }
.flat { position: absolute; z-index: 41; left: var(--x); top: var(--y); width: min(104vw, (104vh - var(--top)) * 2.1); animation: splat-hit .3s cubic-bezier(.2, 1.7, .4, 1) var(--hit) both, splat-slide 2.5s cubic-bezier(.5, 0, .8, .6) calc(var(--hit) + .5s) forwards; }
.splat .drip { transform-box: fill-box; transform-origin: 50% 0; animation: drip 2.2s ease-in calc(var(--hit) + .2s) both; }
.splat .feather { position: absolute; left: 50%; top: 45%; width: 3%; height: 1.1%; background: #fff; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0, 0, 0, .15); animation: feather-fly 1.4s cubic-bezier(.2, .8, .4, 1) var(--hit) both; }
@keyframes crash-fly { from { opacity: 0; transform: translate(-50%, -50%) scale(.1); } 15% { opacity: 1; } to { opacity: 1; transform: translate(-50%, -50%) scale(3.2) rotate(-10deg); } }
@keyframes crash-hide { to { opacity: 0; visibility: hidden; } }
@keyframes splat-hit { from { opacity: 0; transform: translate(-50%, -50%) scale(.3); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@keyframes splat-slide { from { transform: translate(-50%, -50%); } 75% { opacity: 1; } to { opacity: 0; transform: translate(-50%, -38%) rotate(2deg); } }
@keyframes drip { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes feather-fly { from { opacity: 1; transform: translate(-50%, -50%); } to { opacity: 0; transform: translate(calc(-50% + var(--fx)), calc(-50% + var(--fy))) rotate(var(--fr)); } }
.flash { position: absolute; inset: 0; z-index: 35; background: #e0001a; animation: flash .6s ease-out var(--hit) both; }
.spray { position: absolute; z-index: 38; left: var(--x); top: var(--y); width: var(--s); aspect-ratio: 1; animation: splat-hit .25s cubic-bezier(.2, 1.7, .4, 1) calc(var(--hit) + var(--d)) both, spray-fade 1.6s ease-in calc(var(--hit) + 1.3s) forwards; }
.spray svg { display: block; width: 100%; overflow: visible; }
.crack { position: absolute; z-index: 43; left: var(--x); top: var(--y); width: var(--sw); aspect-ratio: 1; transform: translate(-50%, -50%); animation: crack-in .01s steps(1) var(--hit) both; }
.crack svg { display: block; width: 100%; overflow: visible; }
@keyframes crack-in { from { opacity: 0; } to { opacity: 1; } }
.jet { position: absolute; z-index: 41; left: var(--x); top: var(--y); animation: jet-x var(--t) linear calc(var(--hit) + var(--d)) both; }
.jet i { display: block; width: var(--r); height: calc(var(--r) * 1.25); margin: calc(var(--r) * -.6) 0 0 calc(var(--r) * -.5); border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ff7a86 0 14%, #f0001c 42%, #a3000f); animation: jet-y var(--t) linear calc(var(--hit) + var(--d)) both; }
@keyframes flash { 0% { opacity: 0; } 6% { opacity: .6; } 100% { opacity: 0; } }
@keyframes spray-fade { to { opacity: 0; transform: translate(-50%, -35%); } }
@keyframes jet-x { from { transform: translateX(0); } to { transform: translateX(var(--dx)); } }
@keyframes jet-y { 0% { opacity: 0; transform: translateY(0); animation-timing-function: cubic-bezier(.2, .7, .5, 1); } 3% { opacity: 1; } 40% { transform: translateY(var(--up)); animation-timing-function: cubic-bezier(.5, 0, .8, .4); } 90% { opacity: 1; } 100% { opacity: 0; transform: translateY(var(--down)); } }
@keyframes geese-shake { 0%, 100% { transform: none; } 20% { transform: translate(-6px, 4px); } 40% { transform: translate(5px, -5px); } 60% { transform: translate(-4px, -2px); } 80% { transform: translate(3px, 3px); } }
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
.holst-login, .time-login { margin: 0 14px 14px; padding: 10px 12px; background: var(--soft); border-radius: 10px; font-size: 12px; }
.holst-login input[type=password], .time-login input[type=text] { margin-top: 8px; text-align: left; }
.holst-login .why, .time-login .why { font-weight: 600; }
.holst-login .error, .time-login .error { margin: 0; }
.holst-login .plan, .time-login .plan { margin-top: 8px; }
.holst-login .note, .time-login .note { margin-top: 6px; color: var(--muted); }
.holst-login .note b, .time-login .note b { color: var(--fg); font-weight: 600; }
.holst-login details { border: 0; margin-top: 8px; }
.holst-login summary { padding: 0; font-weight: 400; color: var(--muted); }
.holst-login summary::after { margin-left: 0; }
.legend { margin-top: 10px; color: var(--muted); font-size: 11px; }
.done { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; margin-top: 14px; padding: 10px 12px; background: var(--soft); border-radius: 10px; font-variant-numeric: tabular-nums; }
.done b { font-size: 20px; }
.done .of { flex-basis: 100%; color: var(--muted); font-size: 12px; }
.plan { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; margin-top: 12px; }
.plan button { white-space: nowrap; padding: 7px 12px; border-radius: 8px; font-weight: 600; background: var(--accent); color: #10151d; }
.plan button:hover { filter: brightness(1.08); }
.plan button.again { background: var(--soft); color: var(--fg); font-weight: 500; }
.plan button.again:hover { background: var(--line); }
.plan span { color: var(--muted); font-size: 12px; white-space: nowrap; }
.plan + .plan { margin-top: 8px; }
.top { margin-left: 6px; padding: 0 6px; border-radius: 9px; background: #4d3d12; color: #f3cd62; font-size: 11px; font-weight: 600; }
.bar .over-top { background: #c9a227; }
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
input[type=text], input[type=password] { width: 100%; box-sizing: border-box; font: inherit; color: inherit; padding: 5px 8px; text-align: center; border: 1px solid var(--line); border-radius: 8px; background: var(--field); }
input[type=text]:focus, input[type=password]:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(91, 156, 246, .2); }
input[type=text]::placeholder { color: #666c75; }
.group + .group { margin-top: 8px; }
.group-title { color: var(--muted); font-size: 11px; }
ul { list-style: none; margin: 2px 0 0; padding: 0; }
li { padding: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.muted { color: var(--muted); font-size: 12px; }
.report .plan { margin-top: 0; }
.report select { flex: 1; min-width: 0; padding: 6px 8px; font: inherit; color: var(--fg); background: var(--field); border: 1px solid var(--line); border-radius: 8px; }
.report textarea { display: block; width: 100%; box-sizing: border-box; min-height: 220px; margin-top: 8px; padding: 8px; font: 12px/1.45 inherit; font-family: inherit; color: var(--fg); background: var(--field); border: 1px solid var(--line); border-radius: 8px; resize: vertical; }
.report textarea:focus { outline: none; border-color: var(--accent); }
.report [data-report-progress] { margin-top: 6px; }
.report [data-report-progress].error { margin: 6px 0 0; }
.report .plan + .group, .report .group:first-child { margin-top: 10px; }
.plan button:disabled { opacity: .5; cursor: default; filter: none; }
`;

const HOLST_KEY_TITLES = {
  none: 'Вход в Holst: нет',
  checking: 'Вход в Holst: проверяю…',
  ok: 'Вход в Holst: работает',
  rejected: 'Вход в Holst: Holst не пустил',
  error: 'Вход в Holst: сохранён, проверить не получилось',
};

const TIME_KEY_TITLES = {
  none: 'Time: не подключён',
  checking: 'Time: подключаю…',
  ok: 'Time: подключён',
  rejected: 'Time: не работает',
};

const PANEL_INPUT = (path, placeholder) => `<input type="text" inputmode="decimal" autocomplete="off" data-set="${path}" placeholder="${placeholder}">`;

const PANEL_HTML = `
<div class="panel">
  <header>
    <select class="board" data-act="board" title="Доска"></select>
    <span class="time"></span>
    <button type="button" class="icon key" data-act="holst-login" title="Вход в Holst">H</button>
    <button type="button" class="icon key" data-act="time-login" title="Time">T</button>
    <button type="button" class="icon" data-act="refresh" title="Обновить"><span>↻</span></button>
    <button type="button" class="icon" data-act="collapse" title="Свернуть">–</button>
    <button type="button" class="icon" data-act="close" title="Закрыть">×</button>
  </header>
  <div class="status"></div>
  <div class="summary"></div>
  <div class="holst-login" hidden></div>
  <div class="time-login" hidden></div>
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
    <details class="report" hidden>
      <summary>Сводка спринта</summary>
      <div class="inner">
        <div class="plan"><select data-report-sprint title="Спринт"></select><button type="button" data-act="report-run">Посчитать</button></div>
        <div class="muted" data-report-progress></div>
        <textarea data-report-text spellcheck="false" placeholder="Выберите спринт и нажмите «Посчитать». Текст можно поправить перед отправкой"></textarea>
        <div class="plan"><button type="button" data-act="report-send">В Time</button><button type="button" data-act="report-copy" class="again">Скопировать</button></div>
        <div data-report-notes></div>
      </div>
    </details>
    <details class="warnings"></details>
  </div>
</div>`;

const GOOSE_SVG = `<svg viewBox="100 28 262 446" aria-hidden="true">
<g class="leg"><path d="M218 398 V450" stroke="#e8923a" stroke-width="9" stroke-linecap="round"/><path d="M225 446 Q229 462 228 468 H188 Q194 454 210 446 Z" fill="#e8923a"/></g>
<g class="leg"><path d="M252 396 V450" stroke="#e8923a" stroke-width="9" stroke-linecap="round"/><path d="M259 446 Q263 462 262 468 H222 Q228 454 244 446 Z" fill="#e8923a"/></g>
<g class="far" transform="translate(10 -12)"><path class="wing" d="M180 280 C230 250 292 262 334 300 C292 294 252 304 222 326 C200 340 177 316 180 280 Z" fill="#d6d5ce"/></g>
<path d="M205 45 C188 45 180 58 180 80 C180 130 140 190 128 260 C116 340 160 412 232 412 C280 412 318 340 342 294 C312 292 272 284 248 268 C214 246 196 215 198 170 C200 130 226 110 228 78 C229 56 220 45 205 45 Z" fill="#f4f3ee"/>
<path class="wing" d="M180 280 C230 250 292 262 334 300 C292 294 252 304 222 326 C200 340 177 316 180 280 Z" fill="#e6e5df"/>
<path class="jaw" d="M184 68 L156 62 L180 80 Z" fill="#d57a26"/>
<path d="M186 52 L147 49 L181 71 Z" fill="#e8923a"/>
<circle cx="200" cy="64" r="4.8" fill="#1b1c20"/>
</svg>`;

const FLAT_GOOSE = `<g fill="#e8923a"><path d="M88 76 L66 96 L78 94 L74 100 L94 82 Z"/><path d="M122 76 L144 96 L132 94 L136 100 L116 82 Z"/></g>
<g fill="#e6e5df"><path d="M66 50 C44 30 18 28 0 34 C20 42 34 58 60 72 C67 66 69 58 66 50 Z"/><path d="M144 50 C166 30 192 28 210 34 C190 42 176 58 150 72 C143 66 141 58 144 50 Z"/></g>
<g fill="#f4f3ee"><ellipse cx="105" cy="62" rx="46" ry="26"/><circle cx="105" cy="30" r="20"/></g>
<path d="M90 39 Q105 33 120 39 Q117 48 105 50 Q93 48 90 39 Z" fill="#e8923a"/>
<path d="M92 19 l7 7 m0 -7 l-7 7 M111 19 l7 7 m0 -7 l-7 7" fill="none" stroke="#1b1c20" stroke-width="2.4" stroke-linecap="round"/>
<g fill="#ff9aac" opacity=".7"><ellipse cx="91" cy="33" rx="4" ry="2.4"/><ellipse cx="119" cy="33" rx="4" ry="2.4"/></g>`;

const ISSUE_LABELS = {
  noPlatform: 'Нет {back} или {front} — не считаю',
  needQaWithoutQa: 'Need QA, а QA 0 SP',
  noEstimate: 'Без оценки',
};

const PROGRESS_HINT = 'Прогресс спринта: карта весит свои SP, баг и карта без оценки — 1 SP. Готовность по колонке: To Do 0%, Doing 30%, Review 65%, Design Review и Test 80%, Waiting for release 97%, Done 100%';

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
  if (window.location.hostname === 'app.holst.so') {
    holstHandoff();
    return;
  }
  if (TIME_HOST.test(window.location.hostname)) {
    timeHandoff();
    return;
  }
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
  const HOLST_WAIT_MS = 300000;
  const HOLST_PING_MS = 500;
  const TIME_WAIT_MS = 300000;
  const TIME_WATCH_MS = 1000;
  const TIME_SEND_MS = 30000;
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
  let planEnd = null;
  let report = null;
  let closed = false;
  let holstWait = null;
  let holstSend = false;
  let holstStatus = null;
  let holstBoxStatus = false;
  let timeLink = null;
  let timeTimer = null;
  let timeStatus = { state: 'none', message: '', channel: '', user: '', since: 0 };
  const timeSends = new Map();
  let reportSprintList = [];
  let reportRun = { busy: false, sending: false, failed: false, progress: '', notes: [] };
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
    report = data.cards ? buildReport({ cards: data.cards, settings, snapshot, planEnd, config: boardConfig(boardId, config) }) : null;
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
    const unknown = report ? unknownColumnsText(report.progress.unknown.map((item) => item.column)) : null;
    if (unknown) messages.push(`Прогресс: ${unknown}`);
    if (storageBroken) messages.push('Браузер не сохраняет вписанное');
    $('.status').innerHTML = messages.map((message) => `<div class="error">${escapeHtml(message)}</div>`).join('');
    $('[data-act="refresh"]').disabled = data.busy;
  };

  const renderRow = (row) => {
    const scale = Math.max(row.total, row.capacity || 0, snapshot ? row.base : 0);
    const share = (value) => (scale > 0 ? `${(Math.max(value, 0) / scale) * 100}%` : '0');
    const base = snapshot ? Math.min(row.base, row.total) : row.total;
    const top = row.top === null ? 0 : Math.min(Math.max(row.top, 0), row.total - base);
    const limit = row.over ? `<i class="limit" style="left:${share(row.capacity)}"></i>` : '';
    const split = snapshot ? `<span class="split">${formatNumber(row.base)} ${row.added < 0 ? '−' : '+'} ${formatNumber(Math.abs(row.added))} =</span> ` : '';
    const capacity = row.capacity === null ? '—' : formatNumber(row.capacity);
    return `<div class="row${row.over ? ' over' : ''}" title="${escapeHtml(formatRow(row))}">`
      + `<div class="row-head"><span class="name">${escapeHtml(row.label)}${row.top === null ? '' : `<span class="top" title="Прилетело после конца планирования">сверху ${signed(row.top)}</span>`}</span>`
      + `<span class="value">${split}<b>${formatNumber(row.total)}</b><span class="of"> / ${capacity}</span></span></div>`
      + `<div class="bar"><i class="base" style="width:${share(base)}"></i><i class="add" style="width:${share(row.total - base - top)}"></i><i class="over-top" style="width:${share(top)}"></i>${limit}</div></div>`;
  };

  const renderSummary = () => {
    const box = $('.summary');
    box.classList.toggle('stale', Boolean(data.error));
    if (!report) {
      box.innerHTML = '';
      return;
    }
    const rows = report.rows.map(renderRow).join('');
    const legend = snapshot ? `<div class="legend">осталось + прибавилось = сейчас / можно${planEnd ? ' · сверху — после конца планирования' : ''}</div>` : '';
    const percent = report.progress.percent === null ? '—' : `${report.progress.percent}%`;
    const of = `${report.done.count} из ${report.done.of} ${plural(report.done.of, ['карты', 'карт', 'карт'])} · ${formatNumber(report.done.points)} SP`;
    const done = `<div class="done" title="${escapeHtml(PROGRESS_HINT)}"><span>Done</span><b>${percent}</b><span class="of">${of}</span></div>`;
    const since = snapshot ? `<span title="${escapeHtml(snapshot.author)}">с ${snapshotTime(snapshot.takenAt)}</span>` : '';
    const plan = `<div class="plan"><button type="button" data-act="start-planning"${snapshot ? ' class="again"' : ''}${data.busy ? ' disabled' : ''}>Начать планирование</button>${since}</div>`;
    const endSince = planEnd ? `<span title="${escapeHtml(planEnd.author)}">${snapshotTime(planEnd.takenAt)}</span>` : '';
    const end = snapshot ? `<div class="plan"><button type="button" data-act="end-planning"${planEnd ? ' class="again"' : ''}${data.busy ? ' disabled' : ''}>Закончить планирование</button>${endSince}</div>` : '';
    const holst = boardConfig(boardId, config).holst
      ? `<div class="plan"><button type="button" data-act="to-holst" class="again"${data.busy ? ' disabled' : ''}>В Holst</button><span>процент и розовый список</span></div>`
      : '';
    box.innerHTML = rows + legend + done + plan + end + holst;
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
    renderHolstKey();
    renderTimeKey();
    renderReport();
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
      const comments = await kaitenCardComments(config.snapshotCardId);
      loaded.snapshot = snapshotFromComments(comments, board);
      loaded.planEnd = planEndFromComments(comments, loaded.snapshot);
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
      planEnd = loaded.planEnd;
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

  const endPlanning = async () => {
    if (!snapshot) return;
    const text = planEnd
      ? `${boardTitle(boardId, config)}: закончить планирование заново? «Сверху» будет считаться от текущей доски у всей команды, а не от ${snapshotTime(planEnd.takenAt)}.`
      : `${boardTitle(boardId, config)}: закончить планирование для всей команды? Всё, что прилетит дальше, будет видно отдельно — «сверху».`;
    if (!window.confirm(text)) return;
    data.busy = true;
    render();
    const board = boardId;
    const start = snapshot;
    try {
      const cards = await kaitenBoardCards(board);
      await kaitenAddComment(config.snapshotCardId, planEndComment(takePlanEnd({ cards, snapshot: start, now: Date.now(), boardId: board, config: boardConfig(board, config) }), config));
    } catch (error) {
      window.alert(`Конец планирования не сохранился: ${error.message || error}`);
    }
    data.busy = false;
    await refresh();
  };

  const readHolstToken = () => {
    const token = readStored('holstToken', null);
    return typeof token === 'string' && token ? token : null;
  };

  const cleanHolstToken = (raw) => {
    const token = String(raw || '').trim().replace(/^["']+|["']+$/g, '');
    return token && token.length <= 500 && !/\s/.test(token) ? token : null;
  };

  const keepHolstToken = (token) => {
    writeStored('holstToken', token);
    return readHolstToken() === token;
  };

  const holstBoard = () => {
    const holst = boardConfig(boardId, config).holst;
    return holst ? holst.board : null;
  };

  const markHolst = (token, board, state, message, readOnly) => {
    holstStatus = { token, board, state, message: message || '', readOnly: Boolean(readOnly), check: null };
  };

  const checkHolstLogin = (token, board) => {
    const check = holstCheck(board, token)
      .then(() => ['ok', ''], (error) => [error.auth ? 'rejected' : 'error', error.message || String(error), error.readOnly])
      .then(([state, message, readOnly]) => {
        if (closed || !holstStatus || holstStatus.check !== check) return null;
        markHolst(token, board, state, message, readOnly);
        renderHolstKey();
        return state;
      });
    holstStatus = { token, board, state: 'checking', message: '', check };
    return check;
  };

  const holstState = () => {
    const token = readHolstToken();
    const board = holstBoard();
    if (!token || !board) return 'none';
    if (!holstStatus || holstStatus.token !== token || holstStatus.board !== board) checkHolstLogin(token, board);
    return holstStatus.state;
  };

  const holstReason = (state) => {
    if (state === 'none') return ['Вход в Holst — один раз на этом компьютере', false];
    if (state === 'checking') return ['Вход в Holst сохранён, проверяю…', false];
    if (state === 'ok') return ['Вход в Holst работает — входить заново не нужно', false];
    if (state === 'rejected' && holstStatus.readOnly) return [holstStatus.message, true];
    if (state === 'rejected') return [`Holst не пустил с сохранённым входом — войдите заново. Не помогло — проверьте, открывается ли у вас эта доска (${holstStatus.message})`, true];
    return [`Вход в Holst сохранён, но проверить не получилось: ${holstStatus.message}`, false];
  };

  const renderHolstKey = () => {
    const key = $('[data-act="holst-login"]');
    const state = holstState();
    key.hidden = !holstBoard();
    key.dataset.state = state;
    key.title = HOLST_KEY_TITLES[state];
    const line = holstBoxStatus && !$('.holst-login').hidden ? $('.holst-login').querySelector('[data-holst-reason]') : null;
    if (!line) return;
    const [text, failed] = holstReason(state);
    line.className = failed ? 'error' : 'why';
    line.textContent = text;
  };

  const holstNotify = (tab, text, failed, meme) => {
    if (tab && !tab.closed) tab.postMessage({ type: 'sprint-capacity:result', text, failed, meme }, HOLST_ORIGIN);
  };

  const showHolstLogin = (reason, failed, send) => {
    holstSend = send;
    holstBoxStatus = false;
    const box = $('.holst-login');
    box.hidden = false;
    box.innerHTML = `<div class="${failed ? 'error' : 'why'}" data-holst-reason>${escapeHtml(reason)}</div>`
      + '<div class="note">На доске Holst нажмите закладку <b>«Ёмкость спринта»</b> — вход перейдёт сюда сам и сохранится в этом браузере.</div>'
      + `<div class="plan"><button type="button" data-act="holst-open"${holstWait ? ' class="again"' : ''}>${holstWait ? 'Открыть Holst ещё раз' : 'Открыть Holst'}</button><button type="button" data-act="holst-cancel" class="again">Отмена</button></div>`
      + '<details><summary>Вставить вход вручную</summary><input type="password" autocomplete="off" data-holst-token placeholder="вход Holst"><div class="plan"><button type="button" data-act="holst-save" class="again">Сохранить</button></div></details>';
  };

  const stopHolstWait = () => {
    if (!holstWait) return;
    window.clearInterval(holstWait.timer);
    holstWait = null;
  };

  const hideHolstLogin = () => {
    stopHolstWait();
    const box = $('.holst-login');
    box.hidden = true;
    box.innerHTML = '';
  };

  const toggleHolstLogin = () => {
    if (!$('.holst-login').hidden) {
      hideHolstLogin();
      return;
    }
    if (holstState() === 'error') checkHolstLogin(readHolstToken(), holstBoard());
    const [text, failed] = holstReason(holstState());
    showHolstLogin(text, failed, false);
    holstBoxStatus = true;
    renderHolstKey();
  };

  const openHolstLogin = () => {
    const send = holstSend;
    const tab = window.open(`${HOLST_ORIGIN}/board/${boardConfig(boardId, config).holst.board}`, '_blank');
    if (!tab) {
      showHolstLogin('Браузер не дал открыть Holst — разрешите всплывающие окна для Kaiten', true, send);
      return;
    }
    stopHolstWait();
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (tab.closed || Date.now() - started > HOLST_WAIT_MS) {
        const reason = tab.closed ? 'Связь с вкладкой Holst пропала (закрыли или Holst попросил войти) — откройте Holst ещё раз' : 'Вход из Holst не пришёл за 5 минут — откройте Holst ещё раз';
        stopHolstWait();
        showHolstLogin(reason, true, send);
        return;
      }
      tab.postMessage({ type: 'sprint-capacity:ping' }, HOLST_ORIGIN);
    }, HOLST_PING_MS);
    holstWait = { tab, timer };
    showHolstLogin('Жду вход: на открывшейся доске Holst нажмите закладку «Ёмкость спринта»', false, send);
  };

  const sendWhenFree = (tab) => {
    if (closed) return;
    if (data.busy) {
      window.setTimeout(() => sendWhenFree(tab), HOLST_PING_MS);
      return;
    }
    sendToHolst(tab, true);
  };

  const takeHolstLogin = async (raw, tab) => {
    const token = cleanHolstToken(raw);
    if (!token) {
      holstNotify(tab, 'Это не похоже на вход Holst — войдите в Holst заново и нажмите закладку ещё раз', true);
      return;
    }
    const send = Boolean(holstWait) && holstSend;
    if (!keepHolstToken(token)) {
      holstNotify(tab, 'Kaiten не сохранил вход — проверьте, не запрещено ли хранение данных для Kaiten', true);
      return;
    }
    hideHolstLogin();
    if (send) {
      renderHolstKey();
      sendWhenFree(tab);
      return;
    }
    const board = holstBoard();
    const check = board ? checkHolstLogin(token, board) : Promise.resolve(null);
    renderHolstKey();
    const state = await check;
    if (!state) {
      holstNotify(tab, 'Вход сохранён в Kaiten — эту вкладку можно закрыть', false);
      return;
    }
    if (state === 'ok') {
      sprintToast('Вход в Holst работает');
      holstNotify(tab, 'Вход работает — эту вкладку можно закрыть', false);
      return;
    }
    const text = state === 'rejected' && holstStatus.readOnly ? holstStatus.message : state === 'rejected' ? `Holst не пускает и со свежим входом (${holstStatus.message}) — проверьте, открывается ли у вас эта доска` : `Вход в Holst сохранён, но проверить не получилось: ${holstStatus.message}`;
    sprintToast(text, true);
    holstNotify(tab, text, true);
  };

  const saveHolstLogin = async () => {
    const input = $('[data-holst-token]');
    const token = cleanHolstToken(input ? input.value : '');
    const send = holstSend;
    if (!token) {
      showHolstLogin('Это не похоже на вход Holst — нажмите закладку «Ёмкость спринта» на доске Holst ещё раз', true, send);
      return;
    }
    stopHolstWait();
    showHolstLogin('Проверяю вход в Holst…', false, send);
    const board = holstBoard();
    try {
      await holstCheck(board, token);
    } catch (error) {
      showHolstLogin(error.readOnly ? error.message : error.auth ? `Holst не принял этот вход (${error.message})` : `Не получилось проверить вход: ${error.message || error}`, true, send);
      return;
    }
    if (!keepHolstToken(token)) {
      showHolstLogin('Браузер не сохранил вход — проверьте, не запрещено ли хранение данных для Kaiten', true, send);
      return;
    }
    markHolst(token, board, 'ok');
    hideHolstLogin();
    renderHolstKey();
    sprintToast(send ? 'Вход в Holst работает — нажмите «В Holst» ещё раз' : 'Вход в Holst работает');
  };

  const sendToHolst = async (openTab, fresh) => {
    const board = boardId;
    const settingsNow = boardConfig(board, config);
    if (!settingsNow.holst) return;
    const token = readHolstToken();
    if (!token) {
      showHolstLogin('Нужен вход в Holst — один раз на этом компьютере', false, true);
      return;
    }
    const tab = openTab || window.open(`${HOLST_ORIGIN}/board/${settingsNow.holst.board}`, '_blank');
    if (!tab) {
      sprintToast('Браузер не дал открыть Holst — разрешите всплывающие окна для Kaiten', true, 'fail');
      return;
    }
    data.busy = true;
    render();
    try {
      const [cards, boardJson] = await Promise.all([kaitenBoardCards(board), kaitenBoard(board)]);
      const now = Date.now();
      const current = buildReport({ cards, settings, snapshot, planEnd, config: settingsNow });
      const columns = holstColumns(boardJson);
      const capacity = DIRECTIONS.filter((direction) => settings.team[direction].people > 0).map((direction) => ({ label: settingsNow.labels[direction], days: personDaysOf(settings, direction) }));
      const sprintJob = sprintReportLoad({ cards, boardId: board, now, columns, load: kaitenSprint, store: { read: (key) => readStored(key, null), write: writeStored } })
        .then((loaded) => ({ lines: sprintReportLines({ ...loaded, capacity: capacity.length ? capacity : null, now }) }))
        .catch((error) => ({ problem: error.message || String(error) }));
      const since = holstLookback(now);
      const historyIds = holstHistoryIds(cards, since);
      const [historyList, activityList] = await Promise.all([
        Promise.all(historyIds.map((id) => kaitenLocationHistory(id))),
        Promise.all(cards.map((card) => kaitenCardActivity(card.id).catch(() => []))),
      ]);
      const histories = Object.fromEntries(historyIds.map((id, index) => [id, historyList[index]]));
      const renames = Object.fromEntries(cards.map((card, index) => [card.id, activityList[index]]));
      const foreignIds = holstForeignBoards(cards, histories);
      const foreignList = await Promise.all(foreignIds.map((id) => kaitenBoard(id)));
      const boards = Object.fromEntries(foreignIds.map((id, index) => [id, foreignList[index].title]));
      const payload = holstPayload({ cards, report: current, doneAtStart: snapshot ? snapshot.doneIds : [], histories, columns, boards, renames, now, config: settingsNow, holst: settingsNow.holst, kaiten: location.origin, title: boardTitle(board, config) });
      payload.sprint = await sprintJob;
      sprintToast(`${payload.title}: пишу в Holst…`);
      const result = await holstApply(payload, token);
      markHolst(token, settingsNow.holst.board, 'ok');
      sprintToast(result.text, !result.ok, result.calm ? null : result.ok ? 'ok' : 'fail');
      holstNotify(tab, result.text, !result.ok, !result.calm);
    } catch (error) {
      if (error.auth) markHolst(token, settingsNow.holst.board, 'rejected', error.message, error.readOnly);
      if (error.auth && !error.readOnly && !fresh) {
        tab.close();
        showHolstLogin(`Holst не пустил (${error.message}) — войдите заново`, true, true);
        sprintToast('В Holst не отправилось: Holst не пустил — войдите заново в панели', true, 'fail');
      } else {
        const text = `В Holst не отправилось: ${error.auth && !error.readOnly ? `Holst не пускает и со свежим входом (${error.message}) — проверьте, открывается ли у вас эта доска` : error.message || error}`;
        if (!fresh) tab.close();
        sprintToast(text, true, 'fail');
        holstNotify(tab, text, true, true);
      }
    }
    data.busy = false;
    render();
  };

  const onHolstMessage = (event) => {
    if (event.origin !== HOLST_ORIGIN || !event.data || !event.source) return;
    if (event.data.type === 'sprint-capacity:hello') event.source.postMessage({ type: 'sprint-capacity:ping' }, HOLST_ORIGIN);
    if (event.data.type === 'sprint-capacity:login') takeHolstLogin(event.data.token, event.source);
  };
  window.addEventListener('message', onHolstMessage);


  const timeReason = () => {
    const { state, message, channel, user } = timeStatus;
    if (state === 'ok') return [`Time подключён: канал «${channel}», отправитель ${user}`, false];
    if (state === 'checking') return ['Жду Time: в открывшейся вкладке Time нажмите закладку «Ёмкость спринта»', false];
    if (state === 'rejected') return [message, true];
    return [message || 'Сводка уходит в Time через открытую вкладку Time — вставьте ссылку на канал и нажмите «Открыть Time»', false];
  };

  const renderTimeKey = () => {
    const key = $('[data-act="time-login"]');
    key.hidden = !boardConfig(boardId, config).report;
    key.dataset.state = timeStatus.state;
    key.title = TIME_KEY_TITLES[timeStatus.state];
    const line = $('.time-login').hidden ? null : $('.time-login').querySelector('[data-time-reason]');
    if (!line) return;
    const [text, failed] = timeReason();
    line.className = failed ? 'error' : 'why';
    line.textContent = text;
  };

  const setTime = (state, message, extra) => {
    timeStatus = { state, message: message || '', channel: (extra && extra.channel) || '', user: (extra && extra.user) || '', since: Date.now() };
    renderTimeKey();
  };

  const showTimeLogin = () => {
    const box = $('.time-login');
    const [text, failed] = timeReason();
    box.hidden = false;
    box.innerHTML = `<div class="${failed ? 'error' : 'why'}" data-time-reason>${escapeHtml(text)}</div>`
      + `<input type="text" autocomplete="off" spellcheck="false" data-time-channel placeholder="ссылка на канал Time" value="${escapeHtml(readStored('timeChannel', '') || '')}">`
      + '<div class="note">Откройте канал в Time, скопируйте адрес из строки браузера и вставьте сюда. В открывшейся вкладке Time нажмите закладку <b>«Ёмкость спринта»</b> и не закрывайте её — через неё уходят сводки.</div>'
      + `<div class="plan"><button type="button" data-act="time-open"${timeLink ? ' class="again"' : ''}>${timeLink ? 'Открыть Time ещё раз' : 'Открыть Time'}</button><button type="button" data-act="time-cancel" class="again">Отмена</button></div>`;
  };

  const hideTimeLogin = () => {
    const box = $('.time-login');
    box.hidden = true;
    box.innerHTML = '';
  };

  const toggleTimeLogin = () => {
    if (!$('.time-login').hidden) {
      hideTimeLogin();
      return;
    }
    showTimeLogin();
  };

  const stopTimeWatch = () => {
    window.clearInterval(timeTimer);
    timeTimer = null;
  };

  const watchTime = () => {
    if (timeTimer) return;
    timeTimer = window.setInterval(() => {
      if (!timeLink) {
        stopTimeWatch();
        return;
      }
      if (timeLink.tab.closed) {
        timeLink = null;
        stopTimeWatch();
        setTime('none', 'Вкладку Time закрыли — откройте Time ещё раз');
        return;
      }
      if (timeStatus.state === 'checking' && Date.now() - timeStatus.since > TIME_WAIT_MS) setTime('rejected', 'Time не ответил за 5 минут — нажмите закладку «Ёмкость спринта» во вкладке Time');
    }, TIME_WATCH_MS);
  };

  const timePing = () => {
    if (timeLink) timeLink.tab.postMessage({ type: 'sprint-capacity:time-ping', channel: readStored('timeChannel', '') }, timeLink.origin);
  };

  const openTime = () => {
    const input = $('[data-time-channel]');
    const url = String((input && input.value) || readStored('timeChannel', '') || '').trim();
    const place = timeChannelPlace(url);
    if (!place) {
      setTime('rejected', 'Нужна ссылка на канал Time вида https://…time-messenger.ru/команда/channels/канал — откройте канал в Time и скопируйте адрес из строки браузера');
      return;
    }
    writeStored('timeChannel', url);
    const tab = window.open(url, 'sprint-capacity-time');
    if (!tab) {
      setTime('rejected', 'Браузер не дал открыть Time — разрешите всплывающие окна для Kaiten');
      return;
    }
    timeLink = { tab, origin: place.origin };
    setTime('checking');
    watchTime();
    showTimeLogin();
  };

  const onTimeMessage = (event) => {
    if (!TIME_ORIGIN.test(event.origin) || !event.data || !event.source) return;
    const message = event.data;
    if (message.type === 'sprint-capacity:time-hello') {
      const known = timeLink && timeLink.tab === event.source;
      if (known && timeStatus.state !== 'checking') return;
      timeLink = { tab: event.source, origin: event.origin };
      if (!known) setTime('checking');
      watchTime();
      timePing();
    }
    if (message.type === 'sprint-capacity:time-ready' && timeLink && timeLink.tab === event.source) {
      if (message.url !== readStored('timeChannel', '')) return;
      if (message.error) {
        setTime('rejected', message.error);
        return;
      }
      setTime('ok', '', message);
      hideTimeLogin();
      sprintToast(`Time подключён: канал «${message.channel}»`);
    }
    if (message.type === 'sprint-capacity:time-result' && timeSends.has(message.id)) {
      const wait = timeSends.get(message.id);
      timeSends.delete(message.id);
      window.clearTimeout(wait.timer);
      wait.resolve(message);
    }
  };
  window.addEventListener('message', onTimeMessage);

  const reportDraft = () => String($('[data-report-text]').value || '').trim();

  const fillReport = () => {
    const box = $('.report');
    box.hidden = !boardConfig(boardId, config).report;
    if (box.hidden) return;
    reportSprintList = reportSprints(Date.now());
    $('[data-report-sprint]').innerHTML = reportSprintList.map((sprint, index) => `<option value="${index}"${index === 1 ? ' selected' : ''}>${reportShortDate(sprint.from)}–${reportShortDate(sprint.to)}${sprint.current ? ' — идёт' : ''}</option>`).join('');
  };

  const renderReport = () => {
    if (!boardConfig(boardId, config).report) return;
    const progress = $('[data-report-progress]');
    progress.className = reportRun.failed ? 'error' : 'muted';
    progress.textContent = reportRun.progress;
    $('[data-act="report-run"]').disabled = reportRun.busy;
    $('[data-act="report-send"]').disabled = reportRun.busy || reportRun.sending;
    $('[data-report-notes]').innerHTML = reportRun.notes.map((group) => {
      const items = group.items.map((item) => `<li><a href="${window.location.origin}/${item.id}" target="_blank" rel="noopener">${item.id}</a>${item.note ? ` — ${escapeHtml(item.note)}` : ''}</li>`).join('');
      return `<div class="group"><div class="group-title">${escapeHtml(group.label)}</div><ul>${items}</ul></div>`;
    }).join('');
  };

  const runReport = async () => {
    if (reportRun.busy) return;
    const sprint = reportSprintList[Number($('[data-report-sprint]').value)] || reportSprintList[1];
    reportRun = { busy: true, sending: false, failed: false, progress: 'Загружаю карточки…', notes: [] };
    renderReport();
    try {
      const loaded = await reportLoad(sprint, (text) => {
        reportRun.progress = text;
        if (!closed) $('[data-report-progress]').textContent = text;
      });
      const built = reportBuild(loaded, sprint);
      if (closed) return;
      $('[data-report-text]').value = built.text;
      reportRun.notes = reportNotes(built.current);
      reportRun.progress = sprint.current
        ? 'Спринт ещё идёт — цифры неполные'
        : `Посчитано в ${clockTime(new Date())}. Баги — на сегодня: открытые войдут, когда дойдут до Done или Backlog`;
    } catch (error) {
      reportRun.failed = true;
      reportRun.progress = `Не посчиталось: ${error.message || error}`;
    }
    reportRun.busy = false;
    renderReport();
  };

  const copyReport = async () => {
    const text = reportDraft();
    if (!text) {
      sprintToast('Сводка пустая — сначала нажмите «Посчитать»', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      sprintToast('Сводка скопирована');
    } catch (error) {
      sprintToast('Браузер не дал скопировать — выделите текст и нажмите Cmd+C', true);
    }
  };

  const sendReport = async () => {
    const text = reportDraft();
    if (!text) {
      sprintToast('Сводка пустая — сначала нажмите «Посчитать»', true);
      return;
    }
    if (timeStatus.state !== 'ok' || !timeLink || timeLink.tab.closed) {
      showTimeLogin();
      sprintToast('Сначала подключите Time — буква T вверху панели', true);
      return;
    }
    if (!window.confirm(`Отправить сводку в Time, в канал «${timeStatus.channel}»?`)) return;
    reportRun.sending = true;
    renderReport();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        timeSends.delete(id);
        resolve({ ok: false, text: 'Вкладка Time не ответила за 30 секунд — загляните в канал, прежде чем отправлять ещё раз' });
      }, TIME_SEND_MS);
      timeSends.set(id, { resolve, timer });
      timeLink.tab.postMessage({ type: 'sprint-capacity:time-send', id, channel: readStored('timeChannel', ''), text }, timeLink.origin);
    });
    reportRun.sending = false;
    if (closed) return;
    renderReport();
    sprintToast(result.text, !result.ok, result.ok ? 'ok' : 'fail');
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
  const crashGoose = (random) => {
    const x = random(46, 54);
    const y = 70;
    const place = `--x:${x.toFixed(1)}%;--y:var(--gy)`;
    const splash = (count, valley, spike) => {
      const points = Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        const radius = index % 2 ? random(...valley) : random(...spike);
        return [100 + Math.cos(angle) * radius, 100 + Math.sin(angle) * radius * 0.9];
      });
      const middle = (a, b) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
      return `M${middle(points[0], points[1])} ` + points.map((_, index) => {
        const next = points[(index + 1) % points.length];
        return `Q${next[0].toFixed(1)} ${next[1].toFixed(1)} ${middle(next, points[(index + 2) % points.length])}`;
      }).join(' ') + 'Z';
    };
    const blob = splash(26, [58, 72], [84, 124]);
    const drops = Array.from({ length: 18 }, () => {
      const angle = random(0, Math.PI * 2);
      const distance = random(112, 170);
      return `<circle cx="${(100 + Math.cos(angle) * distance).toFixed(1)}" cy="${(100 + Math.sin(angle) * distance).toFixed(1)}" r="${random(2.5, 9).toFixed(1)}"/>`;
    }).join('');
    const streaks = Array.from({ length: 12 }, () => {
      const angle = random(0, 360);
      const distance = random(118, 160);
      const radians = (angle * Math.PI) / 180;
      const cx = 100 + Math.cos(radians) * distance;
      const cy = 100 + Math.sin(radians) * distance;
      return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${random(14, 34).toFixed(1)}" ry="${random(2.5, 5).toFixed(1)}" transform="rotate(${angle.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
    }).join('');
    const drips = Array.from({ length: 7 }, (_, index) => `<rect class="drip" x="${(52 + index * 14 + random(-4, 4)).toFixed(1)}" y="${random(150, 168).toFixed(0)}" width="${random(6, 11).toFixed(1)}" height="${random(70, 190).toFixed(0)}" rx="4"/>`).join('');
    const cracks = Array.from({ length: 11 }, (_, index) => {
      let angle = (index / 11) * Math.PI * 2 + random(-0.2, 0.2);
      let radius = 0;
      const points = [[100, 100]];
      while (radius < 150) {
        radius += random(14, 32);
        angle += random(-0.18, 0.18);
        points.push([100 + Math.cos(angle) * radius, 100 + Math.sin(angle) * radius]);
      }
      return points;
    });
    const line = (points) => 'M' + points.map((point) => `${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' L');
    const web = cracks.map(line).concat(cracks.flatMap((ray, index) => [1, 2, 3]
      .filter((step) => step < 3 || random(0, 1) > 0.5)
      .map((step) => line([ray[step], cracks[(index + 1) % cracks.length][step]])))).join(' ');
    const crack = `<div class="crack" style="${place}"><svg viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${web}" stroke="rgba(0,0,0,.45)" stroke-width="3.2" vector-effect="non-scaling-stroke"/><path d="${web}" stroke="#fff" stroke-width="1.4" opacity=".85" vector-effect="non-scaling-stroke"/></g><circle cx="100" cy="100" r="4" fill="#fff" opacity=".6"/></svg></div>`;
    const gloss = Array.from({ length: 7 }, () => {
      const angle = random(0, Math.PI * 2);
      const distance = random(26, 50);
      return `<ellipse cx="${(100 + Math.cos(angle) * distance).toFixed(1)}" cy="${(100 + Math.sin(angle) * distance).toFixed(1)}" rx="${random(2, 4.5).toFixed(1)}" ry="${random(.8, 1.6).toFixed(1)}" transform="rotate(${random(-40, 40).toFixed(0)})" transform-origin="${(100 + Math.cos(angle) * distance).toFixed(1)} ${(100 + Math.sin(angle) * distance).toFixed(1)}"/>`;
    }).join('');
    const clots = Array.from({ length: 9 }, () => `<circle cx="${random(64, 146).toFixed(1)}" cy="${random(22, 84).toFixed(1)}" r="${random(1.5, 5).toFixed(1)}"/>`).join('');
    const feathers = Array.from({ length: 14 }, () => `<i class="feather" style="--fx:${random(-70, 70).toFixed(0)}cqw;--fy:${random(-60, 25).toFixed(0)}cqw;--fr:${random(-300, 300).toFixed(0)}deg"></i>`).join('');
    const sprays = Array.from({ length: 6 }, () => {
      const style = `--x:${(x + random(-48, 48)).toFixed(1)}%;--y:${(y + random(-50, 30)).toFixed(1)}%;--s:calc(var(--sw) * ${random(0.1, 0.24).toFixed(2)});--d:${random(0.05, 0.35).toFixed(2)}s`;
      return `<div class="spray" style="${style}"><svg viewBox="0 0 200 200" aria-hidden="true"><path d="${splash(16, [40, 60], [70, 100])}" fill="#c8000f"/></svg></div>`;
    }).join('');
    const jets = Array.from({ length: 22 }, () => {
      const style = `${place};--dx:${random(-48, 48).toFixed(1)}vw;--up:${random(-60, -22).toFixed(1)}vh;--down:${random(10, 45).toFixed(1)}vh;--t:${random(0.8, 1.5).toFixed(2)}s;--d:${random(0, 0.5).toFixed(2)}s;--r:${random(8, 22).toFixed(0)}px`;
      return `<div class="jet" style="${style}"><i></i></div>`;
    }).join('');
    return `<div class="goose crash" style="${place};--step:.13s"><div class="bob">${GOOSE_SVG}</div></div><div class="flash"></div>${sprays}`
      + `<div class="splat" style="${place}"><svg viewBox="0 0 200 200" aria-hidden="true"><g fill="#b0000c">${streaks}${drops}${drips}<path d="${blob}"/></g><path d="${blob}" fill="#e00016" transform="translate(100 100) scale(.62) translate(-100 -100)"/><g fill="#fff" opacity=".3">${gloss}</g></svg>${feathers}</div><div class="flat" style="${place}"><svg viewBox="0 0 210 100" aria-hidden="true">${FLAT_GOOSE}<g fill="#d0000f" opacity=".9">${clots}</g></svg></div>${crack}${jets}`;
  };
  const releaseGeese = (names) => {
    if ($('.geese')) return;
    const count = 7;
    const lifetime = 5;
    const shouters = new Set(Array.from({ length: count }, (_, index) => index).sort(() => Math.random() - 0.5).slice(0, 3));
    const words = ['!!Overload!!', ...names.map((name) => `${name} трещит!`)];
    const random = (from, to) => from + Math.random() * (to - from);
    const flock = document.createElement('div');
    flock.className = 'geese';
    flock.style.setProperty('--hit', '1.9s');
    const sides = [1, -1, Math.random() < 0.5 ? 1 : -1].sort(() => Math.random() - 0.5);
    let shouter = 0;
    flock.innerHTML = `<div class="boom" style="--boom-end:${lifetime - 0.45}s"><span>${escapeHtml(words[0])}</span></div>` + Array.from({ length: count }, (_, index) => {
      const size = random(0.75, 1.2);
      const shouts = shouters.has(index);
      const side = shouts ? sides[shouter++] : 1;
      const run = side > 0 ? '--x0:-130%;--x1:calc(100vw + 40%)' : '--x0:calc(100vw + 40%);--x1:-130%';
      const dy = shouts ? random(-18, 14) : random(-6, 6);
      const style = `${run};--dy:${dy.toFixed(1)}vh;--delay:${random(0, 1.2).toFixed(2)}s;--speed:${random(2.4, 3.5).toFixed(2)}s;--size:${size.toFixed(2)};--step:${random(0.16, 0.24).toFixed(2)}s;--wave:${random(0.5, 0.9).toFixed(2)}s;--phase:${random(-1, 0).toFixed(2)}s;--amp:${random(1.5, 5).toFixed(1)}vh;--lean:${random(-6, 6).toFixed(1)}deg;bottom:${random(shouts ? 12 : 3, shouts ? 40 : 48).toFixed(1)}%`;
      const back = side < 0 ? ' back' : '';
      const goose = `<div class="goose${back}" style="${style};z-index:${Math.round(size * 10)}"><div class="wave"><div class="bob">${GOOSE_SVG}</div></div></div>`;
      return shouts ? `${goose}<div class="goose tag${back}" style="${style};z-index:55"><span class="say">Беспредел!</span></div>` : goose;
    }).join('') + crashGoose(random);
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
    window.removeEventListener('message', onHolstMessage);
    window.removeEventListener('message', onTimeMessage);
    stopHolstWait();
    stopTimeWatch();
    for (const wait of timeSends.values()) window.clearTimeout(wait.timer);
    timeSends.clear();
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
    if (act === 'end-planning' && !data.busy) endPlanning();
    if (act === 'to-holst' && !data.busy) sendToHolst(null, false);
    if (act === 'holst-login') toggleHolstLogin();
    if (act === 'holst-open') openHolstLogin();
    if (act === 'holst-save') saveHolstLogin();
    if (act === 'holst-cancel') hideHolstLogin();
    if (act === 'time-login') toggleTimeLogin();
    if (act === 'time-open') openTime();
    if (act === 'time-cancel') hideTimeLogin();
    if (act === 'report-run') runReport();
    if (act === 'report-send' && !reportRun.sending) sendReport();
    if (act === 'report-copy') copyReport();
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
    planEnd = null;
    chaosBefore = false;
    Object.assign(data, { cards: null, loadedAt: null, error: null, snapshotError: null });
    fillSettings();
    fillReport();
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

  shadow.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.dataset.holstToken !== undefined) saveHolstLogin();
    if (event.key === 'Enter' && event.target.dataset.timeChannel !== undefined) openTime();
  });

  for (const type of ['keydown', 'keyup', 'keypress', 'paste', 'copy', 'cut']) {
    shadow.addEventListener(type, (event) => event.stopPropagation());
  }

  window.__sprintCapacity = { close, refresh };
  $('.board').innerHTML = config.boards.map((board) => `<option value="${board.id}"${board.id === boardId ? ' selected' : ''}>${escapeHtml(board.title)}</option>`).join('');
  applyCollapsed();
  fillSettings();
  fillReport();
  $('.settings').open = DIRECTIONS.some((direction) => settings.team[direction].people === 0);
  render();
  refresh();
}
