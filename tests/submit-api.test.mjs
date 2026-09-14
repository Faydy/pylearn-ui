// Real HTTP POST /submit against the bundled Worker. Disposable Supabase fixtures;
// Python really executes locally, or use PYLEARN_LIVE_JUDGE=1 for the public Judge0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { submissionLabel } from '../src/utils/submissionVerdicts.js';

const temp = mkdtempSync(join(tmpdir(), 'pylearn-submit-'));
execFileSync('backend/code-runner-api/node_modules/.bin/esbuild', ['backend/code-runner-api/src/index.ts', '--bundle', '--platform=node', '--format=esm', `--outfile=${temp}/worker.mjs`]);
const { default: worker } = await import(pathToFileURL(`${temp}/worker.mjs`));
const realFetch = globalThis.fetch;
let judgeResult, recorded, failJudge = false;
const live = process.env.PYLEARN_LIVE_JUDGE === '1';
const encode = (s) => Buffer.from(s || '').toString('base64');
globalThis.fetch = async (url, init) => {
  const { pathname: path, hostname } = new URL(String(url));
  if (hostname === 'ce.judge0.com') {
    if (failJudge) return Response.json({ error: 'private judge failure' }, { status: 503 });
    if (live) return realFetch(url, init);
    if (init?.method === 'POST') {
      const body = JSON.parse(init.body);
      const execution = spawnSync('python3', ['-c', body.source_code], { input: body.stdin, encoding: 'utf8', timeout: 1000 });
      judgeResult = { status: { id: execution.error?.code === 'ETIMEDOUT' ? 5 : execution.status === 0 ? 3 : 11 }, stdout: encode(execution.stdout), stderr: encode(execution.stderr) };
      return Response.json({ token: 'local-python' });
    }
    return Response.json(judgeResult);
  }
  if (path === '/auth/v1/user') return Response.json({ id: '00000000-0000-0000-0000-000000000001' });
  if (path === '/rest/v1/problems') return Response.json({ id: 1 });
  if (path === '/rest/v1/profiles') return Response.json({ role: 'admin' });
  if (path === '/rest/v1/test_cases') return Response.json([{ id: 1, input: 'hidden_input', expected_output: '42', is_sample: false }, { id: 2, input: 'second_hidden_input', expected_output: '42', is_sample: false }]);
  if (path === '/rest/v1/rpc/record_problem_submission') {
    recorded = JSON.parse(init.body);
    return Response.json({ first_solve: false, xp_awarded: 0 });
  }
  throw new Error(`Unexpected external request ${path}`);
};
const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const response = await worker.fetch(new Request(`http://localhost${req.url}`, { method: req.method, headers: req.headers, body: Buffer.concat(chunks) }), {
    SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture',
  });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  await test(`HTTP /submit with ${live ? 'live Judge0' : 'real local Python / Judge0 adapter'}`, async (t) => {
    for (const [code, verdict, label] of [
      ['print(42)', 'accepted', 'Soluție acceptată'],
      ['print(0)', 'wrong_answer', 'Răspuns greșit'],
      ['print(1 / 0)', 'runtime_error', 'Eroare de execuție'],
      ['if True print(1)', 'compile_error', 'Eroare de sintaxă'],
      ['while True: pass', 'time_limit', 'Limită de timp depășită'],
      ['raise ValueError(input())', 'runtime_error', 'Eroare de execuție'],
      ["s = input()\nif s.startswith('second'): print(1 / 0)\nelse: print(0)", 'runtime_error', 'Eroare de execuție'],
      ['# judge failure', 'internal_error', 'Eroare la evaluare'],
    ]) {
      await t.test(verdict + ': ' + code, async () => {
        failJudge = verdict === 'internal_error'; recorded = null;
        const response = await realFetch(`http://127.0.0.1:${server.address().port}/submit`, {
          method: 'POST', headers: { Authorization: 'Bearer fixture', 'Content-Type': 'application/json' }, body: JSON.stringify({ code, problemId: 1 }),
        });
        const data = await response.json();
        assert.equal(data.verdict, verdict, JSON.stringify(data));
        assert.equal(submissionLabel(data.verdict), label);
        assert.equal(recorded?.p_status ?? null, failJudge ? null : verdict);
        assert.ok(!JSON.stringify(data).includes('hidden_input'));
        assert.ok(!JSON.stringify(data).includes('private judge failure'));
        if (code === 'print(1 / 0)') assert.equal(data.errorDetails, 'ZeroDivisionError: division by zero');
      });
    }
  });
} finally {
  globalThis.fetch = realFetch;
  await new Promise((resolve) => server.close(resolve));
  rmSync(temp, { recursive: true, force: true });
}
