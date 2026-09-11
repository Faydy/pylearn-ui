import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('curriculum RPC aggregates visible problems and personal solved state under RLS', async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated;
      create table grades (id integer primary key, name text);
      create table chapters (id integer primary key, title text, section text, grade_id integer, order_index integer);
      create table problems (id integer primary key, chapter_id integer, visible boolean default true);
      create table user_problem_status (user_id uuid, problem_id integer, solved boolean, attempts_count integer, primary key(user_id, problem_id));
      grant select on grades, chapters, problems to anon, authenticated;
      grant select on user_problem_status to authenticated;
      alter table problems enable row level security;
      create policy visible_problems on problems for select using (visible);
      alter table user_problem_status enable row level security;
      -- Even if a teacher can read others' status, the RPC must count only their own.
      create policy readable_status on user_problem_status for select to authenticated using (true);
      insert into grades values (1, 'Clasa a IX-a'), (2, 'Clasa a X-a');
      insert into chapters values (1,'Operatori','Algoritmi',1,1), (2,'Vectori','Vectori',1,2), (3,'Gol','Vectori',1,3), (4,'Altă clasă',null,2,1), (5,'Fără secțiune',null,1,4);
      insert into problems values (1,1,true),(2,1,true),(3,1,true),(4,2,true),(5,4,true),(6,1,false);
      insert into problems select id, 2, true from generate_series(100,1299) id;
      insert into user_problem_status values
        ('00000000-0000-0000-0000-000000000001',1,true,1),
        ('00000000-0000-0000-0000-000000000001',2,false,9),
        ('00000000-0000-0000-0000-000000000001',4,true,1),
        ('00000000-0000-0000-0000-000000000001',6,true,1),
        ('00000000-0000-0000-0000-000000000002',2,true,1);
    `);
    await db.exec(await readFile(new URL('../migrations/202609110001_problem_curriculum.sql', import.meta.url), 'utf8'));
    await db.exec("set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)");
    const rows = async (grade, chapter = null) => (await db.query('select * from public.get_problem_curriculum($1,$2)', [grade, chapter])).rows;
    await t.test('grade counts exceed the API row cap, exclude hidden problems, preserve empty chapters', async () => {
      const data = await rows(1);
      assert.deepEqual(data.map((row) => [row.chapter_id, Number(row.total_problem_count), Number(row.solved_problem_count)]), [[1,3,1],[2,1201,1],[3,0,0],[5,0,0]]);
      assert.equal(data.reduce((sum, row) => sum + Number(row.total_problem_count), 0), 1204);
      assert.equal(data[0].grade_name, 'Clasa a IX-a');
    });
    await t.test('chapter and combined scopes cannot include another chapter or grade', async () => {
      assert.deepEqual((await rows(null,1)).map((row) => row.chapter_id), [1]);
      assert.deepEqual(await rows(2,1), []);
      assert.deepEqual(await rows(999), []);
      await assert.rejects(rows(null), /Selectează o clasă/);
    });
    await t.test('other users and failed attempts do not contribute to personal progress', async () => {
      await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)");
      const data = await rows(1);
      assert.equal(Number(data[0].solved_problem_count), 1);
      assert.equal(Number(data[1].solved_problem_count), 0);
    });
    await t.test('anonymous users receive totals without accessing private status or fabricated progress', async () => {
      await db.exec("reset role; set role anon; select set_config('request.jwt.claim.sub','',false)");
      await assert.rejects(db.query('select * from user_problem_status'), /permission denied/);
      const data = await rows(1);
      assert.equal(data.length, 4);
      assert.equal(Number(data[1].total_problem_count), 1201);
      assert.ok(data.every((row) => row.solved_problem_count === null));
    });
  } finally { await db.close(); }
});
