import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { getDeleteClassroomMessage } from '../../src/utils/classrooms.js';

const owner = '00000000-0000-0000-0000-000000000001';
const student = '00000000-0000-0000-0000-000000000002';
const otherTeacher = '00000000-0000-0000-0000-000000000003';
const migration = await readFile(new URL('../migrations/202609120001_delete_classroom.sql', import.meta.url), 'utf8');

for (const action of ['no action', 'cascade']) {
  test(`owner-only class deletion with ${action} FKs`, async (t) => {
    const db = new PGlite();
    try {
      await db.exec(`
        create role anon; create role authenticated;
        create schema auth;
        create function auth.uid() returns uuid language sql stable as
          $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
        grant usage on schema auth, public to anon, authenticated;
        create table profiles (id uuid primary key, role text);
        create table classrooms (id bigint primary key, teacher_id uuid references profiles(id), name text, archived boolean);
        create table classroom_members (classroom_id bigint references classrooms(id) on delete ${action}, student_id uuid references profiles(id));
        create table classroom_announcements (id bigint primary key, classroom_id bigint references classrooms(id) on delete ${action});
        create table assignments (id bigint primary key, classroom_id bigint references classrooms(id) on delete ${action});
        create table problems (id bigint primary key);
        create table assignment_problems (assignment_id bigint references assignments(id) on delete ${action}, problem_id bigint references problems(id));
        create table notifications (id bigint primary key, classroom_id bigint references classrooms(id) on delete cascade, assignment_id bigint references assignments(id) on delete cascade);
        create table submissions (id bigint primary key, problem_id bigint references problems(id), user_id uuid references profiles(id));
        create table user_problem_status (problem_id bigint references problems(id), user_id uuid references profiles(id), solved boolean);
        alter table classrooms enable row level security;
        -- Even a pre-existing permissive policy must not permit direct deletion.
        create policy old_delete_policy on classrooms for delete using (true);
        grant delete on classrooms to public, anon, authenticated;
        insert into profiles values ('${owner}','profesor'),('${student}','elev'),('${otherTeacher}','profesor');
        insert into classrooms values (1,'${owner}','Clasa IX A',true),(2,'${otherTeacher}','Altă clasă',false);
        insert into classroom_members values (1,'${student}'),(2,'${student}');
        insert into classroom_announcements values (1,1),(2,2);
        insert into assignments values (1,1),(2,1),(3,2);
        insert into problems values (1);
        insert into assignment_problems values (1,1),(2,1),(3,1);
        insert into notifications values (1,1,null),(2,null,1),(3,1,2),(4,2,3);
        insert into submissions values (1,1,'${student}');
        insert into user_problem_status values (1,'${student}',true);
      `);
      await db.exec(migration);
      const login = async (uid, role = 'authenticated') => {
        await db.exec(`reset role; set role ${role}`);
        await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
      };
      const remove = (name = 'Clasa IX A', id = 1) => db.query('select public.delete_classroom($1,$2)', [id, name]);
      const counts = async () => {
        await db.exec('reset role');
        const result = {};
        for (const table of ['classrooms','classroom_members','classroom_announcements','assignments','assignment_problems','notifications','profiles','problems','submissions','user_problem_status']) {
          result[table] = Number((await db.query(`select count(*) from public.${table}`)).rows[0].count);
        }
        return result;
      };
      const initial = await counts();

      await t.test('anonymous, students and unrelated teachers cannot call successfully', async () => {
        await login('', 'anon');
        await assert.rejects(remove(), /permission denied/);
        await login('');
        await assert.rejects(remove(), /Trebuie să fii autentificat/);
        for (const uid of [student, otherTeacher]) {
          await login(uid);
          await assert.rejects(remove(), /Clasa nu există sau nu ai permisiunea/);
          await assert.rejects(db.exec('delete from classrooms where id=1'), /permission denied/);
        }
        assert.deepEqual(await counts(), initial);
      });
      await t.test('owner cannot bypass confirmation or use direct table deletion', async () => {
        await login(owner);
        for (const name of ['', null, 'Clasa IX A ', 'clasa ix a']) await assert.rejects(remove(name), /Numele introdus nu corespunde/);
        await assert.rejects(remove('Altă clasă', 2), /Clasa nu există sau nu ai permisiunea/);
        await assert.rejects(db.exec('delete from classrooms where id=1'), /permission denied/);
        assert.deepEqual(await counts(), initial);
      });
      await t.test('unexpected restrictive reference rolls back all earlier child deletions', async () => {
        await db.exec('create table retained_class_record (classroom_id bigint references classrooms(id)); insert into retained_class_record values (1)');
        await login(owner);
        await assert.rejects(remove(), /Clasa nu poate fi ștearsă deoarece există date asociate/);
        assert.deepEqual(await counts(), initial);
        await db.exec('drop table retained_class_record');
      });
      await t.test('owner can delete archived class, its children and assignment-only notifications', async () => {
        await login(owner);
        await remove();
        assert.deepEqual(await counts(), {
          classrooms: 1, classroom_members: 1, classroom_announcements: 1,
          assignments: 1, assignment_problems: 1, notifications: 1,
          profiles: 3, problems: 1, submissions: 1, user_problem_status: 1,
        });
        assert.equal((await db.query('select id from classrooms')).rows[0].id, 2);
        await login(owner);
        await assert.rejects(remove(), /Clasa nu există sau nu ai permisiunea/);
      });
    } finally { await db.close(); }
  });
}

test('deletion displays exact safe RPC messages without exposing SQL internals', () => {
  const message = 'Clasa nu poate fi ștearsă deoarece există date asociate care împiedică ștergerea.';
  assert.equal(getDeleteClassroomMessage({ message, code: 'P0001' }), message);
  assert.equal(getDeleteClassroomMessage({ code: '42501', message: 'private schema details' }), 'Nu ai permisiunea să ștergi această clasă.');
  assert.ok(!getDeleteClassroomMessage({ message: 'SQL private row secret', code: 'XX000' }).includes('secret'));
  assert.match(getDeleteClassroomMessage({ message: 'Failed to fetch' }), /Reîncarcă pagina/);
});
