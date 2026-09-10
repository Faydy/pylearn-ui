import SolvedProblemBadge from '../components/problems/SolvedProblemBadge';
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, Eye, Star, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TopHeader from '../components/MainArea/TopHeader';
import PageLoading from '../components/PageLoading';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { getDifficultyClasses } from '../utils/assignments';
import { getAvatarUrl, getProfileAvatarSeed } from '../utils/profile';

export default function TemaElevDetalii() {
  const { assignmentId, studentId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      const { data, error: detailsError } = await supabase.rpc('get_assignment_student_details', {
        p_assignment_id: Number(assignmentId),
        p_student_id: studentId,
      });

      if (detailsError) {
        setError(detailsError.message);
      } else if (!data?.length) {
        setError('Tema nu conține probleme care pot fi inspectate.');
      } else {
        setDetails(data);
      }
      setLoading(false);
    };

    loadDetails();
  }, [assignmentId, studentId, user]);

  if (authLoading || loading) {
    return <PageLoading title="Teme" />;
  }

  if (!user) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="flex flex-1 items-center justify-center p-4"><section className="max-w-md rounded-2xl border border-border bg-ink p-6 text-center"><UserRound className="mx-auto h-8 w-8 text-accent" /><h1 className="mt-4 text-xl font-bold text-text-main">Intră în cont pentru a vedea progresul</h1><Link to="/login" className="mt-5 inline-flex font-bold text-accent">Intră în cont</Link></section></div></div>;
  }

  if (error || details.length === 0) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="p-4 sm:p-6"><section className="mx-auto max-w-3xl rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><div><p className="font-bold">Progresul elevului nu a putut fi afișat.</p><p className="mt-1 text-sm">{error || 'Datele nu sunt disponibile.'}</p></div></div><Link to={`/teme/${assignmentId}`} className="mt-4 inline-flex font-bold underline">Înapoi la temă</Link></section></div></div>;
  }

  const student = details[0];
  const solvedCount = details.filter((problem) => problem.solved).length;
  const percentage = details.length === 0 ? 0 : Math.round((solvedCount / details.length) * 100);

  return (
    <div className="flex h-full flex-col"><TopHeader title="Teme" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-5xl pb-10"><Link to={`/teme/${assignmentId}`} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la tema clasei</Link>
      <section className="rounded-2xl border border-border bg-ink p-4 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><img src={getAvatarUrl(getProfileAvatarSeed({ avatar: student.student_avatar, username: student.student_username }))} alt="" className="h-14 w-14 shrink-0 rounded-2xl border border-border bg-sidebar" /><div className="min-w-0"><p className="text-sm font-bold text-accent">Progres elev</p><h1 className="mt-1 truncate text-2xl font-bold text-text-main">{student.student_username || 'Elev PyLearn'}</h1><p className="mt-1 truncate text-sm text-muted">{student.assignment_title}</p></div></div><Link to={`/profil/${student.student_id}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-accent"><UserRound className="h-4 w-4" />Profil public</Link></div>
        <div className="mt-6 border-t border-border pt-5"><div className="flex items-end justify-between gap-4"><div><p className="text-sm text-muted">Progres în temă</p><p className="mt-1 text-2xl font-bold text-text-main">{solvedCount} / {details.length} probleme</p></div><p className="text-2xl font-bold text-accent">{percentage}%</p></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${percentage}%` }} /></div></div>
      </section>

      {solvedCount === 0 && <p className="mt-6 rounded-xl border border-dashed border-border bg-ink p-5 text-center text-sm text-muted">Elevul nu a rezolvat încă nicio problemă din această temă.</p>}

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-ink"><div className="border-b border-border px-4 py-5 sm:px-6"><h2 className="text-xl font-bold text-text-main">Problemele temei</h2><p className="mt-1 text-sm text-muted">Poți inspecta toate trimiterile elevului, inclusiv încercările cu răspuns greșit.</p></div><div className="divide-y divide-border">{details.map((problem) => <article key={problem.problem_id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${problem.solved ? 'bg-easy/10 text-easy' : 'bg-background text-muted'}`}>{problem.solved ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><p className="font-bold text-text-main">{problem.problem_title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-md border px-2 py-0.5 font-bold ${getDifficultyClasses(problem.problem_difficulty)}`}>{problem.problem_difficulty || 'Mixt'}</span><span className="inline-flex items-center gap-1 font-bold text-accent"><Star className="h-3.5 w-3.5 fill-current" />+{problem.problem_xp_reward || 0} XP</span><SolvedProblemBadge isSolved={problem.solved === true} /></div></div><Link to={`/teme/${assignmentId}/elev/${studentId}/problema/${problem.problem_id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/20"><Eye className="h-4 w-4" />Vezi trimiterile</Link></article>)}</div></section>
    </div></main></div>
  );
}
