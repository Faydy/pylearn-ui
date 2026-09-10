// Only the current user's user_problem_status.solved === true is completion.
// Embedded rows are filtered on the server; attempts/submissions never qualify.
export function isProblemSolved(problem) {
  return Array.isArray(problem?.solved_status)
    && problem.solved_status.some((status) => status.solved === true);
}

export function solvedStatusColumn(userId, status = '') {
  return userId ? `,solved_status:user_problem_status${status === 'solved' ? '!inner' : ''}(solved)` : '';
}

export function scopeSolvedStatus(query, userId, status = '') {
  if (!userId) return query;
  const scoped = query.eq('solved_status.user_id', userId).eq('solved_status.solved', true);
  // The same relation supplies the badge and the status filter. Missing/false
  // rows are unsolved; a left embed preserves every problem in the default view.
  return status === 'unsolved' ? scoped.is('solved_status', null) : scoped;
}

export function solvedProblemIds(rows = []) {
  return new Set(rows.filter((row) => row.solved === true).map((row) => String(row.problem_id)));
}
