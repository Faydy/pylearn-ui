import SolvedProblemBadge from '../problems/SolvedProblemBadge';
import useSolvedProblemIds from '../../hooks/useSolvedProblemIds';
import { ChevronRight, Code2, Loader2, Moon, Search, Sun } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { normalizeSearchText } from '../../utils/search';
import NotificationsBell from './NotificationsBell';

const THEME_STORAGE_KEY = 'pylearn-theme';
const PREVIEW_LIMIT = 6;

let problemSearchIndex = null;
let problemSearchIndexPromise = null;

function getInitialTheme() {
  return window.localStorage.getItem(THEME_STORAGE_KEY) !== 'light';
}

async function loadProblemSearchIndex() {
  if (problemSearchIndex) return problemSearchIndex;

  if (!problemSearchIndexPromise) {
    problemSearchIndexPromise = supabase
      .from('problems')
      .select('id, title, difficulty, xp_reward')
      .order('title', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        problemSearchIndex = data || [];
        return problemSearchIndex;
      })
      .catch((error) => {
        problemSearchIndexPromise = null;
        throw error;
      });
  }

  return problemSearchIndexPromise;
}

function getDifficultyClass(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'usor': return 'border-easy/20 bg-easy/10 text-easy';
    case 'mediu': return 'border-medium/20 bg-medium/10 text-medium';
    case 'greu': return 'border-hard/20 bg-hard/10 text-hard';
    default: return 'border-border bg-background text-muted';
  }
}

export default function TopHeader({title = "Dashboard"}) {
    const [isDark, setIsDark] = useState(getInitialTheme);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchPreviewOpen, setIsSearchPreviewOpen] = useState(false);
    const [previewProblems, setPreviewProblems] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');
    const solvedStatus = useSolvedProblemIds(isSearchPreviewOpen && !previewLoading ? previewProblems.map((problem) => problem.id) : []);
    const location = useLocation();
    const navigate = useNavigate();
    const searchContainerRef = useRef(null);
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const normalizedPreviewQuery = normalizeSearchText(deferredSearchQuery);

    useEffect(() => {
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
      const isProblemArchive = location.pathname === '/probleme/toate';
      const urlQuery = new URLSearchParams(location.search).get('q') || '';
      setSearchQuery(isProblemArchive ? urlQuery : '');
      setIsSearchPreviewOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
      if (!normalizedPreviewQuery) {
        setPreviewProblems([]);
        setPreviewError('');
        setPreviewLoading(false);
        return undefined;
      }

      let cancelled = false;
      setPreviewLoading(true);
      setPreviewError('');

      loadProblemSearchIndex()
        .then((problems) => {
          if (cancelled) return;
          setPreviewProblems(
            problems
              .filter((problem) => normalizeSearchText(problem.title).includes(normalizedPreviewQuery))
              .slice(0, PREVIEW_LIMIT),
          );
        })
        .catch(() => {
          if (!cancelled) setPreviewError('Sugestiile nu au putut fi încărcate.');
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });

      return () => { cancelled = true; };
    }, [normalizedPreviewQuery]);

    useEffect(() => {
      const handleOutsidePointerDown = (event) => {
        if (!searchContainerRef.current?.contains(event.target)) {
          setIsSearchPreviewOpen(false);
        }
      };

      document.addEventListener('pointerdown', handleOutsidePointerDown);
      return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
    }, []);

    const navigateToSearch = (query) => {
      const nextQuery = query.trim();
      navigate(nextQuery ? `/probleme/toate?q=${encodeURIComponent(nextQuery)}` : '/probleme/toate');
    };

    const handleSearchSubmit = (event) => {
      event.preventDefault();
      setIsSearchPreviewOpen(false);
      navigateToSearch(searchQuery);
    };

    const handleSearchKeyDown = (event) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      setIsSearchPreviewOpen(false);
      navigateToSearch(event.currentTarget.value);
    };

    const handleSearchChange = (event) => {
      const nextQuery = event.target.value;
      setSearchQuery(nextQuery);
      setIsSearchPreviewOpen(Boolean(nextQuery.trim()));
    };

    const handleSelectProblem = (problemId) => {
      setIsSearchPreviewOpen(false);
      navigate(`/rezolvare/${problemId}`);
    };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:gap-6 sm:px-6 lg:px-8">
      
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-bold text-text-main" title={title}>{title}</h2>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-6">
        
        <form ref={searchContainerRef} onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Caută probleme..." 
            aria-label="Caută probleme"
            aria-autocomplete="list"
            aria-controls="problem-search-preview"
            aria-expanded={isSearchPreviewOpen && Boolean(searchQuery.trim())}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchPreviewOpen(Boolean(searchQuery.trim()))}
            onKeyDown={handleSearchKeyDown}
            className="bg-background border border-border text-text-main text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-accent transition-colors w-64 placeholder:text-muted"
          />
          {isSearchPreviewOpen && searchQuery.trim() && (
            <div id="problem-search-preview" className="absolute left-1/2 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl" role="listbox" aria-label="Rezultate rapide">
              {previewLoading || solvedStatus.loading ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin text-accent" />Se caută probleme...</div>
              ) : previewError || solvedStatus.error ? (
                <p className="p-3 text-sm text-hard">{previewError || solvedStatus.error}</p>
              ) : previewProblems.length === 0 ? (
                <p className="p-3 text-sm text-muted">Nu am găsit probleme cu acest titlu.</p>
              ) : (
                <div className="divide-y divide-border">
                  {previewProblems.map((problem) => (
                    <button key={problem.id} type="button" role="option" onClick={() => handleSelectProblem(problem.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-hover">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Code2 className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-text-main">{problem.title}</span><span className="mt-1 flex flex-wrap items-center gap-2"><SolvedProblemBadge isSolved={solvedStatus.solvedIds.has(String(problem.id))} /><span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${getDifficultyClass(problem.difficulty)}`}>{problem.difficulty || 'Mixt'}</span><span className="text-xs font-bold text-accent">+{problem.xp_reward || 0} XP</span></span></span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    </button>
                  ))}
                </div>
              )}
              {!previewLoading && !previewError && previewProblems.length > 0 && <button type="submit" className="flex w-full items-center justify-center gap-2 border-t border-border px-3 py-2.5 text-sm font-bold text-accent transition-colors hover:bg-sidebar-hover hover:text-text-main">Vezi toate rezultatele <ChevronRight className="h-4 w-4" /></button>}
            </div>
          )}
        </form>

        <NotificationsBell />

        {/* 3. Linia despărțitoare verticală */}
        <div className="hidden h-6 w-px bg-border sm:block"></div>

        {/* 4. Butonul pentru Trecere pe Light Mode */}
        <button type="button" aria-label={isDark ? 'Activează tema luminoasă' : 'Activează tema întunecată'} aria-pressed={!isDark} className="flex items-center gap-2 rounded-full border border-border bg-background p-2.5 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover sm:px-3 sm:py-1.5" onClick={() => setIsDark((currentTheme) => !currentTheme)}>
          {isDark ? <Sun className="h-6 w-6 text-accent sm:h-4 sm:w-4" /> : <Moon className="h-6 w-6 text-accent sm:h-4 sm:w-4" />}
          <span className="hidden sm:inline">{isDark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        
      </div>
    </header>
  );
}
