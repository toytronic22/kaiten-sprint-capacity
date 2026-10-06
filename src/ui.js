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
.geese { position: fixed; inset: 0; z-index: 2147483001; overflow: hidden; cursor: pointer; background: #0b0c0e; --bang: 9.2s; animation: noir-in .6s ease-out both, noir-out .8s ease-in var(--end, 11.6s) forwards; }
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
.geese .lf-led { opacity: 0; animation: lf-on .01s linear var(--d) forwards; }
.geese .lf text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
.geese .lf-led text { font-family: "Courier New", monospace; font-weight: 700; text-anchor: middle; }
.geese .lf-blink { animation: lf-blink .5s steps(1, end) infinite; }
.geese .lf-in { animation: lf-in .32s ease-out var(--d) both; }
.geese .lf-bent .sg-neck { transform: rotate(-38deg); }
.geese .lf-tug { animation: lf-tug .12s ease-in 5.3s both; }
.geese .lf-walk { animation: lf-walk 1s linear var(--d) both; }
.geese .lf-bob { animation: lf-bob .25s ease-in-out infinite alternate; }
.geese .lf-walk .sg-leg, .geese .lf-ga .sg-leg { animation: lf-step .25s ease-in-out infinite alternate; }
.geese .lf-walk .sg-alt, .geese .lf-ga .sg-alt { animation-direction: alternate-reverse; }
.geese .lf-ga .sg-leg { animation-duration: .1s; }
.geese .lf-gate { animation: lf-gate 1.3s ease-in-out 4.3s both; }
.geese .lf-tail { animation: lf-tail .1s linear 5.3s both; }
.geese .lf-ga { animation: lf-ga 1s linear 5.6s both; }
.geese .lf-gb { animation: lf-gb 1s ease-out 6.55s both; }
.geese .lf-gc { animation: lf-gc 3.3s linear 7.2s both; }
.geese .lf-gc .sg-neck { animation: lf-peek 1s ease-in-out 9.1s both; }
.geese .lf-gc .sg-wing { animation: lf-shrug .5s ease-in-out 9.55s both, lf-reach .35s ease-out 10.12s forwards; }
.geese .lf-gc .lf-run { animation: lf-tilt .5s ease-in-out 9.55s both; }
.geese .lf-crowd { animation: lf-jostle .09s linear 6.75s 5; }
.geese .lf-crowd .sg-eye { animation: lf-wide .2s ease-out 7.95s both; }
.geese .lf-rope { animation: lf-rope .5s cubic-bezier(.1, .8, .3, 1) 8s both; }
.geese .lf-cab { animation: lf-fall .6s cubic-bezier(.55, 0, 1, .45) 8.05s both; }
.geese .lf-spark { opacity: 0; animation: lf-spark .35s ease-out 8s; }
.geese .lf-zing { opacity: 0; animation: lf-flash .9s ease-out 8s; }
.geese .lf-speed { opacity: 0; animation: lf-speed .7s linear 8.05s; }
.geese .lf-whee { opacity: 0; animation: lf-flash 1s ease-in 8.1s; }
.geese .lf-lit { opacity: 0; animation: lf-on .01s linear 10.3s forwards; }
.geese .lf-boom { opacity: 0; animation: lf-flash 1.2s ease-out 10.45s; }
.geese .lf-cam { animation: lf-shake .35s linear 10.45s both; }
.geese .lf-zoom { animation: lf-zoom .6s ease-in-out 10.6s both; }
.geese .lf-vig { background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0, 0, 0, .35)); }
@keyframes lf-on { to { opacity: 1; } }
@keyframes lf-blink { 50% { opacity: .15; } }
@keyframes lf-in { from { opacity: 0; transform: scale(.6, .6); } 60% { opacity: 1; transform: scale(1.1, .92); } to { opacity: 1; transform: scale(1, 1); } }
@keyframes lf-tug { to { transform: translate(36px, 0px); } }
@keyframes lf-walk { 0% { opacity: 1; transform: translate(-320px, 0px) scale(1, 1); } 85% { opacity: 1; transform: translate(820px, 0px) scale(1, 1); } 100% { opacity: 0; transform: translate(900px, -50px) scale(.8, .8); } }
@keyframes lf-bob { to { transform: translateY(-9px); } }
@keyframes lf-step { from { transform: rotate(-24deg); } to { transform: rotate(24deg); } }
@keyframes lf-gate { 0% { transform: scale(.08, 1); } 35% { transform: scale(.9, 1); } 45% { transform: scale(.865, 1); } 52% { transform: scale(.9, 1); } 60% { transform: scale(.86, 1); } 68% { transform: scale(.9, 1); } 80% { transform: scale(.9, 1); } 92% { transform: scale(1, 1); } 96% { transform: scale(.985, 1); } 100% { transform: scale(1, 1); } }
@keyframes lf-tail { 0% { opacity: 1; transform: translate(0px, 0px); } 100% { opacity: 0; transform: translate(30px, 0px); } }
@keyframes lf-ga { 0% { opacity: 1; transform: translate(-80px, 852px) scale(.38, .38); } 65% { opacity: 1; transform: translate(600px, 852px) scale(.38, .38); } 95% { opacity: 1; transform: translate(650px, 812px) scale(.08, .38); } 100% { opacity: 0; transform: translate(655px, 810px) scale(.08, .38); } }
@keyframes lf-gb { 0% { opacity: 0; transform: translate(660px, 804px) scale(.08, .38); } 2% { opacity: 1; transform: translate(660px, 804px) scale(.08, .38); } 20% { opacity: 1; transform: translate(700px, 800px) scale(.43, .33); } 30% { opacity: 1; transform: translate(700px, 800px) scale(.35, .41); } 40% { opacity: 1; transform: translate(700px, 800px) scale(.38, .38); } 64% { opacity: 1; transform: translate(690px, 800px) scale(.25, .43); } 65% { opacity: 0; transform: translate(690px, 800px) scale(.25, .43); } 100% { opacity: 0; transform: translate(690px, 800px) scale(.25, .43); } }
@keyframes lf-gc {
  0% { opacity: 0; transform: translate(655px, 812px) rotate(0deg) scale(.08, .38); }
  1.5% { opacity: 1; transform: translate(650px, 800px) rotate(0deg) scale(.12, .38); }
  8% { opacity: 1; transform: translate(590px, 690px) rotate(-150deg) scale(.38, .38); }
  15% { opacity: 1; transform: translate(500px, 790px) rotate(-330deg) scale(.38, .38); }
  19.5% { opacity: 1; transform: translate(470px, 852px) rotate(-360deg) scale(.5, .27); }
  24% { opacity: 1; transform: translate(470px, 852px) rotate(-360deg) scale(.38, .38); }
  27% { opacity: 1; transform: translate(470px, 836px) rotate(-360deg) scale(.38, .38); }
  30% { opacity: 1; transform: translate(470px, 852px) rotate(-360deg) scale(.38, .38); }
  45% { opacity: 1; transform: translate(470px, 852px) rotate(-360deg) scale(.38, .38); }
  57.5% { opacity: 1; transform: translate(600px, 852px) rotate(-360deg) scale(.38, .38); }
  83% { opacity: 1; transform: translate(600px, 852px) rotate(-360deg) scale(.38, .38); }
  86% { opacity: 1; transform: translate(600px, 852px) rotate(-360deg) scale(-.38, .38); }
  91% { opacity: 1; transform: translate(600px, 852px) rotate(-360deg) scale(-.38, .38); }
  95.5% { opacity: 1; transform: translate(600px, 781px) rotate(-360deg) scale(-.38, .38); }
  100% { opacity: 1; transform: translate(600px, 852px) rotate(-360deg) scale(-.38, .38); }
}
@keyframes lf-peek { 0% { transform: rotate(0deg); } 30% { transform: rotate(40deg); } 75% { transform: rotate(40deg); } 100% { transform: rotate(0deg); } }
@keyframes lf-shrug { 0% { transform: rotate(0deg); } 40% { transform: rotate(55deg); } 70% { transform: rotate(55deg); } 100% { transform: rotate(0deg); } }
@keyframes lf-reach { 0% { transform: rotate(0deg); } 60% { transform: rotate(110deg); } 100% { transform: rotate(20deg); } }
@keyframes lf-tilt { 0% { transform: translateY(0px) rotate(0deg); } 40% { transform: translateY(-10px) rotate(-6deg); } 70% { transform: translateY(-10px) rotate(-6deg); } 100% { transform: translateY(0px) rotate(0deg); } }
@keyframes lf-jostle { 0%, 100% { transform: translate(0px, 0px); } 25% { transform: translate(-4px, 1px); } 75% { transform: translate(4px, -1px); } }
@keyframes lf-wide { to { transform: scale(1.9, 1.9); } }
@keyframes lf-rope { to { transform: translateY(-300px); } }
@keyframes lf-fall { to { transform: translateY(1150px); } }
@keyframes lf-spark { from { opacity: 1; transform: translate(800px, 266px) scale(.4, .4); } to { opacity: 0; transform: translate(800px, 266px) scale(1.6, 1.6); } }
@keyframes lf-flash { 0% { opacity: 0; } 10% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
@keyframes lf-speed { 0% { opacity: 0; transform: translateY(0px); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-160px); } }
@keyframes lf-shake { 0%, 100% { transform: translate(0px, 0px); } 20% { transform: translate(-5px, 3px); } 45% { transform: translate(4px, -3px); } 70% { transform: translate(-2px, 2px); } }
@keyframes lf-zoom { from { transform: translate(800px, 157px) scale(1, 1) translate(-800px, -157px); } to { transform: translate(800px, 300px) scale(2.4, 2.4) translate(-800px, -157px); } }
.geese .wl text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
.geese .wl-zoom { animation: wl-zoom 10.6s linear both; }
.geese .wl-cam { animation: wl-shake .45s linear 5.85s both; }
.geese .wl-arm { animation: wl-arm 10.6s linear both; }
.geese .wl-bar { animation: wl-bar 10.6s linear both; }
.geese .wl-squash { animation: wl-squash 10.6s linear both; }
.geese .wl-leg { animation: wl-leg 10.6s linear both; }
.geese .wl-eye { animation: wl-eye 10.6s linear both; }
.geese .wl-sag { animation: wl-sag 2s linear 3.6s both, wl-flat .12s ease-out 5.78s forwards; }
.geese .wl-tremble { animation: wl-tremble .07s linear 3.9s 24 alternate both; }
.geese .wl-red { opacity: 0; animation: wl-red 1.8s ease-in 3.7s forwards; }
.geese .wl-sweat { opacity: 0; animation: wl-sweat .55s ease-in 4.1s 3 forwards; }
.geese .wl-chalk { opacity: 0; transform-box: fill-box; transform-origin: center; animation: wl-chalk .35s ease-out .85s 3; }
.geese .wl-feather { opacity: 0; animation: wl-feather 1s ease-out 3.65s forwards; }
.geese .wl-drift { opacity: 0; animation: wl-drift 3.4s ease-in-out var(--d) forwards; }
.geese .wl-flash { opacity: 0; transform-box: fill-box; transform-origin: center; animation: wl-flash .25s ease-out var(--d) forwards; }
.geese .wl-hey { opacity: 0; transform-box: fill-box; transform-origin: center; animation: wl-pop 1s ease-out 3.68s forwards; }
.geese .wl-bang { opacity: 0; transform-box: fill-box; transform-origin: center; animation: wl-bang 1s ease-out 5.86s forwards; }
.geese .wl-crack { opacity: 0; animation: wl-on .01s linear 5.86s forwards; }
.geese .wl-dust { opacity: 0; animation: wl-dust 1s ease-out 5.86s forwards; }
.geese .wl-peek { opacity: 0; animation: wl-peek .3s ease-out 6.45s forwards; }
.geese .wl-orbit { animation: wl-orbit 1.1s linear 6.5s infinite; }
.geese .wl-blink { animation: wl-blink 1.3s linear 7.2s 2; }
.geese .wl-wave { opacity: 0; animation: wl-on .01s linear 6s forwards, wl-wave .45s ease-in-out 9s 4 alternate; }
.geese .wl-judge { animation: wl-judge .4s ease-out var(--d) both; }
.geese .wl-card { animation: wl-card .45s cubic-bezier(.3, 1.5, .6, 1) var(--d) both; }
.geese .wl-live, .geese .wl-third { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
.geese .wl-live { inset: 3% auto auto 3%; height: fit-content; width: fit-content; padding: .3em .7em; border-radius: 4px; background: rgba(0, 0, 0, .55); color: #fff; font-size: clamp(12px, 1.6vw, 22px); font-weight: 700; letter-spacing: .08em; }
.geese .wl-live b { color: #ff3b2f; animation: lf-blink 1s steps(1, end) infinite; }
.geese .wl-third { inset: auto auto 3% 3%; height: fit-content; width: fit-content; max-width: 70%; display: flex; flex-direction: column; padding: .45em 1.1em .5em .9em; border-left: .4em solid #2f62c9; background: rgba(255, 255, 255, .94); color: #111; font-size: clamp(14px, 2.2vw, 32px); opacity: 0; animation: wl-third 5s ease-out .5s both; }
.geese .wl-third b { font-size: 1.2em; font-weight: 900; }
.geese .wl-third span { font-size: .72em; color: #3a4252; }
@keyframes wl-on { to { opacity: 1; } }
@keyframes wl-zoom {
  0%, 33.96% { transform: translate(800px, 450px) scale(1) translate(-800px, -450px); }
  36.8% { transform: translate(800px, 450px) scale(1.12) translate(-800px, -410px); }
  52.83% { transform: translate(800px, 450px) scale(1.2) translate(-800px, -410px); }
  55.19%, 86.8% { transform: translate(800px, 450px) scale(1) translate(-800px, -450px); }
  95.3%, 100% { transform: translate(800px, 450px) scale(1.9) translate(-800px, -650px); }
}
@keyframes wl-shake {
  0% { transform: translate(0, 0); } 15% { transform: translate(-14px, 10px); } 30% { transform: translate(12px, -8px); }
  45% { transform: translate(-8px, 6px); } 60% { transform: translate(6px, -4px); } 80% { transform: translate(-3px, 2px); } 100% { transform: translate(0, 0); }
}
@keyframes wl-arm {
  0%, 6.6% { transform: rotate(8deg); }
  8.02% { transform: rotate(36deg); } 9.62% { transform: rotate(10deg); }
  11.32% { transform: rotate(36deg); } 12.92% { transform: rotate(10deg); }
  14.62% { transform: rotate(36deg); } 16.23% { transform: rotate(8deg); }
  22.64% { transform: rotate(8deg); }
  24.53%, 33.96% { transform: rotate(-25deg); }
  35.66%, 52.83% { transform: rotate(-160deg); }
  55.19%, 100% { transform: rotate(24deg); }
}
@keyframes wl-bar {
  0%, 33.96% { transform: translateY(0) rotate(0); }
  35.66% { transform: translateY(-272px) rotate(0); }
  36.32% { transform: translateY(-258px) rotate(0); }
  37.26% { transform: translateY(-268px) rotate(0); }
  44% { transform: translateY(-264px) rotate(-2deg); }
  48% { transform: translateY(-262px) rotate(2.5deg); }
  52.83% { transform: translateY(-255px) rotate(-1deg); }
  55.19% { transform: translateY(50px) rotate(0); }
  55.85% { transform: translateY(34px) rotate(0); }
  56.6%, 100% { transform: translateY(50px) rotate(0); }
}
@keyframes wl-squash {
  0%, 22.64% { transform: scale(1, 1); }
  24.53%, 33.02% { transform: scale(1.03, .92); }
  34.15% { transform: scale(.96, 1.06); }
  36.32% { transform: scale(1.05, .95); }
  37.74% { transform: scale(1, 1); }
  47.17% { transform: scale(1.02, .97); }
  52.83% { transform: scale(1.04, .93); }
  55.19% { transform: scale(1.7, .13); }
  56.13% { transform: scale(1.6, .17); }
  57.08%, 100% { transform: scale(1.7, .13); }
}
@keyframes wl-leg {
  0%, 33.96% { transform: rotate(0); }
  35.38%, 52.83% { transform: rotate(-26deg); }
  55.19%, 100% { transform: rotate(-80deg); }
}
@keyframes wl-eye {
  0%, 33.96% { transform: scale(1); }
  35.1% { transform: scale(2.1); }
  36.3% { transform: scale(1.7); }
  40%, 44%, 48% { transform: scale(1.85); }
  42%, 46%, 50% { transform: scale(1.65); }
  52.83%, 100% { transform: scale(2); }
}
@keyframes wl-sag {
  0% { transform: rotate(0); } 8% { transform: rotate(8deg); } 16% { transform: rotate(-3deg); }
  24% { transform: rotate(4deg); } 32% { transform: rotate(2deg); } 100% { transform: rotate(10deg); }
}
@keyframes wl-flat { to { transform: rotate(0); } }
@keyframes wl-tremble { from { transform: translate(-3px, 0); } to { transform: translate(3px, 1px); } }
@keyframes wl-red { to { opacity: .85; } }
@keyframes wl-sweat { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(34px); } }
@keyframes wl-chalk { 0% { opacity: .95; transform: scale(.2); } 100% { opacity: 0; transform: scale(1.6); } }
@keyframes wl-feather {
  0% { opacity: 0; transform: translate(0, 0) rotate(0) scale(.3); }
  10% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--r)) scale(1.1); }
}
@keyframes wl-drift {
  0% { opacity: 0; transform: translate(0, -220px) rotate(-30deg); }
  15% { opacity: 1; }
  40% { transform: translate(30px, -120px) rotate(25deg); }
  70% { transform: translate(-25px, -30px) rotate(-20deg); }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translate(10px, 20px) rotate(10deg); }
}
@keyframes wl-flash { 0% { opacity: 0; transform: scale(.2); } 30% { opacity: 1; transform: scale(1.6); } 100% { opacity: 0; transform: scale(.4); } }
@keyframes wl-pop {
  0% { opacity: 0; transform: rotate(-8deg) scale(.2); } 15% { opacity: 1; transform: rotate(-8deg) scale(1.25); }
  25% { transform: rotate(-8deg) scale(1); } 75% { opacity: 1; transform: rotate(-8deg) scale(1.05); } 100% { opacity: 0; transform: rotate(-8deg) scale(1.1); }
}
@keyframes wl-bang {
  0% { opacity: 0; transform: rotate(4deg) scale(.2); } 12% { opacity: 1; transform: rotate(4deg) scale(1.3); }
  22% { transform: rotate(4deg) scale(1); } 75% { opacity: 1; transform: rotate(4deg) scale(1.05); } 100% { opacity: 0; transform: rotate(4deg) scale(1.1); }
}
@keyframes wl-dust { 0% { opacity: .95; transform: scale(.4, .6); } 100% { opacity: 0; transform: scale(1.6, 1.8); } }
@keyframes wl-peek { 0% { opacity: 1; transform: translateY(40px) scaleY(.2); } 70% { opacity: 1; transform: translateY(-6px) scaleY(1.1); } 100% { opacity: 1; transform: translateY(0) scaleY(1); } }
@keyframes wl-orbit { to { transform: rotate(360deg); } }
@keyframes wl-blink { 0%, 86% { transform: scaleY(1); } 92% { transform: scaleY(.1); } 100% { transform: scaleY(1); } }
@keyframes wl-wave { from { transform: rotate(0); } to { transform: rotate(-30deg); } }
@keyframes wl-judge { from { transform: translateY(260px); } to { transform: translateY(0); } }
@keyframes wl-card { from { transform: translateY(440px); } to { transform: translateY(0); } }
@keyframes wl-third { 0% { opacity: 0; transform: translateX(-40px); } 8%, 90% { opacity: 1; transform: translateX(0); } 100% { opacity: 0; transform: translateX(0); } }
.geese .rk-sky { background: linear-gradient(#060a1c, #18203f 62%, #3b3558); }
.geese .rk text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
.geese .rk-wide { animation: rk-push 3.3s ease-in both, rk-off .01s linear 3.3s forwards; }
.geese .rk-rumble { animation: rk-jitter .06s linear 1.9s infinite alternate; }
.geese .rk-steam { animation: rk-steam 1.4s ease-out 2.1s both; }
.geese .rk-flame { opacity: 0; animation: rk-on .01s linear 2.5s forwards, rk-flick .08s linear 2.5s infinite alternate; }
.geese .rk-lift { animation: rk-lift .75s cubic-bezier(.55, 0, .9, .45) 2.65s both; }
.geese .rk-close { opacity: 0; animation: rk-on .01s linear 3.3s forwards, rk-zoom 10.8s linear both; }
.geese .rk-rig { animation: rk-jitter2 .07s linear 3.3s 41 alternate, rk-bounce .55s ease-out 6.22s forwards; }
.geese .rk-cabin { animation: rk-away .7s cubic-bezier(.5, 0, .9, .5) 6.2s forwards; }
.geese .rk-column { opacity: 0; transform-box: fill-box; transform-origin: 50% 100%; animation: rk-column 1.1s ease-out 6.3s forwards; }
.geese .rk-trail { animation: rk-trail 1.5s cubic-bezier(.45, 0, .9, .6) 6.75s both; }
.geese .rk-sparks { opacity: 0; animation: rk-spark .2s steps(1, end) 6.25s 12; }
.geese .rk-wire { opacity: 0; animation: rk-on .01s linear 6.25s forwards; }
.geese .rk-streak { animation: rk-streak .14s linear 3.3s infinite; }
.geese .rk-lamp { animation: rk-blink .6s steps(1, end) var(--d) infinite; }
.geese .rk-blink { animation: rk-blink .5s steps(1, end) infinite; }
.geese .rk-stretch { animation: rk-stretch 10.8s linear both; }
.geese .rk-jaw { animation: rk-flap .06s linear 3.5s 44 alternate, rk-gape .3s ease-out 6.3s forwards, rk-shut .2s ease-in 7.75s forwards; }
.geese .rk-eye { animation: rk-wink .3s ease-in-out 8.55s both; }
.geese .rk-ripple { opacity: 0; animation: rk-on .01s linear 3.6s forwards, rk-wobble .05s linear 3.6s infinite alternate, rk-off .01s linear 7.6s forwards; }
.geese .rk-fish { animation: rk-fish 10.8s linear both; }
.geese .rk-wing { animation: rk-wing 10.8s linear both; }
.geese .rk-rrr, .geese .rk-crack { opacity: 0; transform-box: fill-box; transform-origin: center; }
.geese .rk-rrr { animation: rk-on .01s linear 3.4s forwards, rk-shiver .07s linear 3.4s 40 alternate, rk-off .01s linear 6.2s forwards; }
.geese .rk-crack { animation: rk-text 1.2s ease-out 6.2s forwards; }
.geese .rk-hud, .geese .rk-count, .geese .rk-g, .geese .rk-sub { height: fit-content; width: fit-content; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
.geese .rk-hud { inset: 3% auto auto 3%; padding: .3em .7em; border: 2px solid #5fe08a; background: rgba(0, 0, 0, .55); color: #5fe08a; font: 700 clamp(12px, 1.6vw, 22px) "Courier New", monospace; letter-spacing: .1em; }
.geese .rk-count { inset: 0; margin: auto; color: #fff; font-size: clamp(64px, 15vw, 220px); font-weight: 900; text-shadow: 0 0 .25em #5fb2e6; opacity: 0; animation: rk-pop .7s ease-out var(--d) both; }
.geese .rk-go { font-size: clamp(40px, 9vw, 130px); color: #ffd23a; text-shadow: 0 0 .25em #ff8a2a; }
.geese .rk-g { inset: 5% 0 auto 0; margin: 0 auto; padding: .2em .8em; border: 3px solid #ff3b2f; background: rgba(30, 0, 0, .65); color: #ffd23a; font: 900 clamp(16px, 3vw, 44px) "Courier New", monospace; opacity: 0; animation: rk-on .01s linear var(--d) forwards, rk-off .01s linear var(--e) forwards; }
.geese .rk-g b { color: #ff3b2f; animation: rk-blink .4s steps(1, end) infinite; }
.geese .rk-over { inset: auto 0 7% 0; font-size: clamp(18px, 3.6vw, 52px); }
.geese .rk-sub { inset: auto 0 7% 0; margin: 0 auto; padding: .3em .8em; background: rgba(0, 0, 0, .72); color: #fff; font-size: clamp(14px, 2.3vw, 32px); opacity: 0; animation: rk-on .01s linear var(--d) forwards, rk-off .01s linear var(--e) forwards; }
@keyframes rk-on { to { opacity: 1; } }
@keyframes rk-off { to { opacity: 0; } }
@keyframes rk-blink { 0% { opacity: 1; } 50% { opacity: .2; } }
@keyframes rk-spark { 0% { opacity: 1; } 50% { opacity: 0; } }
@keyframes rk-push { from { transform: translate(800px, 450px) scale(1) translate(-800px, -450px); } to { transform: translate(800px, 450px) scale(1.12) translate(-800px, -470px); } }
@keyframes rk-jitter { from { transform: translateX(-3px); } to { transform: translateX(3px); } }
@keyframes rk-jitter2 { from { transform: translate(-4px, 2px); } to { transform: translate(4px, -2px); } }
@keyframes rk-steam { from { transform: scale(0); opacity: 1; } to { transform: scale(1.7); opacity: .9; } }
@keyframes rk-flick { from { transform: scale(.9, .8); } to { transform: scale(1.1, 1.2); } }
@keyframes rk-lift { from { transform: translateY(0); } to { transform: translateY(-1300px); } }
@keyframes rk-bounce { 0% { transform: translate(0, 0); } 30% { transform: translate(0, -46px); } 60% { transform: translate(0, 0); } 80% { transform: translate(0, -10px); } 100% { transform: translate(0, 0); } }
@keyframes rk-away { from { transform: translateY(0); } to { transform: translateY(-1150px); } }
@keyframes rk-column { from { opacity: 1; transform: scaleY(0); } to { opacity: 1; transform: scaleY(1); } }
@keyframes rk-trail { from { transform: translateY(-260px); } to { transform: translateY(-1500px); } }
@keyframes rk-streak { from { transform: translateX(70px); } to { transform: translateX(-70px); } }
@keyframes rk-stretch {
  0%, 31.48% { transform: scale(1, 1); }
  34.26% { transform: scale(1.72, .86); }
  40% { transform: scale(1.64, .88); }
  46% { transform: scale(1.74, .85); }
  52% { transform: scale(1.65, .88); }
  57.41%, 70.37% { transform: scale(1.7, .86); }
  73.15% { transform: scale(.86, 1.07); }
  75.46% { transform: scale(1.1, .96); }
  77.78% { transform: scale(.96, 1.02); }
  79.63%, 100% { transform: scale(1, 1); }
}
@keyframes rk-flap { from { transform: rotate(0deg); } to { transform: rotate(24deg); } }
@keyframes rk-gape { from { transform: rotate(0deg); } to { transform: rotate(16deg); } }
@keyframes rk-shut { from { transform: rotate(16deg); } to { transform: rotate(0deg); } }
@keyframes rk-wink { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(.1); } }
@keyframes rk-wobble { from { transform: translate(-3px, 1px); } to { transform: translate(3px, -1px); } }
@keyframes rk-fish {
  0%, 31.48% { transform: translate(0px, 0px) rotate(0deg) scale(1, 1); }
  10% { transform: translate(-90px, 30px) rotate(12deg) scale(1, 1); }
  21% { transform: translate(-30px, 14px) rotate(-8deg) scale(1, 1); }
  34.26%, 70.37% { transform: translate(-250px, 40px) rotate(-30deg) scale(.6, 1.25); }
  75% { transform: translate(-90px, 50px) rotate(160deg) scale(1, 1); }
  81.48%, 100% { transform: translate(0px, 0px) rotate(0deg) scale(1, 1); }
}
@keyframes rk-wing {
  0%, 81.48% { transform: rotate(0deg); }
  83.8% { transform: rotate(106deg); }
  85.2% { transform: rotate(97deg); }
  86.6% { transform: rotate(103deg); }
  100% { transform: rotate(100deg); }
}
@keyframes rk-shiver { from { transform: translate(-5px, 2px) rotate(-2deg); } to { transform: translate(5px, -2px) rotate(2deg); } }
@keyframes rk-text { 0% { opacity: 1; transform: scale(.3) rotate(-14deg); } 18% { opacity: 1; transform: scale(1.15) rotate(-8deg); } 80% { opacity: 1; transform: scale(1) rotate(-8deg); } 100% { opacity: 0; transform: scale(1) rotate(-8deg); } }
@keyframes rk-pop { 0% { opacity: 0; transform: scale(1.8); } 18% { opacity: 1; transform: scale(1); } 80% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(.9); } }
@keyframes rk-zoom {
  0%, 87.04% { transform: translate(800px, 450px) scale(1) translate(-800px, -450px); }
  94.44%, 100% { transform: translate(800px, 450px) scale(1.35) translate(-800px, -430px); }
}
.geese .nt text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
.geese .nt-fly { animation: nt-fly 11s ease-in-out both; }
.geese .nt-flap { transform-box: fill-box; transform-origin: center; animation: nt-flutter .12s linear infinite alternate; }
.geese .nt-goose { animation: nt-walk 11s linear both, nt-gcarry 1.2s cubic-bezier(.4, 0, .8, .6) 7.8s forwards; }
.geese .nt-shadow { animation: nt-off .01s linear 7.8s forwards; }
.geese .nt-hop { animation: nt-hop .38s 5.1s 5; }
.geese .nt-load { animation: nt-load 11s ease-in-out both; }
.geese .nt-stack { animation: nt-off .01s linear 7.8s forwards; }
.geese .nt-sway { animation: nt-sway 11s ease-in-out both; }
.geese .nt-card { opacity: 0; animation: nt-on .01s linear var(--d) forwards, nt-drop .3s cubic-bezier(.5, 0, 1, .5) var(--d) both; }
.geese .nt-goose .sg-leg { animation: nt-step .25s ease-in-out 9 alternate, nt-step .35s ease-in-out 2.75s 6 alternate, nt-step .09s linear 7.8s infinite alternate; }
.geese .nt-goose .sg-alt, .geese .nt-lead .sg-alt { animation-direction: alternate-reverse; }
.geese .nt-goose .sg-neck { animation: nt-neck 11s ease-in-out both; }
.geese .nt-goose .sg-wing { animation: nt-wave .19s ease-in-out 5.1s 10 alternate, nt-wave .07s linear 7.8s infinite alternate; }
.geese .nt-goose .sg-eye { animation: nt-wide .2s ease-out 7.8s both; }
.geese .nt-leaf { opacity: 0; animation: nt-on .01s linear 7.8s forwards, nt-scatter 1.7s ease-out 7.8s both; }
.geese .nt-eagle { animation: nt-dive .9s cubic-bezier(.5, 0, .9, .6) 6.9s both, nt-ecarry 1.2s cubic-bezier(.4, 0, .8, .6) 7.8s forwards; }
.geese .nt-eagle .nt-wing { animation: nt-beat .16s ease-in-out infinite alternate; }
.geese .nt-tag { animation: nt-tag .3s ease-in-out infinite alternate; }
.geese .nt-lead { animation: nt-lwalk 11s linear both; }
.geese .nt-lead .sg-leg { animation: nt-step .175s ease-in-out 4.6s 4 alternate; }
.geese .nt-lead .sg-neck { animation: nt-nod .5s ease-in-out 5.5s 4 alternate, nt-tilt .7s ease-in-out 8.7s forwards; }
.geese .nt-lead .sg-wing { animation: nt-shrug .7s ease-in-out 8.7s both; }
.geese .nt-bar { inset: 0 0 auto 0; height: 9%; background: #0d0c0b; }
.geese .nt-low { inset: auto 0 0 0; }
.geese .nt-logo { inset: 1.6% auto auto 3%; width: fit-content; height: fit-content; color: #f4e4b8; font: italic 700 clamp(12px, 1.8vw, 26px) Georgia, "Times New Roman", serif; letter-spacing: .04em; }
.geese .nt-sub { inset: auto 0 2% 0; margin: 0 auto; width: fit-content; height: fit-content; max-width: 92%; color: #fff6d6; font: clamp(13px, 2vw, 28px) Georgia, "Times New Roman", serif; text-align: center; opacity: 0; animation: nt-on .01s linear var(--d) forwards, nt-off .01s linear var(--e) forwards; }
.geese .nt-end { inset: 0; margin: auto; width: fit-content; height: fit-content; display: flex; flex-direction: column; align-items: center; gap: .15em; padding: .5em 1.2em; border-radius: .3em; background: rgba(28, 18, 8, .62); color: #f4e4b8; font: italic 700 clamp(20px, 4vw, 56px) Georgia, "Times New Roman", serif; opacity: 0; animation: nt-fade .7s ease-out 9.3s both; }
.geese .nt-end b { font: 900 1.3em -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #ff5a4a; letter-spacing: .06em; }
@keyframes nt-on { to { opacity: 1; } }
@keyframes nt-off { to { opacity: 0; } }
@keyframes nt-fade { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
@keyframes nt-fly { 0% { transform: translate(0, 0); } 25% { transform: translate(450px, -50px); } 50% { transform: translate(900px, 20px); } 75% { transform: translate(1350px, -40px); } 100% { transform: translate(1800px, 0); } }
@keyframes nt-flutter { from { transform: scale(1, 1); } to { transform: scale(.25, 1); } }
@keyframes nt-walk {
  0% { transform: translate(-240px, 780px); }
  20%, 25% { transform: translate(420px, 780px); }
  30% { transform: translate(470px, 780px); }
  34% { transform: translate(450px, 780px); }
  38% { transform: translate(525px, 780px); }
  41% { transform: translate(505px, 780px); }
  45.45%, 100% { transform: translate(600px, 780px); }
}
@keyframes nt-gcarry { from { transform: translate(600px, 780px); } to { transform: translate(1910px, -84px); } }
@keyframes nt-hop { 0% { transform: translateY(0); animation-timing-function: ease-out; } 50% { transform: translateY(-46px); animation-timing-function: ease-in; } 100% { transform: translateY(0); } }
@keyframes nt-load {
  0%, 25% { transform: rotate(0deg); }
  30% { transform: rotate(-3deg); }
  34% { transform: rotate(4deg); }
  38% { transform: rotate(-5deg); }
  42% { transform: rotate(5deg); }
  45.45% { transform: rotate(-3deg); }
  46.36%, 70.91% { transform: rotate(0deg); }
  75% { transform: rotate(9deg); }
  80% { transform: rotate(-7deg); }
  85%, 100% { transform: rotate(5deg); }
}
@keyframes nt-sway {
  0%, 25% { transform: rotate(0deg); }
  30% { transform: rotate(3deg); }
  35% { transform: rotate(-4deg); }
  40% { transform: rotate(6deg); }
  45% { transform: rotate(-7deg); }
  50% { transform: rotate(12deg); }
  55% { transform: rotate(-13deg); }
  60% { transform: rotate(13deg); }
  65% { transform: rotate(-9deg); }
  69.09%, 100% { transform: rotate(0deg); }
}
@keyframes nt-drop { from { transform: translateY(-700px); } to { transform: translateY(0); } }
@keyframes nt-step { from { transform: rotate(-24deg); } to { transform: rotate(24deg); } }
@keyframes nt-neck {
  0%, 25% { transform: rotate(0deg); }
  30% { transform: rotate(10deg); }
  45.45% { transform: rotate(16deg); }
  46.36% { transform: rotate(-6deg); }
  50% { transform: rotate(8deg); }
  53.5% { transform: rotate(-8deg); }
  57% { transform: rotate(8deg); }
  60.5% { transform: rotate(-8deg); }
  63.64% { transform: rotate(0deg); }
  66.36%, 70.91% { transform: rotate(-30deg); }
  72.5%, 100% { transform: rotate(8deg); }
}
@keyframes nt-wave { from { transform: rotate(0deg); } to { transform: rotate(55deg); } }
@keyframes nt-wide { from { transform: scale(1); } to { transform: scale(1.7); } }
@keyframes nt-scatter {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(calc(var(--dx) * .7), -120px) rotate(calc(var(--r) * 3)); }
  55% { transform: translate(calc(var(--dx) * .85), calc(var(--dy) * .5)) rotate(calc(var(--r) * -1.5)); }
  80% { transform: translate(calc(var(--dx) * .95), calc(var(--dy) * .85)) rotate(var(--r)); }
  100% { transform: translate(var(--dx), var(--dy)) rotate(calc(var(--r) * .15)); }
}
@keyframes nt-dive { from { transform: translate(-300px, 20px) rotate(28deg); } to { transform: translate(500px, 600px) rotate(0deg); } }
@keyframes nt-ecarry { from { transform: translate(500px, 600px) rotate(0deg); } to { transform: translate(1810px, -264px) rotate(-8deg); } }
@keyframes nt-beat { from { transform: scaleY(1); } to { transform: scaleY(-.55); } }
@keyframes nt-tag { from { transform: rotate(-7deg); } to { transform: rotate(7deg); } }
@keyframes nt-lwalk { 0%, 41.82% { transform: translate(1820px, 780px); } 48.18%, 100% { transform: translate(1150px, 780px); } }
@keyframes nt-nod { from { transform: rotate(0deg); } to { transform: rotate(10deg); } }
@keyframes nt-tilt { 0%, 100% { transform: rotate(0deg); } 30%, 70% { transform: rotate(-14deg); } }
@keyframes nt-shrug { 0%, 100% { transform: rotate(0deg); } 30%, 70% { transform: rotate(40deg); } }
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

const sideGoose = ({ body = '#f4f3ee', wing = '#dcdad2', line = '#aaa69a', beak = '#ee9433', jaw = '#cf7420', eye, head = '', chest = '', tuft = false } = {}) => {
  const leg = `<path d="M0 0 V44" stroke="${beak}" stroke-width="7" stroke-linecap="round"/><path d="M-5 41 L25 46 Q19 53 -4 52 Z" fill="${beak}"/>`;
  const dot = eye || '<circle r="5" fill="#1b1c20"/><circle cx="1.6" cy="-1.6" r="1.4" fill="#fff"/>';
  const hair = tuft ? `<path d="M8 -119 q-2 -12 4 -16 M14 -120 q2 -12 9 -13 M2 -117 q-6 -9 -2 -15" fill="none" stroke="${line}" stroke-width="3" stroke-linecap="round"/>` : '';
  const torso = 'M-96 -132 C-70 -120 -40 -126 -8 -126 C42 -126 72 -102 72 -78 C72 -52 46 -44 4 -44 C-50 -44 -84 -64 -90 -94 C-93 -108 -100 -120 -96 -132 Z';
  const neck = 'M-22 6 C-26 -30 -12 -70 2 -92 L28 -90 C16 -66 12 -30 24 8 Z';
  return `<g transform="translate(-16 -52)"><g class="sg-leg">${leg}</g></g>
<g transform="translate(10 -52)"><g class="sg-leg sg-alt">${leg}</g></g>
<path d="${torso}" fill="${body}" stroke="${line}" stroke-width="5" stroke-linejoin="round"/><path d="${torso}" fill="${body}"/>
<path d="M-60 -60 C-30 -48 20 -48 52 -58" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="6" stroke-linecap="round"/>
${chest}
<g transform="translate(36 -114)"><g class="sg-neck">
<path d="${neck}" fill="${line}" stroke="${line}" stroke-width="5" stroke-linejoin="round"/><circle cx="14" cy="-96" r="27.5" fill="${line}"/>
<path d="${neck}" fill="${body}"/><circle cx="14" cy="-96" r="25" fill="${body}"/>${hair}
<g transform="translate(36 -96)"><g class="sg-jaw"><path d="M-4 5 C8 6 20 6 30 5 C20 12 8 14 -2 12 Z" fill="${jaw}"/></g></g>
<path d="M32 -104 C46 -104 62 -100 72 -94 C60 -90 46 -88 32 -89 Z" fill="${beak}"/>
<g transform="translate(22 -102)"><g class="sg-eye">${dot}</g></g>
${head}
</g></g>
<g transform="translate(46 -100)"><g class="sg-wing"><path d="M0 0 C-26 -14 -84 -16 -126 0 C-118 6 -110 8 -104 10 C-112 16 -114 20 -110 24 C-96 22 -88 24 -82 26 C-86 32 -84 36 -78 38 C-40 40 -8 30 2 14 Z" fill="${wing}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/></g></g>`;
};

const liftScene = () => {
  const arrive = (index) => +(1.3 + .28 * index).toFixed(2);
  const crowd = [[690, 800, .78, -1], [805, 800, .78, 1], [905, 800, .78, 1], [740, 708, .78, 1], [880, 708, .78, -1], [690, 618, .76, 1], [800, 618, .76, -1], [912, 618, .76, -1], [750, 528, .74, 1, 1], [868, 528, .74, -1, 1], [672, 802, .84, 1]]
    .map(([x, y, s, dir, bent], index) => ({ y: index === 10 ? 999 : y, html: `<g transform="translate(${x} ${y}) scale(${s * dir} ${s})"><g class="lf-in" style="--d:${arrive(index)}s"><g class="${index === 10 ? 'lf-tug' : ''}${bent ? 'lf-bent' : ''}">${sideGoose()}</g></g></g>` }))
    .sort((a, b) => a.y - b.y).map((goose) => goose.html).join('');
  const walkers = Array.from({ length: 11 }, (_, index) => `<g class="lf-walk" style="--d:${(.3 + .28 * index).toFixed(2)}s"><g class="lf-bob">${sideGoose()}</g></g>`).join('');
  const lattice = Array.from({ length: 10 }, (_, col) => {
    const x = -400 + col * 40;
    return Array.from({ length: 6 }, (_, row) => `M${x} ${row * 100} L${x + 40} ${row * 100 + 100} M${x} ${row * 100 + 100} L${x + 40} ${row * 100}`).join(' ');
  }).join(' ');
  const bars = Array.from({ length: 11 }, (_, col) => `M${-400 + col * 40} 0 V600`).join(' ');
  const led = (text, size, color, delay, cls = '') => `<g class="lf-led" style="--d:${delay}s"><rect x="722" y="132" width="156" height="50" rx="4" fill="#0c0c0c"/><text class="${cls}" x="800" y="${157 + size * .36}" font-size="${size}" fill="${color}">${text}</text></g>`;
  const counts = Array.from({ length: 11 }, (_, index) => led(`${index + 1}/4`, 34, index < 4 ? '#5be37f' : '#ff4b3a', arrive(index))).join('');
  const speed = [640, 700, 760, 840, 900, 960].map((x, index) => `<path d="M${x} ${260 + (index % 3) * 90} v${160 + (index % 2) * 120}"/>`).join('');
  const gosling = (cls) => `<g class="${cls}"><g class="lf-run">${sideGoose({ body: '#ffd84a', wing: '#f0bd2a', line: '#d39b1c', tuft: true })}</g></g>`;
  return `<svg class="lf" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<g class="lf-zoom"><g class="lf-cam">
<rect x="600" y="200" width="400" height="600" fill="#17181b"/>
<path d="M626 200 V800 M974 200 V800" stroke="#34363b" stroke-width="10"/>
<path d="M600 330 H1000 M600 520 H1000 M600 710 H1000" stroke="#222327" stroke-width="6"/>
<g class="lf-rope"><path d="M800 0 V266" stroke="#55565c" stroke-width="5"/><path d="M797 266 l-3 7 M800 266 l0 8 M803 266 l3 7" stroke="#55565c" stroke-width="2"/></g>
<g class="lf-cab">
<path d="M800 268 V284" stroke="#55565c" stroke-width="5"/><path d="M797 268 l-3 -7 M803 268 l3 -7" stroke="#55565c" stroke-width="2"/>
<rect x="612" y="290" width="376" height="516" fill="#8e6038"/>
<rect x="640" y="306" width="320" height="490" fill="#a87346"/>
<path d="M720 306 V796 M800 306 V796 M880 306 V796" stroke="#7a5230" stroke-width="3"/>
<ellipse cx="800" cy="330" rx="150" ry="34" fill="#ffe9a8" fill-opacity=".18"/>
<rect x="782" y="294" width="36" height="9" rx="3" fill="#fff4c9"/>
<rect x="604" y="278" width="392" height="14" fill="#4a3a2c"/>
<circle cx="800" cy="278" r="7" fill="none" stroke="#55565c" stroke-width="4"/>
<g class="lf-crowd">${crowd}</g>
${gosling('lf-gb')}
</g>
<path d="M0 0 H1600 V800 H0 Z M600 200 V800 H1000 V200 Z" fill="#e8e2d0" fill-rule="evenodd"/>
<path d="M0 480 H600 V800 H0 Z M1000 480 H1600 V800 H1000 Z" fill="#4e7d68"/>
<path d="M0 480 H600 M1000 480 H1600" stroke="#3b5f4f" stroke-width="5"/>
<path d="M0 140 Q400 120 560 170 M1080 60 Q1300 90 1600 70" fill="none" stroke="#000" stroke-opacity=".05" stroke-width="30"/>
<rect x="593" y="193" width="414" height="614" fill="none" stroke="#3b2a1e" stroke-width="14"/>
<rect x="714" y="124" width="172" height="66" rx="8" fill="#5c5348"/>
${led('0/4', 34, '#5be37f', 0)}${counts}${led('12/4', 34, '#ff4b3a', 6.75)}${led('ПЕРЕГРУЗ', 23, '#ff4b3a', 6.9, 'lf-blink')}${led('▼', 34, '#ff4b3a', 8.05, 'lf-blink')}${led('Overload', 26, '#ff4b3a', 10.5, 'lf-blink')}
<rect x="330" y="250" width="220" height="118" rx="10" fill="#f3f1ea" stroke="#2c5aa0" stroke-width="5"/>
<text x="440" y="296" font-size="34" font-weight="800" fill="#2c5aa0" text-anchor="middle" letter-spacing="4">ЛИФТ</text>
<text x="440" y="332" font-size="21" fill="#23324d" text-anchor="middle">не более</text>
<text x="440" y="356" font-size="21" font-weight="700" fill="#23324d" text-anchor="middle">4 гусей</text>
<rect x="547" y="676" width="32" height="50" rx="5" fill="#b08d4a" stroke="#6f5524" stroke-width="2"/>
<circle cx="563" cy="701" r="9" fill="#5a4a2a"/><circle class="lf-lit" cx="563" cy="701" r="9" fill="#ffcf3a"/>
<rect x="0" y="800" width="1600" height="100" fill="#8c6a4c"/>
<path d="M0 820 H1600 M0 848 H1600 M0 880 H1600" stroke="#000" stroke-opacity=".12" stroke-width="2"/>
<rect x="0" y="796" width="1600" height="8" fill="#3b2a1e"/>
<g transform="translate(1000 200)"><g class="lf-gate">
<path d="${lattice}" stroke="#2b2b2e" stroke-width="1.6" fill="none" vector-effect="non-scaling-stroke"/>
<path d="${bars}" stroke="#202023" stroke-width="2" vector-effect="non-scaling-stroke"/>
<path d="M-400 0 H0 M-400 600 H0" stroke="#202023" stroke-width="5" vector-effect="non-scaling-stroke"/>
<path d="M-400 0 V600" stroke="#202023" stroke-width="5" vector-effect="non-scaling-stroke"/><rect x="-396" y="300" width="9" height="34" rx="3" fill="#b08d4a"/>
</g></g>
<path class="lf-tail" d="M650 700 C640 694 630 690 618 694 C628 700 630 708 626 716 C636 712 646 712 652 716 Z" fill="#f4f3ee"/>
<g transform="translate(0 860) scale(.78)">${walkers}</g>
${gosling('lf-ga')}${gosling('lf-gc')}
<g class="lf-spark" transform="translate(800 266)"><polygon points="0,-26 6,-8 24,-14 10,0 26,10 6,8 0,28 -6,8 -24,12 -10,0 -26,-12 -6,-8" fill="#fff6b0"/><circle r="7" fill="#fff"/></g>
<text class="lf-zing" x="830" y="262" font-size="34" font-weight="900" fill="#ffd23a" stroke="#3b2a1e" stroke-width="3" paint-order="stroke">ДЗЫНЬ!</text>
<g class="lf-speed" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round">${speed}</g>
<text class="lf-whee" x="800" y="560" font-size="44" font-style="italic" font-weight="700" fill="#cfd2d8" text-anchor="middle">фьюууу…</text>
<text class="lf-boom" x="800" y="770" font-size="26" font-style="italic" fill="#7d8088" text-anchor="middle">бум</text>
</g></g>
</svg>
<div class="lf-vig"></div>`;
};

const barScene = (names = []) => {
  const safe = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const list = names.length ? names : ['Overload'];
  const tag = (index) => safe(list[index % list.length]);
  const disc = (x, r, color, label) => `<circle cx="${x}" r="${r}" fill="${color}" stroke="#111" stroke-width="4"/><circle cx="${x}" r="${r * .3}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="3"/><circle cx="${x}" r="9" fill="#cfcfcf" stroke="#555" stroke-width="2"/><text x="${x}" y="${-r * .42}" font-size="${r > 80 ? 27 : 21}" font-weight="900" fill="#fff" text-anchor="middle"${label.length > 7 ? ` textLength="${r * 1.5}" lengthAdjust="spacingAndGlyphs"` : ''}>${label}</text>`;
  const half = (dir, inner, outer) => `<g transform="scale(${dir} 1)"><g transform="translate(128 0)"><g class="wl-sag">
<rect x="0" y="-6" width="322" height="12" rx="5" fill="#c9ccd2" stroke="#6b6f76" stroke-width="2"/>
<rect x="72" y="-17" width="26" height="34" rx="4" fill="#9aa0a8" stroke="#555" stroke-width="2"/>
<g transform="scale(${dir} 1)">${disc(dir * 112, 95, inner.color, inner.label)}${disc(dir * 242, 70, outer.color, outer.label)}</g>
</g></g></g>`;
  const bar = `<rect x="-130" y="-6" width="260" height="12" rx="5" fill="#c9ccd2" stroke="#6b6f76" stroke-width="2"/><path d="M-90 -6 V6 M-60 -6 V6 M60 -6 V6 M90 -6 V6" stroke="#8a8f97" stroke-width="2"/>${half(-1, { color: '#d23a32', label: tag(0) }, { color: '#e4b62a', label: tag(2) })}${half(1, { color: '#2f62c9', label: tag(1) }, { color: '#3f9a4a', label: tag(3) })}`;
  const line = '#a9a59a';
  const legPath = '<path d="M0 0 V60" stroke="#ee9433" stroke-width="13" stroke-linecap="round"/><path d="M-26 70 Q-14 54 0 58 Q14 54 26 70 Q0 78 -26 70 Z" fill="#ee9433" stroke="#c46f1c" stroke-width="2"/>';
  const wing = `<path d="M-15 -8 C-26 30 -24 84 -10 140 C-4 132 0 130 4 134 C8 122 12 116 17 118 C22 84 24 30 15 -8 Z" fill="#f4f3ee" stroke="${line}" stroke-width="4" stroke-linejoin="round"/><path d="M-2 40 V112 M8 50 V108" stroke="${line}" stroke-width="2" fill="none"/>`;
  const eye = '<circle r="9" fill="#fff" stroke="#3a3a3a" stroke-width="2"/><path d="M-8 -2 q3 1 4 -1 M8 3 q-3 0 -4 2 M-6 5 q2 -1 3 0" stroke="#d0281f" stroke-width="1" fill="none"/><circle cx="1" r="4" fill="#111"/>';
  const torso = 'M0 -270 C46 -270 104 -205 106 -145 C108 -92 66 -62 0 -62 C-66 -62 -108 -92 -106 -145 C-104 -205 -46 -270 0 -270 Z';
  const feathers = [[-260, -180, -200], [240, -240, 260], [-190, -330, 120], [300, -60, -300], [-320, -40, 340], [140, -360, -160], [40, -420, 220], [-80, -400, -260]]
    .map(([dx, dy, r]) => `<g transform="translate(0 -170)"><g class="wl-feather" style="--dx:${dx}px;--dy:${dy}px;--r:${r}deg"><path d="M0 -16 C7 -7 7 7 0 16 C-7 7 -7 -7 0 -16 Z M0 -16 V20" fill="#f4f3ee" stroke="${line}" stroke-width="1.5"/></g></g>`).join('');
  const drift = [[-140, -120, 6.2], [90, -200, 6.5], [200, -90, 6.9], [-60, -260, 7.3]]
    .map(([x, y, delay]) => `<g transform="translate(${x} ${y})"><g class="wl-drift" style="--d:${delay}s"><path d="M0 -14 C6 -6 6 6 0 14 C-6 6 -6 -6 0 -14 Z M0 -14 V18" fill="#f4f3ee" stroke="${line}" stroke-width="1.5"/></g></g>`).join('');
  const fans = Array.from({ length: 3 }, (_, row) => Array.from({ length: 26 }, (_, col) => {
    const x = col * 64 + (row % 2) * 32 - 20 + Math.round(Math.random() * 10);
    const y = 360 + row * 62;
    return `<path d="M${x - 9} ${y + 40} C${x - 10} ${y + 20} ${x - 6} ${y + 6} ${x - 5} ${y} L${x + 5} ${y} C${x + 6} ${y + 6} ${x + 10} ${y + 20} ${x + 9} ${y + 40} Z"/><circle cx="${x}" cy="${y - 8}" r="13"/>`;
  }).join('')).join('');
  const flashes = Array.from({ length: 12 }, (_, index) => {
    const x = 60 + Math.round(Math.random() * 1480);
    const y = 350 + Math.round(Math.random() * 140);
    return `<g transform="translate(${x} ${y})"><polygon class="wl-flash" style="--d:${(3.6 + index * .16).toFixed(2)}s" points="0,-16 4,-4 16,0 4,4 0,16 -4,4 -16,0 -4,-4" fill="#fff"/></g>`;
  }).join('');
  const judge = (x, value, delay, wide) => `<g transform="translate(${x} 975) scale(.66)"><g class="wl-judge" style="--d:${(delay - .5).toFixed(2)}s">
<g class="wl-card" style="--d:${delay}s"><path d="M20 -100 C40 -150 44 -200 30 -236" stroke="#f4f3ee" stroke-width="26" stroke-linecap="round" fill="none"/><rect x="${wide ? -112 : -72}" y="-330" width="${wide ? 224 : 144}" height="96" rx="8" fill="#fff" stroke="#222" stroke-width="4"/><text x="0" y="-262" font-size="${wide ? 42 : 58}" font-weight="900" fill="${wide ? '#d8231b' : '#111'}" text-anchor="middle">${value}</text></g>
<path d="M-58 0 C-56 -40 -30 -60 -18 -64 C-20 -90 -16 -110 -12 -128 L12 -128 C16 -110 20 -90 18 -64 C30 -60 56 -40 58 0 Z" fill="#e9e7e0" stroke="${line}" stroke-width="4"/>
<circle cy="-150" r="32" fill="#e9e7e0" stroke="${line}" stroke-width="4"/><path d="M-30 -164 A32 32 0 0 1 30 -164 Z" fill="#20232b"/><rect x="-140" y="-70" width="280" height="80" rx="6" fill="#2a3346"/><text x="0" y="-26" font-size="22" font-weight="800" fill="#c9d3e6" text-anchor="middle">СУДЬЯ</text><circle cx="-11" cy="-146" r="4.5" fill="#111"/><circle cx="11" cy="-146" r="4.5" fill="#111"/><path d="M-11 -136 Q0 -132 11 -136 L0 -118 Z" fill="#ee9433"/>
</g></g>`;
  return `<svg class="wl" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<g class="wl-zoom"><g class="wl-cam">
<rect width="1600" height="900" fill="#121827"/>
<rect y="300" width="1600" height="260" fill="#0c111c"/>
<g fill="#1f2a40">${fans}</g>
<g>${flashes}</g>
<rect x="250" y="208" width="1100" height="62" rx="6" fill="#1d3f8f"/>
<text x="800" y="250" font-size="30" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing="3">ЧЕМПИОНАТ СПРИНТА · ТЯЖЁЛАЯ АТЛЕТИКА</text>
<polygon points="690,0 910,0 1260,780 340,780" fill="#fffbe8" fill-opacity=".07"/>
<polygon points="320,690 1280,690 1300,760 300,760" fill="#b98a55"/>
<path d="M440 690 L410 760 M640 690 L630 760 M960 690 L970 760 M1160 690 L1190 760" stroke="#000" stroke-opacity=".12" stroke-width="3"/>
<ellipse cx="800" cy="745" rx="330" ry="34" fill="#fffbe8" fill-opacity=".14"/>
<g transform="translate(800 735)">
<g class="wl-tremble">
<g class="wl-squash">
<g transform="translate(30 -70)"><g class="wl-leg">${legPath}</g></g>
<g transform="translate(-30 -70) scale(-1 1)"><g class="wl-leg">${legPath}</g></g>
<path d="${torso}" fill="#f4f3ee" stroke="${line}" stroke-width="5"/>
<path d="M-74 -232 C-40 -200 40 -200 74 -232 L92 -120 C40 -102 -40 -102 -92 -120 Z" fill="#c8302a"/>
<text x="0" y="-150" font-size="40" font-weight="900" fill="#fff" text-anchor="middle">P2P</text>
<path d="M-98 -122 C-40 -100 40 -100 98 -122 L102 -96 C40 -76 -40 -76 -102 -96 Z" fill="#6b4423"/><rect x="-16" y="-108" width="32" height="24" rx="3" fill="#d9b44a" stroke="#6b4423" stroke-width="3"/>
<path d="M-20 -250 C-22 -268 -18 -282 -16 -292 L16 -292 C18 -282 22 -268 20 -250 Z" fill="#f4f3ee" stroke="${line}" stroke-width="4"/>
<circle cy="-296" r="34" fill="#f4f3ee" stroke="${line}" stroke-width="4"/>
<circle class="wl-red" cy="-296" r="32" fill="#e5483e"/>
<rect x="-33" y="-322" width="66" height="10" rx="4" fill="#c8302a"/>
<g transform="translate(-13 -301)"><g class="wl-eye">${eye}</g></g>
<g transform="translate(13 -301)"><g class="wl-eye">${eye}</g></g>
<path d="M-15 -292 C-8 -298 8 -298 15 -292 C10 -278 5 -268 0 -262 C-5 -268 -10 -278 -15 -292 Z" fill="#ee9433" stroke="#c46f1c" stroke-width="2"/>
<path class="wl-sweat" d="M30 -318 q6 10 0 14 q-6 -4 0 -14 Z M-34 -300 q6 10 0 14 q-6 -4 0 -14 Z" fill="#9fd3ff"/>
</g>
<g transform="translate(0 -95)"><g class="wl-bar">${bar}</g></g>
<g class="wl-squash">
<g transform="translate(82 -230)"><g class="wl-arm">${wing}</g></g>
<g transform="translate(-82 -230) scale(-1 1)"><g class="wl-arm">${wing}</g></g>
</g>
</g>
<g class="wl-chalk"><circle cy="-165" r="40" fill="#fff" fill-opacity=".8"/><circle cx="-30" cy="-180" r="26" fill="#fff" fill-opacity=".7"/><circle cx="28" cy="-150" r="24" fill="#fff" fill-opacity=".7"/></g>
${feathers}
</g>
<polygon points="300,760 1300,760 1312,790 288,790" fill="#b98a55"/>
<polygon points="288,790 1312,790 1312,830 288,830" fill="#7c5631"/>
<rect y="830" width="1600" height="70" fill="#0c111c"/>
<g class="wl-crack" fill="none" stroke="#3b2510" stroke-width="4" stroke-linejoin="round"><path d="M520 762 l-30 14 l18 10 l-26 16 M560 764 l22 12 l-10 12 M1080 762 l30 12 l-16 12 l28 14 M1040 764 l-20 14 l12 10"/></g>
<g transform="translate(800 735)">
<g class="wl-peek"><path d="M-18 -6 V-86 M18 -6 V-86" stroke="#f4f3ee" stroke-width="6"/><g transform="translate(-18 -96)"><g class="wl-blink"><circle r="18" fill="#fff" stroke="#3a3a3a" stroke-width="2.5"/><circle cx="3" r="7.5" fill="#111"/></g></g><g transform="translate(18 -96)"><g class="wl-blink"><circle r="18" fill="#fff" stroke="#3a3a3a" stroke-width="2.5"/><circle cx="-3" r="7.5" fill="#111"/></g></g>
<g transform="translate(0 -140) scale(1 .35)"><g class="wl-orbit">${[0, 120, 240].map((a) => `<polygon transform="rotate(${a}) translate(70 0)" points="0,-16 5,-5 16,-4 8,4 10,16 0,9 -10,16 -8,4 -16,-4 -5,-5" fill="#ffd23a" stroke="#8a6a00" stroke-width="2"/>`).join('')}</g></g></g>
<g transform="translate(40 -10)"><g class="wl-wave"><path d="M0 0 C20 -6 50 -8 74 -2 C66 2 62 6 66 10 C44 12 20 10 0 6 Z" fill="#f4f3ee" stroke="${line}" stroke-width="3"/></g></g>
${drift}
<g class="wl-dust" fill="#d8c3a0" fill-opacity=".8"><circle cx="-420" cy="-20" r="40"/><circle cx="-480" cy="-50" r="30"/><circle cx="420" cy="-20" r="40"/><circle cx="480" cy="-50" r="30"/><circle cx="-360" cy="-50" r="24"/><circle cx="360" cy="-50" r="24"/></g>
</g>
<text class="wl-hey" x="1190" y="610" font-size="64" font-weight="900" fill="#ffd23a" stroke="#1a1a1a" stroke-width="5" paint-order="stroke">ХЭЙ!</text>
<text class="wl-bang" x="800" y="560" font-size="96" font-weight="900" fill="#ff3b2f" stroke="#1a1a1a" stroke-width="6" paint-order="stroke" text-anchor="middle">БДЫЩ!</text>
${judge(420, '9.8', 6.6)}${judge(800, '10', 7)}${judge(1180, 'Overload', 7.5, true)}
</g></g>
</svg>
<div class="wl-live"><b>● LIVE</b> P2P Sport</div>
<div class="wl-third"><b>Гусь Гусев</b><span>сборная P2P · рывок: ${list.map(safe).join(' + ')}</span></div>`;
};

const rocketScene = () => {
  const stars = Array.from({ length: 40 }, () => `<circle cx="${Math.round(Math.random() * 1600)}" cy="${Math.round(Math.random() * 520)}" r="${(1 + Math.random() * 2).toFixed(1)}"/>`).join('');
  const lattice = Array.from({ length: 10 }, (_, i) => `M600 ${760 - i * 51} L660 ${709 - i * 51} M660 ${760 - i * 51} L600 ${709 - i * 51}`).join(' ');
  const steam = [[-170, -20, 60], [-260, -50, 46], [-110, -60, 40], [170, -20, 60], [260, -50, 46], [110, -60, 40], [-330, -10, 36], [330, -10, 36]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  const lights = Array.from({ length: 24 }, (_, i) => `<circle class="rk-lamp" style="--d:${(i * .13 % 1).toFixed(2)}s" cx="${1090 + (i % 8) * 56}" cy="${190 + Math.floor(i / 8) * 46}" r="10" fill="${['#ff5a4a', '#ffd23a', '#5fe08a', '#5fb2e6'][i % 4]}"/>`).join('');
  const skull = (fill, r) => `<circle r="${r}" fill="${fill}"/><path d="M${-r + 8} -${r * .5} C${-r - 30} -${r * .7} ${-r - 40} -${r * .2} ${-r - 10} 0" fill="${fill}"/>`;
  return `<div class="rk-sky"></div>
<svg class="rk" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<g class="rk-wide">
<g fill="#fff" fill-opacity=".8">${stars}</g>
<path d="M0 740 Q200 690 420 730 T900 720 T1600 735 V900 H0 Z" fill="#20222e"/>
<path d="M600 250 V760 M660 250 V760 ${lattice} M660 420 H740 M660 560 H740" stroke="#3b3f52" stroke-width="7" fill="none"/>
<g transform="translate(800 760)"><g class="rk-rumble"><g class="rk-lift">
<g class="rk-flame"><path d="M-46 0 C-40 70 -10 130 0 190 C10 130 40 70 46 0 Z" fill="#ff8a2a"/><path d="M-24 0 C-20 50 -6 90 0 130 C6 90 20 50 24 0 Z" fill="#ffe36a"/></g>
<path d="M-62 0 V-420 C-62 -480 -30 -530 0 -570 C30 -530 62 -480 62 -420 V0 Z" fill="#eef1f5" stroke="#9aa3ad" stroke-width="5"/>
<path d="M-62 -440 H62 M-62 -60 H62" stroke="#c8302a" stroke-width="18"/>
<path d="M-62 -110 L-120 0 H-62 Z M62 -110 L120 0 H62 Z" fill="#c8302a" stroke="#8a1f1a" stroke-width="4"/>
<text x="0" y="-160" font-size="34" font-weight="900" fill="#c8302a" text-anchor="middle" transform="rotate(-90 0 -170)">P2P-1</text>
<circle cy="-330" r="38" fill="#5fb2e6" stroke="#9aa3ad" stroke-width="7"/><circle cx="-4" cy="-326" r="18" fill="#f4f3ee"/><path d="M12 -330 L34 -326 L12 -320 Z" fill="#ee9433"/><circle cx="2" cy="-332" r="3.5" fill="#111"/><circle cy="-328" r="27" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
</g></g>
<g class="rk-steam" fill="#e9edf2">${steam}</g></g>
</g>
<g class="rk-close">
<rect y="860" width="1600" height="40" fill="#8d9097"/><path d="M0 860 H1600" stroke="#f2c230" stroke-width="8" stroke-dasharray="40 40"/>
<path d="M120 860 V420 M190 860 V420 M120 470 L190 520 M190 470 L120 520 M120 570 L190 620 M190 570 L120 620 M120 670 L190 720 M190 670 L120 720 M120 770 L190 820 M190 770 L120 820" stroke="#596071" stroke-width="7" fill="none"/>
<g class="rk-column"><rect x="1210" y="-40" width="90" height="900" rx="40" fill="#f2f4f7" fill-opacity=".85"/><circle cx="1200" cy="840" r="70" fill="#e9edf2"/><circle cx="1320" cy="830" r="80" fill="#e9edf2"/><circle cx="1110" cy="860" r="50" fill="#e9edf2"/><circle cx="1420" cy="860" r="56" fill="#e9edf2"/></g>
<g transform="translate(1255 820)"><g class="rk-trail"><path d="M-50 0 C-44 90 -12 170 0 260 C12 170 44 90 50 0 Z" fill="#ff8a2a"/><path d="M-62 0 V-260 C-62 -310 -30 -350 0 -380 C30 -350 62 -310 62 -260 V0 Z" fill="#eef1f5" stroke="#9aa3ad" stroke-width="5"/><path d="M-62 -40 H62" stroke="#c8302a" stroke-width="16"/></g></g>
<g class="rk-rig">
<g class="rk-cabin">
<rect x="-50" y="-50" width="1700" height="1000" fill="#2b3440"/>
<path d="M-50 70 H1650 M-50 110 H1650" stroke="#3c4754" stroke-width="16"/>
<rect x="1050" y="150" width="500" height="380" rx="16" fill="#39444f" stroke="#1d242c" stroke-width="5"/>
${lights}
<rect x="1090" y="340" width="190" height="150" rx="8" fill="#0f1a14"/><path class="rk-graph" d="M1100 470 L1140 450 L1170 460 L1200 400 L1230 420 L1260 350" stroke="#5fe08a" stroke-width="4" fill="none"/>
<rect x="1310" y="340" width="200" height="150" rx="8" fill="#0f1a14"/><text x="1410" y="430" font-size="44" font-weight="900" fill="#ff5a4a" text-anchor="middle" class="rk-blink">12g</text>
<circle cx="190" cy="250" r="90" fill="#0b1020" stroke="#9aa3ad" stroke-width="16"/><g class="rk-streak" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M140 210 H240 M120 250 H260 M150 290 H230"/></g>
<rect x="-50" y="760" width="1700" height="200" fill="#222a33"/>
<text class="rk-rrr" x="1050" y="640" font-size="70" font-weight="900" fill="#ffd23a" stroke="#1a1a1a" stroke-width="6" paint-order="stroke">РРРРРРР</text>
</g>
<g class="rk-sparks" stroke="#ffd23a" stroke-width="4" stroke-linecap="round"><path d="M450 862 l-30 -26 M470 862 l6 -40 M720 862 l30 -30 M700 862 l-8 -36"/></g>
<path d="M440 848 L460 868 L480 846 L500 866 L520 846 L540 868 L560 846 L580 866 L600 846 L620 868 L640 846 L660 866 L680 846 L700 868 L720 846 V820 H440 Z" fill="#6b737e"/>
<g class="rk-wire"><path d="M470 850 C460 880 490 880 480 900 M690 850 C710 875 680 885 700 900" stroke="#c8302a" stroke-width="5" fill="none"/><path d="M500 850 C510 880 530 870 524 900" stroke="#3d7be0" stroke-width="5" fill="none"/></g>
<path d="M300 330 Q290 300 330 296 L420 300 Q446 304 440 340 L430 820 H330 Z" fill="#3a4250" stroke="#1d242c" stroke-width="6"/>
<rect x="330" y="770" width="470" height="60" rx="18" fill="#4a5262" stroke="#1d242c" stroke-width="6"/>
<path d="M730 660 C760 600 780 520 820 470 L880 500 C850 540 830 610 820 680 Z" fill="#aaa69a"/>
<ellipse cx="600" cy="690" rx="214" ry="134" fill="#aaa69a"/>
<path d="M733 660 C762 602 782 524 822 476 L874 502 C846 542 826 612 816 680 Z" fill="#f4f3ee"/>
<ellipse cx="600" cy="690" rx="210" ry="130" fill="#f4f3ee"/>
<path d="M470 580 L700 780 M560 570 L770 720" stroke="#2c5a9e" stroke-width="22" stroke-linecap="round"/><circle cx="640" cy="690" r="16" fill="#c9ced6" stroke="#5b6470" stroke-width="3"/>
<ellipse cx="840" cy="560" rx="120" ry="26" fill="#c9ced6" stroke="#7b8792" stroke-width="4"/>
<g transform="translate(870 380)"><g class="rk-head">
<g transform="translate(88 0)"><g class="rk-stretch"><g transform="translate(-88 0)">
${skull('#aaa69a', 104)}${skull('#f4f3ee', 100)}
<path class="rk-ripple" d="M-30 40 Q-50 30 -70 42 M-20 62 Q-44 52 -66 66 M-40 18 Q-58 10 -76 20" stroke="#aaa69a" stroke-width="4" fill="none" stroke-linecap="round"/>
<g transform="translate(36 -30)"><g class="rk-eye"><circle r="20" fill="#fff" stroke="#3a3a3a" stroke-width="2.5"/><circle cx="6" r="8" fill="#111"/><circle cx="8" cy="-3" r="2.5" fill="#fff"/></g></g>
<path class="rk-brow" d="M14 -58 Q36 -66 58 -56" stroke="#3a3a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
</g></g></g>
<g transform="translate(88 12)"><g class="rk-jaw"><path d="M0 0 C40 2 80 4 104 4 C80 18 40 28 0 26 Z" fill="#cf7420"/></g></g>
<path d="M88 -34 C130 -32 180 -18 214 0 C180 10 130 14 88 12 Z" fill="#ee9433"/><circle cx="126" cy="-18" r="3.5" fill="#a85a12"/>
<g transform="translate(70 -150)"><g class="rk-fish"><path d="M0 0 C14 -14 36 -14 46 0 C36 14 14 14 0 0 Z M0 0 L-16 -12 L-12 0 L-16 12 Z" fill="#ff8a2a"/><circle cx="34" cy="-2" r="2.5" fill="#111"/></g></g>
<circle cx="-10" r="230" fill="#bfe6ff" fill-opacity=".14" stroke="#dff3ff" stroke-opacity=".9" stroke-width="7"/>
<path d="M-150 -120 A190 190 0 0 1 20 -210" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="14" stroke-linecap="round"/>
<path d="M140 120 A190 190 0 0 1 60 190" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="8" stroke-linecap="round"/>
</g></g>
<g transform="translate(700 620)"><g class="rk-wing"><path d="M0 0 C-60 -20 -200 -10 -300 40 C-280 50 -262 54 -250 56 C-262 66 -264 74 -258 80 C-220 82 -200 84 -186 88 C-190 96 -186 102 -178 104 C-100 104 -30 80 10 40 Z" fill="#dcdad2" stroke="#aaa69a" stroke-width="3"/></g></g>
</g>
<text class="rk-crack" x="1000" y="240" font-size="100" font-weight="900" fill="#ff3b2f" stroke="#1a1a1a" stroke-width="7" paint-order="stroke">КРРАК!</text>
</g>
</svg>
<div class="rk-hud"><span>ЦУП · P2P-1</span></div>
<div class="rk-count" style="--d:.5s;--e:1.2s">3</div><div class="rk-count" style="--d:1.2s;--e:1.9s">2</div><div class="rk-count" style="--d:1.9s;--e:2.6s">1</div><div class="rk-count rk-go" style="--d:2.6s;--e:3.2s">ПОЕХАЛИ!</div>
<div class="rk-g" style="--d:3.4s;--e:6.2s">ПЕРЕГРУЗКА <b>12g</b></div>
<div class="rk-sub" style="--d:6.9s;--e:8.7s">ЦУП: Гусь, приём? Гусь?..</div>
<div class="rk-g rk-over" style="--d:9.5s;--e:99s">ПЕРЕГРУЗКА <b>Overload</b></div>`;
};

const natureScene = () => {
  const colors = ['#e2574c', '#3d7be0', '#f2b33d', '#4caf6a', '#9b6ad6'];
  const tile = (i) => `<rect x="-62" y="-22" width="124" height="22" rx="4" fill="#fff" stroke="#c9c4b8" stroke-width="2"/><rect x="-62" y="-22" width="9" height="22" rx="3" fill="${colors[i % colors.length]}"/><path d="M-44 -14 H${10 + (i * 17) % 34} M-44 -7 H${-6 + (i * 23) % 30}" stroke="#b9b4a8" stroke-width="3" stroke-linecap="round"/>`;
  const shift = (i) => ((i * 37) % 21) - 10;
  const stack = Array.from({ length: 16 }, (_, i) => `<g transform="translate(${shift(i)} ${-22 * i})"><g class="nt-card" style="--d:${(2.75 + i * .115).toFixed(3)}s">${tile(i)}</g></g>`).join('');
  const leaves = Array.from({ length: 16 }, (_, i) => {
    const y = 656 - 22 * i;
    const dx = ((i * 53) % 400) - 200 + (i % 2 ? 40 : -40);
    const dy = 782 + (i * 7) % 26 - y;
    const r = ((i * 71) % 120) - 60;
    return `<g transform="translate(${552 + shift(i)} ${y})"><g class="nt-leaf" style="--dx:${dx}px;--dy:${dy}px;--r:${r}deg">${tile(i)}</g></g>`;
  }).join('');
  const acacia = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 0 C-4 -60 -10 -110 -40 -150 M-2 -70 C10 -110 30 -130 60 -150 M-4 -40 C-30 -70 -60 -90 -90 -100" stroke="#a48a74" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="-10" cy="-160" rx="150" ry="34" fill="#a9cf97"/><ellipse cx="-50" cy="-178" rx="90" ry="24" fill="#bcdcaa"/><ellipse cx="50" cy="-172" rx="80" ry="22" fill="#b3d6a0"/></g>`;
  const tufts = [120, 330, 760, 980, 1250, 1530].map((x) => `<path d="M${x} 792 l-10 -26 M${x + 6} 792 l2 -34 M${x + 12} 792 l12 -24" stroke="#9fc28a" stroke-width="5" stroke-linecap="round"/>`).join('');
  const glasses = '<circle cx="22" cy="-102" r="11" fill="#fff" fill-opacity=".3" stroke="#2b2b2b" stroke-width="3"/><path d="M11 -101 L-10 -97 M33 -103 L40 -104" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>';
  const tie = '<path d="M50 -108 H66 L61 -98 H55 Z" fill="#2f62c9"/><path d="M55 -98 H61 L68 -62 L58 -50 L48 -62 Z" fill="#2f62c9"/><path d="M54 -88 L63 -80 M51 -74 L65 -64" stroke="#f2b33d" stroke-width="3"/>';
  const eagleWing = (fill, line) => `<path d="M0 0 C-30 -60 -60 -150 -40 -230 C-10 -200 0 -190 10 -186 C14 -196 22 -204 30 -206 C34 -170 40 -150 50 -146 C56 -160 66 -168 74 -170 C76 -120 70 -60 40 0 Z" fill="${fill}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>`;
  return `<svg class="nt" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<rect width="1600" height="900" fill="#fbe3cc"/>
<rect width="1600" height="500" fill="#d6ebf0"/>
<rect y="340" width="1600" height="180" fill="#f6dcc6" fill-opacity=".75"/>
<circle cx="1230" cy="250" r="110" fill="#fff3c2" fill-opacity=".35"/><circle cx="1230" cy="250" r="74" fill="#fff3c2"/>
<path d="M0 540 Q240 460 520 520 T1060 500 T1600 520 V900 H0 Z" fill="#cfe0b8"/>
<path d="M0 610 Q300 560 640 600 T1300 580 T1600 600 V900 H0 Z" fill="#bcd6a3"/>
${acacia(170, 590, .95)}${acacia(880, 575, .8)}${acacia(1560, 600, 1)}
<path d="M0 690 Q400 660 800 682 T1600 674 V900 H0 Z" fill="#ead9a8"/>
<rect y="770" width="1600" height="130" fill="#e3cf98"/>
${tufts}
<g class="nt-fly"><g transform="translate(-60 300)"><ellipse class="nt-flap" cx="0" cy="-6" rx="9" ry="13" fill="#f2a7c3"/><ellipse class="nt-flap" cx="8" cy="-4" rx="7" ry="10" fill="#f7c4d6"/><path d="M0 0 L6 6" stroke="#6d5a4e" stroke-width="3" stroke-linecap="round"/></g></g>
<g transform="translate(1450 782)"><path d="M0 0 V-170" stroke="#a48a74" stroke-width="8"/><g transform="rotate(-4 0 -170)"><rect x="-70" y="-214" width="140" height="56" rx="6" fill="#fff8e6" stroke="#a48a74" stroke-width="5"/><text x="0" y="-174" font-size="34" font-weight="800" fill="#4caf6a" text-anchor="middle">Done</text></g></g>
<g transform="translate(1340 776)"><ellipse rx="96" ry="26" fill="#9a7b5c"/><path d="M-96 -2 C-60 -30 60 -30 96 -2 M-90 6 C-40 -18 40 -18 90 6 M-80 -10 L60 8 M-60 10 L80 -12" stroke="#7d6248" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="-20" cy="-20" rx="16" ry="20" fill="#fffaf0"/><ellipse cx="14" cy="-22" rx="16" ry="20" fill="#fff4e0"/></g>
<g class="nt-lead"><ellipse cy="4" rx="100" ry="14" fill="#4a3d30" fill-opacity=".22"/><g transform="scale(-1 1)">${sideGoose({ head: glasses, chest: tie })}</g></g>
<g class="nt-goose"><ellipse class="nt-shadow" cy="4" rx="110" ry="15" fill="#4a3d30" fill-opacity=".25"/><g class="nt-hop"><g class="nt-load">
<g transform="translate(-48 -124)"><g class="nt-stack"><g class="nt-sway">${stack}</g></g></g>
${sideGoose({ body: '#b5afa4', wing: '#979186', line: '#736d63', tuft: true })}
</g></g></g>
${leaves}
<g class="nt-eagle">
<g transform="translate(-10 -16)"><g class="nt-wing">${eagleWing('#6b4a2f', '#4e3522')}</g></g>
<g transform="translate(-6 60)"><g class="nt-tag"><path d="M0 0 L-44 -6" stroke="#7d6248" stroke-width="3"/><g transform="translate(-44 -6) rotate(6)"><rect x="-166" y="-4" width="166" height="44" rx="6" fill="#e2574c" stroke="#9e2a22" stroke-width="3"/><circle cx="-12" cy="18" r="5" fill="#fff"/><text x="-90" y="27" font-size="24" font-weight="900" fill="#fff" text-anchor="middle">ДЕДЛАЙН</text></g></g></g>
<path d="M-70 -6 L-150 -30 L-140 0 L-156 22 L-70 14 Z" fill="#f6f2e8" stroke="#cfc6b2" stroke-width="3"/>
<ellipse cx="0" cy="0" rx="82" ry="36" fill="#7a5233" stroke="#4e3522" stroke-width="4"/>
<path d="M0 30 L-6 64 M18 30 L22 66" stroke="#e8b83a" stroke-width="7" stroke-linecap="round"/><path d="M-20 64 L-6 64 L6 72 M8 66 L22 66 L34 74" stroke="#e8b83a" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="78" cy="-22" r="30" fill="#f6f2e8" stroke="#cfc6b2" stroke-width="3"/>
<path d="M98 -32 C124 -34 136 -20 128 -2 C122 -12 112 -14 100 -12 Z" fill="#e8b83a" stroke="#b48a1e" stroke-width="2"/>
<circle cx="88" cy="-30" r="5" fill="#1b1c20"/><path d="M74 -44 L100 -36" stroke="#3a2a1c" stroke-width="5" stroke-linecap="round"/>
<g transform="translate(10 -20)"><g class="nt-wing">${eagleWing('#8a5d3b', '#4e3522')}</g></g>
</g>
</svg>
<div class="nt-bar"></div><div class="nt-bar nt-low"></div>
<div class="nt-logo">В мире животных</div>
<div class="nt-sub" style="--d:.4s;--e:2.6s">Перед нами гусь серый в период спринта</div>
<div class="nt-sub" style="--d:2.75s;--e:5s">Самец пытается унести в гнездо больше задач, чем способен поднять</div>
<div class="nt-sub" style="--d:5.1s;--e:7s">Брачный танец перед тимлидом</div>
<div class="nt-sub" style="--d:7.1s;--e:9.2s">Увы, не каждый гусь доживёт до релиза</div>
<div class="nt-end"><span>Природа беспощадна.</span><b>Overload</b></div>`;
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
      await kaitenAddComment(config.snapshotCardId, planEndComment(takePlanEnd({ cards, snapshot: start, settings, now: Date.now(), boardId: board, config: boardConfig(board, config) }), config));
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
      const capacityLog = kaitenCardComments(config.snapshotCardId).then(capacityLogFromComments).catch(() => null);
      const sprintJob = Promise.all([sprintReportLoad({ cards, boardId: board, now, columns, load: kaitenSprint, store: { read: (key) => readStored(key, null), write: writeStored } }), capacityLog])
        .then(([loaded, log]) => ({ lines: sprintReportLines({ ...loaded, capacity: capacityDays(settings), capacityLog: log, labels: settingsNow.labels, now }) }))
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
  const GOOSE_SCENES = [{ name: 'lift', draw: liftScene, end: 11.3 }, { name: 'bar', draw: barScene, end: 10.6 }, { name: 'rocket', draw: rocketScene, end: 10.8 }, { name: 'nature', draw: natureScene, end: 11 }, { name: 'noir', draw: noirScene, end: 11.6 }];
  const releaseGeese = (names) => {
    if ($('.geese')) return;
    const last = GOOSE_SCENES.findIndex((item) => item.name === readStored('gooseScene', null));
    const pick = GOOSE_SCENES[(last + 1) % GOOSE_SCENES.length];
    writeStored('gooseScene', pick.name);
    const scene = document.createElement('div');
    scene.className = 'geese';
    scene.dataset.scene = pick.name;
    scene.style.setProperty('--end', `${pick.end}s`);
    scene.innerHTML = pick.draw(names);
    scene.addEventListener('click', () => scene.remove());
    shadow.appendChild(scene);
    window.setTimeout(() => scene.remove(), (pick.end + .8) * 1000);
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
