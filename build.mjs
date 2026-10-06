import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const EXPORT_LINE = /^if \(typeof module !== 'undefined'\) module\.exports = .*$/m;

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const write = (path, text) => writeFileSync(new URL(path, import.meta.url), text);

const core = read('./src/core.js');
if (!EXPORT_LINE.test(core)) {
  throw new Error('В src/core.js нет строки с module.exports — сборка остановлена, проверьте её вид');
}

const holstCore = read('./src/holst-core.js');
if (!EXPORT_LINE.test(holstCore)) {
  throw new Error('В src/holst-core.js нет строки с module.exports — сборка остановлена, проверьте её вид');
}

const reportCore = read('./src/report-core.js');
if (!EXPORT_LINE.test(reportCore)) {
  throw new Error('В src/report-core.js нет строки с module.exports — сборка остановлена, проверьте её вид');
}

const sprintCore = read('./src/sprint-core.js');
if (!EXPORT_LINE.test(sprintCore)) {
  throw new Error('В src/sprint-core.js нет строки с module.exports — сборка остановлена, проверьте её вид');
}

const wrap = (parts) => {
  const source = parts
    .join('\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
  const text = `(function () {\n'use strict';\n${source}\n})();\n`;
  new Function(text);
  return text;
};

const holstLogin = read('./src/holst-login.js');
const script = wrap([core.replace(EXPORT_LINE, ''), holstCore.replace(EXPORT_LINE, ''), reportCore.replace(EXPORT_LINE, ''), sprintCore.replace(EXPORT_LINE, ''), read('./src/kaiten.js'), read('./src/toast.js'), holstLogin, read('./src/holst.js'), read('./src/time.js'), read('./src/report.js'), read('./src/ui.js'), 'sprintCapacityMount(SPRINT_CAPACITY);']);
const holstScript = wrap([read('./src/toast.js'), holstLogin, 'holstHandoff();']);

const PAGES = 'https://toytronic22.github.io/kaiten-sprint-capacity/';
const makeBookmarklet = (file, failure) => {
  const loader = `(()=>{const s=document.createElement('script');s.src='${PAGES}${file}?t='+Date.now();s.onload=()=>s.remove();s.onerror=()=>{s.remove();alert('${failure}')};document.head.appendChild(s)})()`;
  new Function(loader);
  return `javascript:${encodeURIComponent(loader)}`;
};
const bookmarklet = makeBookmarklet('sprint-capacity.js', 'Ёмкость спринта: панель не загрузилась, проверьте интернет');
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const installPage = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ёмкость спринта — закладка</title>
<style>
body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 720px; margin: 32px auto; padding: 0 16px; color: #1f2328; background: #fff; }
.bookmarklet { display: inline-block; margin: 8px 0 4px; padding: 8px 14px; border-radius: 8px; background: #0969da; color: #fff; font-weight: 600; text-decoration: none; }
textarea { width: 100%; height: 120px; font: 12px/1.4 ui-monospace, Menlo, monospace; }
li { margin: 4px 0; }
</style>
</head>
<body>
<h1>Ёмкость спринта</h1>
<ol>
<li>Перетащите синюю кнопку на панель закладок. Панели закладок не видно — нажмите Cmd+Shift+B (на Windows — Ctrl+Shift+B).<br><a class="bookmarklet" href="${escapeHtml(bookmarklet)}">Ёмкость спринта</a></li>
<li>Откройте Kaiten и нажмите эту закладку — справа появится панель. Вверху панели нажмите на название доски и выберите свою: Staff Core или Staff Mobile.</li>
<li>Нажмите «Команда и дни» и заполните поля. «нет, чел.-дн» — сколько дней за спринт люди в отпуске, на отгуле или дежурстве. «SP в день» — сколько SP один человек делает за день. Серые числа — то, что будет, если поле не заполнять.</li>
<li>Войдите в Holst в этом же браузере.</li>
<li>Вернитесь в Kaiten. Вверху панели, левее ↻, нажмите красную букву H — ниже появится кнопка «Открыть Holst», нажмите её.</li>
<li>Holst откроется в новой вкладке. Нажмите там закладку «Ёмкость спринта». Holst напишет «Вход работает — эту вкладку можно закрыть», а буква H в панели станет зелёной. Готово.</li>
</ol>
<p>Шаги 4–6 — один раз на браузер.</p>
<p>Сводка спринта в Time (доска Staff Core): нажмите красную букву T, вставьте ссылку на канал Time и нажмите «Открыть Time». В открывшейся вкладке Time нажмите эту же закладку — буква T станет зелёной. Вкладку Time не закрывайте: через неё уходят сводки.</p>
<p><a href="https://github.com/toytronic22/kaiten-sprint-capacity#readme">Как пользоваться и как считает</a></p>
<p>Не перетаскивается — создайте закладку вручную и вставьте в поле адреса этот код:</p>
<textarea readonly onclick="this.select()">${escapeHtml(bookmarklet)}</textarea>
</body>
</html>
`;

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
write('./dist/sprint-capacity.js', script);
write('./dist/holst-sprint.js', holstScript);
write('./dist/bookmarklet.txt', `${bookmarklet}\n`);
write('./dist/install.html', installPage);
mkdirSync(new URL('./dist/memes/', import.meta.url), { recursive: true });
for (const meme of ['ok.png', 'fail.png']) copyFileSync(new URL(`./assets/memes/${meme}`, import.meta.url), new URL(`./dist/memes/${meme}`, import.meta.url));
console.log(`Готово: панель ${Math.round(script.length / 1024)} КБ, скрипт Holst ${Math.round(holstScript.length / 1024)} КБ, закладка ${bookmarklet.length} знаков`);
