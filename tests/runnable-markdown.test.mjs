import assert from 'node:assert/strict';
import test from 'node:test';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { getRunnableCode } from '../src/utils/runnableMarkdown.js';

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkRehype).use(rehypeKatex);
const render = (markdown) => processor.runSync(processor.parse(markdown));

test('only a Python fence with a standalone run metadata token is interactive', () => {
  for (const [info, expected] of [
    ['python', false], ['python run', true], ['python title=example run extra', true],
    ['python runny', false], ['python title=run', false], ['javascript run', false],
    ['run', false], ['', false], ['python\trun', true],
  ]) {
    const pre = render('```' + info + '\nprint(1)\n```').children[0];
    assert.equal(Boolean(getRunnableCode(pre)), expected, info);
    if (expected) assert.deepEqual(getRunnableCode(pre), { language: 'python', initialCode: 'print(1)' });
  }
});

test('preserves indentation, blank lines and trailing whitespace for Reset', () => {
  const code = '\nif True:\n    print(1)  \n\n';
  assert.equal(getRunnableCode(render('```python run\n' + code + '\n```').children[0]).initialCode, code);
  assert.equal(getRunnableCode(render('```python run\n```').children[0]).initialCode, '');
});

test('supports tilde fences and nested list fences without affecting normal Markdown', () => {
  const tree = render('# Heading\n\nText **bold** and *italic* with `python run` and [link](https://example.com).\n\n- Item\n\n  ~~~python run\n  print(2)\n  ~~~\n\n## After\n\n$x^2$');
  const tags = [], blocks = [];
  function walk(node) {
    if (node.tagName) tags.push(node.tagName);
    if (node.tagName === 'pre') blocks.push(getRunnableCode(node));
    node.children?.forEach(walk);
  }
  walk(tree);
  assert.deepEqual(blocks, [{ language: 'python', initialCode: 'print(2)' }]);
  for (const tag of ['h1', 'p', 'strong', 'em', 'code', 'a', 'ul', 'li', 'h2', 'math']) assert.ok(tags.includes(tag), tag);
});
