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

export function getAssignmentLifecycle({ solvedCount = 0, total = 0, dueAt, now = Date.now() }) {
  if (total > 0 && solvedCount >= total) {
    return { state: 'completed', label: 'Finalizată', tone: 'easy' };
  }

  const dueAtTimestamp = dueAt ? new Date(dueAt).getTime() : Number.NaN;
  if (!Number.isNaN(dueAtTimestamp) && now > dueAtTimestamp) {
    return { state: 'expired', label: 'Expirată', tone: 'hard' };
  }

  if (solvedCount > 0) {
    return { state: 'active', label: 'În lucru', tone: 'medium' };
  }

  return { state: 'active', label: 'Neîncepută', tone: 'muted' };
}

export function getAssignmentStatus({ solvedCount, total, dueAt, now }) {
  return getAssignmentLifecycle({ solvedCount, total, dueAt, now });
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

export function toDueAtISOString(localValue) {
  if (!localValue) return null;

  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Deadline-ul nu conține o dată și o oră valide.');
  }

  return date.toISOString();
}

export function toDateTimeLocalValue(dueAt) {
  if (!dueAt) return '';

  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return '';

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
