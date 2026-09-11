import test from 'node:test';
import assert from 'node:assert/strict';
import { changeProblemFilters, readProblemFilters, writeProblemFilters, FILTER_KEYS } from '../src/utils/problemFilters.js';

const metadata = {
  grades: [{ id: 1 }, { id: 2 }], categories: [{ slug: 'vectori' }],
  chapters: [
    { id: 10, grade_id: 1, section: 'Algoritmi' },
    { id: 11, grade_id: 1, section: 'Vectori' },
    { id: 12, grade_id: 2, section: 'Algoritmi' },
  ],
};
const read = (query, scope = {}) => readProblemFilters(new URLSearchParams(query), scope, metadata, true).filters;

test('parent changes discard invalid descendants and preserve independent selections', () => {
  const initial = read('grade=1&section=Vectori&chapter=11&difficulty=mediu&status=unsolved&page=3');
  const next = changeProblemFilters(initial, { grade: '2' }, {}, metadata, true);
  assert.equal(next.grade, '2');
  assert.equal(next.section, '');
  assert.equal(next.chapter, '');
  assert.equal(next.difficulty, 'mediu');
  assert.equal(next.status, 'unsolved');
  assert.equal(next.page, 1);
  const sameSection = changeProblemFilters(read('grade=1&section=Algoritmi&chapter=10'), { grade: '2' }, {}, metadata, true);
  assert.equal(sameSection.section, 'Algoritmi');
  assert.equal(sameSection.chapter, '');
});

test('removing a parent chip keeps descendants that are still valid', () => {
  const next = changeProblemFilters(read('grade=1&section=Vectori&chapter=11&difficulty=mediu'), { grade: '' }, {}, metadata, true);
  assert.equal(next.grade, '');
  assert.equal(next.section, 'Vectori');
  assert.equal(next.chapter, '11');
  assert.equal(next.difficulty, 'mediu');
});

test('all filter, search and sort changes reset pagination', () => {
  for (const key of FILTER_KEYS) {
    assert.equal(changeProblemFilters(read('page=3'), { [key]: '' }, {}, metadata, true).page, 1, key);
  }
});

test('shareable URL round trips all active state and preserves unrelated query parameters', () => {
  const params = new URLSearchParams('grade=1&section=Vectori&chapter=11&difficulty=mediu&status=unsolved&sort=xp_desc&q=suma&categorie=vectori&page=2&ref=lesson');
  const filters = read(params.toString());
  assert.deepEqual(read(writeProblemFilters(params, filters).toString()), filters);
  assert.equal(writeProblemFilters(params, filters).get('ref'), 'lesson');
});

test('reset clears non-route state, restores default sort and leaves scope effective', () => {
  const params = new URLSearchParams('grade=2&section=Vectori&chapter=11&difficulty=greu&status=solved&sort=title&q=suma&page=3&ref=lesson');
  const cleared = writeProblemFilters(params, { page: 1 });
  assert.equal(cleared.toString(), 'ref=lesson');
  const scoped = readProblemFilters(cleared, { gradeId: '1', section: 'Algoritmi' }, metadata, true);
  assert.deepEqual(scoped.chapters.map(({ id }) => id), [10]);
  assert.equal(scoped.filters.grade, '');
  assert.equal(scoped.filters.section, '');
  assert.equal(scoped.filters.page, 1);
  assert.equal(scoped.filters.sort, '');
});
