import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { lessonUpdateSql, THEORY_STARTER } from '../src/utils/theoryAuthoring.js';

test('SQL copy preserves exact content even with quotes, dollar tags and SQL-looking Markdown', async () => {
  const db = new PGlite();
  try {
    await db.exec('create table theory_lessons (id bigint primary key, content text); insert into theory_lessons values (1, \'old\'), (9223372036854775807, \'old\')');
    for (const source of [THEORY_STARTER, '', '\n\n    print("șțăîâ")  \r\n', "$pylearn_lesson$ $pylearn_lesson_1$ '; drop table theory_lessons; --", '```python run\nprint(1)']) {
      await db.exec(lessonUpdateSql(source, '1'));
      assert.equal((await db.query('select content from theory_lessons where id=1')).rows[0].content, source);
      assert.equal((await db.query('select count(*) from theory_lessons')).rows[0].count, 2);
    }
    await db.exec(lessonUpdateSql('bigint', '9223372036854775807'));
    assert.equal((await db.query('select content from theory_lessons where id=9223372036854775807')).rows[0].content, 'bigint');
  } finally { await db.close(); }
});

test('SQL copy rejects missing, fractional, overflowing or injected IDs', () => {
  for (const id of ['', '0', '-1', '1.5', '1; delete from theory_lessons', '9223372036854775808', '12abc', ' 1']) assert.throws(() => lessonUpdateSql('text', id), /ID de lecție valid/);
});
