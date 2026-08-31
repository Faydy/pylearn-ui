export function isTeacher(profile, user) {
  const role = profile?.role || user?.user_metadata?.role;
  return role === 'teacher' || role === 'profesor';
}

export function getAssignmentProgress(problemIds, statuses = []) {
  const solvedIds = new Set(
    statuses
      .filter((status) => status.solved)
      .map((status) => status.problem_id),
  );
  const solvedCount = problemIds.filter((problemId) => solvedIds.has(problemId)).length;
  const total = problemIds.length;

  return {
    solvedCount,
    total,
    percentage: total === 0 ? 0 : Math.round((solvedCount / total) * 100),
    solvedIds,
  };
}

export function getAssignmentStatus({ solvedCount, total, dueAt }) {
  if (total > 0 && solvedCount === total) {
    return { label: 'Finalizată', tone: 'easy' };
  }

  if (dueAt && new Date(dueAt).getTime() < Date.now()) {
    return { label: 'Întârziată', tone: 'hard' };
  }

  if (solvedCount > 0) {
    return { label: 'În lucru', tone: 'medium' };
  }

  return { label: 'Neîncepută', tone: 'muted' };
}

export function formatDueAt(dueAt, includeTime = true) {
  if (!dueAt) return null;

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(dueAt));
}

export function toDateTimeLocalValue(dueAt) {
  if (!dueAt) return '';

  const date = new Date(dueAt);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function getDifficultyClasses(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'usor':
      return 'border-easy/20 bg-easy/10 text-easy';
    case 'mediu':
      return 'border-medium/20 bg-medium/10 text-medium';
    case 'greu':
      return 'border-hard/20 bg-hard/10 text-hard';
    default:
      return 'border-border bg-background text-muted';
  }
}
