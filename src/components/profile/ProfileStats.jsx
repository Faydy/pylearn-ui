import { Award, CheckCircle2, Flame, Trophy } from 'lucide-react';
import { formatXp } from '../../utils/leaderboard';

const statDefinitions = [
  { key: 'solvedCount', label: 'Probleme rezolvate', icon: CheckCircle2, tone: 'easy' },
  { key: 'totalXp', label: 'XP total', icon: Award, tone: 'accent' },
  { key: 'currentStreak', label: 'Serie curentă', icon: Flame, tone: 'medium', suffix: ' zile' },
  { key: 'longestStreak', label: 'Cea mai lungă serie', icon: Trophy, tone: 'accent', suffix: ' zile' },
];

function getToneClasses(tone) {
  if (tone === 'easy') return 'bg-easy/10 text-easy';
  if (tone === 'medium') return 'bg-medium/10 text-medium';
  return 'bg-accent/10 text-accent';
}

export default function ProfileStats({ profile, solvedCount }) {
  const values = {
    solvedCount: solvedCount || 0,
    totalXp: formatXp(profile?.total_xp),
    currentStreak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
  };

  return <section className="rounded-2xl border border-border bg-ink p-5 sm:p-6"><h2 className="text-xl font-bold text-text-main">Statistici</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{statDefinitions.map(({ key, label, icon: Icon, tone, suffix = '' }) => <article key={key} className="rounded-xl border border-border bg-background p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${getToneClasses(tone)}`}><Icon className="h-5 w-5" /></span><p className="mt-4 text-xl font-black text-text-main">{values[key]}{suffix}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">{label}</p></article>)}</div></section>;
}
