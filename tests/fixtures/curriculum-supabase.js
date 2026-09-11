export const requests = [];
let viewer = 'student-a';
export const setViewer = (id) => { viewer = id; };
const grades = [{ id: 1, name: 'Clasa a IX-a', level: 9 }, { id: 2, name: 'Clasa a X-a', level: 10 }];
const chapters = [
  { id: 1, title: 'Operatori și expresii', section: 'Algoritmi', grade_id: 1, order_index: 1 },
  { id: 2, title: 'Structura de decizie', section: 'Algoritmi', grade_id: 1, order_index: 2 },
  { id: 3, title: 'Parcurgerea vectorilor', section: 'Vectori', grade_id: 1, order_index: 3 },
  { id: 4, title: 'Sortarea vectorilor', section: 'Vectori', grade_id: 1, order_index: 4 },
  { id: 5, title: 'Recapitulare', section: null, grade_id: 1, order_index: 5 },
  { id: 6, title: 'Matrice', section: 'Tablouri', grade_id: 2, order_index: 1 },
];
const problems = [
  { id: 1, title: 'Adunare', chapter_id: 1, difficulty: 'usor', xp_reward: 10 },
  { id: 2, title: 'Calcul expresie', chapter_id: 1, difficulty: 'mediu', xp_reward: 20 },
  { id: 3, title: 'Expresie complexă', chapter_id: 1, difficulty: 'greu', xp_reward: 30 },
  { id: 4, title: 'Major sau minor', chapter_id: 2, difficulty: 'usor', xp_reward: 10 },
  { id: 5, title: 'Suma vectorului', chapter_id: 3, difficulty: 'mediu', xp_reward: 20 },
  { id: 6, title: 'Recapitulare finală', chapter_id: 5, difficulty: 'greu', xp_reward: 30 },
  { id: 7, title: 'Suma matricei', chapter_id: 6, difficulty: 'mediu', xp_reward: 20 },
];
const statuses = [{ user_id: 'student-a', problem_id: 1, solved: true }, { user_id: 'student-a', problem_id: 2, solved: false, attempts_count: 4 }, { user_id: 'student-a', problem_id: 4, solved: true }, { user_id: 'student-b', problem_id: 2, solved: true }];
const categories = [{ id: 1, name: 'Fundamente', slug: 'fundamente' }];
function query(source, dataSource) {
  let columns = '', options = {}, filters = [], orders = [], start = 0, end = Infinity, single = false;
  const api = {
    select(value, opts = {}) { columns = value; options = opts; return api; },
    eq(key, value) { filters.push([key, value]); return api; },
    is(key, value) { filters.push([key, value]); return api; },
    in(key, value) { filters.push([key, value]); return api; },
    filter(key, operator, value) { filters.push([key, value, operator]); return api; },
    order(key, opts = {}) { orders.push([key, opts]); return api; },
    range(a, b) { start = a; end = b; return api; }, limit(n) { end = n - 1; return api; },
    maybeSingle() { single = true; return api; }, abortSignal() { return api; },
    async then(resolve, reject) {
      try {
        requests.push({ source, columns, filters, start, end });
        let data = dataSource();
        if (source === 'problems' && columns.includes('solved_status')) {
          const owner = filters.find(([key]) => key === 'solved_status.user_id')?.[1];
          data = data.map((row) => ({ ...row, solved_status: statuses.filter((status) => status.user_id === owner && status.problem_id === row.id && status.solved) }));
          if (columns.includes('user_problem_status!inner')) data = data.filter((row) => row.solved_status.length);
          if (filters.some(([key, value]) => key === 'solved_status' && value === null)) data = data.filter((row) => !row.solved_status.length);
        }
        for (const [key, value, operator] of filters) {
          if (key.startsWith('solved_status')) continue;
          data = data.filter((row) => {
            const actual = key.split('.').reduce((obj, part) => obj?.[part], row);
            if (operator === 'imatch') return new RegExp(value, 'iu').test(actual);
            return Array.isArray(value) ? value.map(String).includes(String(actual)) : String(actual) === String(value);
          });
        }
        for (const [key, opts] of [...orders].reverse()) data.sort((a,b) => (typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : a[key] - b[key]) * (opts.ascending === false ? -1 : 1));
        const count = data.length;
        data = data.slice(start, end + 1);
        resolve({ data: options.head ? null : single ? data[0] || null : data, count, error: null });
      } catch (error) { reject?.(error); }
    },
  };
  return api;
}
export const supabase = {
  from(table) {
    return query(table, () => table === 'problems' ? problems.map((problem) => ({ ...problem, chapters: chapters.find((chapter) => chapter.id === problem.chapter_id), categories: categories[0] })) : [...({ grades, chapters, categories, user_problem_status: statuses }[table] || [])]);
  },
  rpc(name, args) {
    if (name !== 'get_problem_curriculum') throw new Error('Unexpected RPC');
    return query(name, () => chapters.filter((chapter) => (!args.p_grade_id || chapter.grade_id === args.p_grade_id) && (!args.p_chapter_id || chapter.id === args.p_chapter_id)).map((chapter) => {
      const rows = problems.filter((problem) => problem.chapter_id === chapter.id);
      return { ...chapter, chapter_id: chapter.id, grade_name: grades.find((grade) => grade.id === chapter.grade_id).name, total_problem_count: rows.length, solved_problem_count: viewer ? rows.filter((problem) => statuses.some((status) => status.user_id === viewer && status.problem_id === problem.id && status.solved === true)).length : null };
    }));
  },
};
