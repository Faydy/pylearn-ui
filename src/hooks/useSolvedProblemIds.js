import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { solvedProblemIds } from '../utils/solvedProblems';

// For small lists whose existing source cannot embed status (e.g. cached search
// metadata). One query for visible IDs; never cache personal state across visits.
export default function useSolvedProblemIds(problemIds) {
  const { user, loading: authLoading } = useAuth();
  const { key: locationKey } = useLocation();
  const userId = user?.id;
  const idsKey = JSON.stringify([...new Set(problemIds.map(String))].sort());
  const key = JSON.stringify([userId, idsKey, locationKey]);
  const [result, setResult] = useState({});

  useEffect(() => {
    const ids = JSON.parse(idsKey);
    if (authLoading || !userId || ids.length === 0) return undefined;
    const controller = new AbortController();
    supabase.from('user_problem_status').select('problem_id,solved')
      .eq('user_id', userId).eq('solved', true).in('problem_id', ids)
      .abortSignal(controller.signal)
      .then(({ data, error }) => {
        if (!controller.signal.aborted) setResult({ key, ids: error ? new Set() : solvedProblemIds(data || []), error });
      });
    return () => controller.abort();
  }, [authLoading, userId, idsKey, key]);

  const needsStatuses = Boolean(userId) && JSON.parse(idsKey).length > 0;
  return {
    solvedIds: userId && result.key === key ? result.ids : new Set(),
    loading: authLoading || (needsStatuses && result.key !== key),
    error: needsStatuses && result.key === key && result.error
      ? 'Starea problemelor nu a putut fi încărcată.' : '',
  };
}
