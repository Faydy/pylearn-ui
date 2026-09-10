export const fixtureProblems = [
  { id: 1, title: 'Problema A — rezolvată', difficulty: 'usor', xp_reward: 20, description: 'Problemă confirmată în user_problem_status.', chapter_id: 1 },
  { id: 2, title: 'Problema B — încercări greșite', difficulty: 'mediu', xp_reward: 30, description: 'Trei trimiteri greșite; solved este false.', chapter_id: 1 },
  { id: 3, title: 'Problema C — fără trimiteri', difficulty: 'greu', xp_reward: 40, description: 'Nicio trimitere și niciun status salvat.', chapter_id: 1 },
];
export const statuses = [{ user_id: 'fixture-user', problem_id: 1, solved: true }, { user_id: 'fixture-user', problem_id: 2, solved: false, attempts_count: 3 }];
export const requests = [];
const chapters = [{ id: 1, title: 'Introducere', grade_id: 1, section: 'Bazele programării', order_index: 1 }];
const categories = [{ id: 1, name: 'Fundamente', slug: 'fundamente' }];
const tables = { grades: [{ id: 1, name: 'Clasa a IX-a', level: 9 }], chapters, categories };
export function simulateAccepted(id) {
  const row = statuses.find((status) => status.problem_id === Number(id));
  if (row) row.solved = true;
  else statuses.push({ user_id: 'fixture-user', problem_id: Number(id), solved: true });
}
export const supabase = {
  from(table) {
    let columns = '', options = {}, filters = [], start = 0, end = Infinity, single = false;
    const query = {
      select(value, opts = {}) { columns = value; options = opts; return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      is(key, value) { filters.push([key, value]); return query; },
      in(key, value) { filters.push([key, value]); return query; },
      filter() { return query; }, or() { return query; }, order() { return query; },
      range(a, b) { start = a; end = b; return query; },
      limit(n) { end = n - 1; return query; },
      maybeSingle() { single = true; return query; },
      abortSignal() { return query; },
      async then(resolve, reject) {
        try {
          requests.push({ table, columns, filters: [...filters], start, end });
          let data = table === 'problems' ? fixtureProblems.map((problem) => ({ ...problem, chapters: chapters[0], categories: categories[0] }))
            : table === 'user_problem_status' ? statuses.map((status) => ({ ...status })) : [...(tables[table] || [])];
          if (table === 'problems' && columns.includes('solved_status')) {
            const owner = filters.find(([key]) => key === 'solved_status.user_id')?.[1];
            data = data.map((problem) => ({ ...problem, solved_status: statuses.filter((s) => s.user_id === owner && s.problem_id === problem.id && s.solved === true).map((s) => ({ solved: s.solved })) }));
            if (columns.includes('user_problem_status!inner')) data = data.filter((p) => p.solved_status.length);
            if (filters.some(([key, value]) => key === 'solved_status' && value === null)) data = data.filter((p) => !p.solved_status.length);
          }
          for (const [key, value] of filters) {
            if (key.startsWith('solved_status')) continue;
            data = data.filter((row) => {
              const actual = key.split('.').reduce((obj, part) => obj?.[part], row);
              return Array.isArray(value) ? value.map(String).includes(String(actual)) : String(actual) === String(value);
            });
          }
          const count = data.length;
          data = data.slice(start, end + 1);
          return resolve({ data: options.head ? null : single ? data[0] || null : data, count, error: null });
        } catch (error) { return reject?.(error); }
      },
    };
    return query;
  },
};
