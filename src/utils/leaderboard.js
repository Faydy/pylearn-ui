const numberFormatter = new Intl.NumberFormat('ro-RO');

export function formatXp(value) {
  return `${numberFormatter.format(Number(value) || 0)} XP`;
}

export function getRankClasses(rank) {
  if (rank === 1) return 'border-accent/35 bg-accent/15 text-accent';
  if (rank === 2) return 'border-border bg-sidebar text-text-main';
  if (rank === 3) return 'border-medium/30 bg-medium/10 text-medium';
  return 'border-border bg-background text-muted';
}
