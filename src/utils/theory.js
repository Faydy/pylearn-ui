export function sortTheoryLessons(lessons = []) {
  return [...lessons].sort((first, second) => (
    Number(first.order_index || 0) - Number(second.order_index || 0)
    || Number(first.id) - Number(second.id)
  ));
}

export function formatReadTime(minutes) {
  const normalizedMinutes = Number(minutes);
  if (!Number.isFinite(normalizedMinutes) || normalizedMinutes <= 0) return 'Timp de lectură flexibil';
  return `${normalizedMinutes} ${normalizedMinutes === 1 ? 'minut' : 'minute'} de citit`;
}

export function formatLessonCount(count = 0) {
  const normalizedCount = Number(count) || 0;
  return `${normalizedCount} ${normalizedCount === 1 ? 'lecție' : 'lecții'}`;
}

export function getTheoryMessage(error, fallback) {
  return error?.message || fallback;
}

export function getDifficultyClasses(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'usor': return 'border-easy/20 bg-easy/10 text-easy';
    case 'mediu': return 'border-medium/20 bg-medium/10 text-medium';
    case 'greu': return 'border-hard/20 bg-hard/10 text-hard';
    default: return 'border-border bg-background text-muted';
  }
}

export function getRelationRow(value) {
  return Array.isArray(value) ? value[0] : value;
}
