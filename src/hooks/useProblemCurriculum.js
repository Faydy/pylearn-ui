import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

export default function useProblemCurriculum({ gradeId, chapterId } = {}) {
  const { user, loading: authLoading } = useAuth();
  const { pathname } = useLocation();
  const [state, setState] = useState({});
  const [attempt, setAttempt] = useState(0);
  // Query-string filters must not change or refetch the chapter's overall progress.
  const key = JSON.stringify([gradeId, chapterId, user?.id, pathname, attempt]);
  useEffect(() => {
    if (authLoading) return undefined;
    const controller = new AbortController();
    const load = async () => {
      try {
        if (![gradeId, chapterId].some((id) => id && /^\d+$/.test(id) && Number(id) > 0 && Number(id) <= 2147483647)) throw new Error('invalid scope');
        const [gradeResult, chapters] = await Promise.all([
          gradeId ? supabase.from('grades').select('id,name').eq('id', gradeId).maybeSingle().abortSignal(controller.signal) : null,
          (async () => {
            const rows = [];
            // Page aggregate rows only, never problem records; no per-chapter requests.
            for (let offset = 0; ; offset += 1000) {
              const { data, error } = await supabase.rpc('get_problem_curriculum', {
                p_grade_id: gradeId ? Number(gradeId) : null,
                p_chapter_id: chapterId ? Number(chapterId) : null,
              }).range(offset, offset + 999).abortSignal(controller.signal);
              if (error) throw error;
              rows.push(...data);
              if (data.length < 1000) return rows;
            }
          })(),
        ]);
        if (gradeResult?.error) throw gradeResult.error;
        const grade = gradeResult?.data || (chapters[0] ? { id: chapters[0].grade_id, name: chapters[0].grade_name } : null);
        if (!controller.signal.aborted) setState({ key, grade, chapters });
      } catch {
        if (!controller.signal.aborted) setState({ key, error: 'Programa și progresul nu au putut fi încărcate. Încearcă din nou.' });
      }
    };
    load();
    return () => controller.abort();
  }, [key, gradeId, chapterId, authLoading]);

  // Refresh when returning to the browser tab; route changes load above.
  useEffect(() => {
    const refresh = () => setAttempt((value) => value + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const current = state.key === key ? state : {};
  return {
    grade: current.grade, chapters: current.chapters || [], error: current.error,
    loading: authLoading || state.key !== key, personal: Boolean(user),
    retry: () => setAttempt((value) => value + 1),
  };
}
