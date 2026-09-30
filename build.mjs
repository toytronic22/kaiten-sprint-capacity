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

const script = wrap([core.replace(EXPORT_LINE, ''), holstCore.replace(EXPORT_LINE, ''), read('./src/kaiten.js'), read('./src/toast.js'), read('./src/ui.js'), 'sprintCapacityMount(SPRINT_CAPACITY);']);
const holstScript = wrap([holstCore.replace(EXPORT_LINE, ''), read('./src/toast.js'), read('./src/holst.js'), "holstSprintRun().catch((error) => sprintToast(`Ёмкость спринта: ${error.message || error}`, true, 'fail'));"]);

const PAGES = 'https://toytronic22.github.io/kaiten-sprint-capacity/';
const makeBookmarklet = (file, failure) => {
  const loader = `(()=>{const s=document.createElement('script');s.src='${PAGES}${file}?t='+Date.now();s.onload=()=>s.remove();s.onerror=()=>{s.remove();alert('${failure}')};document.head.appendChild(s)})()`;
  new Function(loader);
  return `javascript:${encodeURIComponent(loader)}`;
};
const bookmarklet = makeBookmarklet('sprint-capacity.js', 'Ёмкость спринта: панель не загрузилась, проверьте интернет');
const holstBookmarklet = makeBookmarklet('holst-sprint.js', 'Ёмкость спринта: скрипт для Holst не загрузился, проверьте интернет');
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const installPage = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ёмкость спринта — закладка</title>
<style>
body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 720px; margin: 32px auto; padding: 0 16px; color: #1f2328; background: #fff; }
.bookmarklet { display: inline-block; padding: 8px 14px; border-radius: 8px; background: #0969da; color: #fff; font-weight: 600; text-decoration: none; }
textarea { width: 100%; height: 120px; font: 12px/1.4 ui-monospace, Menlo, monospace; }
li { margin: 4px 0; }
</style>
</head>
<body>
<h1>Ёмкость спринта</h1>
<p>Перетащите кнопку на панель закладок:</p>
<p><a class="bookmarklet" href="${escapeHtml(bookmarklet)}">Ёмкость спринта</a></p>
<ol>
<li>Откройте доску Development(P2P) в Kaiten.</li>
<li>Нажмите закладку — справа появится панель. Нажмите ещё раз — панель закроется.</li>
</ol>
<p>Закладка при каждом нажатии берёт свежую версию панели с этой страницы — перетаскивать заново после обновлений не нужно.</p>
<p>Не перетаскивается — создайте закладку вручную и вставьте в поле адреса этот код:</p>
<textarea readonly onclick="this.select()">${escapeHtml(bookmarklet)}</textarea>
<h2>Бомба и розовый список в Holst</h2>
<p>Вторая закладка — для доски Holst:</p>
<p><a class="bookmarklet" href="${escapeHtml(holstBookmarklet)}">Спринт → Holst</a></p>
<ol>
<li>В панели калькулятора нажмите «В Holst» — откроется доска Holst команды.</li>
<li>Когда доска загрузится, нажмите закладку «Спринт → Holst».</li>
<li>Бомба сегодняшнего дня встанет на процент Done, розовый список разложится по колонкам Kaiten. Итог появится сверху.</li>
</ol>
<p>Код для ручной закладки:</p>
<textarea readonly onclick="this.select()">${escapeHtml(holstBookmarklet)}</textarea>
</body>
</html>
`;

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
write('./dist/sprint-capacity.js', script);
write('./dist/holst-sprint.js', holstScript);
write('./dist/bookmarklet.txt', `${bookmarklet}\n`);
write('./dist/holst-bookmarklet.txt', `${holstBookmarklet}\n`);
write('./dist/install.html', installPage);
mkdirSync(new URL('./dist/memes/', import.meta.url), { recursive: true });
for (const meme of ['ok.png', 'fail.png']) copyFileSync(new URL(`./assets/memes/${meme}`, import.meta.url), new URL(`./dist/memes/${meme}`, import.meta.url));
console.log(`Готово: панель ${Math.round(script.length / 1024)} КБ, скрипт Holst ${Math.round(holstScript.length / 1024)} КБ, закладки ${bookmarklet.length} и ${holstBookmarklet.length} знаков`);
