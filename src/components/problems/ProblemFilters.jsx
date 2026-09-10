import { useId, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { DIFFICULTIES, PROBLEM_SORTS } from '../../utils/problemFilters';

export default function ProblemFilters({ browser, placeholder = 'Caută o problemă după titlu...', grouped = false }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const { filters, metadata, scope, sections, chapters, activeCount } = browser;
  const fixedChapter = Boolean(scope.chapterId);
  const controls = [
    !scope.gradeId && !fixedChapter && { key: 'grade', label: 'Clasa', options: metadata?.grades.map((grade) => ({ value: String(grade.id), label: grade.name })) || [] },
    !scope.section && !fixedChapter && (sections.length > 1 || filters.section) && { key: 'section', label: 'Secțiune', options: sections.map((section) => ({ value: section, label: section })) },
    !fixedChapter && (chapters.length > 1 || filters.chapter) && { key: 'chapter', label: 'Capitol', options: chapters.map((chapter) => ({ value: String(chapter.id), label: chapter.title })) },
    { key: 'difficulty', label: 'Dificultate', options: DIFFICULTIES },
    browser.showStatus && { key: 'status', label: 'Status', options: [{ value: 'solved', label: 'Rezolvate' }, { value: 'unsolved', label: 'Nerezolvate' }] },
    { key: 'sort', label: 'Sortează', options: PROBLEM_SORTS },
  ].filter(Boolean);
  const category = metadata?.categories.find((item) => item.slug === filters.categorie);

  return (
    <div className="mb-6 min-w-0" role="search" aria-label="Filtre pentru probleme">
      <div className="flex min-w-0 flex-wrap items-end gap-3">
        <label className="relative block w-full min-w-0 lg:w-auto lg:min-w-60 lg:flex-1">
          <span className="sr-only">Caută probleme</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input type="search" maxLength={200} placeholder={placeholder} value={browser.search} onChange={(event) => browser.setSearch(event.target.value)} className="w-full min-w-0 rounded-xl border border-border bg-ink py-3 pl-12 pr-4 text-sm text-text-main outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent" />
        </label>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-ink px-4 py-2 text-sm font-bold text-text-main focus-visible:outline-2 focus-visible:outline-accent lg:hidden">
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-accent" />Filtre{activeCount > 0 ? ` (${activeCount})` : ''}<ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <div id={id} className={`${open ? 'grid' : 'hidden'} w-full min-w-0 grid-cols-1 gap-3 min-[375px]:grid-cols-2 sm:grid-cols-3 lg:flex lg:w-auto lg:flex-wrap lg:items-end`}>
          {controls.map(({ key, label, options }) => (
            <label key={key} className="block min-w-0 lg:w-36">
              <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
              <select value={filters[key] || ''} disabled={!metadata} onChange={(event) => browser.update({ [key]: event.target.value })} aria-describedby={key === 'sort' && grouped ? `${id}-sort-help` : undefined} className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-border bg-ink px-3 py-2 text-sm text-text-main outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50">
                {key !== 'sort' && <option value="">Toate</option>}
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>
      {(activeCount > 0 || grouped) && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {activeCount > 0 && <><span className="hidden font-bold text-accent lg:inline">Filtre ({activeCount})</span>{category && <button type="button" onClick={() => browser.update({ categorie: '' })} aria-label={`Elimină conceptul ${category.name}`} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border px-2 py-1 text-text-main"><span className="min-w-0 break-words">{category.name}</span><X className="h-3 w-3 shrink-0" /></button>}<button type="button" onClick={browser.reset} className="min-h-9 font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent">Resetează filtrele</button></>}
        {grouped && <span id={`${id}-sort-help`} className="text-muted">Sortarea se aplică problemelor din fiecare capitol.</span>}
      </div>}
    </div>
  );
}
