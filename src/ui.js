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
.key { width: 22px; }
.key i { display: inline-block; width: 10px; height: 10px; box-sizing: border-box; border: 2px solid var(--bad); border-radius: 50%; background: var(--bad); vertical-align: middle; }
.key:hover i { box-shadow: 0 0 0 3px var(--bad-soft); }
.key[data-state="checking"] i, .key[data-state="error"] i { border-color: var(--muted); background: none; }
.key[data-state="checking"] i { animation: pulse .6s ease-in-out infinite alternate; }
.key[data-state="checking"]:hover i, .key[data-state="error"]:hover i { box-shadow: 0 0 0 3px var(--line); }
.key[data-state="ok"] i { border-color: var(--good); background: var(--good); }
.key[data-state="ok"]:hover i { box-shadow: 0 0 0 3px var(--good-soft); }
@keyframes pulse { to { opacity: .3; } }
@keyframes spin { to { transform: rotate(360deg); } }
.geese { position: fixed; inset: 0; z-index: 2147483001; overflow: hidden; cursor: pointer; background: #0b0c0e; --bang: 9.2s; animation: noir-in .6s ease-out both, noir-out .8s ease-in 11.6s forwards; }
.geese > svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.geese > div { position: absolute; inset: 0; pointer-events: none; }
.geese .cam { animation: noir-shake .45s linear var(--bang) both; }
.geese .weave { animation: noir-weave 7.2s ease-in-out .4s both; }
.geese .walker { animation: noir-walk 7.2s linear .4s both; }
.geese .sway { animation: noir-sway 2.2s ease-in-out .4s 3 both; }
.geese .bob { animation: noir-bob .55s ease-in-out .4s 12 alternate both; }
.geese .leg { animation: noir-leg .55s ease-in-out .4s 12 alternate both; }
.geese .leg.other { animation-direction: alternate-reverse; }
.geese .hic { animation: noir-hic .5s ease-out 2.6s both; }
.geese .arm-l { animation: noir-swig 4.9s ease-in-out both; }
.geese .swing-l { animation: noir-swing 1.1s ease-in-out 4.9s 2 both; }
.geese .swing-r { animation: noir-swing 1.1s ease-in-out .4s 6 both; }
.geese .lid { animation: noir-lid var(--bang) linear both; }
.geese .lean { animation: noir-lean .4s ease-in-out 8.5s both; }
.geese .gunrise { animation: noir-gunrise .8s cubic-bezier(.2, .7, .3, 1) 7.9s both; }
.geese .tremble { animation: noir-tremble .08s linear 8.7s 6; }
.geese .sweat { animation: noir-sweat .7s ease-in 8.4s both; }
.geese .wisp { animation: noir-wisp 2.4s linear infinite; }
.geese .wisp + .wisp { animation-delay: -1.2s; }
.geese .ember { animation: noir-ember 1.6s ease-in-out infinite alternate; }
.geese .jerk { animation: noir-jerk .1s ease-out var(--bang) both; }
.geese .fall { animation: noir-fall .75s cubic-bezier(.5, 0, .9, .5) calc(var(--bang) + .08s) both; }
.geese .recoil { animation: noir-recoil .25s ease-out var(--bang) both; }
.geese .muzzle { animation: noir-muzzle .16s ease-out var(--bang) both; }
.geese .hat { animation: noir-hide .01s steps(1) var(--bang) forwards; }
.geese .flyhat { animation: noir-hatfly 1.5s var(--bang) both; }
.geese .flyspin { animation: noir-hatspin 1.5s var(--bang) both; }
.geese .hatshadow { animation: noir-show .4s ease-out calc(var(--bang) + 1.25s) both; }
.geese .puff { animation: noir-puff 2.4s ease-out calc(var(--bang) + var(--d)) both; }
.geese .blink { animation: noir-blink 3.2s steps(1, end) infinite; }
.geese .flicker { animation: noir-flicker 3.7s steps(1, end) infinite; }
.geese .surge { animation: noir-surge .7s steps(1, end) var(--bang) both; }
.geese .tube, .geese .lit { position: absolute; left: 5vw; top: 6vh; font: italic 400 clamp(44px, 11vh, 128px)/1 "Brush Script MT", "Snell Roundhand", "Segoe Script", cursive; letter-spacing: .02em; white-space: nowrap; transform: rotate(-6deg); }
.geese .tube { color: #3a1416; text-shadow: 0 1px 0 #000; }
.geese .lit { color: #fff1f1; text-shadow: 0 0 .02em #fff, 0 0 .08em #ff5a5a, 0 0 .18em #ff2424, 0 0 .4em #e00000, 0 0 .8em #a00000; }
.geese .glow { background: radial-gradient(ellipse 42% 48% at 20% 12%, rgba(255, 34, 34, .26), rgba(255, 34, 34, .07) 55%, transparent 78%); mix-blend-mode: screen; }
.geese .rain { inset: -25%; transform: rotate(10deg); background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M22 0v34M74 46v34M128 12v34M150 92v34M42 104v34M98 124v34M8 62v22M118 70v22' stroke='%23fff' stroke-opacity='.32' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E") 0 0 / 160px; animation: noir-rain .32s linear infinite; }
.geese .rain.far { opacity: .5; background-size: 90px; animation-name: noir-rain-far; animation-duration: .5s; }
.geese .grain { inset: -40%; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E") 0 0 / 200px; opacity: .13; animation: noir-grain .5s steps(5) infinite; }
.geese .vignette { background: radial-gradient(ellipse 75% 70% at 50% 45%, transparent 50%, rgba(0, 0, 0, .78)); }
.geese .flash { background: #fff; animation: noir-flash .4s ease-out var(--bang) both; }
@keyframes noir-in { from { opacity: 0; } }
@keyframes noir-out { to { opacity: 0; } }
@keyframes noir-shake { 0%, 100% { transform: translate(0px, 0px); } 15% { transform: translate(-16px, 9px); } 30% { transform: translate(13px, -11px); } 45% { transform: translate(-9px, -6px); } 60% { transform: translate(7px, 7px); } 80% { transform: translate(-3px, 2px); } }
@keyframes noir-weave { 0%, 100% { transform: translateX(0px); } 10% { transform: translateX(-60px); } 24% { transform: translateX(70px); } 38% { transform: translateX(-80px); } 52% { transform: translateX(60px); } 66% { transform: translateX(-70px); } 78% { transform: translateX(40px); } 88% { transform: translateX(-15px); } }
@keyframes noir-walk { 0% { transform: translate(800px, 398px) scale(.34); } 22.2% { transform: translate(800px, 400px) scale(.44); } 43.1% { transform: translate(800px, 403px) scale(.58); } 63.9% { transform: translate(800px, 408px) scale(.84); } 77.8% { transform: translate(800px, 418px) scale(1.25); } 86.1% { transform: translate(800px, 436px) scale(1.95); } 91.7% { transform: translate(800px, 465px) scale(3.3); } 95.8% { transform: translate(800px, 495px) scale(5.6); animation-timing-function: ease-out; } 100% { transform: translate(800px, 510px) scale(7.5); } }
@keyframes noir-sway { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(3.5deg); } 75% { transform: rotate(-3.5deg); } }
@keyframes noir-bob { to { transform: translateY(-5px); } }
@keyframes noir-leg { to { transform: translateY(-9px); } }
@keyframes noir-hic { 0%, 45%, 100% { transform: translateY(0px); } 20% { transform: translateY(-12px); } 62% { transform: translateY(-3px); } }
@keyframes noir-swig { 0%, 8.2% { transform: rotate(8deg) scale(1); } 13.8% { transform: rotate(14deg) scale(1); } 25% { transform: rotate(2deg) scale(1); } 36.2% { transform: rotate(14deg) scale(1); } 47.4% { transform: rotate(2deg) scale(1); } 58.7% { transform: rotate(14deg) scale(1); } 69.9% { transform: rotate(2deg) scale(1); } 73.5% { transform: rotate(8deg) scale(1); } 80.6% { transform: rotate(-152.9deg) scale(1.46); } 86.7% { transform: rotate(-155deg) scale(1.46); } 91.8% { transform: rotate(-152deg) scale(1.46); } 100% { transform: rotate(8deg) scale(1); } }
@keyframes noir-swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(6deg); } 75% { transform: rotate(-6deg); } }
@keyframes noir-lid { 0%, 84.8% { transform: scaleY(1); } 86.7%, 88% { transform: scaleY(2.05); } 91.8%, 96.2% { transform: scaleY(1.15); } 98.4%, 100% { transform: scaleY(2.05); } }
@keyframes noir-lean { to { transform: rotate(-3deg); } }
@keyframes noir-gunrise { 0% { opacity: 0; transform: translate(40px, 75px) rotate(28deg); } 6% { opacity: 1; } 100% { opacity: 1; transform: translate(0px, 0px) rotate(0deg); } }
@keyframes noir-tremble { 0%, 100% { transform: translate(0px, 0px); } 25% { transform: translate(.7px, -.5px); } 50% { transform: translate(-.5px, .4px); } 75% { transform: translate(.4px, .7px); } }
@keyframes noir-sweat { 0% { opacity: 0; transform: translate(0px, 0px); } 15% { opacity: .9; } 100% { opacity: .9; transform: translate(-1px, 13px); } }
@keyframes noir-wisp { 0% { opacity: 0; transform: translate(0px, 0px); } 30% { opacity: .45; } 100% { opacity: 0; transform: translate(-3px, -16px); } }
@keyframes noir-ember { to { opacity: .55; } }
@keyframes noir-jerk { to { transform: translate(-5px, 1px) rotate(-12deg); } }
@keyframes noir-fall { from { transform: translate(0px, 0px) translate(0px, 355px) rotate(0deg) translate(0px, -355px); } to { transform: translate(-30px, 170px) translate(0px, 355px) rotate(-26deg) translate(0px, -355px); } }
@keyframes noir-recoil { to { transform: rotate(35deg); } }
@keyframes noir-muzzle { 0% { opacity: 0; transform: scale(.2); } 1% { opacity: 1; transform: scale(.3); } 40% { opacity: 1; transform: scale(1.15); } 100% { opacity: 0; transform: scale(1.5); } }
@keyframes noir-hide { to { opacity: 0; } }
@keyframes noir-show { from { opacity: 0; } to { opacity: 1; } }
@keyframes noir-hatfly { 0% { opacity: 0; transform: translate(0px, 0px); } 1% { opacity: 1; transform: translate(0px, 0px); animation-timing-function: cubic-bezier(.2, .8, .4, 1); } 25% { opacity: 1; transform: translate(-260px, -300px); animation-timing-function: cubic-bezier(.5, 0, .9, .6); } 88% { opacity: 1; transform: translate(-240px, 470px); animation-timing-function: ease-out; } 94% { opacity: 1; transform: translate(-246px, 452px); animation-timing-function: ease-in; } 100% { opacity: 1; transform: translate(-240px, 470px); } }
@keyframes noir-hatspin { 0%, 1% { transform: rotate(0deg) scale(1, 1); animation-timing-function: cubic-bezier(.2, .8, .4, 1); } 25% { transform: rotate(-190deg) scale(.7, .7); animation-timing-function: linear; } 55% { transform: rotate(-290deg) scale(.5, .18); } 88% { transform: rotate(-349deg) scale(.4, .4); animation-timing-function: ease-out; } 94% { transform: rotate(-344deg) scale(.4, .37); } 100% { transform: rotate(-349deg) scale(.4, .4); } }
@keyframes noir-puff { 0% { opacity: 0; transform: translate(0px, 0px) scale(.3); } 6% { opacity: .6; } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(2.4); } }
@keyframes noir-blink { 0% { opacity: 1; } 46% { opacity: .2; } 47.5% { opacity: 1; } 49% { opacity: 0; } 50.5% { opacity: .8; } 52% { opacity: 0; } 76% { opacity: .6; } 77.5% { opacity: 0; } 79% { opacity: 1; } }
@keyframes noir-flicker { 0% { opacity: 1; } 40% { opacity: .3; } 42% { opacity: 1; } 70% { opacity: .2; } 71% { opacity: 1; } 72% { opacity: .4; } 74% { opacity: 1; } }
@keyframes noir-surge { 0% { opacity: 1; } 8% { opacity: .2; } 20% { opacity: 1; } 34% { opacity: .1; } 52% { opacity: 1; } 70% { opacity: .5; } 80% { opacity: 1; } }
@keyframes noir-flash { 0% { opacity: 0; } 4% { opacity: .95; } 100% { opacity: 0; } }
@keyframes noir-rain { to { background-position: 0 160px; } }
@keyframes noir-rain-far { to { background-position: 0 90px; } }
@keyframes noir-grain { 0% { transform: translate(0, 0); } 20% { transform: translate(-7%, 4%); } 40% { transform: translate(5%, -6%); } 60% { transform: translate(-3%, -8%); } 80% { transform: translate(8%, 3%); } }
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
.holst-login { margin: 0 14px 14px; padding: 10px 12px; background: var(--soft); border-radius: 10px; font-size: 12px; }
.holst-login input[type=password] { margin-top: 8px; text-align: left; }
.holst-login .why { font-weight: 600; }
.holst-login .error { margin: 0; }
.holst-login .plan { margin-top: 8px; }
.holst-login .note { margin-top: 6px; color: var(--muted); }
.holst-login .note b { color: var(--fg); font-weight: 600; }
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
`;

const HOLST_KEY_TITLES = {
  none: 'Вход в Holst: нет',
  checking: 'Вход в Holst: проверяю…',
  ok: 'Вход в Holst: работает',
  rejected: 'Вход в Holst: Holst не пустил',
  error: 'Вход в Holst: сохранён, проверить не получилось',
};

const PANEL_INPUT = (path, placeholder) => `<input type="text" inputmode="decimal" autocomplete="off" data-set="${path}" placeholder="${placeholder}">`;

const PANEL_HTML = `
<div class="panel">
  <header>
    <select class="board" data-act="board" title="Доска"></select>
    <span class="time"></span>
    <button type="button" class="icon key" data-act="holst-login" title="Вход в Holst"><i></i></button>
    <button type="button" class="icon" data-act="refresh" title="Обновить"><span>↻</span></button>
    <button type="button" class="icon" data-act="collapse" title="Свернуть">–</button>
    <button type="button" class="icon" data-act="close" title="Закрыть">×</button>
  </header>
  <div class="status"></div>
  <div class="summary"></div>
  <div class="holst-login" hidden></div>
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

const noirScene = () => {
  const fix = (value) => +value.toFixed(1);
  const points = (list) => list.map(([x, y]) => `${fix(x)},${fix(y)}`).join(' ');
  const wallY = (x, v) => -40 + .525 * x + v * (752 - .94 * x);
  const panes = [1.08, 1.38, 1.75, 2.2, 2.75, 3.4, 4.2].flatMap((z) => {
    const near = 800 - 800 / z;
    const far = 800 - 800 / (z * 1.14);
    return [[.12, .24], [.32, .44], [.52, .64]].flatMap(([top, bottom]) => [0, 1600].map((mirror) => {
      const x = (value) => Math.abs(mirror - value);
      return points([[x(near), wallY(near, top)], [x(far), wallY(far, top)], [x(far), wallY(far, bottom)], [x(near), wallY(near, bottom)]]);
    }));
  });
  const flicker = Math.floor(Math.random() * panes.length);
  const windows = panes.map((pane, index) => {
    const lit = index === flicker || Math.random() < .3;
    return `<polygon${index === flicker ? ' class="flicker"' : ''} points="${pane}" fill="${lit ? '#9a9a9a' : '#060607'}" fill-opacity="${lit ? (.35 + Math.random() * .3).toFixed(2) : .85}"/>`;
  }).join('');
  const dashes = Array.from({ length: 9 }, (_, k) => {
    const near = 380 + 520 / (1 + 2.2 * k);
    const far = 380 + 520 / (2.1 + 2.2 * k);
    const half = (y) => 8 * (y - 380) / 520;
    return `<polygon points="${points([[800 - half(near), near], [800 + half(near), near], [800 + half(far), far], [800 - half(far), far]])}"/>`;
  }).join('');
  const puffs = [[60, -120, 0], [130, -60, .05], [20, -190, .12], [160, -160, .2], [90, -240, .3]]
    .map(([dx, dy, delay]) => `<circle class="puff" r="40" style="--dx:${dx}px;--dy:${dy}px;--d:${delay}s" fill="url(#noir-smoke) #777"/>`).join('');
  const wing = '<path d="M4 -6 C-12 -4 -22 20 -22 52 C-22 86 -14 112 -6 134 C-2 124 0 116 2 110 C4 120 6 124 8 128 C12 104 16 70 16 40 C16 14 14 -4 4 -6 Z" fill="url(#noir-white) #bdbdbd" stroke="#7a7a7a" stroke-width="1.2"/>';
  const foot = '<path d="M0 0 V36" stroke="#4d4d4d" stroke-width="6" stroke-linecap="round"/><path d="M-2 33 L-15 41 Q-8 38.5 -5.5 43 Q0 39 5.5 43 Q8 38.5 15 41 L2 33 Z" fill="#3c3c3c"/>';
  const almond = 'M-22 -3 C-20 -11 -9 -12 -6.5 -6 C-8 0 -19 1.5 -22 -3 Z';
  const eyeball = `<path d="${almond}" fill="url(#noir-sclera) #dcb8b3"/><path d="M-21.6 -3.2 q2 -.9 3.6 -.3 q1 .3 1.8 -.4 M-21.4 -2.6 q2.2 1 3.4 .6 M-21 -3.6 q1.5 -1.4 3 -1.5 M-7 -5.8 q-1.6 .2 -2.6 1 q-.6 .5 -1.4 .4 M-7.2 -5.2 q-1 1.6 -2.4 2.2" fill="none" stroke="#b0201a" stroke-opacity=".85" stroke-width=".55" stroke-linecap="round"/><circle cx="-13.5" cy="-2" r="3.6" fill="#2e2e2e"/><circle cx="-13.5" cy="-2" r="1.9" fill="#0a0a0a"/><circle cx="-12.4" cy="-3.4" r=".6" fill="#fff" fill-opacity=".45"/>`;
  const lid = '<path d="M-10 -2 H10 V5 Q0 8 -10 9.5 Z" fill="#9c9c9c"/><path d="M8 5.9 Q0 8.8 -9 10.2" fill="none" stroke="#a8322b" stroke-opacity=".55" stroke-width=".8"/><path d="M10 5 Q0 8 -10 9.5" fill="none" stroke="#262626" stroke-width="1.5"/>';
  const sunken = '<path d="M-22 -3 C-19 1.5 -8 0 -6.5 -6 C-6 4 -20 7.5 -22 -3 Z" fill="#1c1c1c" fill-opacity=".32"/><path d="M-22 -3 C-19 1.5 -8 0 -6.5 -6 C-7 1.5 -19 4.5 -22 -3 Z" fill="#3b1212" fill-opacity=".35"/><path d="M-6.5 -6 C-8 0 -19 1.5 -22 -3" fill="none" stroke="#c62f25" stroke-opacity=".9" stroke-width="1.3" stroke-linecap="round"/><path d="M-22 -3 C-20 -11 -9 -12 -6.5 -6" fill="none" stroke="#2e2e2e" stroke-width="1.2" stroke-linecap="round"/><path d="M-23 -6.5 C-21 -14 -9 -15 -5.2 -8.8" fill="none" stroke="#4a4a4a" stroke-opacity=".55" stroke-width="1" stroke-linecap="round"/><path d="M-21.5 5 Q-14 8.5 -6.5 2" fill="none" stroke="#555" stroke-opacity=".35" stroke-width="1" stroke-linecap="round"/>';
  const hat = '<path d="M-33 -2 C-35 -22 -33 -39 -28 -47 C-16 -53 -7 -45 0 -49 C7 -45 16 -53 28 -47 C33 -39 35 -22 33 -2 Z" fill="#26262a" stroke="#5a5a63" stroke-width="1.3"/><path d="M19 -48 C28 -45 32 -32 31.5 -3 L25 -3 C25.5 -28 23.5 -40 19 -48 Z" fill="#4a4a52" fill-opacity=".5"/><path d="M-34.2 -17 H34.2 L33.6 -8 H-33.6 Z" fill="#09090a"/><ellipse rx="54" ry="10" fill="#18181b" stroke="#4a4a52" stroke-width="1.2"/><path d="M-54 0 A54 10 0 0 1 54 0" fill="none" stroke="#6a6a73" stroke-width="1.4"/>';
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs>
<linearGradient id="noir-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0c0e"/><stop offset="1" stop-color="#2a2c30"/></linearGradient>
<linearGradient id="noir-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b0c0e"/><stop offset="1" stop-color="#1f2024"/></linearGradient>
<linearGradient id="noir-wall-r" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#0b0c0e"/><stop offset="1" stop-color="#1f2024"/></linearGradient>
<linearGradient id="noir-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2c30"/><stop offset=".45" stop-color="#141518"/><stop offset="1" stop-color="#0c0d0f"/></linearGradient>
<linearGradient id="noir-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa0a6" stop-opacity="0"/><stop offset=".45" stop-color="#9aa0a6" stop-opacity=".2"/><stop offset="1" stop-color="#9aa0a6" stop-opacity="0"/></linearGradient>
<linearGradient id="noir-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".13"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="noir-redpool"><stop offset="0" stop-color="#ff2a2a" stop-opacity=".24"/><stop offset="1" stop-color="#ff2a2a" stop-opacity="0"/></radialGradient>
<radialGradient id="noir-white" cx=".62" cy=".3" r=".8"><stop offset="0" stop-color="#f2f2f2"/><stop offset=".5" stop-color="#c2c2c2"/><stop offset=".85" stop-color="#777"/><stop offset="1" stop-color="#4a4a4a"/></radialGradient>
<radialGradient id="noir-head" gradientUnits="userSpaceOnUse" cx="8.6" cy="-12.8" r="56"><stop offset="0" stop-color="#f2f2f2"/><stop offset=".5" stop-color="#c2c2c2"/><stop offset=".85" stop-color="#777"/><stop offset="1" stop-color="#4a4a4a"/></radialGradient>
<radialGradient id="noir-sclera"><stop offset=".25" stop-color="#efdfdb"/><stop offset="1" stop-color="#c2625a"/></radialGradient>
<radialGradient id="noir-smoke"><stop offset="0" stop-color="#b8b8b8" stop-opacity=".9"/><stop offset="1" stop-color="#b8b8b8" stop-opacity="0"/></radialGradient>
<radialGradient id="noir-halo"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<g class="cam">
<rect x="-40" y="-40" width="1680" height="460" fill="url(#noir-sky) #16171a"/>
<circle cx="1210" cy="92" r="120" fill="url(#noir-halo) none"/>
<circle cx="1210" cy="92" r="40" fill="#d9d9d9"/>
<g fill="#bdbdbd"><circle cx="1196" cy="80" r="7"/><circle cx="1224" cy="104" r="5"/><circle cx="1220" cy="76" r="3"/></g>
<path d="M1100 112 Q1150 96 1206 104 T1330 98 Q1300 118 1210 120 T1100 112 Z M1150 62 Q1200 52 1250 58 Q1230 68 1180 68 Z" fill="#121316" fill-opacity=".85"/>
<g fill="#141518"><rect x="660" y="318" width="38" height="64"/><rect x="694" y="334" width="30" height="48"/><rect x="722" y="300" width="26" height="82"/><rect x="746" y="326" width="40" height="56"/><rect x="814" y="322" width="34" height="60"/><rect x="846" y="296" width="24" height="86"/><rect x="868" y="330" width="36" height="52"/><rect x="902" y="312" width="38" height="70"/></g>
<g fill="#8a8a8a" fill-opacity=".5"><rect x="668" y="330" width="3" height="4"/><rect x="730" y="314" width="3" height="4"/><rect x="852" y="310" width="3" height="4"/><rect x="910" y="340" width="3" height="4"/><rect x="760" y="338" width="3" height="4"/></g>
<polygon points="0,-40 660,306 660,438 0,712" fill="url(#noir-wall) #141518"/>
<polygon points="1600,-40 940,306 940,438 1600,712" fill="url(#noir-wall-r) #141518"/>
<g>${windows}</g>
<path d="M300 117.5 V587.5 M1270 114 V585" stroke="#08090a" stroke-width="6"/>
<polygon points="0,712 785,380 150,900 0,900" fill="#17181b"/>
<polygon points="1600,712 815,380 1450,900 1600,900" fill="#17181b"/>
<polygon points="150,900 785,380 815,380 1450,900" fill="url(#noir-road) #16171a"/>
<path d="M150 900 L785 380 M1450 900 L815 380" stroke="#2e3034" stroke-width="2.5"/>
<path d="M0 712 L660 438 M1600 712 L940 438" stroke="#08090a" stroke-width="3"/>
<g fill="#8d8d86" fill-opacity=".55">${dashes}</g>
<g fill="#3a3d42" fill-opacity=".45"><ellipse cx="620" cy="720" rx="95" ry="13"/><ellipse cx="990" cy="560" rx="48" ry="6"/><ellipse cx="720" cy="470" rx="22" ry="2.6"/><ellipse cx="1120" cy="830" rx="70" ry="9"/></g>
<ellipse class="blink" cx="390" cy="730" rx="120" ry="200" fill="url(#noir-redpool) none"/>
<ellipse cx="1353" cy="760" rx="34" ry="150" fill="url(#noir-halo) none" fill-opacity=".45"/>
<rect x="768" y="346" width="2" height="46" fill="#0c0d0f"/>
<circle cx="764" cy="347" r="16" fill="url(#noir-halo) none"/>
<circle cx="764" cy="347" r="2.5" fill="#f0ede0"/>
<rect x="-40" y="300" width="1680" height="180" fill="url(#noir-fog) none"/>
<polygon points="1340,206 1366,206 1560,890 1150,890" fill="url(#noir-cone) none"/>
<ellipse cx="1360" cy="872" rx="220" ry="30" fill="#fff" fill-opacity=".06"/>
<rect x="1420" y="170" width="14" height="690" fill="#0c0d0f"/>
<path d="M1427 176 Q1420 192 1362 196" fill="none" stroke="#0c0d0f" stroke-width="7"/>
<circle cx="1353" cy="206" r="70" fill="url(#noir-halo) none"/>
<ellipse cx="1353" cy="201" rx="26" ry="8" fill="#222326"/>
<ellipse cx="1353" cy="206" rx="15" ry="4.5" fill="#f4f1e6"/>
<g class="weave"><g class="walker">
<ellipse cy="357" rx="70" ry="9" fill="#000" fill-opacity=".45"/>
<g class="fall"><g class="jerk"><g class="lean">
<g class="hic"><g class="bob"><g transform="translate(0 355)"><g class="sway"><g transform="translate(0 -355)">
<g transform="translate(-26 318)"><g class="leg">${foot}</g></g>
<g transform="translate(26 318)"><g class="leg other">${foot}</g></g>
<path d="M-22 150 C-21 100 -19 50 -17 18 L17 18 C19 50 21 100 22 150 Z" fill="url(#noir-white) #bdbdbd"/>
<path d="M-22 150 C-21 100 -19 50 -17 18 L-9 18 C-11 50 -13 100 -12 150 Z" fill="#000" fill-opacity=".18"/>
<ellipse cy="30" rx="18" ry="6" fill="#000" fill-opacity=".25"/>
<ellipse cy="232" rx="92" ry="100" fill="url(#noir-white) #bdbdbd"/>
<path d="M-52 196 q8 7 16 0 M-20 214 q8 7 16 0 M18 198 q8 7 16 0 M-40 246 q8 7 16 0 M4 252 q8 7 16 0 M40 236 q8 7 16 0" fill="none" stroke="#8a8a8a" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>
<path d="M-6 144 L10 144 L7 156 L-3 156 Z M-3 156 L7 156 L14 205 L6 218 L-2 207 Z" fill="#141416"/>
<g transform="translate(70 168) scale(-1 1) rotate(8)"><g class="swing-r">${wing}</g></g>
<ellipse rx="36" ry="32" fill="url(#noir-head) #bdbdbd"/>
<path d="M-35 4 l-5 -3 M-36 10 l-6 0 M-33 -14 l-5 -4 M34 6 l6 -4 M35 12 l6 1 M33 -12 l5 -5" stroke="#9a9a9a" stroke-width="1.5" stroke-linecap="round"/>
${eyeball}<g transform="scale(-1 1)">${eyeball}</g>
<g transform="translate(-14 -12.5)"><g class="lid">${lid}</g></g>
<g transform="translate(14 -12.5) scale(-1 1)"><g class="lid">${lid}</g></g>
<path d="M-25 -18 H-3 V8 H-25 Z ${almond} M3 -18 H25 V8 H3 Z M22 -3 C20 -11 9 -12 6.5 -6 C8 0 19 1.5 22 -3 Z" fill="url(#noir-head) #bdbdbd" fill-rule="evenodd"/>
<path d="M-31.8 -15 A36 32 0 0 1 31.8 -15 Q0 -8 -31.8 -15 Z" fill="#000" fill-opacity=".5"/>
${sunken}<g transform="scale(-1 1)">${sunken}</g>
<path d="M-23 -13 Q-16 -16.5 -8 -18.5 M23 -13 Q16 -16.5 8 -18.5" fill="none" stroke="#333" stroke-width="2.4" stroke-linecap="round"/>
<path d="M-10 19 Q0 33 10 19 Q0 27 -10 19 Z" fill="#3d3d3d"/>
<path d="M-15 3 C-15 -1.5 15 -1.5 15 3 C14 14 8 23 0 25.5 C-8 23 -14 14 -15 3 Z" fill="#6a6a6a"/>
<path d="M-7 3 C-4 1 4 1 7 3" fill="none" stroke="#8e8e8e" stroke-width="1.4" stroke-linecap="round"/>
<g fill="#2a2a2a"><ellipse cx="-5" cy="7" rx="1.6" ry="1"/><ellipse cx="5" cy="7" rx="1.6" ry="1"/></g>
<circle cy="22.5" r="2" fill="#4a4a4a"/>
<g transform="translate(31 -12)"><g class="sweat"><path d="M0 -3 C1.6 -.5 2.4 1 2.4 2.2 A2.4 2.4 0 0 1 -2.4 2.2 C-2.4 1 -1.6 -.5 0 -3 Z" fill="#dfe7ea" stroke="#888" stroke-width=".5"/></g></g>
<g class="hat"><g transform="translate(0 -28) rotate(-8)">${hat}</g></g>
<path d="M9 20 L23 30.5" stroke="#e4e4e4" stroke-width="3"/>
<path d="M23 30.5 L24.2 31.4" stroke="#8a8a8a" stroke-width="3"/>
<circle class="ember" cx="24.8" cy="31.8" r="1.5" fill="#ff3b30"/>
<g fill="none" stroke="#aaa" stroke-width=".8" stroke-linecap="round"><path class="wisp" d="M25 29 q-3 -5 0 -9 q3 -4 0 -8"/><path class="wisp" d="M25 29 q3 -5 0 -9 q-3 -4 0 -8"/></g>
<g transform="translate(-70 168)"><g class="swing-l"><g class="arm-l">
<path d="M-3 112 H5 V140 C5 143 13 145 13 152 V198 C13 201 11 202 9 202 H-7 C-9 202 -11 201 -11 198 V152 C-11 145 -3 143 -3 140 Z" fill="#262829" fill-opacity=".92"/>
<rect x="-4" y="108" width="10" height="4.5" rx="1" fill="#3a3c3e"/>
<rect x="-11" y="162" width="24" height="20" fill="#bdbab2" fill-opacity=".85"/>
<path d="M-7 172 H9" stroke="#555" stroke-width="2"/>
<path d="M8 152 V196" stroke="#fff" stroke-opacity=".25" stroke-width="2.4" stroke-linecap="round"/>
${wing}
</g></g></g>
</g></g></g></g></g>
<g transform="translate(37 -6)"><g class="gunrise"><g class="tremble"><g transform="rotate(30) scale(1.15)"><g transform="translate(44 16)"><g class="recoil"><g transform="translate(-44 -16)">
<path d="M38 8 C46 2 58 6 62 16 C68 34 76 60 90 94 L46 100 C48 74 42 44 36 24 C34 16 34 11 38 8 Z" fill="url(#noir-white) #bdbdbd" stroke="#7a7a7a" stroke-width="1.2"/>
<rect y="-3.2" width="23" height="6.2" rx="1" fill="#55555c"/>
<path d="M.5 -2.6 H22.5" stroke="#b5b5bd" stroke-width="1"/>
<path d="M3 -3.2 L5 -5.4 L7 -3.2 Z" fill="#55555c"/>
<rect x="22" y="-6.5" width="13" height="13.5" rx="2.5" fill="#46464d" stroke="#8a8a92" stroke-width=".6"/>
<path d="M22 -2.5 H35 M22 1.5 H35" stroke="#2a2a2f" stroke-width="1.2"/>
<path d="M34 -7 L44 -7 L47 -3 L47 6 L35 8 Z" fill="#505057" stroke="#8a8a92" stroke-width=".6"/>
<path d="M44 -7 L49 -12 L51 -10 L47 -5 Z" fill="#3a3a40"/>
<path d="M37 8 C36 15 41 18 46 15 L46 12 C42 14 39 12 39 8 Z" fill="#3a3a40"/>
<path d="M41 8 C41 11 42 12 43 13" fill="none" stroke="#1a1a1d" stroke-width="1.5"/>
<path d="M37 5 L47 3 C49 10 52 18 54 26 C51 28 46 29 43 27 C41 19 39 12 37 5 Z" fill="#2e2b29" stroke="#6a6560" stroke-width=".6"/>
<path d="M52 9 C46 8 40 9 38.5 12 C40 14 46 13.5 52 14 Z M53 15 C47 14 41 15 40 18.5 C41.5 20.5 47 19.5 53.5 20 Z M54 21 C48 20.5 43 21.5 42 25 C43.5 27 48.5 26 55 26 Z" fill="url(#noir-white) #bdbdbd" stroke="#7a7a7a" stroke-width=".8"/>
</g></g></g></g></g></g></g>
<g transform="translate(37 -6)"><g class="muzzle"><circle r="34" fill="#fff3c4" fill-opacity=".35"/><polygon points="0,-22 4,-7 16,-16 7,-3 22,0 7,3 16,16 4,7 0,22 -4,7 -16,16 -7,3 -22,0 -7,-3 -16,-16 -4,-7" fill="#fffbe6"/><circle r="9" fill="#fff"/></g></g>
</g></g></g>
</g></g>
<ellipse class="hatshadow" cx="549" cy="804" rx="170" ry="14" fill="#000" fill-opacity=".5"/>
<g class="flyhat"><g transform="translate(800 510) scale(7.5) rotate(-3) translate(0 -28) rotate(-8)"><g class="flyspin">${hat}</g></g></g>
<g transform="translate(1075 450)">${puffs}</g>
</g>
</svg>
<div class="rain far"></div>
<div class="rain"></div>
<div class="glow blink"></div>
<div class="surge"><div class="tube">Overload</div><div class="lit blink">Overload</div></div>
<div class="grain"></div>
<div class="vignette"></div>
<div class="flash"></div>`;
};

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

  const timer = window.setInterval(() => {
    if (!document.hidden) refresh();
  }, REFRESH_MS);

  const onVisible = () => {
    if (!document.hidden && data.loadedAt && Date.now() - data.loadedAt.getTime() > REFRESH_MS) refresh();
  };
  document.addEventListener('visibilitychange', onVisible);

  let chaosBefore = false;
  let chaosTimer = null;
  const releaseGeese = () => {
    if ($('.geese')) return;
    const scene = document.createElement('div');
    scene.className = 'geese';
    scene.innerHTML = noirScene();
    scene.addEventListener('click', () => scene.remove());
    shadow.appendChild(scene);
    window.setTimeout(() => scene.remove(), 12400);
  };
  const checkChaos = () => {
    const names = report ? chaosNames(report.rows, boardConfig(boardId, config)) : [];
    const chaos = names.length > 0;
    if (chaos && !chaosBefore) releaseGeese();
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
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('message', onHolstMessage);
    stopHolstWait();
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
  });

  for (const type of ['keydown', 'keyup', 'keypress', 'paste', 'copy', 'cut']) {
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
