// Run ONLY against disposable PGlite, never a remote database.
// npm run test:activity (PGLITE_MODULE optionally points to a separate install).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(process.env.PGLITE_MODULE
  ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const migration = await read('migrations/202609100001_bucharest_activity_and_streaks.sql');
const repair = await read('manual/repair_bucharest_activity.sql');
const uid = '00000000-0000-0000-0000-000000000001';
let db;
let installedSubmission;
let installedStreak;
let installedWeek;
let installedMonth;
const row = async (sql, params = []) => (await db.query(sql, params)).rows[0];
const profile = () => row('select total_xp, coin_balance, total_coins_earned, current_streak, longest_streak, last_active_date::text from profiles where id=$1', [uid]);

async function setup() {
  db = new PGlite();
  await db.exec(await read('tests/activity_fixture.sql'));
  // Execute the repository's ACTUAL economy trigger and existing scoped profile
  // RPCs, so XP/coins and both streak consumers are regression-tested together.
  const economy = await read('migrations/202609050012_gamification_economy.sql');
  await db.exec(economy.slice(economy.indexOf('create or replace function public.guard_profile_economy()'), economy.indexOf('create or replace function public.buy_avatar(')));
  await db.exec(await read('migrations/202609040004_activity_calendar_and_streaks.sql'));
  await db.exec(migration);
  const def = async (name) => (await row('select pg_get_functiondef(oid) as definition from pg_proc where proname=$1', [name])).definition;
  installedSubmission = await def('record_problem_submission');
  installedStreak = await def('calculate_pylearn_current_streak');
  installedWeek = await def('get_own_activity_week');
  installedMonth = await def('get_public_user_activity_month');
}

async function reset() {
  await db.exec('truncate profiles, submissions, user_problem_status, activity_log, user_category_progress, coin_transactions, problems restart identity cascade');
  await db.query('insert into profiles(id, username) values($1, $2)', [uid, 'fixture']);
  await db.exec('insert into problems select id, 6, 1 from generate_series(1, 30) id');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
  await db.exec("set timezone='UTC'");
}

// Freeze ONLY the disposable DB function clock; production has no clock/date
// injection setting or public testing overload. All other SQL is the migration.
async function at(instant) {
  assert.match(instant, /^\d{4}-\d\d-\d\dT[\d:.]+Z$/);
  await db.exec(installedSubmission.replace('v_recorded_at := clock_timestamp();', `v_recorded_at := '${instant}'::timestamptz;`));
  for (const definition of [installedStreak, installedWeek, installedMonth]) {
    await db.exec(definition.replaceAll('now()', `'${instant}'::timestamptz`));
  }
}
const submit = async (problem, status = 'accepted', fakeDate = null) => (await row(
  'select record_problem_submission($1,$2,$3,$4,null,null,$5) as result',
  [uid, problem, 'print(1)', status, fakeDate],
)).result;
const effective = async () => (await row('select calculate_pylearn_current_streak($1) as value', [uid])).value;
const activity = async () => (await db.query('select activity_date::text, problems_solved_count from activity_log where user_id=$1 order by activity_date', [uid])).rows;

await test('PostgreSQL migration and progression regressions', async (t) => {
  await setup();
  try {
    await t.test('original bug and all midnight boundaries ignore session timezone and supplied dates', async () => {
      const instants = [
        ['2026-09-08T21:05:00Z', '2026-09-09'],
        ['2026-09-08T23:00:00Z', '2026-09-09'],
        ['2026-09-09T20:55:00Z', '2026-09-09'],
        ['2026-09-09T21:05:00Z', '2026-09-10'],
        ['2026-01-08T22:05:00Z', '2026-01-09'],
        ['2026-01-09T00:00:00Z', '2026-01-09'],
        ['2026-03-29T00:59:59Z', '2026-03-29'],
        ['2026-03-29T01:00:00Z', '2026-03-29'],
        ['2026-10-25T00:59:59Z', '2026-10-25'],
        ['2026-10-25T01:00:00Z', '2026-10-25'],
      ];
      for (const timezone of ['UTC', 'Europe/Bucharest', 'America/Los_Angeles']) {
        for (const [instant, expected] of instants) {
          await reset();
          await at(instant);
          await db.query("select set_config('TimeZone', $1, false)", [timezone]);
          assert.equal((await submit(1, 'accepted', '2099-01-01')).first_solve, true);
          assert.deepEqual(await activity(), [{ activity_date: expected, problems_solved_count: 1 }]);
          assert.equal((await profile()).last_active_date, expected);
          assert.equal((await profile()).current_streak, 1);
          assert.equal((await row("select solved_at = $1::timestamptz at time zone 'UTC' as utc from user_problem_status", [instant])).utc, true);
        }
      }
    });
    await t.test('multiple first solves: one bucket, one streak day, cumulative coins/category progress', async () => {
      await reset(); await at('2026-09-08T23:00:00Z');
      assert.equal((await submit(1)).xp_awarded, 6);
      assert.equal((await profile()).coin_balance, 0);
      assert.equal((await submit(2)).xp_awarded, 6);
      assert.equal((await profile()).coin_balance, 1);
      await submit(3);
      assert.deepEqual(await activity(), [{ activity_date: '2026-09-09', problems_solved_count: 3 }]);
      assert.deepEqual(await profile(), { total_xp: 18, coin_balance: 1, total_coins_earned: 1, current_streak: 1, longest_streak: 1, last_active_date: '2026-09-09' });
      assert.equal((await row('select progress_percent from user_category_progress')).progress_percent, 10);
      assert.equal((await row('select count(*)::int as n from coin_transactions')).n, 1);
    });
    await t.test('consecutive day increments, missed day expires before next solve and then resets', async () => {
      await reset(); await at('2026-09-07T12:00:00Z'); await submit(1);
      await at('2026-09-08T12:00:00Z'); await submit(2);
      assert.equal((await profile()).current_streak, 2);
      await at('2026-09-09T12:00:00Z');
      assert.equal(await effective(), 2); // yesterday is still live
      await submit(3);
      assert.equal((await profile()).current_streak, 3);
      await db.exec('update profiles set longest_streak=8');
      await at('2026-09-11T00:00:00Z');
      assert.equal(await effective(), 0);
      const before = await profile();
      assert.equal((await row('select current_streak from get_own_activity_summary()')).current_streak, 0);
      assert.equal((await row('select current_streak from get_public_profile($1)', [uid])).current_streak, 0);
      assert.deepEqual(await profile(), before); // reads perform no resets
      await submit(4);
      assert.equal((await profile()).current_streak, 1);
      assert.equal((await profile()).longest_streak, 8);
    });
    await t.test('September 7 + September 9 resets to one', async () => {
      await reset(); await at('2026-09-07T12:00:00Z'); await submit(1);
      await at('2026-09-09T12:00:00Z'); await submit(2);
      assert.equal((await profile()).current_streak, 1);
    });
    await t.test('wrong/repeated accepted submissions never revive streak or change first-solve time/economy', async () => {
      await reset(); await at('2026-09-07T12:00:00Z'); await submit(1);
      const before = await profile();
      const beforeActivity = await activity();
      const solvedAt = await row('select solved_at::text from user_problem_status where problem_id=1');
      await at('2026-09-09T12:00:00Z');
      assert.equal((await submit(1)).first_solve, false);
      assert.equal((await submit(2, 'wrong_answer')).xp_awarded, 0);
      assert.equal((await submit(2, 'runtime_error')).xp_awarded, 0);
      assert.deepEqual(await profile(), before);
      assert.deepEqual(await activity(), beforeActivity);
      assert.deepEqual(await row('select solved_at::text from user_problem_status where problem_id=1'), solvedAt);
      assert.equal(await effective(), 0);
      assert.equal((await row('select count(*)::int as n from submissions')).n, 4);
      assert.equal((await row('select attempts_count from user_problem_status where problem_id=1')).attempts_count, 2);
    });
    await t.test('Worker-compatible six-argument call and service-only grants', async () => {
      await reset(); await at('2026-09-08T23:00:00Z');
      const signature = 'record_problem_submission(uuid,integer,text,character varying,integer,integer,date)';
      for (const role of ['anon', 'authenticated']) {
        assert.equal((await row("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, signature])).allowed, false);
        assert.equal((await row("select has_function_privilege($1,'calculate_pylearn_current_streak(uuid)','EXECUTE') as allowed", [role])).allowed, false);
      }
      await db.exec('set role service_role');
      await db.query("select public.record_problem_submission(p_user_id=>$1,p_problem_id=>1,p_code=>'x',p_status=>'accepted',p_runtime_ms=>null,p_memory_kb=>null)", [uid]);
      await db.exec('reset role');
      assert.equal((await profile()).current_streak, 1);
    });
    await t.test('late progression failure rolls back submission, status, XP, coins, activity and streak', async () => {
      await reset(); await at('2026-09-08T23:00:00Z');
      await db.exec('update profiles set total_xp=9');
      const before = await profile();
      await db.exec("create function fail_category() returns trigger language plpgsql as $$ begin raise exception 'forced category failure'; end $$; create trigger fail_category before insert on user_category_progress for each row execute function fail_category()");
      await assert.rejects(submit(1), /forced category failure/);
      assert.deepEqual(await profile(), before);
      for (const table of ['submissions', 'user_problem_status', 'activity_log', 'coin_transactions']) {
        assert.equal((await row(`select count(*)::int as n from ${table}`)).n, 0);
      }
      await db.exec('drop trigger fail_category on user_category_progress; drop function fail_category()');
    });
    await t.test('month/week RPCs use DATEs, exclude future/repeat activity and handle Bucharest new year', async () => {
      await reset(); await at('2026-09-08T23:00:00Z'); await submit(1); await submit(2);
      assert.equal((await row('select activity_date::text from get_own_activity_week()')).activity_date, '2026-09-09');
      assert.equal((await row('select activity_date::text from get_public_user_activity_month($1,2026,9)', [uid])).activity_date, '2026-09-09');
      await assert.rejects(db.query('select * from get_public_user_activity_month($1,2026,10)', [uid]), /Luna/);
      await at('2026-12-31T22:05:00Z');
      await db.exec("set timezone='America/Los_Angeles'");
      await submit(3);
      assert.equal((await row('select activity_date::text from get_public_user_activity_month($1,2027,1)', [uid])).activity_date, '2027-01-01');
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await assert.rejects(db.query('select * from get_own_activity_week()'), /autentificat/);
    });
    await t.test('future activity cannot seed effective streak', async () => {
      await reset(); await at('2026-09-08T23:00:00Z');
      await db.query("insert into activity_log values($1,'2099-01-01',1)", [uid]);
      assert.equal(await effective(), 0);
    });
    await t.test('schema drift aborts the migration before replacing any function', async () => {
      await db.exec("alter table user_problem_status alter column solved_at type timestamptz using solved_at at time zone 'UTC'");
      const before = await row("select pg_get_functiondef(oid) as definition from pg_proc where proname='record_problem_submission'");
      await assert.rejects(db.exec(migration), /Timestamp types differ/);
      await db.exec('rollback');
      assert.deepEqual(await row("select pg_get_functiondef(oid) as definition from pg_proc where proname='record_problem_submission'"), before);
    });
  } finally { await db.close(); }
});

await test('guarded historical repair', async (t) => {
  await setup();
  try {
    await reset();
    await t.test('unknown timezone aborts before writes', async () => {
      await assert.rejects(db.exec(repair), /independently verify historical UTC storage/);
      await db.exec('rollback');
    });
    // Independent historical fixture: first accepts are UTC-naive timestamps,
    // daily buckets are the old UTC dates. Repeat accepts on Sep 8 are excluded.
    await db.exec(`
      insert into user_problem_status values
        ('${uid}',1,true,1,'2026-09-04 10:00'),
        ('${uid}',2,true,1,'2026-09-05 10:00'),
        ('${uid}',3,true,1,'2026-09-07 10:00'),
        ('${uid}',4,true,1,'2026-09-08 23:00'),
        ('${uid}',5,true,1,'2026-09-08 23:05');
      insert into submissions(user_id,problem_id,code,status,submitted_at)
        select user_id,problem_id,'x','accepted',solved_at from user_problem_status;
      insert into submissions(user_id,problem_id,code,status,submitted_at) values('${uid}',1,'repeat','accepted','2026-09-08 12:00');
      insert into activity_log values ('${uid}','2026-09-04',1),('${uid}','2026-09-05',1),('${uid}','2026-09-07',1),('${uid}','2026-09-08',2);
      update profiles set current_streak=2,longest_streak=8,last_active_date='2026-09-08';
      insert into profiles(id,username) values ('00000000-0000-0000-0000-000000000002','unrelated');
      insert into activity_log values ('00000000-0000-0000-0000-000000000002','2026-09-08',50);
    `);
    const confirmed = repair.replace('v_verified_source_timezone text := null;', "v_verified_source_timezone text := 'UTC';");
    await t.test('preview rolls back all changes', async () => {
      const before = await activity();
      await db.exec(confirmed);
      assert.deepEqual(await activity(), before);
      assert.equal((await profile()).last_active_date, '2026-09-08');
    });
    await t.test('only proven first solves repaired; gap streak, longest, unrelated data and economy preserved', async () => {
      await db.exec(confirmed.replace(/rollback;\s*$/, 'commit;'));
      assert.deepEqual(await activity(), [
        { activity_date: '2026-09-04', problems_solved_count: 1 },
        { activity_date: '2026-09-05', problems_solved_count: 1 },
        { activity_date: '2026-09-07', problems_solved_count: 1 },
        { activity_date: '2026-09-09', problems_solved_count: 2 },
      ]);
      assert.deepEqual(await profile(), { total_xp: 0, coin_balance: 0, total_coins_earned: 0, current_streak: 1, longest_streak: 8, last_active_date: '2026-09-09' });
      assert.equal((await row("select problems_solved_count from activity_log where user_id<>'" + uid + "'")).problems_solved_count, 50);
      await db.exec(confirmed.replace(/rollback;\s*$/, 'commit;')); // idempotent
      assert.equal((await profile()).current_streak, 1);
    });
    await t.test('three consecutive reconstructed days yield streak 3', async () => {
      await reset();
      await db.exec(`
        insert into user_problem_status values ('${uid}',1,true,1,'2026-09-07 10:00'),('${uid}',2,true,1,'2026-09-08 10:00'),('${uid}',3,true,1,'2026-09-09 10:00');
        insert into submissions(user_id,problem_id,code,status,submitted_at) select user_id,problem_id,'x','accepted',solved_at from user_problem_status;
        insert into activity_log values ('${uid}','2026-09-07',1),('${uid}','2026-09-08',1),('${uid}','2026-09-09',1);
      `);
      await db.exec(confirmed.replace(/rollback;\s*$/, 'commit;'));
      assert.equal((await profile()).current_streak, 3);
      assert.equal((await profile()).longest_streak, 3);
    });
    await t.test('unmatched counts and missing first-accept evidence are left untouched', async () => {
      await reset();
      await db.exec(`
        insert into user_problem_status values ('${uid}',1,true,1,'2026-09-08 23:00');
        insert into submissions(user_id,problem_id,code,status,submitted_at) values('${uid}',1,'x','accepted','2026-09-08 23:00');
        insert into activity_log values ('${uid}','2026-09-08',2);
        update profiles set current_streak=5, longest_streak=8, last_active_date='2026-09-08';
      `);
      const before = await profile();
      const beforeActivity = await activity();
      await db.exec(confirmed.replace(/rollback;\s*$/, 'commit;'));
      assert.deepEqual(await activity(), beforeActivity);
      assert.deepEqual(await profile(), before);
      await db.exec(`update activity_log set problems_solved_count=1; delete from submissions`);
      await db.exec(confirmed.replace(/rollback;\s*$/, 'commit;'));
      assert.equal((await profile()).last_active_date, '2026-09-08');
      assert.equal((await activity())[0].activity_date, '2026-09-08');
    });
  } finally { await db.close(); }
});
