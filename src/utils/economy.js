export function getUserLevel(totalXp) {
  return Math.floor(Math.max(Number(totalXp) || 0, 0) / 100);
}

export function getLevelProgress(totalXp) {
  const safeXp = Math.max(Number(totalXp) || 0, 0);
  const level = getUserLevel(safeXp);

  return {
    level,
    currentXp: safeXp % 100,
    requiredXp: 100,
    xpToNextLevel: 100 - (safeXp % 100),
  };
}

export function formatCoins(value) {
  return new Intl.NumberFormat('ro-RO').format(Math.max(Number(value) || 0, 0));
}

export function getRarityClasses(rarity) {
  switch (rarity) {
    case 'rare':
      return 'border-accent/30 bg-accent/10 text-accent';
    case 'epic':
      return 'border-medium/30 bg-medium/10 text-medium';
    case 'legendary':
      return 'border-easy/30 bg-easy/10 text-easy';
    default:
      return 'border-border bg-background text-muted';
  }
}

export function getShopErrorMessage(error) {
  const message = error?.message || '';
  const normalizedMessage = message.toLowerCase();

  if (error?.code === 'PGRST202') return 'Shop-ul nu este configurat încă. Rulează migrarea economiei și reîncarcă pagina.';
  if (error?.code === '42501' || normalizedMessage.includes('row-level security') || normalizedMessage.includes('permission denied')) return 'Nu am primit permisiunea necesară pentru cumpărare. Rulează migrarea Shop de corecție și reîncarcă pagina.';
  if (error?.code === '23505' || normalizedMessage.includes('deții deja')) return 'Deții deja acest avatar.';
  if (normalizedMessage.includes('nu ai suficiente monede')) return 'Nu ai suficiente monede.';
  if (normalizedMessage.includes('nivelul necesar')) return 'Nu ai încă nivelul necesar.';
  if (normalizedMessage.includes('trebuie să fii autentificat')) return 'Trebuie să fii autentificat.';
  if (normalizedMessage.includes('profilul tău nu a fost găsit')) return 'Profilul tău nu este disponibil. Reautentifică-te și încearcă din nou.';
  if (normalizedMessage.includes('nu este disponibil')) return 'Avatarul nu mai este disponibil.';

  return 'Cumpărarea nu a putut fi finalizată. Reîncarcă pagina și încearcă din nou.';
}
