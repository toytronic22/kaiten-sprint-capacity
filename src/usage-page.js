// Страница «Как пользоваться» для GitHub Pages: разделы docs/USAGE.md, переведённые в HTML.

const USAGE_SECTIONS = ['Как пользоваться', 'Как считает', 'Если не работает'];

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inline = (text) => escapeHtml(text)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

// Только то, что есть в README: заголовки, абзацы, жирный, код, ссылки, списки с вложенностью, блоки кода.
function markdownToHtml(markdown) {
  const out = [];
  let paragraph = [];
  let lists = [];
  let code = null;

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(inline).join(' ')}</p>`);
    paragraph = [];
  };
  const closeLists = (indent) => {
    while (lists.length && lists[lists.length - 1].indent > indent) out.push(`</li></${lists.pop().tag}>`);
  };

  for (const line of markdown.split('\n')) {
    if (code) {
      if (line.startsWith('```')) {
        out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }
    if (line.startsWith('```')) {
      flushParagraph();
      closeLists(-1);
      code = [];
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeLists(-1);
      continue;
    }
    const heading = line.match(/^(#{1,6}) (.*)$/);
    if (heading) {
      flushParagraph();
      closeLists(-1);
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    const item = line.match(/^( *)([-*]|\d+\.) (.*)$/);
    if (item) {
      flushParagraph();
      const indent = item[1].length;
      const tag = /\d/.test(item[2]) ? 'ol' : 'ul';
      closeLists(indent);
      const top = lists[lists.length - 1];
      if (!top || top.indent < indent) {
        out.push(`<${tag}>`);
        lists.push({ indent, tag });
      } else {
        out.push('</li>');
      }
      out.push(`<li>${inline(item[3])}`);
      continue;
    }
    if (lists.length && /^\s/.test(line)) {
      out.push(` ${inline(line.trim())}`);
      continue;
    }
    closeLists(-1);
    paragraph.push(line.trim());
  }
  if (code) throw new Error('В README не закрыт блок кода ```');
  flushParagraph();
  closeLists(-1);
  return out.join('\n');
}

// Нет раздела — сборка падает: страница не должна молча потерять половину инструкции после переименования.
function readmeSections(readme, titles) {
  const parts = readme.split(/^## /m).slice(1);
  return titles.map((title) => {
    const part = parts.find((text) => text.split('\n')[0].trim() === title);
    if (!part) throw new Error(`В README.md нет раздела «## ${title}» — страницу «Как пользоваться» не собрать`);
    return `## ${part.trimEnd()}`;
  }).join('\n\n');
}

function usagePage(readme) {
  const body = markdownToHtml(readmeSections(readme, USAGE_SECTIONS));
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ёмкость спринта — как пользоваться</title>
<style>
body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 820px; margin: 32px auto; padding: 0 16px; color: #1f2328; background: #fff; }
h2 { margin-top: 32px; padding-bottom: 4px; border-bottom: 1px solid #d0d7de; }
code { font: 13px ui-monospace, Menlo, monospace; background: #f6f8fa; padding: 1px 4px; border-radius: 4px; }
pre { background: #f6f8fa; padding: 10px 12px; border-radius: 6px; overflow-x: auto; }
pre code { padding: 0; }
li { margin: 4px 0; }
a { color: #0969da; }
</style>
</head>
<body>
<p><a href="./">← Установка</a></p>
<h1>Ёмкость спринта — как пользоваться</h1>
${body}
</body>
</html>
`;
}

if (typeof module !== 'undefined') module.exports = { USAGE_SECTIONS, markdownToHtml, readmeSections, usagePage };
