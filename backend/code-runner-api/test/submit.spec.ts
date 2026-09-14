import { env, createExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { executionVerdict, safeErrorDetails } from '../src/verdict';

const hidden = 'HIDDEN_INPUT_SENTINEL';
const expected = 'HIDDEN_EXPECTED_SENTINEL';
const encode = (text: string) => Buffer.from(text).toString('base64');

describe('POST /submit verdict contract', () => {
  it.each([
    [3, expected, '', 'accepted'],
    [3, 'incorrect', '', 'wrong_answer'],
    [4, '', '', 'wrong_answer'],
    [11, '', 'ZeroDivisionError: division by zero', 'runtime_error'],
    [11, '', 'IndexError: list index out of range', 'runtime_error'],
    [11, '', `NameError: ${hidden}`, 'runtime_error'],
    [11, '', `ValueError: ${hidden}`, 'runtime_error'],
    [11, '', 'SyntaxError: invalid syntax', 'compile_error'],
    [6, '', 'SyntaxError: invalid syntax', 'compile_error'],
    [5, '', '', 'time_limit'],
    [11, '', 'MemoryError', 'memory_limit'],
    [13, '', 'private Worker stack/secret', 'internal_error'],
    [14, '', '', 'internal_error'],
    [99, '', '', 'internal_error'],
    [503, '', '', 'internal_error'],
    [429, '', '', 'internal_error'],
  ])('Judge status %s → %s / %s / %s', async (id, stdout, stderr, verdict) => {
    const recorded: string[] = [];
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const path = new URL(String(url)).pathname;
      if (path === '/auth/v1/user') return Response.json({ id: '00000000-0000-0000-0000-000000000001' });
      if (path === '/rest/v1/problems') return Response.json({ id: 1 });
      if (path === '/rest/v1/profiles') return Response.json({ role: 'admin' });
      if (path === '/rest/v1/test_cases') return Response.json([{ id: 1, input: hidden, expected_output: expected, is_sample: false }]);
      if (path === '/rest/v1/rpc/record_problem_submission') {
        recorded.push(JSON.parse(String(init?.body)).p_status);
        return Response.json({ first_solve: false, xp_awarded: 0 });
      }
      if (path === '/submissions') {
        if ((id === 503 || id === 429)) return Response.json({ error: 'secret' }, { status: id });
        return Response.json({ token: 'test' });
      }
      if (path === '/submissions/test') return Response.json({ status: { id, description: 'untrusted description' }, stdout: encode(stdout), stderr: encode(stderr) });
      throw new Error(`Unexpected path: ${path}`);
    });
    try {
      const response = await worker.fetch(new Request('https://example.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer fixture' },
        body: JSON.stringify({ code: 'print(1 / 0)', problemId: 1 }),
      }), { ...env, SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture' }, createExecutionContext());
      const data = await response.json() as Record<string, unknown>;
      expect(data).toMatchObject({ status: verdict, verdict });
      expect(recorded).toEqual((id === 503 || id === 429) ? [] : [verdict]);
      if (id !== 503 && id !== 429) expect(data).toMatchObject({ firstSolve: false, xpAwarded: 0, coinsAwarded: 0 });
      const json = JSON.stringify(data);
      for (const secret of [hidden, expected, 'private Worker stack', 'secret', 'untrusted description']) expect(json).not.toContain(secret);
      if (stderr.startsWith('ZeroDivisionError')) expect(data.errorDetails).toBe('ZeroDivisionError: division by zero');
    } finally { spy.mockRestore(); }
  });
  it('unfinished jobs are infrastructure failures; diagnostics cannot leak arbitrary data', () => {
    for (const id of [1, 2, 13, 14]) expect(executionVerdict({ status: { id } })).toBe('internal_error');
    expect(safeErrorDetails('runtime_error', `Exception: ${hidden}`)).toBeNull();
    expect(safeErrorDetails('internal_error', 'SyntaxError: secret')).toBeNull();
  });
});
