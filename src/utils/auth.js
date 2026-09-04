const PENDING_VERIFICATION_EMAIL_KEY = 'pylearn-pending-verification-email';

export function getAuthErrorMessage(error, fallback = 'A apărut o eroare. Încearcă din nou.') {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('invalid login credentials')) return 'Email sau parolă incorectă.';
  if (message.includes('email not confirmed') || message.includes('email not verified')) return 'Adresa ta de email nu a fost încă verificată.';
  if (message.includes('user already registered') || message.includes('already been registered')) return 'Există deja un cont asociat acestei adrese de email.';
  if (message.includes('password should be at least') || message.includes('password must be at least')) return 'Parola trebuie să aibă minimum 8 caractere.';
  if (message.includes('rate limit') || message.includes('too many requests')) return 'Ai făcut prea multe solicitări. Încearcă din nou peste câteva momente.';
  if (message.includes('expired') || message.includes('invalid') || message.includes('otp')) return 'Linkul nu mai este valid sau a expirat.';

  return fallback;
}

export function isUnverifiedEmailError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('email not confirmed') || message.includes('email not verified');
}

export function rememberPendingVerificationEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail) window.sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, normalizedEmail);
}

export function getPendingVerificationEmail() {
  return window.sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || '';
}

export function clearPendingVerificationEmail() {
  window.sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
}
