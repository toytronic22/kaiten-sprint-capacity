const DAILY_TICK_MS = 5000;
const DAILY_STEP_MS = 70;
const DAILY_REVEAL_MS = 700;
const DAILY_FLY_MS = 2600;
const DAILY_LEAVE_MS = 450;
const DAILY_ROAST_MS = 5 * 60 * 1000;
const DAILY_ARM_MS = 3000;
const DAILY_LEVER = { pivot: 150, reach: 110, knob: 20, swell: 0.35, teeth: 16, curve: 1.8, fire: 0.98, autoMs: 750, holdMs: 160, stiff: 260, damp: 20, floor: -0.1, gear: 18, wind: 80, chain: 128 };
const DAILY_HORN = { rest: 38, end: -38, nod: 6, squint: 0.35, travel: 100 };
const DAILY_FINISH = 'Теперь inbox';
const DAILY_ROAST = 'ПРОЖАРКААА';
const DAILY_ART = 'https://toytronic22.github.io/kaiten-sprint-capacity/daily/';
const DAILY_FONT_FACE = 'Sprint Dungeon';
const DAILY_FONT = `"${DAILY_FONT_FACE}", "Palatino Linotype", Palatino, Georgia, serif`;
const DAILY_CUTE_FACE = 'Sprint Balsamiq';
const DAILY_CUTE = `"${DAILY_CUTE_FACE}", "Comic Sans MS", "Chalkboard SE", "Segoe Print", sans-serif`;
const DAILY_CUTE_FILES = 'https://cdn.jsdelivr.net/npm/@fontsource/balsamiq-sans@5.3.0/files/balsamiq-sans-';
const DAILY_CUTE_RANGES = { cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116', latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD' };
const DAILY_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 -.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`;

const DAILY_CSS = `
.panel.daily-on > .status, .panel.daily-on > .remind, .panel.daily-on > .summary, .panel.daily-on > .body { display: none; }
.panel:not(.collapsed) { right: 94px; max-width: calc(100vw - 110px); }
.panel.daily-on:not(.collapsed) { display: flex; flex-direction: column; overflow: hidden; }
.panel.daily-on:not(.collapsed) > * { flex: none; }
.panel.daily-on:not(.collapsed) > .daily { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.daily .room { position: relative; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable both-edges; scrollbar-width: thin; }
.daily .room > * { flex: none; }
.daily .send { justify-content: center; }
.daily-side { position: fixed; top: 96px; right: 18px; width: 76px; height: 330px; z-index: 2147483001; pointer-events: none; }
.panel.collapsed ~ .daily-side { display: none; }
`;

const DAILY_TORCH = `<div class="torch" aria-hidden="true"><i class="glow"></i><i class="mount"></i><i class="stick"></i><i class="ring"></i><i class="head"></i><canvas class="fire" width="${DAILY_FIRE.width}" height="${DAILY_FIRE.height}"></canvas><i class="smoke"></i><i class="smoke"></i><i class="ember"></i><i class="ember"></i><i class="ember"></i></div>`;

const DAILY_KNOB = '<div class="knob" role="button" tabindex="0" aria-label="Рычаг: тяните шар вниз до щелчка или нажмите Enter" title="Тяните шар вниз до щелчка"></div>';
const DAILY_EMBER_KNOB = DAILY_KNOB.replace('></div>', '><i class="halo"></i><i class="flame"></i><i class="flame"></i><i class="flame"></i><i class="core"></i><i class="lava"></i><i class="lava"></i></div>');
const DAILY_WINCH_HTML = `<div class="plate"></div><div class="chain"></div><div class="weight"></div><div class="axle"></div><div class="arm"></div><div class="hub"></div>${DAILY_EMBER_KNOB}`;
const DAILY_STICK_HTML = `<div class="plate"></div><div class="axle"></div><div class="arm"></div><div class="hub"></div>${DAILY_KNOB}`;
const DAILY_UNICORN_HTML = `<div class="head">
<svg class="face" viewBox="0 0 92 100" aria-hidden="true">
<path d="M54 17C53 9 58 3 65 0C69 6 71 13 68 21Z" fill="#fff8ef" stroke="#5b3a4e" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M57.5 15C57.5 10 60 6.5 64 4.5C66 9 66.5 13 65 17Z" fill="#ffb5d3"/>
<path d="M50 11A25 25 0 0 1 75 36C76 52 78 70 86 100L46 100C48 88 50 78 46 68C38 71 28 70 20 67C8 64 4 56 6 49C8 41 16 37 25 37C28 32 28 28 30 24A25 25 0 0 1 50 11Z" fill="#fff8ef" stroke="#5b3a4e" stroke-width="2.6" stroke-linejoin="round"/>
<ellipse cx="15" cy="55" rx="10" ry="8.5" fill="#ffd6e4"/>
<path d="M9.5 51.5q2.2-2.6 4.4 0M13 62q5 3.4 10 0" fill="none" stroke="#5b3a4e" stroke-width="1.8" stroke-linecap="round"/>
<ellipse cx="41" cy="53" rx="5.5" ry="3.4" fill="#ff9fc4" opacity=".75"/>
<g class="eye"><ellipse cx="35" cy="40" rx="5.4" ry="7" fill="#3b2533"/><circle cx="33.2" cy="37.2" r="2" fill="#fff"/><circle cx="36.6" cy="43" r="1" fill="#fff"/></g>
<path class="lid" d="M29.5 41q5.5 4.6 11 0M30.5 43.2l-2.6 1.8M33 44.6l-1.6 2.3" fill="none" stroke="#3b2533" stroke-width="2.2" stroke-linecap="round"/>
<g fill="none" stroke-linecap="round">
<path d="M60 10C84 14 90 46 89 92" stroke="#5b3a4e" stroke-width="17"/>
<path d="M60 10C84 14 90 46 89 92" stroke="#cdb3f5" stroke-width="12"/>
<path d="M58 14C78 22 81 52 82 94" stroke="#5b3a4e" stroke-width="15"/>
<path d="M58 14C78 22 81 52 82 94" stroke="#a8dcf5" stroke-width="10"/>
<path d="M56 18C72 30 74 58 75 96" stroke="#5b3a4e" stroke-width="13"/>
<path d="M56 18C72 30 74 58 75 96" stroke="#ffe28a" stroke-width="8"/>
<path d="M55 22C66 36 68 62 68 98" stroke="#5b3a4e" stroke-width="11"/>
<path d="M55 22C66 36 68 62 68 98" stroke="#ffb5d3" stroke-width="6.5"/>
</g>
</svg>
<div class="knob" role="button" tabindex="0" aria-label="Рог-рычаг: тяните рог вниз до щелчка или нажмите Enter" title="Тяните рог вниз до щелчка"><svg viewBox="0 0 60 24" aria-hidden="true">
<defs><linearGradient id="daily-horn-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa0"/><stop offset=".55" stop-color="#f7c04a"/><stop offset="1" stop-color="#e9a12e"/></linearGradient><clipPath id="daily-horn-cut"><path d="M2 12L56 3.5Q61 12 56 20.5Z"/></clipPath></defs>
<path d="M2 12L56 3.5Q61 12 56 20.5Z" fill="url(#daily-horn-gold)"/>
<path d="M13 8l5 9M24 6l6 12M35 4.5l7 15M46 3l7 18" clip-path="url(#daily-horn-cut)" fill="none" stroke="#d8932b" stroke-width="2.2" stroke-linecap="round"/>
<path d="M10 10.6L52 5.2" fill="none" stroke="#fff6cf" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
<path d="M2 12L56 3.5Q61 12 56 20.5Z" fill="none" stroke="#5b3a4e" stroke-width="2.2" stroke-linejoin="round"/>
</svg></div>
<svg class="tuft" viewBox="0 0 92 100" aria-hidden="true">
<g fill="none" stroke-linecap="round">
<path d="M47 11C37 13 31 19 30 28" stroke="#5b3a4e" stroke-width="11"/>
<path d="M47 11C37 13 31 19 30 28" stroke="#ffb5d3" stroke-width="6.5"/>
<path d="M52 12C46 18 45 24 47 30" stroke="#5b3a4e" stroke-width="10"/>
<path d="M52 12C46 18 45 24 47 30" stroke="#a8dcf5" stroke-width="5.5"/>
</g>
<path d="M49 12c3-4 8-5 11-2-3 4-8 5-11 2Z" fill="#9ad4a6" stroke="#5b3a4e" stroke-width="1.4"/>
<g fill="#ff9ec7" stroke="#5b3a4e" stroke-width="1.4"><circle cx="48.4" cy="10" r="3"/><circle cx="46" cy="13.2" r="3"/><circle cx="42.3" cy="12" r="3"/><circle cx="42.3" cy="8" r="3"/><circle cx="46" cy="6.8" r="3"/></g>
<circle cx="45" cy="10" r="2.2" fill="#ffe28a" stroke="#5b3a4e" stroke-width="1.2"/>
</svg>
</div>
<div class="cloud"></div>`;

function dailyStick(parts, p) {
  const { pivot, reach, swell, knob } = DAILY_LEVER;
  const y = pivot - reach + 2 * reach * p;
  const scale = 1 + swell * Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
  parts.arm.style.top = `${Math.min(y, pivot)}px`;
  parts.arm.style.height = `${Math.abs(y - pivot)}px`;
  parts.knob.style.transform = `translateY(${(y - knob).toFixed(1)}px) scale(${scale.toFixed(3)})`;
}

function dailyWinch(parts, p) {
  dailyStick(parts, p);
  const { gear, wind, chain } = DAILY_LEVER;
  const wound = wind * Math.min(1, Math.max(0, p));
  parts.hub.style.transform = `rotate(${((-wound / gear) * (180 / Math.PI)).toFixed(1)}deg)`;
  parts.chain.style.height = `${(chain - wound).toFixed(1)}px`;
  parts.chain.style.backgroundPosition = `0 ${(-wound).toFixed(1)}px, 0 ${(-wound).toFixed(1)}px`;
  parts.weight.style.transform = `translateY(${(-wound).toFixed(1)}px)`;
}

function dailyHorn(parts, p) {
  const { rest, end, nod, squint } = DAILY_HORN;
  const bent = Math.min(1, Math.max(0, p));
  parts.knob.style.transform = `rotate(${(rest + (end - rest) * p).toFixed(1)}deg)`;
  parts.head.style.transform = `rotate(${(-nod * bent).toFixed(1)}deg)`;
  parts.head.classList.toggle('squint', bent > squint);
}

const DAILY_SKINS = {
  dungeon: {
    css: `
.daily { position: relative; isolation: isolate; overflow: hidden; background: #0b0a09; color: #ddd2bf; font-family: ${DAILY_FONT}; }
.daily::before { content: ""; position: absolute; left: 0; right: 0; top: 165px; z-index: -3; aspect-ratio: 1; transform: translateY(-50%); background: url("${DAILY_ART}skull.jpg") center / cover no-repeat; opacity: .72; pointer-events: none; }
.daily::after { content: ""; position: absolute; inset: 0; z-index: -2; pointer-events: none; background: ${DAILY_GRAIN}, radial-gradient(ellipse 90% 72% at 50% 46%, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, .8) 100%), linear-gradient(rgba(8, 7, 6, .15), rgba(8, 7, 6, .4)); }
.daily .room { padding: 22px 16px 20px; scrollbar-color: rgba(196, 132, 63, .55) transparent; mask-image: linear-gradient(rgba(0, 0, 0, 0), #000 16px, #000 calc(100% - 16px), rgba(0, 0, 0, 0)); }
.daily .light { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.daily .light::before, .daily .light::after { content: ""; position: absolute; top: -70px; width: 270px; height: 270px; border-radius: 50%; background: radial-gradient(circle closest-side, rgba(255, 140, 50, .3), rgba(255, 105, 30, .1) 50%, rgba(255, 80, 20, 0)); mix-blend-mode: screen; animation: daily-wall 2.8s ease-in-out infinite; }
.daily .light::before { left: -100px; }
.daily .light::after { right: -100px; animation-duration: 3.3s; animation-delay: -1.2s; }
.daily .frame { position: absolute; inset: 0; z-index: -1; pointer-events: none; border: 64px solid transparent; border-image: url("${DAILY_ART}frame.jpg") 50% / 64px stretch; mix-blend-mode: screen; opacity: .8; }
.daily .frame::before { content: ""; position: absolute; inset: -58px; border: 1px solid rgba(206, 192, 168, .3); box-shadow: 0 0 0 3px rgba(0, 0, 0, .6), 0 0 0 4px rgba(206, 192, 168, .12), inset 0 0 0 3px rgba(0, 0, 0, .6), inset 0 0 0 4px rgba(206, 192, 168, .1); }
.daily .hall { display: grid; grid-template-columns: 26px minmax(0, 1fr) 26px; gap: 8px; align-items: end; }
.daily .torch { position: relative; height: 104px; }
.daily .torch i, .daily .torch b { position: absolute; display: block; }
.daily .torch .glow { left: 50%; bottom: 40px; width: 96px; height: 96px; margin-left: -48px; border-radius: 50%; background: radial-gradient(circle closest-side, rgba(255, 160, 70, .4), rgba(255, 110, 30, .13) 50%, rgba(255, 80, 0, 0)); animation: daily-torchlight 2.2s ease-in-out infinite; }
.daily .torch .mount { left: 50%; bottom: 4px; width: 12px; height: 34px; margin-left: -6px; border-radius: 1px; background: radial-gradient(circle at 50% 5px, #8b857c 0 1.2px, #151413 2px, rgba(0, 0, 0, 0) 2.6px), radial-gradient(circle at 50% 29px, #8b857c 0 1.2px, #151413 2px, rgba(0, 0, 0, 0) 2.6px), linear-gradient(90deg, #0c0c0c, #33312e 45%, #1d1c1a 70%, #0a0a0a); box-shadow: 0 0 0 1px #000, 2px 2px 4px rgba(0, 0, 0, .7); }
.daily .torch .stick { left: 50%; bottom: 10px; width: 8px; height: 46px; margin-left: -4px; background: linear-gradient(90deg, #0a0705, #3b2616 42%, #24170d 68%, #080604); clip-path: polygon(8% 0, 92% 0, 68% 100%, 32% 100%); }
.daily .torch .ring { left: 50%; bottom: 22px; width: 18px; height: 7px; margin-left: -9px; border-radius: 1px; background: linear-gradient(#5a5650, #23211f 55%, #0b0b0a); box-shadow: 0 2px 2px rgba(0, 0, 0, .8); }
.daily .torch .head { left: 50%; bottom: 52px; width: 14px; height: 14px; margin-left: -7px; border-radius: 5px 5px 3px 3px; background: repeating-linear-gradient(-22deg, #23170e 0 2px, #0c0806 2px 4px); box-shadow: inset 0 4px 5px rgba(255, 110, 30, .5), 0 -4px 9px rgba(255, 120, 30, .55); }
.daily .torch .fire { position: absolute; display: block; left: 50%; bottom: 58px; width: 30px; height: 56px; margin-left: -15px; filter: blur(.3px) drop-shadow(0 0 5px rgba(255, 120, 30, .55)); mix-blend-mode: screen; }
.daily .torch .smoke { left: 50%; bottom: 84px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: radial-gradient(circle, rgba(92, 86, 80, .5), rgba(60, 56, 52, 0) 70%); filter: blur(1.5px); opacity: 0; animation: daily-smoke 3.2s linear infinite; }
.daily .torch .smoke + .smoke { --x: -6px; animation-duration: 3.8s; animation-delay: -1.6s; }
.daily .torch .ember { left: 50%; bottom: 74px; width: 2.5px; height: 2.5px; margin-left: -1.25px; border-radius: 50%; background: #ffcf80; box-shadow: 0 0 4px 1px rgba(255, 120, 30, .85); opacity: 0; animation: daily-ember 1.9s linear infinite; }
.daily .torch .ember + .ember { --x: -7px; animation-duration: 2.3s; animation-delay: -1.1s; }
.daily .torch .ember + .ember + .ember { --x: 3px; animation-duration: 2.7s; animation-delay: -.4s; }
.daily .reel { position: relative; height: 72px; display: grid; place-items: center; overflow: hidden; border: 1px solid #000; border-radius: 3px; background: radial-gradient(circle at 8px 8px, #77716a 0 1.3px, #141312 2.3px, rgba(0, 0, 0, 0) 3px), radial-gradient(circle at calc(100% - 8px) 8px, #77716a 0 1.3px, #141312 2.3px, rgba(0, 0, 0, 0) 3px), radial-gradient(circle at 8px calc(100% - 8px), #77716a 0 1.3px, #141312 2.3px, rgba(0, 0, 0, 0) 3px), radial-gradient(circle at calc(100% - 8px) calc(100% - 8px), #77716a 0 1.3px, #141312 2.3px, rgba(0, 0, 0, 0) 3px), radial-gradient(ellipse 70% 120% at 50% 0, rgba(255, 150, 60, .13), rgba(0, 0, 0, 0) 70%), ${DAILY_GRAIN}, linear-gradient(#211e1b, #0f0e0d); box-shadow: inset 0 1px 0 rgba(255, 240, 220, .07), inset 0 0 22px rgba(0, 0, 0, .85), 0 0 0 1px #3b342c, 0 0 0 3px #0a0908, 0 0 0 4px #2a251f, 0 8px 18px rgba(0, 0, 0, .6); }
.daily .reel::before, .daily .reel::after { content: ""; position: absolute; left: 0; right: 0; height: 16px; z-index: 1; pointer-events: none; }
.daily .reel::before { top: 0; background: linear-gradient(#1c1a17, rgba(28, 26, 23, 0)); }
.daily .reel::after { bottom: 0; background: linear-gradient(rgba(16, 15, 14, 0), #100f0e); }
.daily .reel-name { font-size: 24px; font-weight: 700; line-height: 1.15; letter-spacing: .02em; text-align: center; padding: 0 6px; color: #eadcc1; text-shadow: 0 1px 0 #000, 0 -1px 0 rgba(255, 255, 255, .05), 0 0 14px rgba(255, 140, 50, .28); }
.daily .reel-name.blur { filter: blur(1.2px); opacity: .7; }
.daily .reel-name.idle { font-size: 16px; font-weight: 400; font-style: italic; letter-spacing: .04em; color: #a39887; }
.daily .toast { min-height: 1.3em; margin-top: 6px; font-size: 14px; font-style: italic; text-align: center; color: #8d8478; }
.daily .toast.hot { font-style: normal; color: #d4664f; }
.daily .queue-head { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 2px; padding-bottom: 5px; border-bottom: 1px solid rgba(206, 192, 168, .18); font-size: 13px; letter-spacing: .16em; text-transform: uppercase; color: #8d8478; }
.daily .reset { padding: 3px 8px; border: 1px solid #3a332b; border-radius: 2px; font-size: 12.5px; letter-spacing: .1em; text-transform: uppercase; color: #b8ab96; background: rgba(10, 9, 8, .7); }
.daily .reset:hover:not(:disabled) { color: #f0e2c8; border-color: #6b5a45; }
.daily .reset.armed { color: #f6d2ac; border-color: #a2532a; background: rgba(120, 40, 15, .55); }
.daily .reset:disabled { opacity: .4; cursor: default; }
.daily .queue { display: grid; }
.daily .person { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; width: 100%; padding: 5px 8px; text-align: left; font-family: ${DAILY_FONT}; font-size: 16px; color: #d9cdb8; text-shadow: 0 1px 2px #000; background: linear-gradient(90deg, rgba(8, 7, 6, .45), rgba(8, 7, 6, .08)); border-bottom: 1px solid rgba(206, 192, 168, .09); border-radius: 0; }
.daily .person:hover:not(:disabled) { background: rgba(206, 192, 168, .08); }
.daily .person:disabled { cursor: default; }
.daily .person small { font-size: 12.5px; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; color: #8a8072; }
.daily .person .crown { font-style: normal; color: #c9a25e; }
.daily .person.done span { color: #7d7468; }
.daily .person.done small { color: #7f8d6e; }
.daily .person.now { color: #fbeed5; background: linear-gradient(90deg, rgba(160, 62, 18, .55), rgba(110, 38, 12, .15)); box-shadow: inset 2px 0 0 #d07a35; }
.daily .person.now small { color: #f0b47a; }
.daily .person.away span { text-decoration: line-through; color: #6a6258; }
.daily .tools { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.daily .tools button { padding: 5px 10px; border: 1px solid #3a332b; border-radius: 2px; color: #d0c4ae; background: rgba(20, 18, 16, .85); }
.daily .tools button:hover { border-color: #6b5a45; }
.daily .tools button:disabled { opacity: .5; cursor: default; }
.daily details { margin-top: 12px; border-top: 1px solid rgba(206, 192, 168, .16); }
.daily summary { padding: 8px 0 4px; font-family: ${DAILY_FONT}; font-size: 13px; font-weight: 400; letter-spacing: .16em; text-transform: uppercase; color: #8d8478; }
.daily summary::after { margin-left: auto; }
.daily label { display: block; margin-top: 6px; font-size: 14px; color: #9a9080; }
.daily .hint { margin-top: 6px; font-size: 14px; color: #9a9080; }
.daily select, .daily textarea { display: block; width: 100%; box-sizing: border-box; margin-top: 4px; font: inherit; color: #e2d8c6; padding: 5px 8px; border: 1px solid #3a332b; border-radius: 2px; background: rgba(8, 7, 6, .85); }
.daily textarea { height: 150px; resize: vertical; }
.daily select:focus, .daily textarea:focus { outline: none; border-color: #a2532a; }
.daily-side { font: 15px/1.4 ${DAILY_FONT}; -webkit-text-stroke-width: .4px; }
.daily-side .plate { position: absolute; left: -2px; top: 70px; width: 24px; height: 160px; border-radius: 0 3px 3px 0; background: ${DAILY_GRAIN}, radial-gradient(ellipse 60% 18% at 45% 34%, rgba(255, 110, 30, .45), rgba(0, 0, 0, 0) 70%), radial-gradient(ellipse 55% 14% at 60% 78%, rgba(255, 96, 24, .4), rgba(0, 0, 0, 0) 70%), linear-gradient(90deg, #101010, #383632 38%, #262422 66%, #0c0c0c); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .85), inset 1px 0 0 rgba(255, 255, 255, .05), 6px 0 14px rgba(0, 0, 0, .65), 0 0 14px rgba(255, 90, 20, .45); }
.daily-side .plate::before, .daily-side .plate::after { content: ""; position: absolute; left: 0; right: 0; height: 12px; background: radial-gradient(circle at 62% 50%, #9a948b 0 1.3px, #1b1a18 2.4px, rgba(0, 0, 0, 0) 3.3px), linear-gradient(#45423e, #1a1918); box-shadow: 0 1px 2px rgba(0, 0, 0, .8); }
.daily-side .plate::before { top: 16px; }
.daily-side .plate::after { bottom: 16px; }
.daily-side .chain { position: absolute; left: 52px; top: 150px; width: 10px; height: 128px; background: radial-gradient(3.5px 6px at 50% 50%, rgba(0, 0, 0, 0) 45%, #8a867f 55%, #2f2d2a 85%, rgba(0, 0, 0, 0) 95%) 0 0 / 10px 14px repeat-y, radial-gradient(1.4px 5px at 50% 0, #67635d 60%, rgba(0, 0, 0, 0) 75%) 0 0 / 10px 14px repeat-y; filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, .8)) drop-shadow(0 0 3px rgba(255, 110, 30, .85)); }
.daily-side .weight { position: absolute; left: 46px; top: 278px; width: 22px; height: 26px; clip-path: polygon(22% 0, 78% 0, 100% 100%, 0 100%); background: radial-gradient(ellipse 40% 30% at 35% 40%, rgba(120, 55, 22, .5), rgba(0, 0, 0, 0) 70%), linear-gradient(180deg, rgba(0, 0, 0, 0) 45%, rgba(255, 100, 24, .75)), linear-gradient(90deg, #0c0c0c, #46433f 40%, #2a2826 70%, #090909); }
.daily-side .axle { position: absolute; left: 16px; top: 141px; width: 26px; height: 18px; border-radius: 2px; background: linear-gradient(180deg, #161616, #4a4743 45%, #2a2826 70%, #0c0c0c); box-shadow: 0 2px 4px rgba(0, 0, 0, .6); }
.daily-side .arm { position: absolute; left: 34px; top: 40px; width: 12px; height: 110px; border-radius: 2px; overflow: hidden; background: linear-gradient(90deg, #0a0a0a, #3a2a20 30%, #a8320c 50%, #3a2a20 70%, #090909); box-shadow: 0 2px 6px rgba(0, 0, 0, .6), 0 0 10px 1px rgba(255, 90, 20, .6); }
.daily-side .arm::before { content: ""; position: absolute; left: 3px; right: 3px; top: 0; height: calc(100% + 44px); background: repeating-linear-gradient(180deg, rgba(255, 90, 20, 0) 0 8px, rgba(255, 140, 40, .95) 15px, #ffe6a0 20px, rgba(255, 140, 40, .95) 25px, rgba(255, 90, 20, 0) 32px 44px); filter: blur(.5px); animation: daily-flow 1.5s linear infinite; }
.daily-side .hub { position: absolute; left: 19px; top: 129px; width: 42px; height: 42px; border-radius: 50%; filter: drop-shadow(0 0 4px rgba(255, 100, 30, .85)); background: radial-gradient(circle closest-side, #5d5a55 0 15%, #1a1918 17% 26%, #3a3835 28% 70%, #161514 72% 77%, rgba(0, 0, 0, 0) 79%), repeating-conic-gradient(#3a3835 0 13deg, #171615 13deg 15deg, rgba(0, 0, 0, 0) 15deg 30deg); box-shadow: 0 0 9px rgba(0, 0, 0, .75); will-change: transform; }
.daily-side .hub::after { content: ""; position: absolute; inset: 16px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #ffe08a, #ff6a1a 45%, #5a1404); }
.daily-side .knob { position: absolute; left: 20px; top: 0; width: 40px; height: 40px; border-radius: 50%; pointer-events: auto; cursor: grab; touch-action: none; transform: translateY(20px); will-change: transform; box-shadow: 0 8px 16px rgba(0, 0, 0, .7); }
.daily-side .knob i { position: absolute; pointer-events: none; }
.daily-side .knob .halo { inset: -24px; border-radius: 50%; background: radial-gradient(circle closest-side, rgba(255, 170, 60, .75), rgba(255, 90, 10, .35) 50%, rgba(255, 60, 0, 0)); animation: daily-blaze 1.6s ease-in-out infinite; }
.daily-side .knob .flame { left: 50%; bottom: 46%; width: 24px; height: 38px; margin-left: -12px; border-radius: 50% 50% 45% 45% / 62% 62% 38% 38%; background: radial-gradient(ellipse 50% 60% at 50% 72%, #fff6c8, #ffc04a 30%, #ff6a12 62%, rgba(255, 60, 0, 0) 100%); filter: blur(1px); transform-origin: 50% 100%; animation: daily-lick 1.1s ease-in-out infinite; }
.daily-side .knob .flame:nth-child(3) { margin-left: -19px; width: 16px; height: 28px; --tilt: -16deg; animation-duration: .9s; animation-delay: -.3s; }
.daily-side .knob .flame:nth-child(4) { margin-left: 3px; width: 16px; height: 30px; --tilt: 14deg; animation-duration: 1.3s; animation-delay: -.7s; }
.daily-side .knob .core { inset: 0; border-radius: 50%; background: radial-gradient(circle at 50% 56%, #fff4c0 0, #ffc24a 22%, #ff6a14 48%, #b8200a 74%, #3a0602 100%); box-shadow: inset -4px -6px 10px rgba(60, 0, 0, .55), inset 3px 3px 6px rgba(255, 220, 140, .35); }
.daily-side .knob .lava { inset: 3px; border-radius: 50%; mix-blend-mode: screen; background: radial-gradient(circle at 30% 35%, rgba(255, 240, 160, .95) 0, rgba(255, 160, 40, 0) 30%), radial-gradient(circle at 70% 62%, rgba(255, 200, 80, .85) 0, rgba(255, 120, 20, 0) 34%), radial-gradient(circle at 42% 82%, rgba(255, 110, 20, .8) 0, rgba(255, 80, 0, 0) 28%); animation: daily-swirl 3.4s linear infinite; }
.daily-side .knob .lava + .lava { inset: 8px; opacity: .85; animation-duration: 2.3s; animation-direction: reverse; }
.daily-side .knob::after { content: ""; position: absolute; left: 9px; top: 6px; width: 11px; height: 6px; border-radius: 50%; background: rgba(255, 250, 220, .55); filter: blur(1px); transform: rotate(-25deg); }
.daily-side .knob:focus-visible { outline: 3px solid #c4843f; outline-offset: 3px; }
.daily-side.ready .knob { animation: daily-beckon 2.4s ease-in-out infinite; }
.daily-side .knob:hover { filter: brightness(1.15); }
.daily-side.grab .knob { cursor: grabbing; animation: none; }
.daily-side.locked .knob { cursor: not-allowed; filter: saturate(.3) brightness(.6); }
.daily-side.locked .knob .halo, .daily-side.locked .knob .flame { display: none; }
.daily-side.locked .knob .lava, .daily-side.locked .arm::before { animation: none; }
.daily-side .fly { position: absolute; right: -4px; top: 184px; min-width: 130px; max-width: 250px; box-sizing: border-box; padding: 10px 18px 12px; border: 1px solid #000; border-radius: 2px; text-align: center; color: #eadfc8; font-family: ${DAILY_FONT}; background: radial-gradient(ellipse at 50% 0, rgba(255, 140, 50, .18), rgba(0, 0, 0, 0) 70%), ${DAILY_GRAIN}, linear-gradient(#24211e, #121110); box-shadow: 0 0 0 1px #4a4035, 0 0 0 4px #0b0a09, 0 0 0 5px #2c261f, 0 16px 34px rgba(0, 0, 0, .75), 0 0 26px rgba(255, 110, 30, .22); transform-origin: 50% 0; animation: daily-drop .55s cubic-bezier(.2, .8, .25, 1) both; }
.daily-side .fly small { display: block; font-size: 12.5px; letter-spacing: .2em; text-transform: uppercase; color: #a5998a; }
.daily-side .fly b { display: block; margin-top: 2px; font-size: 24px; font-weight: 700; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 0 #000, 0 0 12px rgba(255, 140, 50, .3); }
.daily-side .fly.leave { animation: daily-fade .45s ease-in both; }
.daily-side .spark { position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; border-radius: 50%; background: #ffc27a; box-shadow: 0 0 6px 2px rgba(255, 120, 30, .8); animation: daily-spark 1.1s ease-out both; }
.daily-side .roast { position: absolute; right: calc(min(var(--panel-w, 340px), 100vw - 110px) + 88px); top: 60px; width: 220px; text-align: center; pointer-events: auto; cursor: pointer; animation: daily-rise .5s cubic-bezier(.2, .8, .25, 1) both; }
.daily-side .roast img { display: block; width: 220px; height: 310px; border: 1px solid #000; background: #111; box-shadow: 0 0 0 1px #4a4035, 0 0 0 4px #0b0a09, 0 0 0 5px #2c261f, 0 18px 40px rgba(0, 0, 0, .75); }
.daily-side .roast b { position: absolute; left: -30px; right: -30px; bottom: 16px; z-index: 1; font: 400 34px/1 ${DAILY_FONT}; letter-spacing: .02em; color: #fff; -webkit-text-stroke: 1.5px #000; text-shadow: 0 0 2px #000, 0 3px 0 #000, 0 0 18px rgba(255, 80, 20, .7); transform-origin: 50% 60%; animation: daily-shout .95s ease-in-out infinite alternate; }
.daily-side .roast.still b { position: static; display: block; padding: 22px 0; border: 1px solid #000; background: #111; box-shadow: 0 0 0 1px #4a4035, 0 0 0 4px #0b0a09, 0 0 0 5px #2c261f; }
@keyframes daily-torchlight { 0%, 100% { opacity: .75; transform: scale(1); } 23% { opacity: .95; transform: scale(1.06); } 41% { opacity: .68; transform: scale(.97); } 67% { opacity: .9; transform: scale(1.03); } 84% { opacity: .72; transform: scale(1); } }
@keyframes daily-wall { 0%, 100% { opacity: .8; } 20% { opacity: 1; } 37% { opacity: .7; } 61% { opacity: .95; } 83% { opacity: .74; } }
@keyframes daily-ember { 0% { transform: translate(0, 0); opacity: 0; } 12% { opacity: 1; } 100% { transform: translate(var(--x, 6px), -36px); opacity: 0; } }
@keyframes daily-smoke { 0% { transform: translate(0, 0) scale(.6); opacity: 0; } 15% { opacity: .7; } 100% { transform: translate(var(--x, 4px), -42px) scale(2.4); opacity: 0; } }
@keyframes daily-drop { 0% { transform: translateY(-14px) scale(1.06); opacity: 0; filter: blur(2px); } 60% { opacity: 1; filter: none; } 100% { transform: none; opacity: 1; } }
@keyframes daily-fade { to { transform: translateY(10px); opacity: 0; filter: blur(1px); } }
@keyframes daily-blaze { 0%, 100% { opacity: .75; transform: scale(1); } 30% { opacity: 1; transform: scale(1.12); } 55% { opacity: .65; transform: scale(.94); } 80% { opacity: .95; transform: scale(1.06); } }
@keyframes daily-lick { 0%, 100% { transform: rotate(var(--tilt, 0deg)) scale(1, 1); opacity: .9; } 25% { transform: rotate(calc(var(--tilt, 0deg) - 6deg)) scale(.9, 1.25); opacity: 1; } 50% { transform: rotate(calc(var(--tilt, 0deg) + 5deg)) scale(1.05, .85); opacity: .75; } 75% { transform: rotate(calc(var(--tilt, 0deg) - 3deg)) scale(.95, 1.15); opacity: 1; } }
@keyframes daily-swirl { to { transform: rotate(360deg); } }
@keyframes daily-flow { to { transform: translateY(-44px); } }
@keyframes daily-beckon { 0%, 100% { box-shadow: 0 8px 16px rgba(0, 0, 0, .7), inset -4px -6px 10px rgba(0, 0, 0, .5); } 50% { box-shadow: 0 8px 16px rgba(0, 0, 0, .7), inset -4px -6px 10px rgba(0, 0, 0, .5), 0 0 16px 4px rgba(255, 110, 30, .45); } }
@keyframes daily-spark { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(.3); opacity: 0; } }
@keyframes daily-rise { 0% { transform: translateX(40px) scale(.9); opacity: 0; } 100% { transform: none; opacity: 1; } }
@keyframes daily-shout { 0% { transform: scale(1) rotate(-1.5deg); } 100% { transform: scale(1.08) rotate(1.5deg); } }
@media (prefers-reduced-motion: reduce) { .summary::before, .daily-side .fly, .daily-side .fly.leave, .daily-side .knob, .daily-side .knob i, .daily-side .arm::before, .daily-side .roast, .daily-side .roast b, .daily .torch .glow, .daily .light::before, .daily .light::after { animation: none; } .daily-side .spark, .daily .torch .ember, .daily .torch .smoke { display: none; } }
`,
    stage: '<div class="light" aria-hidden="true"></div>\n<div class="frame" aria-hidden="true"></div>',
    scene: '',
    deco: DAILY_TORCH,
    lever: { html: DAILY_WINCH_HTML, travel: 2 * DAILY_LEVER.reach, place: dailyWinch },
    burst: { marks: Array(12).fill(''), near: 50, far: 50, delay: 160 },
  },
  classic: {
    css: `
.daily .room { padding: 12px 14px 14px; }
.daily .reel { height: 72px; border-radius: 10px; background: var(--field); border: 2px solid var(--line); overflow: hidden; position: relative; display: grid; place-items: center; }
.daily .reel::before, .daily .reel::after { content: ""; position: absolute; left: 0; right: 0; height: 16px; z-index: 1; pointer-events: none; }
.daily .reel::before { top: 0; background: linear-gradient(var(--field), transparent); }
.daily .reel::after { bottom: 0; background: linear-gradient(transparent, var(--field)); }
.daily .reel-name { font-size: 20px; font-weight: 700; line-height: 1.15; text-align: center; padding: 0 8px; }
.daily .reel-name.blur { filter: blur(1.2px); opacity: .75; }
.daily .reel-name.idle { font-size: 15px; font-weight: 600; color: var(--muted); }
.daily .toast { min-height: 1.4em; margin-top: 6px; font-size: 12px; color: var(--muted); }
.daily .toast.hot { color: var(--bad); font-weight: 600; }
.daily .queue-head { display: flex; justify-content: flex-end; margin-top: 2px; }
.daily .reset { padding: 4px 10px; border-radius: 8px; font-size: 12px; background: var(--soft); }
.daily .reset:hover:not(:disabled) { background: var(--line); }
.daily .reset.armed { color: var(--bad); background: var(--bad-soft); font-weight: 600; }
.daily .reset:disabled { opacity: .5; cursor: default; }
.daily .queue { display: grid; gap: 3px; margin-top: 6px; }
.daily .person { display: flex; justify-content: space-between; gap: 8px; width: 100%; padding: 4px 8px; text-align: left; border: 1px solid var(--line); border-radius: 8px; }
.daily .person:hover { background: var(--soft); }
.daily .person:disabled { cursor: default; }
.daily .person small { color: var(--muted); white-space: nowrap; }
.daily .person.done { background: var(--good-soft); border-color: transparent; }
.daily .person.done small { color: var(--good); }
.daily .person.now { border-color: var(--accent); background: var(--accent-soft); font-weight: 600; }
.daily .person.now small { color: var(--fg); }
.daily .person.away span { text-decoration: line-through; color: var(--muted); }
.daily .person .crown { font-style: normal; color: #f3cd62; }
.daily .tools { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.daily .tools button { padding: 5px 10px; border-radius: 8px; background: var(--soft); }
.daily .tools button:hover { background: var(--line); }
.daily .tools button:disabled { opacity: .5; cursor: default; }
.daily details { margin-top: 10px; border-top: 1px solid var(--line); }
.daily summary { padding: 8px 0 4px; font-weight: 500; color: var(--muted); }
.daily summary::after { margin-left: auto; }
.daily label { display: block; margin-top: 6px; font-size: 12px; color: var(--muted); }
.daily .hint { margin-top: 6px; font-size: 12px; color: var(--muted); }
.daily select, .daily textarea { display: block; width: 100%; box-sizing: border-box; margin-top: 4px; font: inherit; color: inherit; padding: 5px 8px; border: 1px solid var(--line); border-radius: 8px; background: var(--field); }
.daily textarea { height: 150px; resize: vertical; }
.daily select:focus, .daily textarea:focus { outline: none; border-color: var(--accent); }
.daily-side { font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
.daily-side .plate { position: absolute; left: -2px; top: 80px; width: 22px; height: 140px; border-radius: 0 12px 12px 0; background: linear-gradient(90deg, #5f646c, #eef1f5 30%, #a2a9b3 55%, #e2e6eb 78%, #6f757e); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .35), 5px 0 12px rgba(0, 0, 0, .35); }
.daily-side .plate::before, .daily-side .plate::after { content: ""; position: absolute; left: 6px; width: 9px; height: 9px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff, #8b929b 60%, #3c4148); box-shadow: 0 1px 1px rgba(0, 0, 0, .5); }
.daily-side .plate::before { top: 12px; }
.daily-side .plate::after { bottom: 12px; }
.daily-side .axle { position: absolute; left: 16px; top: 141px; width: 24px; height: 18px; border-radius: 3px; background: linear-gradient(180deg, #7d838c, #f5f7f9 42%, #9aa1ab 70%, #535860); box-shadow: 0 2px 4px rgba(0, 0, 0, .4); }
.daily-side .arm { position: absolute; left: 35px; top: 40px; width: 10px; height: 110px; border-radius: 5px; background: linear-gradient(90deg, #4f545c, #f7f9fb 38%, #b2b8c0 62%, #464a51); box-shadow: 0 2px 6px rgba(0, 0, 0, .45); }
.daily-side .hub { position: absolute; left: 22px; top: 132px; width: 36px; height: 36px; border-radius: 50%; background: radial-gradient(circle at 36% 30%, #fff, #d3d8de 28%, #7b818a 66%, #383c43); box-shadow: 0 4px 10px rgba(0, 0, 0, .55), inset 0 0 0 2px rgba(255, 255, 255, .18); }
.daily-side .hub::after { content: ""; position: absolute; inset: 11px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #c8cdd3, #4a4f56); }
.daily-side .knob { position: absolute; left: 20px; top: 0; width: 40px; height: 40px; border-radius: 50%; pointer-events: auto; cursor: grab; touch-action: none; transform: translateY(20px); will-change: transform; background: radial-gradient(circle at 34% 28%, #fff 0, #ffd6d6 6%, #ff5252 22%, #c8101c 58%, #5e0006 100%); box-shadow: 0 8px 16px rgba(0, 0, 0, .5), inset -4px -6px 10px rgba(0, 0, 0, .3); }
.daily-side .knob::after { content: ""; position: absolute; left: 9px; top: 6px; width: 13px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, .75); filter: blur(1px); transform: rotate(-25deg); }
.daily-side .knob:focus-visible { outline: 3px solid #5b9cf6; outline-offset: 3px; }
.daily-side.ready .knob { animation: daily-glow 2.4s ease-in-out infinite; }
.daily-side .knob:hover { filter: brightness(1.12); }
.daily-side.grab .knob { cursor: grabbing; animation: none; }
.daily-side.locked .knob { cursor: not-allowed; filter: saturate(.35) brightness(.75); }
.daily-side .fly { position: absolute; right: -4px; top: 184px; min-width: 120px; max-width: 250px; box-sizing: border-box; padding: 9px 16px 11px; border-radius: 14px; text-align: center; color: #3b2300; background: linear-gradient(135deg, #fff1a8, #ffd24a 45%, #f39a1e); border: 2px solid #fff6c4; box-shadow: 0 12px 28px rgba(0, 0, 0, .5), 0 0 0 4px rgba(255, 196, 0, .25); transform-origin: calc(100% - 40px) -34px; animation: daily-pop .7s cubic-bezier(.18, .89, .32, 1.28) both, daily-wobble .8s ease-in-out .7s 2; }
.daily-side .fly small { display: block; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; opacity: .7; }
.daily-side .fly b { display: block; font-size: 22px; font-weight: 800; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 0 rgba(255, 255, 255, .6); }
.daily-side .fly.leave { animation: daily-leave .45s ease-in both; }
.daily-side .spark { position: absolute; left: 50%; top: 50%; font-style: normal; font-size: 19px; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .45)); animation: daily-spark 1s ease-out both; }
.daily-side .roast { position: absolute; right: calc(min(var(--panel-w, 340px), 100vw - 110px) + 88px); top: 60px; width: 220px; text-align: center; pointer-events: auto; cursor: pointer; animation: daily-rise .5s cubic-bezier(.2, .8, .25, 1) both; }
.daily-side .roast img { display: block; box-sizing: border-box; width: 220px; height: 310px; border: 1px solid #383b41; border-radius: 14px; background: #1e2024; box-shadow: 0 16px 40px rgba(0, 0, 0, .45); }
.daily-side .roast b { position: absolute; left: -30px; right: -30px; bottom: 16px; z-index: 1; font: 900 32px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #fff; -webkit-text-stroke: 1.5px #000; text-shadow: 0 0 2px #000, 0 3px 0 #000, 0 0 16px rgba(255, 82, 82, .6); transform-origin: 50% 60%; animation: daily-shout .95s ease-in-out infinite alternate; }
.daily-side .roast.still b { position: static; display: block; padding: 22px 0; border: 1px solid #383b41; border-radius: 14px; background: #26282c; }
@keyframes daily-pop { 0% { transform: scale(.15) rotate(-30deg); opacity: 0; } 50% { transform: scale(1.18) rotate(5deg); opacity: 1; } 72% { transform: scale(.94) rotate(-2deg); } 88% { transform: scale(1.04) rotate(1deg); } 100% { transform: none; opacity: 1; } }
@keyframes daily-wobble { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-3deg) scale(1.02); } 70% { transform: rotate(3deg) scale(1.02); } }
@keyframes daily-leave { to { transform: translate(30px, -60px) scale(.2) rotate(25deg); opacity: 0; } }
@keyframes daily-glow { 0%, 100% { box-shadow: 0 8px 16px rgba(0, 0, 0, .5), inset -4px -6px 10px rgba(0, 0, 0, .3); } 50% { box-shadow: 0 8px 16px rgba(0, 0, 0, .5), inset -4px -6px 10px rgba(0, 0, 0, .3), 0 0 18px 5px rgba(255, 82, 82, .55); } }
@keyframes daily-spark { 0% { transform: translate(-50%, -50%) scale(.3); opacity: 1; } 65% { opacity: 1; } 100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.15) rotate(var(--r)); opacity: 0; } }
@keyframes daily-rise { 0% { transform: translateX(40px) scale(.9); opacity: 0; } 100% { transform: none; opacity: 1; } }
@keyframes daily-shout { 0% { transform: scale(1) rotate(-1.5deg); } 100% { transform: scale(1.08) rotate(1.5deg); } }
@media (prefers-reduced-motion: reduce) { .daily-side .fly, .daily-side .fly.leave, .daily-side .knob, .daily-side .roast, .daily-side .roast b { animation: none; } .daily-side .spark { display: none; } }
`,
    stage: '',
    scene: '',
    deco: '',
    lever: { html: DAILY_STICK_HTML, travel: 2 * DAILY_LEVER.reach, place: dailyStick },
    burst: { marks: ['✨', '🎉', '⭐', '✨', '🎊', '⭐', '✨', '🎉'], near: 60, far: 40, delay: 120 },
  },
  unicorn: {
    css: `
.panel:not(.collapsed) { right: 130px; max-width: calc(100vw - 146px); }
.daily { position: relative; isolation: isolate; overflow: hidden; }
.daily .room { padding: 14px 16px 16px; scrollbar-color: #f4a6d7 transparent; }
.daily .sky { position: absolute; left: 10px; right: 10px; top: 10px; height: 140px; z-index: -1; overflow: hidden; pointer-events: none; border: 3px solid #fff; border-radius: 22px; background: linear-gradient(#7484e4, #a99bf0 42%, #f0b6dd 82%, #ffd6ea); box-shadow: 0 0 0 2px #f2c3e6, 0 6px 16px rgba(150, 90, 190, .22); }
.daily .rainbow { position: absolute; left: 50%; top: 9px; width: 280px; height: 280px; margin-left: -140px; border-radius: 50%; background: radial-gradient(circle closest-side, rgba(255, 255, 255, 0) 104px, #c9a5ff 104px 110px, #8fcaff 110px 116px, #9fe3b4 116px 122px, #ffe37a 122px 128px, #ffc27a 128px 134px, #ff9ec7 134px 140px); opacity: .9; }
.daily .star { position: absolute; background: #fff7c2; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); animation: daily-twinkle 2.6s ease-in-out infinite; }
.daily .hall { position: relative; padding: 52px 20px 12px; }
.daily .puff { position: absolute; bottom: 0; z-index: 2; width: 74px; height: 34px; pointer-events: none; background: radial-gradient(circle at 16px 21px, #fff 0 13px, rgba(255, 255, 255, 0) 13.5px), radial-gradient(circle at 35px 15px, #fff 0 15px, rgba(255, 255, 255, 0) 15.5px), radial-gradient(circle at 56px 20px, #fff 0 13px, rgba(255, 255, 255, 0) 13.5px), linear-gradient(#fff, #fff) 14px 21px / 46px 13px no-repeat; filter: drop-shadow(0 2px 0 #f2c3e6); }
.daily .puff:first-child { left: 4px; }
.daily .puff:last-child { right: 4px; transform: scaleX(-1); }
.daily .reel { position: relative; z-index: 1; box-sizing: border-box; height: 76px; display: grid; place-items: center; overflow: hidden; border: 3px solid #fff; border-radius: 22px; background: #fff; box-shadow: 0 0 0 2px #f4b8e4, 0 6px 14px rgba(150, 80, 170, .28); }
.daily .reel::before, .daily .reel::after { content: ""; position: absolute; left: 0; right: 0; height: 14px; z-index: 1; pointer-events: none; }
.daily .reel::before { top: 0; background: linear-gradient(#fff, rgba(255, 255, 255, 0)); }
.daily .reel::after { bottom: 0; background: linear-gradient(rgba(255, 255, 255, 0), #fff); }
.daily .reel-name { padding: 0 8px; font-size: 25px; font-weight: 700; line-height: 1.15; text-align: center; color: transparent; background: linear-gradient(90deg, #ef4f9b, #a55cf0 55%, #4b8ef0); -webkit-background-clip: text; background-clip: text; }
.daily .reel-name.blur { filter: blur(1.2px); opacity: .7; }
.daily .reel-name.idle { font-size: 17px; font-weight: 400; color: #94799d; background: none; }
.daily .toast { min-height: 1.4em; margin-top: 10px; font-size: 14px; text-align: center; color: #94799d; }
.daily .toast.hot { font-weight: 700; color: #e0457a; }
.daily .queue-head { display: flex; justify-content: flex-end; margin-top: 2px; }
.daily .reset { padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #c561d6; background: #fff; box-shadow: 0 0 0 2px #f0c8ea; }
.daily .reset:hover:not(:disabled) { background: #fff5fc; }
.daily .reset.armed { color: #4a1258; background: linear-gradient(135deg, #ff7aa8, #ff9a6b); box-shadow: 0 0 0 2px #ffc2d6; }
.daily .reset:disabled { opacity: .45; cursor: default; }
.daily .queue { display: grid; gap: 5px; margin-top: 8px; }
.daily .person { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; width: 100%; padding: 5px 12px; text-align: left; border-radius: 999px; background: #fff; box-shadow: 0 0 0 2px #f6dcf2; }
.daily .person:hover:not(:disabled) { background: #fff5fc; }
.daily .person:disabled { cursor: default; }
.daily .person small { font-size: 13px; white-space: nowrap; color: #94799d; }
.daily .person .crown { font-style: normal; color: #f2a93b; }
.daily .person.done { background: #e9f8f1; box-shadow: 0 0 0 2px #c9eedd; }
.daily .person.done span { color: #6d8f80; }
.daily .person.done small { color: #23a37a; }
.daily .person.now { font-weight: 700; color: #fff; background: linear-gradient(135deg, #ff9ccd, #c79bff 60%, #8fcaff); box-shadow: 0 3px 8px rgba(170, 90, 200, .35); }
.daily .person.now small { color: #fff; }
.daily .person.away span { text-decoration: line-through; color: #b9a4bf; }
.daily .tools { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.daily .tools button { padding: 5px 12px; border-radius: 999px; font-weight: 700; color: #4b3150; background: #fff; box-shadow: 0 0 0 2px #f0c8ea; }
.daily .tools button:hover { background: #fff5fc; }
.daily .tools button:disabled { opacity: .5; cursor: default; }
.daily details { margin-top: 12px; border-top: 2px dashed #f1d2ec; }
.daily summary { padding: 8px 0 4px; font-weight: 700; color: #94799d; }
.daily summary::after { margin-left: auto; }
.daily label { display: block; margin-top: 6px; font-size: 13px; color: #94799d; }
.daily .hint { margin-top: 6px; font-size: 13px; color: #94799d; }
.daily select, .daily textarea { display: block; width: 100%; box-sizing: border-box; margin-top: 4px; padding: 6px 10px; font: inherit; color: #4b3150; border: 2px solid #f1d6ee; border-radius: 14px; background: #fff; }
.daily textarea { height: 150px; resize: vertical; }
.daily select:focus, .daily textarea:focus { outline: none; border-color: #e59ad8; box-shadow: 0 0 0 3px rgba(229, 154, 216, .3); }
.daily-side { width: 112px; font: 15px/1.4 ${DAILY_CUTE}; }
.daily-side .head { position: absolute; left: 20px; top: 40px; width: 92px; height: 100px; transform-origin: 70% 96%; will-change: transform; filter: drop-shadow(0 6px 10px rgba(150, 70, 170, .28)); }
.daily-side .face, .daily-side .tuft { position: absolute; left: 0; top: 0; width: 92px; height: 100px; overflow: visible; }
.daily-side .tuft { pointer-events: none; }
.daily-side .eye { transform-box: fill-box; transform-origin: 50% 50%; animation: daily-blink 4.8s ease-in-out infinite; }
.daily-side .lid { display: none; }
.daily-side .head.squint .eye { display: none; }
.daily-side .head.squint .lid { display: inline; }
.daily-side .knob { position: absolute; left: -24px; top: 6px; width: 60px; height: 24px; pointer-events: auto; cursor: grab; touch-action: none; transform-origin: 100% 50%; transform: rotate(38deg); will-change: transform; }
.daily-side .knob svg { display: block; width: 60px; height: 24px; overflow: visible; }
.daily-side .knob:focus-visible { outline: 3px solid #c561d6; outline-offset: 2px; border-radius: 12px; }
.daily-side.ready .knob { animation: daily-shine 2.2s ease-in-out infinite; }
.daily-side .knob:hover { filter: brightness(1.08) drop-shadow(0 0 5px rgba(255, 200, 80, .9)); }
.daily-side.grab .knob { cursor: grabbing; animation: none; }
.daily-side.locked .knob { cursor: not-allowed; filter: saturate(.3) brightness(.95); }
.daily-side .cloud { position: absolute; left: 6px; top: 122px; width: 106px; height: 46px; pointer-events: none; background: radial-gradient(circle at 20px 27px, #fff 0 17px, rgba(255, 255, 255, 0) 17.5px), radial-gradient(circle at 45px 19px, #fff 0 19px, rgba(255, 255, 255, 0) 19.5px), radial-gradient(circle at 72px 20px, #fff 0 18px, rgba(255, 255, 255, 0) 18.5px), radial-gradient(circle at 91px 29px, #fff 0 14px, rgba(255, 255, 255, 0) 14.5px), linear-gradient(#fff, #fff) 18px 27px / 76px 17px no-repeat; filter: drop-shadow(0 2px 0 #f2c3e6) drop-shadow(0 6px 10px rgba(150, 70, 170, .22)); }
.daily-side .fly { position: absolute; right: -4px; top: 178px; min-width: 130px; max-width: 250px; box-sizing: border-box; padding: 10px 18px 12px; border: 3px solid #fff; border-radius: 22px; text-align: center; color: #4b3150; background: linear-gradient(135deg, #ffe3f1, #efe2ff 55%, #dff1ff); box-shadow: 0 0 0 2px #f2bde4, 0 12px 26px rgba(150, 70, 170, .35); transform-origin: calc(100% - 40px) -34px; animation: daily-pop .7s cubic-bezier(.18, .89, .32, 1.28) both, daily-wobble .8s ease-in-out .7s 2; }
.daily-side .fly small { display: block; font-size: 13px; font-weight: 700; color: #b06bc2; }
.daily-side .fly b { display: block; margin-top: 2px; font-size: 24px; font-weight: 700; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.daily-side .fly.leave { animation: daily-leave .45s ease-in both; }
.daily-side .spark { position: absolute; left: 50%; top: 50%; font-style: normal; font-size: 19px; filter: drop-shadow(0 1px 2px rgba(150, 70, 170, .4)); animation: daily-spark 1s ease-out both; }
.daily-side .roast { position: absolute; right: calc(min(var(--panel-w, 340px), 100vw - 110px) + 124px); top: 60px; width: 220px; text-align: center; pointer-events: auto; cursor: pointer; animation: daily-rise .5s cubic-bezier(.2, .8, .25, 1) both; }
.daily-side .roast img { display: block; box-sizing: border-box; width: 220px; height: 310px; border: 4px solid #fff; border-radius: 26px; background: #fff; box-shadow: 0 0 0 3px #f2bde4, 0 18px 40px rgba(150, 70, 170, .4); }
.daily-side .roast b { position: absolute; left: -30px; right: -30px; bottom: 16px; z-index: 1; font: 700 34px/1 ${DAILY_CUTE}; color: #fff; -webkit-text-stroke: 1.5px #c0398a; text-shadow: 0 3px 0 #c0398a, 0 0 18px rgba(255, 120, 200, .8); transform-origin: 50% 60%; animation: daily-shout .95s ease-in-out infinite alternate; }
.daily-side .roast.still b { position: static; display: block; padding: 22px 0; border: 4px solid #fff; border-radius: 26px; background: linear-gradient(135deg, #ff9ccd, #c79bff 60%, #8fcaff); box-shadow: 0 0 0 3px #f2bde4; }
@keyframes daily-pop { 0% { transform: scale(.15) rotate(-30deg); opacity: 0; } 50% { transform: scale(1.18) rotate(5deg); opacity: 1; } 72% { transform: scale(.94) rotate(-2deg); } 88% { transform: scale(1.04) rotate(1deg); } 100% { transform: none; opacity: 1; } }
@keyframes daily-wobble { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-3deg) scale(1.02); } 70% { transform: rotate(3deg) scale(1.02); } }
@keyframes daily-leave { to { transform: translate(30px, -60px) scale(.2) rotate(25deg); opacity: 0; } }
@keyframes daily-spark { 0% { transform: translate(-50%, -50%) scale(.3); opacity: 1; } 65% { opacity: 1; } 100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.15) rotate(var(--r)); opacity: 0; } }
@keyframes daily-rise { 0% { transform: translateX(40px) scale(.9); opacity: 0; } 100% { transform: none; opacity: 1; } }
@keyframes daily-shout { 0% { transform: scale(1) rotate(-1.5deg); } 100% { transform: scale(1.08) rotate(1.5deg); } }
@keyframes daily-shine { 0%, 100% { filter: drop-shadow(0 0 0 rgba(255, 200, 80, 0)); } 50% { filter: drop-shadow(0 0 6px rgba(255, 196, 64, .95)); } }
@keyframes daily-blink { 0%, 90%, 100% { transform: scaleY(1); } 94% { transform: scaleY(.1); } }
@keyframes daily-twinkle { 0%, 100% { opacity: .35; transform: scale(.7); } 50% { opacity: 1; transform: scale(1.15); } }
@media (prefers-reduced-motion: reduce) { .daily-side .fly, .daily-side .fly.leave, .daily-side .knob, .daily-side .roast, .daily-side .roast b, .daily-side .eye, .daily .star { animation: none; } .daily-side .spark { display: none; } }
`,
    stage: '',
    scene: '<div class="sky" aria-hidden="true"><i class="rainbow"></i><b class="star" style="left: 22px; top: 12px; width: 10px; height: 10px"></b><b class="star" style="left: 60px; top: 22px; width: 7px; height: 7px; animation-delay: -1.1s"></b><b class="star" style="left: 36px; top: 38px; width: 6px; height: 6px; animation-delay: -1.9s"></b><b class="star" style="right: 22px; top: 14px; width: 10px; height: 10px; animation-delay: -.7s"></b><b class="star" style="right: 62px; top: 26px; width: 7px; height: 7px; animation-delay: -1.5s"></b><b class="star" style="right: 38px; top: 40px; width: 6px; height: 6px; animation-delay: -2.3s"></b></div>',
    deco: '<i class="puff" aria-hidden="true"></i>',
    lever: { html: DAILY_UNICORN_HTML, travel: DAILY_HORN.travel, place: dailyHorn },
    burst: { marks: ['✨', '💖', '⭐', '🌈', '💜', '✨', '🦄', '💗', '⭐', '✨'], near: 60, far: 46, delay: 140 },
  },
};

function dailyHtml(look) {
  return `
${look.stage}
<div class="room">
${look.scene}
<div class="hall">${look.deco}<div class="reel"><div class="reel-name idle" data-part="reel" aria-live="polite"></div></div>${look.deco}</div>
<div class="toast" data-part="toast"></div>
<details data-part="line">
  <summary>Очередь</summary>
  <div class="queue-head"><button type="button" class="reset" data-daily="reset" title="Вернуть очередь к началу — снова начнёт ведущий">Сбросить очередь</button></div>
  <div class="queue" data-part="queue"></div>
</details>
<details data-part="check" hidden>
  <summary>Проверить <span class="count" data-part="check-count"></span></summary>
  <div class="check" data-part="check-list"></div>
</details>
<details data-part="edit">
  <summary>Настройки</summary>
  <div class="hint">Рычаг дёргает ведущий у себя: очередь хранится в его браузере. Ведущий и список — общие для команды, у каждой команды свои</div>
  <div class="hint" data-part="shared"></div>
  <div class="hint" data-part="host" hidden></div>
  <label>Ведущий спринта — говорит первым<select data-daily="host"></select></label>
  <div class="hint">Кого нет сегодня — нажмите на имя в очереди, второй клик вернёт</div>
  <div class="tools"><button type="button" data-daily="undo">← Назад</button></div>
  <label>Список команды — в этом порядке и говорят, по имени в строке<textarea data-part="people" spellcheck="false"></textarea></label>
  <div class="tools"><button type="button" data-daily="people-save">Сохранить список</button><button type="button" data-daily="people-default">Список по умолчанию</button></div>
</details>
<div class="plan send" data-part="send" hidden><button type="button" data-act="to-holst" title="Процент, розовый список, отчёт идущего спринта и рядом — итоги прошлого">В Holst</button><span>процент, список и отчёт спринта</span></div>
</div>`;
}

const DAILY_FACES = {
  dungeon: [],
  classic: [],
  unicorn: ['400', '700'].flatMap((weight) => Object.entries(DAILY_CUTE_RANGES).map(([range, unicodeRange]) => ({ family: DAILY_CUTE_FACE, source: `url("${DAILY_CUTE_FILES}${range}-${weight}-normal.woff2") format("woff2")`, descriptors: { weight, unicodeRange } }))),
};

const DAILY_CLIPS = { gear: 'gear.mp3', lever: 'lever.mp3' };
const DAILY_GEAR = { gain: 0.55, mesh: 0.019, meshGain: 0.45, late: 0.12 };
const DAILY_VOLUME = 0.25;
function dailyFont(skin) {
  const fonts = window.document && window.document.fonts;
  const faces = DAILY_FACES[skin] || [];
  if (!fonts || !window.FontFace || !faces.length) return;
  for (const face of fonts) if (face.family.replace(/["']/g, '') === faces[0].family) return;
  for (const { family, source, descriptors } of faces) {
    const face = new window.FontFace(family, source, descriptors);
    fonts.add(face);
    const loaded = face.load();
    if (loaded && loaded.catch) loaded.catch(() => {});
  }
}

function dailySound() {
  const Context = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let out = null;
  let bytes = null;
  let clips = null;
  const fetchClips = () => {
    if (!bytes) {
      bytes = Promise.all(Object.entries(DAILY_CLIPS).map(([name, file]) => Promise.resolve()
        .then(() => window.fetch(`${DAILY_ART}${file}`))
        .then((response) => (response && response.ok ? response.arrayBuffer() : null))
        .then((data) => [name, data])));
      bytes.catch(() => {
        bytes = null;
      });
    }
    return bytes;
  };
  const decode = () => {
    if (!clips) {
      clips = fetchClips()
        .then((pairs) => Promise.all(pairs.map(([name, data]) => (data ? ctx.decodeAudioData(data.slice(0)) : Promise.resolve(null)).then((buffer) => [name, buffer]))))
        .then((pairs) => Object.fromEntries(pairs));
      clips.catch(() => {
        clips = null;
      });
    }
    return clips;
  };
  const open = () => {
    if (!Context) return;
    if (!ctx) {
      try {
        ctx = new Context();
      } catch (error) {
        ctx = null;
        return;
      }
      out = ctx.createGain();
      out.gain.value = DAILY_VOLUME;
      out.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      const resumed = ctx.resume();
      if (resumed && resumed.catch) resumed.catch(() => {});
    }
    decode();
  };
  const play = (name, delay, { gain, rate = 1, late = Infinity }) => {
    if (!ctx || !clips) return;
    const want = ctx.currentTime + delay;
    clips.then((ready) => {
      const buffer = ready[name];
      if (!buffer || ctx.state !== 'running' || ctx.currentTime - want > late) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      const amp = ctx.createGain();
      amp.gain.value = gain;
      source.connect(amp);
      amp.connect(out);
      source.start(Math.max(want, ctx.currentTime));
    }).catch(() => {});
  };
  const gear = (delay = 0) => {
    const { gain, mesh, meshGain, late } = DAILY_GEAR;
    play('gear', delay, { gain: gain * (0.85 + Math.random() * 0.3), rate: 0.97 + Math.random() * 0.06, late });
    play('gear', delay + mesh * (0.7 + Math.random() * 0.6), { gain: gain * meshGain, rate: 0.9 + Math.random() * 0.06, late });
  };
  const lever = (delay = 0) => play('lever', delay, { gain: 1 });
  return { prefetch: fetchClips, open, gear, lever };
}

function dailyPanel({ shadow, box, tabs, config, store, send, check, share, skin: first }) {
  const known = (name) => Object.keys(DAILY_SKINS).includes(name);
  let look = DAILY_SKINS[known(first) ? first : 'dungeon'];
  const style = document.createElement('style');
  style.textContent = DAILY_CSS + look.css;
  shadow.appendChild(style);
  const side = document.createElement('div');
  side.className = 'daily-side';
  side.hidden = true;
  shadow.appendChild(side);
  const part = (name) => box.querySelector(`[data-part="${name}"]`);
  let parts = {};
  let visible = false;
  let team = null;
  let saved = new Map();
  const club = new Map();
  let tick = null;
  let tickDay = null;
  let spin = null;
  let motion = null;
  let fly = null;
  let lever = 0;
  let toast = { text: '', hot: false };
  let roast = null;
  let speaker = { key: null, since: 0 };
  let armed = false;
  let shownCheck = { list: null, html: null };
  let armTimer = null;
  let fires = [];
  let fireId = null;
  let fireAt = 0;
  let fireStart = 0;

  const setup = () => config();
  const sound = dailySound();
  sound.prefetch();
  const reduced = () => Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const frame = (step) => (window.requestAnimationFrame ? window.requestAnimationFrame(step) : window.setTimeout(step, 16));
  const cancelFrame = (id) => (window.cancelAnimationFrame ? window.cancelAnimationFrame(id) : window.clearTimeout(id));
  const douse = () => {
    if (fireId !== null) cancelFrame(fireId);
    fireId = null;
  };
  const burn = () => {
    fireId = null;
    const now = Date.now();
    if (now - fireAt >= 1000 / DAILY_FIRE.fps) {
      fireAt = now;
      for (const fire of fires) {
        dailyFirePaint(fire.image.data, DAILY_FIRE.width, DAILY_FIRE.height, (now - fireStart) / 1000, fire.seed);
        fire.pen.putImageData(fire.image, 0, 0);
      }
    }
    if (!reduced()) fireId = frame(burn);
  };
  const ignite = () => {
    douse();
    fires = Array.from(box.querySelectorAll('canvas.fire')).map((canvas, index) => {
      const pen = canvas.getContext ? canvas.getContext('2d') : null;
      return pen ? { pen, image: pen.createImageData(DAILY_FIRE.width, DAILY_FIRE.height), seed: index * 7.31 } : null;
    }).filter(Boolean);
    fireAt = 0;
    fireStart = Date.now();
    if (fires.length) burn();
  };
  const field = (name, key) => `daily.${key}.${name}`;
  const read = (name, key = setup().key) => {
    const at = field(name, key);
    if (!saved.has(at)) saved.set(at, store.read(at));
    return saved.get(at);
  };
  const write = (name, value, key = setup().key) => {
    const at = field(name, key);
    saved.set(at, value);
    store.write(at, value);
  };
  const publish = (key = setup().key) => {
    const status = club.get(key) || {};
    if (status.saving) {
      club.set(key, { ...status, again: true });
      return;
    }
    club.set(key, { saving: true });
    share({ people: read('people', key), host: read('host', key) || '' }).then((record) => {
      const again = Boolean((club.get(key) || {}).again);
      club.set(key, { author: record.author, savedAt: record.savedAt });
      if (again) publish(key);
      else {
        write('at', record.savedAt, key);
        write('pending', false, key);
      }
      render();
    }, (error) => {
      club.set(key, { failed: error });
      toast = { text: `Ведущий и список не ушли команде: ${error.message || error} — в этом браузере сохранила, повторю при обновлении`, hot: true };
      render();
    });
  };
  const changed = () => {
    write('at', new Date().toISOString());
    write('pending', true);
    publish();
  };
  const adopt = (record, error) => {
    const cfg = setup();
    if (!cfg) return;
    const key = cfg.key;
    const status = club.get(key) || {};
    if (status.saving) return;
    if (error) club.set(key, { ...status, lost: error });
    else if (record && Date.parse(record.savedAt) >= (Date.parse(read('at', key) || '') || 0)) {
      write('people', record.people, key);
      write('host', record.host, key);
      write('at', record.savedAt, key);
      write('pending', false, key);
      club.set(key, { author: record.author, savedAt: record.savedAt });
    } else if (read('pending', key) === true) publish(key);
    else club.set(key, record ? { author: record.author, savedAt: record.savedAt } : { none: true });
    render();
  };
  const sharedText = () => {
    const status = club.get(setup().key);
    if (!status) return 'Загружаю общие…';
    if (status.saving) return 'Сохраняю для всей команды…';
    if (status.failed) return 'Не ушло команде — повторю при обновлении панели';
    if (status.lost) return 'Общие не загрузились — показываю сохранённое в этом браузере';
    if (status.none) return 'Общих ещё нет — выберите ведущего или сохраните список, и они уйдут всей команде';
    return `Общие для команды · последняя правка: ${status.author ? `${status.author}, ` : ''}${snapshotTime(status.savedAt)}`;
  };
  const view = () => {
    const cfg = setup();
    const list = dailyPeople(read('people'), cfg.people);
    const state = dailyFresh(read('day'), dailyToday(Date.now()));
    const chosen = read('host');
    const host = dailyHost(chosen, list);
    return { state, list, host, chosen: typeof chosen === 'string' ? chosen : '', queue: dailyQueue({ people: list, host, state }) };
  };
  const busy = () => Boolean(spin || motion);
  const pullable = (current) => !busy() && Boolean(current.queue.current || current.queue.waiting.length);
  const grabbable = () => !busy() && (!visible || pullable(view()));

  const mount = () => {
    side.innerHTML = look.lever.html;
    parts = Object.fromEntries(['head', 'arm', 'hub', 'chain', 'weight', 'knob'].map((name) => [name, side.querySelector(`.${name}`)]));
  };

  const place = (p) => {
    lever = p;
    look.lever.place(parts, p);
  };

  const stopMotion = () => {
    if (!motion) return;
    if (motion.frame) cancelFrame(motion.frame);
    window.clearTimeout(motion.hold);
    motion = null;
    side.classList.remove('grab');
  };

  const stopSpin = () => {
    if (!spin) return;
    window.clearInterval(spin.timer);
    window.clearTimeout(spin.stop);
    spin = null;
  };

  const stopFly = () => {
    if (!fly) return;
    window.clearTimeout(fly.timer);
    fly.card.remove();
    fly = null;
  };

  const disarm = () => {
    window.clearTimeout(armTimer);
    armTimer = null;
    armed = false;
  };

  const roastDue = (current) => {
    const who = current.queue.current ? `${team}:${current.queue.current}` : null;
    if (who !== speaker.key) speaker = { key: who, since: Date.now() };
    return Boolean(who) && Date.now() - speaker.since >= DAILY_ROAST_MS;
  };

  const hush = () => {
    speaker = { key: speaker.key, since: Date.now() };
    showRoast(false);
  };

  const showRoast = (due) => {
    if (!due) {
      if (roast) roast.remove();
      roast = null;
      return;
    }
    if (roast) return;
    const still = reduced();
    roast = document.createElement('div');
    roast.className = still ? 'roast still' : 'roast';
    roast.title = 'Нажмите, чтобы закрыть';
    roast.innerHTML = `<b>${DAILY_ROAST}</b>${still ? '' : `<img src="${DAILY_ART}roast.gif" alt="Сурок кричит «${DAILY_ROAST}»" width="220" height="310">`}`;
    roast.addEventListener('click', hush);
    side.appendChild(roast);
  };

  const ratchet = (p) => {
    const tooth = Math.min(DAILY_LEVER.teeth - 1, Math.floor(p * DAILY_LEVER.teeth));
    for (let index = 0; index < Math.min(4, tooth - motion.tooth); index += 1) sound.gear(index * 0.03);
    motion.tooth = tooth;
  };

  const autoSound = () => {
    const { teeth, curve, autoMs } = DAILY_LEVER;
    for (let tooth = 1; tooth < teeth; tooth += 1) sound.gear((Math.pow(tooth / teeth, 1 / curve) * autoMs) / 1000);
    sound.lever(autoMs / 1000);
  };

  const spring = (from) => {
    stopMotion();
    if (reduced()) {
      place(0);
      render();
      return;
    }
    motion = { kind: 'spring', p: from, v: 0, last: Date.now() };
    const step = () => {
      if (!motion || motion.kind !== 'spring') return;
      const now = Date.now();
      const dt = Math.min(0.05, (now - motion.last) / 1000) / 4;
      motion.last = now;
      for (let index = 0; index < 4; index += 1) {
        motion.v += (-DAILY_LEVER.stiff * motion.p - DAILY_LEVER.damp * motion.v) * dt;
        motion.p += motion.v * dt;
      }
      if (motion.p < DAILY_LEVER.floor) {
        motion.p = DAILY_LEVER.floor;
        motion.v = Math.abs(motion.v) * 0.3;
      }
      if (Math.abs(motion.p) < 0.002 && Math.abs(motion.v) < 0.02) {
        motion = null;
        place(0);
        render();
        return;
      }
      place(motion.p);
      motion.frame = frame(step);
    };
    motion.frame = frame(step);
  };

  const autoPull = () => {
    stopMotion();
    autoSound();
    if (reduced()) return;
    const begin = Date.now();
    motion = { kind: 'auto' };
    const step = () => {
      if (!motion || motion.kind !== 'auto') return;
      const late = Date.now() - begin > DAILY_LEVER.autoMs * 3;
      if (late) {
        motion = null;
        place(0);
        render();
        return;
      }
      const t = Math.min(1, (Date.now() - begin) / DAILY_LEVER.autoMs);
      place(Math.pow(t, DAILY_LEVER.curve));
      if (t < 1) {
        motion.frame = frame(step);
        return;
      }
      motion.frame = null;
      motion.hold = window.setTimeout(() => spring(1), DAILY_LEVER.holdMs);
    };
    motion.frame = frame(step);
  };

  const flyOut = () => {
    stopFly();
    const current = view();
    const { queue } = current;
    const card = document.createElement('div');
    card.className = 'fly';
    const { marks, near, far, delay } = look.burst;
    const sparks = reduced() ? '' : marks.map((mark, index) => {
      const angle = (index / marks.length) * Math.PI * 2 + Math.random() * 0.5;
      const reach = near + Math.random() * far;
      return `<i class="spark" style="--dx: ${Math.round(Math.cos(angle) * reach)}px; --dy: ${Math.round(Math.sin(angle) * reach)}px; --r: ${Math.round(Math.random() * 240 - 120)}deg; animation-delay: ${Math.round(Math.random() * delay)}ms">${mark}</i>`;
    }).join('');
    if (queue.current) card.innerHTML = `<small>${current.state.done.length ? 'Говорит' : 'Первым говорит'}</small><b>${escapeHtml(queue.current)}</b>${sparks}`;
    else card.innerHTML = `<b>${queue.finished ? DAILY_FINISH : 'Некому говорить'}</b>${sparks}`;
    side.appendChild(card);
    fly = { card, timer: window.setTimeout(() => {
      card.classList.add('leave');
      fly.timer = window.setTimeout(stopFly, DAILY_LEAVE_MS);
    }, DAILY_FLY_MS) };
  };

  const spinReel = (ms, names) => {
    stopSpin();
    stopFly();
    if (reduced()) {
      render();
      flyOut();
      return;
    }
    let index = 0;
    spin = { timer: window.setInterval(() => {
      const reel = part('reel');
      index += 1;
      if (!reel) return;
      reel.textContent = names.length ? names[index % names.length] : '…';
      reel.className = 'reel-name blur';
    }, DAILY_STEP_MS) };
    spin.stop = window.setTimeout(() => {
      stopSpin();
      render();
      flyOut();
    }, ms);
    render();
  };

  const change = (make) => {
    if (busy()) return;
    const next = make(view());
    if (!next) return;
    toast = { text: '', hot: false };
    write('day', next);
    render();
  };

  const pull = (revealMs) => {
    const current = view();
    const next = dailyPull(current.state, { people: current.list, host: current.host });
    if (!next) return false;
    toast = { text: '', hot: false };
    write('day', next);
    spinReel(revealMs, current.queue.waiting.concat(current.queue.current ? [current.queue.current] : []));
    return true;
  };

  const tell = (revealMs) => {
    if (!setup()) return;
    saved = new Map();
    if (!pull(revealMs)) spinReel(revealMs, []);
  };

  const press = () => {
    if (!grabbable()) return;
    sound.open();
    if (visible && !pull(DAILY_LEVER.autoMs + DAILY_REVEAL_MS)) return;
    if (!visible) tell(DAILY_LEVER.autoMs + DAILY_REVEAL_MS);
    autoPull();
  };

  const grip = (event) => (event.target && event.target.closest ? event.target.closest('.knob') : null);

  const onDown = (event) => {
    const knob = grip(event);
    if (!knob) return;
    if (event.button !== undefined && event.button !== 0) return;
    if (!grabbable()) return;
    event.preventDefault();
    sound.open();
    stopMotion();
    motion = { kind: 'drag', y: event.clientY, tooth: 0, fired: false };
    if (knob.setPointerCapture) knob.setPointerCapture(event.pointerId);
    side.classList.add('grab');
  };

  const onMove = (event) => {
    if (!motion || motion.kind !== 'drag' || motion.fired) return;
    const raw = Math.min(1, Math.max(0, (event.clientY - motion.y) / look.lever.travel));
    const p = Math.pow(raw, DAILY_LEVER.curve);
    ratchet(p);
    place(p);
    if (p < DAILY_LEVER.fire) return;
    motion.fired = true;
    place(1);
    sound.lever();
    if (visible) pull(DAILY_REVEAL_MS);
    else tell(DAILY_REVEAL_MS);
  };

  const onUp = () => {
    if (!motion || motion.kind !== 'drag') return;
    side.classList.remove('grab');
    const fired = motion.fired;
    if (!fired && lever > 0.05) {
      toast = { text: 'Тяните до конца — до щелчка', hot: false };
      render();
    }
    spring(lever);
  };

  const onKey = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!grip(event)) return;
    event.preventDefault();
    press();
  };

  side.addEventListener('pointerdown', onDown);
  side.addEventListener('pointermove', onMove);
  side.addEventListener('pointerup', onUp);
  side.addEventListener('pointercancel', onUp);
  side.addEventListener('lostpointercapture', onUp);
  side.addEventListener('keydown', onKey);

  const hostLine = (current) => {
    const line = part('host');
    let html = '';
    if (current.host && current.state.away[current.host]) html = `Ведущего ${escapeHtml(current.host)} сегодня нет — начинает следующий за ним по кругу`;
    else if (!current.host && current.chosen) html = `Ведущего «${escapeHtml(current.chosen)}» нет в списке — начинает первый по списку`;
    else if (!current.host) html = 'Ведущий не выбран — начинает первый по списку';
    line.hidden = !html;
    line.innerHTML = html;
  };

  const personNote = (status) => ({ done: 'рассказал', now: 'сейчас', away: 'нет сегодня' }[status] || '');

  const personTitle = (status) => {
    if (status === 'away') return 'Нажмите, чтобы вернуть в очередь';
    if (status === 'done') return 'Уже рассказал';
    return 'Нажмите, если человека сегодня нет';
  };

  const editor = (current) => {
    const select = box.querySelector('[data-daily="host"]');
    const area = part('people');
    if (select && shadow.activeElement !== select) {
      const options = [`<option value=""${current.host ? '' : ' selected'}>не выбран</option>`]
        .concat(current.list.map((name) => `<option value="${escapeHtml(name)}"${current.host === name ? ' selected' : ''}>${escapeHtml(name)}</option>`));
      select.innerHTML = options.join('');
    }
    if (area && shadow.activeElement !== area) area.value = current.list.join('\n');
  };

  const paint = () => {
    const row = visible ? part('send') : null;
    if (!row) return;
    const holst = send();
    row.hidden = !holst.on;
    const button = box.querySelector('[data-act="to-holst"]');
    if (button) button.disabled = Boolean(holst.busy);
    const found = check();
    part('check').hidden = !found.count;
    part('check-count').textContent = String(found.count);
    const list = part('check-list');
    if (list !== shownCheck.list || found.html !== shownCheck.html) {
      list.innerHTML = found.html;
      shownCheck = { list, html: found.html };
    }
  };

  const render = () => {
    const cfg = setup();
    tabs.hidden = !cfg;
    tabs.dataset.mode = visible ? 'daily' : 'sprint';
    for (const tab of tabs.querySelectorAll('[role="tab"]')) tab.setAttribute('aria-selected', (tab.dataset.act === 'daily') === visible ? 'true' : 'false');
    const panel = shadow.querySelector('.panel');
    if (panel) panel.classList.toggle('daily-on', visible);
    box.hidden = !visible;
    side.hidden = false;
    if (!visible || !cfg) {
      side.classList.remove('locked', 'ready');
      showRoast(false);
      return;
    }
    const current = view();
    const { queue } = current;
    const can = pullable(current);
    for (const button of box.querySelectorAll('.tools button')) button.disabled = busy();
    side.classList.toggle('locked', !can && !busy());
    side.classList.toggle('ready', can);
    const reset = box.querySelector('[data-daily="reset"]');
    reset.disabled = busy() || !(current.state.done.length || current.state.current);
    reset.classList.toggle('armed', armed);
    reset.textContent = armed ? 'Точно сбросить?' : 'Сбросить очередь';
    showRoast(roastDue(current));
    paint();
    part('shared').textContent = sharedText();
    if (spin) return;
    hostLine(current);
    const reel = part('reel');
    if (queue.current || queue.finished) {
      reel.className = 'reel-name';
      reel.textContent = queue.current || DAILY_FINISH;
    } else {
      reel.className = 'reel-name idle';
      reel.textContent = queue.waiting.length ? 'Дёрните рычаг' : 'Некому говорить';
    }
    const toastBox = part('toast');
    toastBox.className = toast.hot ? 'toast hot' : 'toast';
    toastBox.textContent = toast.text;
    const items = queue.done.map((name) => ({ name, status: 'done' }))
      .concat(queue.current ? [{ name: queue.current, status: 'now' }] : [])
      .concat(queue.waiting.map((name) => ({ name, status: 'wait' })))
      .concat(queue.away.filter((name) => !queue.done.includes(name)).map((name) => ({ name, status: 'away' })));
    const editable = !busy();
    part('queue').innerHTML = items.map((item) => `<button type="button" class="person ${item.status}" data-daily="person" data-name="${escapeHtml(item.name)}" title="${escapeHtml(personTitle(item.status))}"${item.status === 'done' || !editable ? ' disabled' : ''}><span>${item.name === current.host ? '<i class="crown" title="Ведущий">♛</i> ' : ''}${escapeHtml(item.name)}</span><small>${escapeHtml(personNote(item.status))}</small></button>`).join('');
    editor(current);
  };

  const onClick = (event) => {
    const button = event.target.closest('[data-daily]');
    if (!button || button.disabled) return;
    const act = button.dataset.daily;
    if (act === 'undo') change((current) => dailyUndo(current.state));
    if (act === 'reset' && !armed) {
      armed = true;
      window.clearTimeout(armTimer);
      armTimer = window.setTimeout(() => {
        disarm();
        render();
      }, DAILY_ARM_MS);
      render();
    } else if (act === 'reset') {
      disarm();
      change((current) => dailyReset(current.state));
    }
    if (act === 'person') change((current) => dailyToggleAway(current.state, button.dataset.name));
    if (act === 'people-save') {
      const list = dailyParsePeople(part('people').value);
      if (list.length) write('people', list);
      toast = list.length ? { text: 'Сохранила список для всей команды', hot: false } : { text: 'Список пуст — не сохранила', hot: true };
      if (list.length) changed();
      render();
    }
    if (act === 'people-default') {
      write('people', null);
      toast = { text: 'Вернула список по умолчанию для всей команды', hot: false };
      changed();
      render();
    }
  };

  const onSelect = (event) => {
    if (event.target.dataset.daily !== 'host') return;
    write('host', event.target.value);
    changed();
    render();
  };

  box.addEventListener('click', onClick);
  box.addEventListener('change', onSelect);

  const onTick = () => {
    if (!visible) return;
    const today = dailyToday(Date.now());
    const fresh = today !== tickDay;
    tickDay = today;
    if (busy()) return;
    if (fresh || roastDue(view()) !== Boolean(roast)) render();
  };

  const start = () => {
    const cfg = setup();
    if (!cfg) return;
    visible = true;
    team = cfg.key;
    saved = new Map();
    speaker = { key: null, since: 0 };
    disarm();
    tickDay = dailyToday(Date.now());
    toast = { text: '', hot: false };
    box.innerHTML = dailyHtml(look);
    place(0);
    window.clearInterval(tick);
    tick = window.setInterval(onTick, DAILY_TICK_MS);
    render();
    ignite();
  };

  const stop = () => {
    visible = false;
    window.clearInterval(tick);
    tick = null;
    stopMotion();
    stopSpin();
    stopFly();
    disarm();
    douse();
    fires = [];
    side.classList.remove('grab');
    box.innerHTML = '';
    render();
  };

  const show = (on) => {
    if (on && !visible) start();
    if (!on && visible) stop();
  };

  const skin = (name) => {
    if (!known(name) || DAILY_SKINS[name] === look) return;
    look = DAILY_SKINS[name];
    style.textContent = DAILY_CSS + look.css;
    stopMotion();
    stopFly();
    showRoast(false);
    mount();
    place(0);
    if (!visible) {
      render();
      return;
    }
    const open = ['line', 'edit'].map((section) => Boolean(part(section) && part(section).open));
    const draft = part('people') ? part('people').value : null;
    douse();
    box.innerHTML = dailyHtml(look);
    ['line', 'edit'].forEach((section, index) => {
      if (part(section)) part(section).open = open[index];
    });
    render();
    if (typeof draft === 'string' && part('people')) part('people').value = draft;
    ignite();
  };

  const sync = () => {
    const cfg = setup();
    if (visible && !cfg) stop();
    else if (visible && cfg.key !== team) {
      stopMotion();
      stopSpin();
      stopFly();
      disarm();
      team = cfg.key;
      toast = { text: '', hot: false };
      place(0);
    }
    render();
  };

  mount();
  place(0);
  render();
  return { show, stop, sync, skin, paint, adopt };
}
