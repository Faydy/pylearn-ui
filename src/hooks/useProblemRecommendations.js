import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { scopeSolvedStatus, solvedStatusColumn } from '../utils/solvedProblems';

// These existing dashboard suggestions deliberately recommend unfinished work.
// Use the same solved=true anti-join as the archive's Nerezolvate filter.
export default function useProblemRecommendations(limit) {
  const { user, profile, loading: authLoading } = useAuth();
  const { key: locationKey } = useLocation();
  const userId = user?.id;
  const gradeId = userId ? profile?.grade_id : undefined;
  const key = JSON.stringify([userId, gradeId, limit, locationKey]);
  const [result, setResult] = useState({});

  useEffect(() => {
    if (authLoading) return undefined;
    const controller = new AbortController();
    let query = supabase.from('problems')
      .select('id,title,description,difficulty,xp_reward,chapters!inner(section,grade_id)' + solvedStatusColumn(userId))
      .order('id').limit(limit);
    if (gradeId) query = query.eq('chapters.grade_id', gradeId);
    scopeSolvedStatus(query, userId, 'unsolved').abortSignal(controller.signal)
      .then(({ data, error }) => {
        if (!controller.signal.aborted) setResult({ key, problems: data || [], error });
      });
    return () => controller.abort();
  }, [authLoading, userId, gradeId, limit, key]);

  return {
    problems: result.key === key ? result.problems || [] : [],
    loading: authLoading || result.key !== key,
    error: result.key === key && result.error ? 'Problemele recomandate nu au putut fi încărcate.' : '',
    isGuest: !userId,
  };
}
