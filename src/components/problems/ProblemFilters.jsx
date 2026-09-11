import { useId, useRef, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { DIFFICULTIES, PROBLEM_SORTS } from '../../utils/problemFilters';
import FilterDropdown from './FilterDropdown';

const STATUS_OPTIONS = [{ value: '', label: 'Toate' }, { value: 'solved', label: 'Rezolvate' }, { value: 'unsolved', label: 'Nerezolvate' }];

export default function ProblemFilters({ browser, placeholder = 'Caută o problemă după titlu...', grouped = false }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  const id = useId();
  const { filters, metadata, scope, sections, chapters, activeCount } = browser;
  const fixedChapter = Boolean(scope.chapterId);
  const controls = [
    !scope.gradeId && !fixedChapter && { key: 'grade', label: 'Clasa', options: metadata?.grades.map((grade) => ({ value: String(grade.id), label: grade.name })) || [] },
    !scope.section && !fixedChapter && (sections.length > 1 || filters.section) && { key: 'section', label: 'Secțiune', options: sections.map((section) => ({ value: section, label: section })) },
    !fixedChapter && (chapters.length > 1 || filters.chapter) && { key: 'chapter', label: 'Capitol', options: chapters.map((chapter) => ({ value: String(chapter.id), label: chapter.title })) },
    { key: 'difficulty', label: 'Dificultate', options: DIFFICULTIES },
  ].filter(Boolean);
  const category = metadata?.categories.find((item) => item.slug === filters.categorie);
  const chips = [
    ...controls.filter(({ key }) => filters[key]).map(({ key, label, options }) => ({ key, label, text: options.find((option) => option.value === filters[key])?.label || filters[key] })),
    filters.status && { key: 'status', label: 'Status', text: STATUS_OPTIONS.find((option) => option.value === filters.status)?.label },
    category && { key: 'categorie', label: 'Concept', text: category.name },
    browser.search.trim() && { key: 'q', label: 'Căutare', text: `„${browser.search.trim()}”` },
    filters.sort && { key: 'sort', label: 'Sortare', text: PROBLEM_SORTS.find((option) => option.value === filters.sort)?.label },
  ].filter(Boolean);
  const close = () => { setOpen(false); toggle.current?.focus(); };

  return (
    <div className="mb-6 min-w-0" role="search" aria-label="Filtre pentru probleme" onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { event.preventDefault(); close(); }
    }}>
      <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-3">
        <label className="relative block w-full min-w-0 lg:flex-1">
          <span className="sr-only">Caută probleme</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input type="search" maxLength={200} placeholder={placeholder} value={browser.search} onChange={(event) => browser.setSearch(event.target.value)} className="w-full min-w-0 rounded-xl border border-border bg-sidebar py-3 pl-12 pr-4 text-sm text-text-main placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent" />
        </label>
        <div className="flex max-w-full shrink-0 items-center gap-1">
          <button ref={toggle} type="button" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen(!open)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-text-main transition-colors hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${open || activeCount > 0 ? 'border-accent/40 bg-accent/10' : 'border-border bg-sidebar'}`}>
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-accent" />Filtre{activeCount > 0 ? ` (${activeCount})` : ''}<ChevronDown aria-hidden="true" className={`hidden h-3.5 w-3.5 text-muted transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
          </button>
          {browser.showStatus && <FilterDropdown compact label="Status" value={filters.status} options={STATUS_OPTIONS} disabled={!metadata} onChange={(value) => browser.update({ status: value })} />}
          <FilterDropdown compact label="Sortează" value={filters.sort} options={PROBLEM_SORTS} disabled={!metadata} onChange={(value) => browser.update({ sort: value })} describedBy={grouped ? `${id}-sort-help` : undefined} />
        </div>
      </div>

      <section id={`${id}-panel`} hidden={!open} aria-labelledby={`${id}-heading`} className="mt-3 rounded-2xl border border-border bg-sidebar p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><h3 id={`${id}-heading`} className="text-sm font-semibold text-text-main">Filtre</h3><p className="mt-1 text-xs text-muted">Alege ce vrei să exersezi. Rezultatele se actualizează automat.</p></div>
          <button type="button" onClick={close} aria-label="Închide filtrele" className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-sidebar-hover hover:text-text-main focus-visible:outline-2 focus-visible:outline-accent"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        {open && <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {controls.map(({ key, label, options }) => <FilterDropdown key={key} label={label} value={filters[key] || ''} options={[{ value: '', label: 'Toate' }, ...options]} disabled={!metadata} onChange={(value) => browser.update({ [key]: value })} />)}
        </div>}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          {activeCount > 0 && <button type="button" onClick={browser.reset} className="mr-auto min-h-11 rounded-lg px-1 text-xs font-semibold text-muted hover:text-text-main focus-visible:outline-2 focus-visible:outline-accent">Resetează filtrele</button>}
          <button type="button" onClick={close} className="min-h-11 rounded-xl border border-accent/30 bg-accent/10 px-4 text-sm font-semibold text-accent hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent">{browser.loading ? 'Vezi rezultatele' : `Vezi ${browser.total} ${browser.total === 1 ? 'problemă' : 'probleme'}`}</button>
        </div>
      </section>

      {chips.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Filtre active">
        {chips.map(({ key, label, text }) => <button key={key} type="button" onClick={() => browser.update({ [key]: '' })} aria-label={`Elimină ${label}: ${text}`} className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs text-accent transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <span className="min-w-0 break-words">{text}</span><X aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        </button>)}
        <button type="button" onClick={browser.reset} className="min-h-9 rounded-lg px-2 text-xs font-medium text-muted hover:text-text-main hover:underline focus-visible:outline-2 focus-visible:outline-accent">Resetează filtrele</button>
      </div>}
      {grouped && <p id={`${id}-sort-help`} className="mt-3 text-xs text-muted">Sortarea se aplică problemelor din fiecare capitol.</p>}
    </div>
  );
}
