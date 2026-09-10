import { solvedStatusColumn, scopeSolvedStatus } from './solvedProblems.js';
import { normalizeSearchText } from './search.js';

export const PROBLEM_PAGE_SIZE = 30;
export const DIFFICULTIES = [
  { value: 'usor', label: 'Ușor' },
  { value: 'mediu', label: 'Mediu' },
  { value: 'greu', label: 'Greu' },
];
export const PROBLEM_SORTS = [
  { value: '', label: 'Implicit' },
  { value: 'xp_asc', label: 'XP crescător' },
  { value: 'xp_desc', label: 'XP descrescător' },
  { value: 'title', label: 'Titlu A-Z' },
];
export const FILTER_KEYS = ['q', 'grade', 'section', 'chapter', 'difficulty', 'status', 'sort', 'categorie'];
export const sectionValue = (chapter) => chapter.section || 'Altele';

// Literal, case/diacritic-insensitive Romanian title search. Escape regex syntax
// before using PostgREST's imatch operator; user input never becomes query syntax.
export function problemSearchPattern(value) {
  const letters = { a: '[aăâ]', i: '[iî]', s: '[sșş]', t: '[tțţ]' };
  return [...normalizeSearchText(value)].map((letter) => (
    letters[letter] || letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )).join('');
}

export function readProblemFilters(params, scope = {}, metadata, authenticated = false) {
  const validId = (key, rows) => {
    const value = params.get(key) || '';
    return rows.some((row) => String(row.id) === value) ? value : '';
  };
  const grade = scope.gradeId || (metadata ? validId('grade', metadata.grades) : params.get('grade') || '');
  const gradeChapters = (metadata?.chapters || []).filter((chapter) => !grade || String(chapter.grade_id) === String(grade));
  const sections = [...new Set(gradeChapters.map(sectionValue))];
  const requestedSection = params.get('section') || '';
  const section = scope.section || (sections.includes(requestedSection) ? requestedSection : '');
  const chapters = gradeChapters.filter((chapter) => !section || sectionValue(chapter) === section);
  const chapter = scope.chapterId || validId('chapter', chapters);
  const requestedPage = Number(params.get('page') || 1);
  const filters = {
    q: (params.get('q') || '').trim().slice(0, 200),
    grade: scope.gradeId || scope.chapterId ? '' : grade,
    section: scope.section || scope.chapterId ? '' : section,
    chapter: scope.chapterId ? '' : chapter,
    difficulty: DIFFICULTIES.some(({ value }) => value === params.get('difficulty')) ? params.get('difficulty') : '',
    status: authenticated && ['solved', 'unsolved'].includes(params.get('status')) ? params.get('status') : '',
    sort: PROBLEM_SORTS.some(({ value }) => value === params.get('sort')) ? params.get('sort') : '',
    categorie: metadata?.categories.some((category) => category.slug === params.get('categorie')) ? params.get('categorie') : '',
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 1000000 ? requestedPage : 1,
  };
  return { filters, sections, chapters };
}

export function writeProblemFilters(params, filters) {
  const next = new URLSearchParams(params);
  for (const key of [...FILTER_KEYS, 'page']) {
    if (filters[key] && !(key === 'page' && filters.page === 1)) next.set(key, String(filters[key]));
    else next.delete(key);
  }
  return next;
}

export function changeProblemFilters(filters, changes, scope, metadata, authenticated) {
  const next = { ...filters, ...changes, page: 1 };
  // Revalidate descendants against the new parent. Valid selections survive.
  return readProblemFilters(writeProblemFilters(new URLSearchParams(), next), scope, metadata, authenticated).filters;
}

export function buildProblemQuery(client, { filters = {}, scope = {}, userId, head = false, base = false, grouped = false }) {
  const active = base ? {} : filters;
  const grade = scope.gradeId || active.grade;
  const section = scope.section || active.section;
  const chapter = scope.chapterId || active.chapter;
  const columns = [
    head ? 'id' : 'id,title,description,difficulty,xp_reward,chapter_id',
    `chapters${grade || section ? '!inner' : ''}(id,title,grade_id,section,order_index)`,
    `categories${active.categorie ? '!inner' : ''}(id,name,slug)`,
  ];
  let query = client.from('problems').select(columns.join(',') + solvedStatusColumn(userId, active.status), { count: 'exact', head });
  if (grade) query = query.eq('chapters.grade_id', grade);
  if (section === 'Altele') query = query.or('section.is.null,section.eq.,section.eq.Altele', { referencedTable: 'chapters' });
  else if (section) query = query.eq('chapters.section', section);
  if (chapter) query = query.eq('chapter_id', chapter);
  if (active.categorie) query = query.eq('categories.slug', active.categorie);
  if (active.difficulty) query = query.eq('difficulty', active.difficulty);
  if (active.q) query = query.filter('title', 'imatch', problemSearchPattern(active.q));
  query = scopeSolvedStatus(query, userId, active.status);
  if (head) return query;
  // The grade curriculum keeps chapter order; sorting applies inside each chapter.
  if (grouped) query = query.order('chapters(order_index)', { ascending: true }).order('chapter_id', { ascending: true });
  if (active.sort === 'xp_asc' || active.sort === 'xp_desc') query = query.order('xp_reward', { ascending: active.sort === 'xp_asc', nullsFirst: false });
  if (active.sort === 'title') query = query.order('title', { ascending: true });
  return query.order('id', { ascending: true });
}
