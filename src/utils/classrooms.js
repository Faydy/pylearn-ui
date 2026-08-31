export function normalizeClassCode(value = '') {
  return value.toUpperCase().replace(/\s+/g, '').slice(0, 6);
}

export function formatClassroomDate(value) {
  if (!value) return null;

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatStudentCount(count = 0) {
  const normalizedCount = Number(count) || 0;
  return `${normalizedCount} ${normalizedCount === 1 ? 'elev' : 'elevi'}`;
}

export function getSupabaseMessage(error, fallback) {
  return error?.message || fallback;
}
