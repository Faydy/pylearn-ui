import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { buildProblemQuery, readProblemFilters } from '../src/utils/problemFilters.js';
import { isProblemSolved, solvedProblemIds } from '../src/utils/solvedProblems.js';

function queryClient() {
  const requests = [];
  const client = createClient('https://fixture.invalid', 'fixture-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url) => { requests.push(new URL(url)); return Response.json([], { headers: { 'content-range': '0-0/0' } }); } },
  });
  return { client, requests };
}

test('only a boolean true solved row marks a problem; attempts/submissions/local-looking state do not', () => {
  assert.equal(isProblemSolved({ solved_status: [{ solved: true }] }), true);
  for (const problem of [
    { solved_status: [{ solved: false }], attempts_count: 3 },
    { solved_status: [{ solved: null }] },
    { solved_status: [{ solved: 'true' }] },
    { submissions: [{ status: 'accepted' }], solved: true },
    { solved_status: [] }, {},
  ]) assert.equal(isProblemSolved(problem), false);
  assert.deepEqual([...solvedProblemIds([{ problem_id: 1, solved: true }, { problem_id: 2, solved: false }])], ['1']);
});

for (const status of ['', 'solved', 'unsolved']) {
  test(`status=${status || 'all'} embeds only the current user's solved=true rows in the paginated problem request`, async () => {
    const { client, requests } = queryClient();
    await buildProblemQuery(client, { userId: 'user-a', filters: { status } }).range(30, 59);
    assert.equal(requests.length, 1);
    const params = requests[0].searchParams;
    assert.equal(params.get('solved_status.user_id'), 'eq.user-a');
    assert.equal(params.get('solved_status.solved'), 'eq.true');
    assert.equal(params.get('solved_status'), status === 'unsolved' ? 'is.null' : null);
    assert.equal(params.get('select').includes('user_problem_status!inner'), status === 'solved');
    assert.equal(params.get('offset'), '30');
    assert.equal(params.get('limit'), '30');
  });
}

test('anonymous query has no personal relation or status filtering', async () => {
  const { client, requests } = queryClient();
  await buildProblemQuery(client, { filters: { status: 'solved' } }).range(0, 29);
  assert.equal(requests[0].searchParams.get('select').includes('user_problem_status'), false);
  assert.equal(requests[0].searchParams.has('solved_status.user_id'), false);
  assert.equal(readProblemFilters(new URLSearchParams('status=solved'), {}, undefined, false).filters.status, '');
});
