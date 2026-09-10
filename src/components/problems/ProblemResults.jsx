import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, SearchX } from 'lucide-react';
import { PROBLEM_PAGE_SIZE } from '../../utils/problemFilters';

export default function ProblemResults({ browser, children, emptyMessage = 'Nu există probleme disponibile momentan.' }) {
  const { loading, error, total, filters, hasProblems } = browser;
  const pages = Math.max(1, Math.ceil(total / PROBLEM_PAGE_SIZE));
  return (
    <div aria-busy={loading} className="min-w-0">
      {loading ? <div role="status" className="flex items-center justify-center py-20"><Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-accent" /><span className="sr-only">Se încarcă problemele...</span></div>
        : error ? <div role="alert" className="rounded-2xl border border-hard/25 bg-hard/10 p-5 text-hard"><AlertTriangle aria-hidden="true" className="mb-3 h-5 w-5" /><p>{error}</p><button type="button" onClick={browser.retry} className="mt-4 rounded-lg border border-hard/30 px-3 py-2 text-sm font-bold">Încearcă din nou</button></div>
          : total === 0 ? <div role="status" className="rounded-2xl border border-border bg-ink px-4 py-10 text-center"><SearchX aria-hidden="true" className="mx-auto mb-3 h-6 w-6 text-muted" /><p className="text-muted">{hasProblems ? 'Nicio problemă nu corespunde filtrelor selectate.' : emptyMessage}</p>{browser.activeCount > 0 && <button type="button" onClick={browser.reset} className="mt-3 min-h-11 text-sm font-bold text-accent hover:underline">Resetează filtrele</button>}</div>
            : <><p role="status" className="mb-3 text-xs text-muted">{total} {total === 1 ? 'problemă' : 'probleme'}{pages > 1 ? ` · Pagina ${filters.page} din ${pages}` : ''}</p>{children}{pages > 1 && <nav aria-label="Paginarea problemelor" className="mt-6 flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={filters.page <= 1} onClick={() => browser.setPage(filters.page - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border bg-ink px-3 text-sm font-bold text-text-main hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft aria-hidden="true" className="h-4 w-4" />Înapoi</button><span className="text-xs text-muted">{filters.page} / {pages}</span><button type="button" disabled={filters.page >= pages} onClick={() => browser.setPage(filters.page + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border bg-ink px-3 text-sm font-bold text-text-main hover:border-accent disabled:cursor-not-allowed disabled:opacity-40">Înainte<ChevronRight aria-hidden="true" className="h-4 w-4" /></button></nav>}</>}
    </div>
  );
}
