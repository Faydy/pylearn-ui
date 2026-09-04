import { AlertTriangle, ArrowLeft, Code2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TopHeader from '../components/MainArea/TopHeader';
import SubmittedSolutions from '../components/profile/SubmittedSolutions';
import PageLoading from '../components/PageLoading';
import { supabase } from '../supabaseClient';

const SUBMISSIONS_PAGE_SIZE = 20;

export default function SolutieTemaElev() {
  const { assignmentId, studentId, problemId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [problemTitle, setProblemTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const loadSubmissions = useCallback(async ({ offset = 0, append = false } = {}) => {
    if (!user) return;

    setLoading(true);
    setError('');
    const { data, error: submissionsError } = await supabase.rpc('get_assignment_student_problem_submissions', {
      p_assignment_id: Number(assignmentId),
      p_student_id: studentId,
      p_problem_id: Number(problemId),
      p_offset: offset,
      p_limit: SUBMISSIONS_PAGE_SIZE + 1,
    });

    if (submissionsError) {
      setError(submissionsError.message || 'Trimiterile elevului nu au putut fi încărcate.');
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
    setProblemTitle(nextSubmissions[0]?.problem_title || 'Problema temei');
    setHasMore(receivedSubmissions.length > SUBMISSIONS_PAGE_SIZE);
    setLoading(false);
  }, [assignmentId, problemId, studentId, user]);

  useEffect(() => {
    setSubmissions([]);
    setProblemTitle('');
    setHasMore(false);
    loadSubmissions();
  }, [loadSubmissions]);

  if (authLoading || loading) return <PageLoading title="Soluții elev" />;

  if (!user || error) {
    return <div className="flex h-full flex-col"><TopHeader title="Soluții elev" /><div className="p-4 sm:p-6"><section className="mx-auto max-w-3xl rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><div><p className="font-bold">Soluțiile nu au putut fi afișate.</p><p className="mt-1 text-sm">{error || 'Trebuie să fii autentificat pentru a vedea soluțiile elevului.'}</p></div></div><Link to={`/teme/${assignmentId}/elev/${studentId}`} className="mt-4 inline-flex font-bold underline">Înapoi la progresul elevului</Link></section></div></div>;
  }

  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Soluții elev" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-6xl pb-10">
          <Link to={`/teme/${assignmentId}/elev/${studentId}`} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la progresul elevului
          </Link>

          <div className="mb-6 flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl bg-accent/10 p-3 text-accent"><Code2 className="h-6 w-6" /></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-accent">Istoric trimiteri</p>
              <h1 className="mt-1 truncate text-2xl font-bold text-text-main sm:text-3xl">{problemTitle}</h1>
              <p className="mt-1 text-muted">Sunt afișate toate trimiterile elevului, inclusiv cele cu răspuns greșit.</p>
            </div>
          </div>

          <SubmittedSolutions
            submissions={submissions}
            loading={loading}
            error={error}
            hasMore={hasMore}
            onLoadMore={() => loadSubmissions({ offset: submissions.length, append: true })}
            onLoadSolution={async (submissionId) => submissions.find((submission) => submission.submission_id === submissionId)}
            title="Toate trimiterile"
            description="Deschide orice trimitere pentru a vedea codul, rezultatul, timpul și memoria folosită."
            showProblemTitle={false}
          />
        </div>
      </main>
    </div>
  );
}
