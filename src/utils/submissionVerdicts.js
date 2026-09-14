export const submissionLabels = {
  accepted: 'Soluție acceptată',
  wrong_answer: 'Răspuns greșit',
  runtime_error: 'Eroare de execuție',
  compile_error: 'Eroare de sintaxă',
  time_limit: 'Limită de timp depășită',
  memory_limit: 'Limită de memorie depășită',
  internal_error: 'Eroare la evaluare',
};

export function submissionLabel(verdict) {
  return submissionLabels[verdict] || submissionLabels.internal_error;
}
