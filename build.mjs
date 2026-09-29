import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const EXPORT_LINE = /^if \(typeof module !== 'undefined'\) module\.exports = .*$/m;

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const write = (path, text) => writeFileSync(new URL(path, import.meta.url), text);

const core = read('./src/core.js');
if (!EXPORT_LINE.test(core)) {
  throw new Error('В src/core.js нет строки с module.exports — сборка остановлена, проверьте её вид');
}

const source = [core.replace(EXPORT_LINE, ''), read('./src/kaiten.js'), read('./src/ui.js'), 'sprintCapacityMount(SPRINT_CAPACITY);']
  .join('\n')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .join('\n');
const script = `(function () {\n'use strict';\n${source}\n})();\n`;
new Function(script);

const bookmarklet = `javascript:${encodeURIComponent(script)}`;
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
<p>Не перетаскивается — создайте закладку вручную и вставьте в поле адреса этот код:</p>
<textarea readonly onclick="this.select()">${escapeHtml(bookmarklet)}</textarea>
</body>
</html>
`;

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
write('./dist/sprint-capacity.js', script);
write('./dist/bookmarklet.txt', `${bookmarklet}\n`);
write('./dist/install.html', installPage);
console.log(`Готово: скрипт ${Math.round(script.length / 1024)} КБ, закладка ${Math.round(bookmarklet.length / 1024)} КБ`);
