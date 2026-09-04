import Editor from '@monaco-editor/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Cpu, MemoryStick } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TopHeader from '../components/MainArea/TopHeader';
import PageLoading from '../components/PageLoading';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

function formatSubmittedAt(value) {
  if (!value) return 'Dată indisponibilă';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă';
  return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function SolutieTemaElev() {
  const { assignmentId, studentId, problemId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSolution = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      const { data, error: solutionError } = await supabase.rpc('get_assignment_student_details', {
        p_assignment_id: Number(assignmentId),
        p_student_id: studentId,
      });

      if (solutionError) {
        setError(solutionError.message);
      } else {
        const problemSolution = (data || []).find((problem) => Number(problem.problem_id) === Number(problemId));
        if (!problemSolution?.submission_id || !problemSolution.source_code) {
          setError('Nu există încă o soluție acceptată pentru această problemă.');
        } else {
          setSolution(problemSolution);
        }
      }
      setLoading(false);
    };

    loadSolution();
  }, [assignmentId, problemId, studentId, user]);

  if (authLoading || loading) {
    return <PageLoading title="Soluție elev" />;
  }

  if (!user || error || !solution) {
    return <div className="flex h-full flex-col"><TopHeader title="Soluție elev" /><div className="p-4 sm:p-6"><section className="mx-auto max-w-3xl rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><div><p className="font-bold">Soluția nu a putut fi afișată.</p><p className="mt-1 text-sm">{error || 'Trebuie să fii autentificat pentru a vedea soluția.'}</p></div></div><Link to={`/teme/${assignmentId}/elev/${studentId}`} className="mt-4 inline-flex font-bold underline">Înapoi la progresul elevului</Link></section></div></div>;
  }

  return (
    <div className="flex h-full flex-col"><TopHeader title="Soluție elev" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-6xl pb-10"><Link to={`/teme/${assignmentId}/elev/${studentId}`} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la progresul elevului</Link>
      <section className="rounded-2xl border border-border bg-ink p-4 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-sm font-bold text-accent">Soluție acceptată</p><h1 className="mt-2 text-2xl font-bold text-text-main">{solution.problem_title}</h1><p className="mt-2 text-sm text-muted">{solution.student_username} · {solution.assignment_title}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-lg border border-easy/20 bg-easy/10 px-3 py-2 text-sm font-bold text-easy"><CheckCircle2 className="h-4 w-4" />Acceptată</span></div>
        <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3"><div className="rounded-xl border border-border bg-background p-3"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><Clock3 className="h-4 w-4" />Trimisă</p><p className="mt-2 text-sm font-bold text-text-main">{formatSubmittedAt(solution.submitted_at)}</p></div><div className="rounded-xl border border-border bg-background p-3"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><Cpu className="h-4 w-4" />Timp</p><p className="mt-2 text-sm font-bold text-text-main">{solution.runtime_ms == null ? 'Indisponibil' : `${solution.runtime_ms} ms`}</p></div><div className="rounded-xl border border-border bg-background p-3"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><MemoryStick className="h-4 w-4" />Memorie</p><p className="mt-2 text-sm font-bold text-text-main">{solution.memory_kb == null ? 'Indisponibilă' : `${solution.memory_kb} KB`}</p></div></div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-ink"><div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5"><div><h2 className="font-bold text-text-main">Python</h2><p className="mt-0.5 text-xs text-muted">Vizualizare doar pentru citire</p></div><span className="rounded-md bg-background px-2 py-1 font-mono text-xs text-muted">main.py</span></div><Editor height="min(65vh, 46rem)" language="python" theme="vs-dark" value={solution.source_code} options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 14, padding: { top: 16, bottom: 16 } }} /></section>
    </div></main></div>
  );
}
