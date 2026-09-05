import { Award, Coins, TrendingUp } from 'lucide-react';
import { formatXp } from '../../utils/leaderboard';
import { formatCoins, getLevelProgress } from '../../utils/economy';

export default function ShopProgressSummary({ totalXp, coinBalance }) {
  const progress = getLevelProgress(totalXp);
  const percentage = (progress.currentXp / progress.requiredXp) * 100;

  return (
    <section className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/15 via-ink to-ink p-5 sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-3 py-1.5 text-sm font-bold text-accent"><TrendingUp className="h-4 w-4" />Nivel {progress.level}</div>
          <p className="mt-4 text-2xl font-black text-text-main sm:text-3xl">{formatXp(totalXp)}</p>
          <p className="mt-1 text-sm text-muted">{progress.currentXp} / {progress.requiredXp} XP până la nivelul următor</p>
          <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percentage}%` }} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-72">
          <div className="rounded-xl border border-border bg-background/70 p-4"><Award className="h-5 w-5 text-accent" /><p className="mt-3 text-xl font-black text-text-main">Nivel {progress.level}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">Progres</p></div>
          <div className="rounded-xl border border-border bg-background/70 p-4"><Coins className="h-5 w-5 text-medium" /><p className="mt-3 text-xl font-black text-text-main">{formatCoins(coinBalance)}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">Monede</p></div>
        </div>
      </div>
    </section>
  );
}
