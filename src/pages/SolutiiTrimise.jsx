import { ArrowLeft, Code2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TopHeader from '../components/MainArea/TopHeader';
import SubmittedSolutions from '../components/profile/SubmittedSolutions';
import PageLoading from '../components/PageLoading';
import { supabase } from '../supabaseClient';

const SUBMISSIONS_PAGE_SIZE = 20;

export default function SolutiiTrimise() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const loadSubmissions = useCallback(async ({ offset = 0, append = false } = {}) => {
    if (!user) return;

    setLoading(true);
    setError('');
    const { data, error: submissionsError } = await supabase.rpc('get_own_recent_submissions', {
      p_offset: offset,
      p_limit: SUBMISSIONS_PAGE_SIZE + 1,
    });

    if (submissionsError) {
      setError('Soluțiile trimise nu au putut fi încărcate.');
      setLoading(false);
      return;
    }

    const receivedSubmissions = data || [];
    const nextSubmissions = receivedSubmissions.slice(0, SUBMISSIONS_PAGE_SIZE);
    setSubmissions((current) => {
      if (!append) return nextSubmissions;

      const knownIds = new Set(current.map((submission) => submission.submission_id));
      return [...current, ...nextSubmissions.filter((submission) => !knownIds.has(submission.submission_id))];
    });
    setHasMore(receivedSubmissions.length > SUBMISSIONS_PAGE_SIZE);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const loadSubmissionSolution = async (submissionId) => {
    const { data, error: submissionError } = await supabase.rpc('get_own_submission', {
      p_submission_id: submissionId,
    });

    if (submissionError) throw submissionError;
    if (!data?.[0]) throw new Error('Soluția nu a fost găsită.');
    return data[0];
  };

  if (!user && loading) return <PageLoading title="Soluții trimise" />;

  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Soluții trimise" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-6xl pb-10">
          <Link to="/profil" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la profil
          </Link>

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent"><Code2 className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-bold text-text-main sm:text-3xl">Soluții trimise</h1>
              <p className="mt-1 text-muted">Istoricul complet al soluțiilor pe care le-ai trimis.</p>
            </div>
          </div>

          <SubmittedSolutions
            submissions={submissions}
            loading={loading}
            error={error}
            hasMore={hasMore}
            onLoadMore={() => loadSubmissions({ offset: submissions.length, append: true })}
            onLoadSolution={loadSubmissionSolution}
            title="Toate soluțiile trimise"
            description="Deschide o soluție pentru a vedea codul și rezultatul trimiterii."
          />
        </div>
      </main>
    </div>
  );
}
