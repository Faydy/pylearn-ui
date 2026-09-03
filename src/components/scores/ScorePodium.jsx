import { Crown, Medal, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarUrl, getProfileAvatarSeed } from '../../utils/profile';
import { formatXp } from '../../utils/leaderboard';

const podiumStyles = {
  1: {
    icon: Crown,
    label: 'Campionul clasamentului',
    card: 'border-accent/45 bg-gradient-to-br from-accent/20 via-ink to-ink',
    iconColor: 'text-accent',
  },
  2: {
    icon: Trophy,
    label: 'Locul 2',
    card: 'border-border bg-sidebar/60',
    iconColor: 'text-text-main',
  },
  3: {
    icon: Medal,
    label: 'Locul 3',
    card: 'border-medium/30 bg-medium/10',
    iconColor: 'text-medium',
  },
};

export default function ScorePodium({ entries, loading }) {
  if (loading) {
    return (
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Se încarcă podiumul">
        {[1, 2, 3].map((position) => <div key={position} className="h-44 animate-pulse rounded-2xl border border-border bg-ink" />)}
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-ink p-8 text-center">
        <Trophy className="mx-auto h-9 w-9 text-muted" />
        <h2 className="mt-4 text-xl font-bold text-text-main">Clasamentul își așteaptă primii campioni</h2>
        <p className="mt-2 text-sm text-muted">Rezolvă o problemă pentru a acumula XP și a apărea aici.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-3" aria-label="Podium clasament">
      {entries.map((entry, index) => {
        const rank = index + 1;
        const style = podiumStyles[rank];
        const Icon = style.icon;

        return (
          <article key={entry.id} className={`relative overflow-hidden rounded-2xl border p-5 ${style.card}`}>
            {rank === 1 && <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/10 blur-2xl" />}
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] ${style.iconColor}`}><Icon className="h-4 w-4" />{style.label}</p>
                <Link to={`/profil/${entry.id}`} className="mt-5 flex items-center gap-3 rounded-lg outline-none ring-accent focus-visible:ring-2">
                  <img src={getAvatarUrl(getProfileAvatarSeed(entry))} alt="" className="h-12 w-12 rounded-full border border-border bg-sidebar" />
                  <div className="min-w-0"><h2 className="truncate text-lg font-bold text-text-main transition-colors hover:text-accent">{entry.username || 'Utilizator PyLearn'}</h2><p className="mt-1 text-sm font-bold text-accent">{formatXp(entry.total_xp)}</p></div>
                </Link>
              </div>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${rank === 1 ? 'border-accent/40 bg-accent text-ink' : 'border-border bg-background text-text-main'}`}>#{rank}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
