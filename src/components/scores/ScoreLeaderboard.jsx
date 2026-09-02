import { ChevronLeft, ChevronRight, SearchX, Trophy } from 'lucide-react';
import { getAvatarUrl, getProfileAvatarSeed } from '../../utils/profile';
import { formatXp, getRankClasses } from '../../utils/leaderboard';

export default function ScoreLeaderboard({ entries, loading, currentUserId, currentPage, total, pageSize, searchActive, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstRank = (currentPage - 1) * pageSize + 1;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-ink">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6"><div><h2 className="text-lg font-bold text-text-main">Clasament complet</h2><p className="mt-1 text-sm text-muted">{searchActive ? `${total} rezultate găsite` : `${total} utilizatori în clasament`}</p></div><Trophy className="h-5 w-5 text-accent" /></div>

      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted sm:px-6"><span>Loc</span><span>Utilizator</span><span>XP total</span></div>

      {loading ? (
        <div className="divide-y divide-border" aria-label="Se încarcă clasamentul">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="grid grid-cols-[3.5rem_minmax(0,1fr)_5rem] items-center gap-3 px-5 py-4 sm:px-6"><div className="h-9 w-9 animate-pulse rounded-xl bg-sidebar" /><div className="flex items-center gap-3"><div className="h-10 w-10 animate-pulse rounded-full bg-sidebar" /><div className="h-4 w-32 animate-pulse rounded bg-sidebar" /></div><div className="ml-auto h-4 w-14 animate-pulse rounded bg-sidebar" /></div>)}
        </div>
      ) : entries.length === 0 ? (
        <div className="p-10 text-center"><SearchX className="mx-auto h-8 w-8 text-muted" /><h3 className="mt-4 font-bold text-text-main">{searchActive ? 'Nu am găsit utilizatori cu acest nume.' : 'Clasamentul este gol momentan.'}</h3><p className="mt-2 text-sm text-muted">{searchActive ? 'Încearcă o altă căutare.' : 'Primii utilizatori care acumulează XP vor apărea aici.'}</p></div>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry, index) => {
            const rank = firstRank + index;
            const isCurrentUser = entry.id === currentUserId;

            return <div key={entry.id} className={`grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition-colors sm:px-6 ${isCurrentUser ? 'bg-accent/10' : 'hover:bg-sidebar-hover/60'}`}><span className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-black ${getRankClasses(rank)}`}>{rank}</span><div className="flex min-w-0 items-center gap-3"><img src={getAvatarUrl(getProfileAvatarSeed(entry))} alt="" className="h-10 w-10 shrink-0 rounded-full border border-border bg-sidebar" /><div className="min-w-0"><p className="truncate font-bold text-text-main">{entry.username || 'Utilizator PyLearn'}{isCurrentUser && <span className="ml-2 text-xs font-bold text-accent">Tu</span>}</p><p className="mt-0.5 text-xs text-muted">Explorator PyLearn</p></div></div><p className="whitespace-nowrap text-sm font-black text-accent">{formatXp(entry.total_xp)}</p></div>;
          })}
        </div>
      )}

      {total > pageSize && <nav className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6" aria-label="Paginare clasament"><p className="text-sm text-muted">Pagina {currentPage} din {pageCount}</p><div className="flex gap-2"><button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-text-main transition-colors hover:border-muted hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Pagina anterioară</span></button><button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === pageCount || loading} className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-text-main transition-colors hover:border-muted hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-40"><span className="sr-only">Pagina următoare</span><ChevronRight className="h-4 w-4" /></button></div></nav>}
    </section>
  );
}
