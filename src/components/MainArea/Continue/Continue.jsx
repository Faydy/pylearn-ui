import { useEffect, useState } from 'react';
import { BookOpen, Loader2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import { supabase } from '../../../supabaseClient';
import ContinueComponent from './ContinueComponent';

export default function Continue() {
  const { user, profile, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [chapters, setChapters] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContinueData = async () => {
      if (authLoading) return;

      if (!userId) {
        setChapters([]);
        setHasError(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasError(false);

      try {
        let chaptersQuery = supabase
          .from('chapters')
          .select('id, title, section, grade_id, order_index, problems(id, title)')
          .order('order_index', { ascending: true });

        if (profile?.grade_id) {
          chaptersQuery = chaptersQuery.eq('grade_id', profile.grade_id);
        }

        const [chaptersResult, statusesResult, submissionsResult] = await Promise.all([
          chaptersQuery,
          supabase
            .from('user_problem_status')
            .select('problem_id, solved')
            .eq('user_id', userId),
          supabase
            .from('submissions')
            .select('problem_id, submitted_at')
            .eq('user_id', userId)
            .order('submitted_at', { ascending: false })
            .limit(100),
        ]);

        if (chaptersResult.error) throw chaptersResult.error;
        if (statusesResult.error) throw statusesResult.error;
        if (submissionsResult.error) throw submissionsResult.error;

        const solvedProblemIds = new Set(
          (statusesResult.data || [])
            .filter((status) => status.solved)
            .map((status) => status.problem_id),
        );

        // The submission query is newest first, so the first value we keep is the latest activity.
        const latestSubmissionByProblem = new Map();
        (submissionsResult.data || []).forEach((submission) => {
          if (!latestSubmissionByProblem.has(submission.problem_id)) {
            latestSubmissionByProblem.set(submission.problem_id, submission.submitted_at);
          }
        });

        const nextChapters = (chaptersResult.data || [])
          .map((chapter) => {
            const problems = [...(chapter.problems || [])].sort((first, second) => first.id - second.id);
            const solvedCount = problems.filter((problem) => solvedProblemIds.has(problem.id)).length;
            const unfinishedProblems = problems.filter((problem) => !solvedProblemIds.has(problem.id));
            const latestUnfinishedProblem = unfinishedProblems.reduce((latest, problem) => {
              const submittedAt = latestSubmissionByProblem.get(problem.id);
              return submittedAt && (!latest || submittedAt > latest.submittedAt)
                ? { problem, submittedAt }
                : latest;
            }, null);
            const nextProblem = latestUnfinishedProblem?.problem || unfinishedProblems[0];
            const latestActivity = problems.reduce((latest, problem) => {
              const submittedAt = latestSubmissionByProblem.get(problem.id);
              return submittedAt && (!latest || submittedAt > latest) ? submittedAt : latest;
            }, null);

            return {
              id: chapter.id,
              category: chapter.section || 'Capitol',
              title: chapter.title,
              percentage: problems.length === 0 ? 0 : Math.round((solvedCount / problems.length) * 100),
              nextProblemId: nextProblem?.id,
              latestActivity,
              orderIndex: chapter.order_index || 0,
              problemCount: problems.length,
            };
          })
          .filter((chapter) => chapter.problemCount > 0 && chapter.nextProblemId)
          .sort((first, second) => {
            if (first.latestActivity && second.latestActivity) {
              return second.latestActivity.localeCompare(first.latestActivity);
            }

            if (first.latestActivity) return -1;
            if (second.latestActivity) return 1;
            return first.orderIndex - second.orderIndex;
          })
          .slice(0, 3);

        setChapters(nextChapters);
      } catch (error) {
        console.error('Eroare la încărcarea progresului:', error.message);
        setChapters([]);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueData();
  }, [authLoading, profile?.grade_id, userId]);

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-mono text-lg font-semibold text-text-main">Continuă de unde ai rămas</h2>
          <p className="mt-1 text-sm text-muted">Progresul tău pe capitolele cu probleme.</p>
        </div>
      </div>

      {authLoading || loading ? (
        <div className="flex min-h-44 items-center justify-center rounded-xl border border-border bg-ink">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : !user ? (
        <div className="rounded-xl border border-dashed border-border bg-ink p-6 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-accent" />
          <p className="mt-3 font-semibold text-text-main">Păstrează progresul într-un cont</p>
          <p className="mt-1 text-sm text-muted">Poți rezolva probleme și fără cont; autentifică-te pentru a relua progresul de pe orice dispozitiv.</p>
          <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent transition-colors hover:text-text-main">
            <LogIn className="h-4 w-4" />Intră în cont
          </Link>
        </div>
      ) : hasError ? (
        <div className="rounded-xl border border-hard/20 bg-hard/10 p-6 text-center">
          <p className="font-semibold text-hard">Progresul nu a putut fi încărcat momentan.</p>
          <p className="mt-1 text-sm text-muted">Reîncarcă pagina și încearcă din nou.</p>
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-ink p-6 text-center">
          <p className="font-semibold text-text-main">Ai finalizat toate capitolele disponibile.</p>
          <Link to="/probleme" className="mt-3 inline-flex text-sm font-bold text-accent transition-colors hover:text-text-main">Explorează alte probleme</Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {chapters.map((chapter) => (
            <ContinueComponent
              key={chapter.id}
              categorie={chapter.category}
              titlu={chapter.title}
              procentaj={chapter.percentage}
              to={`/rezolvare/${chapter.nextProblemId}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
