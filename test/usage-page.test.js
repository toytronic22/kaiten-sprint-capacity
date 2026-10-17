const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { readFileSync } = require('node:fs');
const { USAGE_SECTIONS, markdownToHtml, readmeSections, usagePage } = require('../src/usage-page.js');

const readme = readFileSync(path.join(__dirname, '..', 'docs', 'USAGE.md'), 'utf8');

test('markdownToHtml переводит заголовок, жирный, код и ссылку, а HTML экранирует', () => {
  const html = markdownToHtml('## Строки\n\n**Бэк** — `48 / 30`, <b> [доска](https://example.com/a?x=1&y=2)');

  assert.equal(html, '<h2>Строки</h2>\n<p><b>Бэк</b> — <code>48 / 30</code>, &lt;b&gt; <a href="https://example.com/a?x=1&amp;y=2">доска</a></p>');
});

test('markdownToHtml склеивает строки абзаца и закрывает вложенный список', () => {
  const html = markdownToHtml('первая\nвторая\n\n- верх\n  - низ\n  - ещё\n- снова верх\n\n1. раз\n2. два');

  assert.equal(html, [
    '<p>первая вторая</p>',
    '<ul>', '<li>верх', '<ul>', '<li>низ', '</li>', '<li>ещё', '</li></ul>', '</li>', '<li>снова верх', '</li></ul>',
    '<ol>', '<li>раз', '</li>', '<li>два', '</li></ol>',
  ].join('\n'));
});

test('markdownToHtml оставляет блок кода как есть', () => {
  const html = markdownToHtml('```\nБэк  20 + 28 = 48 / 30 <x>\n```');

  assert.equal(html, '<pre><code>Бэк  20 + 28 = 48 / 30 &lt;x&gt;</code></pre>');
});

test('markdownToHtml не собирает страницу с незакрытым блоком кода', () => {
  assert.throws(() => markdownToHtml('```\nкод'), /не закрыт блок кода/);
});

test('readmeSections берёт разделы по названию и падает, если раздела нет', () => {
  const text = '# Заголовок\n\n## Один\nа\n\n## Два\nб\n\n## Три\nв\n';

  assert.equal(readmeSections(text, ['Три', 'Один']), '## Три\nв\n\n## Один\nа');
  assert.throws(() => readmeSections(text, ['Четыре']), /нет раздела «## Четыре»/);
});

test('страница из настоящего README — три раздела для команды, без установки и раздела для разработчиков', () => {
  const html = usagePage(readme);

  for (const title of USAGE_SECTIONS) assert.ok(html.includes(`<h2>${title}</h2>`), title);
  assert.ok(!html.includes('Для разработчиков'));
  assert.ok(!html.includes('<h2>Установка с нуля</h2>'));
  assert.ok(html.includes('<pre><code>Бэк  20 + 28 = 48 / 30</code></pre>'));
  assert.ok(!/\*\*|```/.test(html), 'в HTML не осталось разметки Markdown');
});
