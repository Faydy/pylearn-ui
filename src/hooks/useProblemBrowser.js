import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { buildProblemQuery, changeProblemFilters, FILTER_KEYS, PROBLEM_PAGE_SIZE, readProblemFilters, writeProblemFilters } from '../utils/problemFilters';

// Metadata is small; page through it so Supabase's row cap never hides options.
async function readMetadata(query, signal) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await query().range(offset, offset + 999).abortSignal(signal);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

export default function useProblemBrowser({ gradeId, section, chapterId, grouped = false } = {}) {
  const { user, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [metadataState, setMetadataState] = useState({});
  const [result, setResult] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const [draft, setDraft] = useState({});
  const scope = { gradeId, section, chapterId };
  const scopeKey = JSON.stringify([gradeId, section, chapterId]);
  const metadataKey = `${scopeKey}:${retryCount}`;
  const metadata = metadataState.key === metadataKey ? metadataState.data : undefined;
  const metadataError = metadataState.key === metadataKey ? metadataState.error : '';
  const { filters, sections, chapters } = readProblemFilters(params, scope, metadata, Boolean(user));
  const search = draft.key === location.key ? draft.value : filters.q;
  const canonical = writeProblemFilters(params, filters).toString();
  const paramsString = params.toString();

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [grades, chapterRows, categories] = await Promise.all([
          readMetadata(() => supabase.from('grades').select('id,name,level').order('level').order('id'), controller.signal),
          readMetadata(() => {
            let query = supabase.from('chapters').select('id,title,section,grade_id,order_index').order('order_index').order('id');
            if (gradeId) query = query.eq('grade_id', gradeId);
            if (chapterId) query = query.eq('id', chapterId);
            return query;
          }, controller.signal),
          readMetadata(() => supabase.from('categories').select('id,name,slug').order('id'), controller.signal),
        ]);
        if (!controller.signal.aborted) setMetadataState({ key: metadataKey, data: { grades, chapters: chapterRows, categories } });
      } catch {
        if (!controller.signal.aborted) setMetadataState({ key: metadataKey, error: 'Filtrele nu au putut fi încărcate.' });
      }
    };
    load();
    return () => controller.abort();
  }, [gradeId, chapterId, metadataKey]);

  useEffect(() => {
    if (metadata && canonical !== paramsString) setParams(new URLSearchParams(canonical), { replace: true });
  }, [metadata, canonical, paramsString, setParams]);

  const update = (changes, { replace = false } = {}) => {
    const next = changeProblemFilters(filters, { q: search, ...changes }, scope, metadata, Boolean(user));
    setDraft({});
    setParams(writeProblemFilters(params, next), { replace });
  };

  useEffect(() => {
    if (!metadata || draft.key !== location.key || search.trim() === filters.q) return undefined;
    const timeout = setTimeout(() => {
      const next = changeProblemFilters(filters, { q: search }, scope, metadata, Boolean(user));
      // A committed draft must not be revived when Back returns to its old key.
      setDraft({});
      setParams(writeProblemFilters(params, next));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filters.q, location.key, draft.key, metadata, paramsString, user?.id]);

  const queryKey = JSON.stringify([scopeKey, filters, user?.id, retryCount, grouped, location.key]);
  useEffect(() => {
    if (!metadata || authLoading) return undefined;
    const controller = new AbortController();
    const load = async () => {
      try {
        const options = { filters, scope, userId: user?.id, grouped };
        const offset = (filters.page - 1) * PROBLEM_PAGE_SIZE;
        const { data, count, error } = await buildProblemQuery(supabase, options).range(offset, offset + PROBLEM_PAGE_SIZE - 1).abortSignal(controller.signal);
        if (controller.signal.aborted) return;
        if (error?.code === 'PGRST103' || (!error && filters.page > Math.max(1, Math.ceil(count / PROBLEM_PAGE_SIZE)))) {
          setParams(writeProblemFilters(params, { ...filters, page: 1 }), { replace: true });
          return;
        }
        if (error) throw error;
        let hasProblems = count > 0;
        if (!hasProblems && FILTER_KEYS.some((key) => filters[key])) {
          const base = await buildProblemQuery(supabase, { ...options, head: true, base: true }).abortSignal(controller.signal);
          if (base.error) throw base.error;
          hasProblems = base.count > 0;
        }
        if (!controller.signal.aborted) setResult({ key: queryKey, problems: data || [], total: count || 0, hasProblems });
      } catch {
        if (!controller.signal.aborted) setResult({ key: queryKey, error: 'Problemele nu au putut fi încărcate. Încearcă din nou.' });
      }
    };
    load();
    return () => controller.abort();
  }, [queryKey, metadata, authLoading]);

  const current = result.key === queryKey ? result : {};
  return {
    filters, search, metadata, sections, chapters, scope,
    problems: current.problems || [], total: current.total || 0,
    hasProblems: current.hasProblems, error: metadataError || current.error,
    loading: authLoading || !metadataError && (!metadata || result.key !== queryKey || search.trim() !== filters.q),
    activeCount: FILTER_KEYS.filter((key) => key === 'q' ? search.trim() : filters[key]).length,
    showStatus: Boolean(user),
    setSearch: (value) => setDraft({ key: location.key, value }),
    update,
    reset: () => {
      setDraft({});
      setParams(writeProblemFilters(params, { page: 1 }));
    },
    setPage: (page) => setParams(writeProblemFilters(params, { ...filters, page })),
    retry: () => setRetryCount((value) => value + 1),
  };
}
