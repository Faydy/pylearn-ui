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

// Only explicit RPC business errors are safe to display verbatim. Raw database
// failures may contain constraint names, SQL or private row details.
export function getDeleteClassroomMessage(error) {
  const safeMessages = [
    'Trebuie să fii autentificat pentru a șterge clasa.',
    'Clasa nu există sau nu ai permisiunea să o ștergi.',
    'Numele introdus nu corespunde numelui clasei. Reîncarcă pagina dacă numele s-a schimbat.',
    'Clasa nu poate fi ștearsă deoarece există date asociate care împiedică ștergerea.',
  ];
  if (safeMessages.includes(error?.message)) return error.message;
  if (error?.code === '42501') return 'Nu ai permisiunea să ștergi această clasă.';
  if (error?.code === 'PGRST202') return 'Ștergerea claselor nu este disponibilă momentan. Contactează administratorul.';
  if (/fetch|network|conexiune/i.test(error?.message || '')) return 'Conexiunea a fost întreruptă. Reîncarcă pagina pentru a verifica dacă clasa a fost ștearsă.';
  return 'Clasa nu a putut fi ștearsă. Reîncarcă pagina și încearcă din nou.';
}
