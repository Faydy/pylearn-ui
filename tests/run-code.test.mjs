import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

// Load the actual Vite module with a public test API URL, without changing production code.
const bundle = await build({
  configFile: false,
  logLevel: 'silent',
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('https://api.example.test/') },
  build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('../src/utils/api.js', import.meta.url)), formats: ['es'] } },
});
const { runCode } = await import(`data:text/javascript;base64,${Buffer.from(bundle[0].output[0].code).toString('base64')}`);

test('uses the existing POST /run contract and preserves code, stdin and stdout', async (t) => {
  const code = 'print(input())\n', input = '5\n7';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.example.test/run');
    assert.equal(options.method, 'POST');
    assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
    assert.deepEqual(JSON.parse(options.body), { code, input });
    return Response.json({ success: true, output: '  12\n\n', time: 0.01, memory: 100 });
  });
  assert.deepEqual(await runCode(code, input), { success: true, output: '  12\n\n' });
});

test('defaults to empty stdin and preserves empty successful output', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(JSON.parse(options.body).input, '');
    return Response.json({ success: true, output: '' });
  });
  assert.deepEqual(await runCode('x = 1'), { success: true, output: '' });
});

test('runtime errors and backend errors use the existing output/error fields', async (t) => {
  const responses = [
    Response.json({ success: false, output: 'Traceback\nZeroDivisionError', status: 'Runtime Error' }),
    Response.json({ error: 'Prea multe cereri.' }, { status: 429 }),
  ];
  t.mock.method(globalThis, 'fetch', async () => responses.shift());
  assert.deepEqual(await runCode('1/0'), { success: false, output: 'Traceback\nZeroDivisionError' });
  assert.deepEqual(await runCode('print(1)'), { success: false, output: 'Prea multe cereri.' });
});

test('invalid JSON and missing success use the existing fallback messages', async (t) => {
  const responses = [new Response('Bad Gateway', { status: 502 }), Response.json({}), new Response('invalid')];
  t.mock.method(globalThis, 'fetch', async () => responses.shift());
  assert.deepEqual(await runCode('print(1)'), { success: false, output: 'Eroare necunoscută la execuție. HTTP 502.' });
  for (let i = 0; i < 2; i += 1) assert.deepEqual(await runCode('print(1)'), { success: false, output: 'Eroare necunoscută la execuție.' });
});

test('network failure can be followed by a successful run', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    if (calls++ === 0) throw new Error('Failed to fetch');
    return Response.json({ success: true, output: '1\n' });
  });
  assert.deepEqual(await runCode('print(1)'), { success: false, output: 'Eroare de conexiune la server: Failed to fetch' });
  assert.deepEqual(await runCode('print(1)'), { success: true, output: '1\n' });
});
