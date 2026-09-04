import { AlertTriangle, ArrowLeft, CalendarClock, ClipboardList, Loader2, LockKeyhole, Pencil, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AssignmentProblemList from '../components/assignments/AssignmentProblemList';
import AssignmentProgress from '../components/assignments/AssignmentProgress';
import StudentAssignmentProgressCard from '../components/assignments/StudentAssignmentProgressCard';
import TopHeader from '../components/MainArea/TopHeader';
import PageLoading from '../components/PageLoading';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { formatDueAt, getAssignmentProgress, isTeacher } from '../utils/assignments';

function getTeacherSummary(students) {
  const completed = students.filter((student) => student.total > 0 && student.solvedCount === student.total).length;
  const inProgress = students.filter((student) => student.solvedCount > 0 && student.solvedCount < student.total).length;
  const notStarted = students.length - completed - inProgress;
  const average = students.length === 0
    ? 0
    : Math.round(students.reduce((sum, student) => sum + student.percentage, 0) / students.length);
  const submittedAfterDeadline = students.filter((student) => student.submittedAfterDeadline).length;

  return { completed, inProgress, notStarted, average, submittedAfterDeadline };
}

export default function TemaDetalii() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [problems, setProblems] = useState([]);
  const [progress, setProgress] = useState({ solvedCount: 0, total: 0, percentage: 0, solvedIds: new Set() });
  const [studentProgress, setStudentProgress] = useState([]);
  const [studentProgressError, setStudentProgressError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const teacherView = isTeacher(profile, user);

  const loadStudentProgress = useCallback(async () => {
    if (!teacherView || !assignmentId) return;

    let { data, error: progressError } = await supabase.rpc('get_assignment_student_progress_with_deadline', {
      p_assignment_id: Number(assignmentId),
    });

    // Keep existing teacher progress available until the accompanying SQL migration
    // is applied to a deployed Supabase project.
    if (progressError?.code === 'PGRST202') {
      ({ data, error: progressError } = await supabase.rpc('get_assignment_student_progress', {
        p_assignment_id: Number(assignmentId),
      }));
    }
    if (progressError) throw progressError;

    setStudentProgress((data || []).map((student) => ({
      id: student.student_id,
      username: student.username || 'Elev PyLearn',
      avatar: student.avatar,
      solvedCount: Number(student.solved_count) || 0,
      total: Number(student.total_count) || 0,
      percentage: Number(student.progress_percentage) || 0,
      submittedAfterDeadline: Boolean(student.submitted_after_deadline),
    })));
    setStudentProgressError('');
  }, [assignmentId, teacherView]);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data: assignmentRow, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, classroom_id, created_by, title, description, due_at, published, is_finalized, finalized_at, created_at')
          .eq('id', assignmentId)
          .maybeSingle();
        if (assignmentError) throw assignmentError;
        if (!assignmentRow) throw new Error('Tema nu există sau nu este disponibilă.');

        let classroomName = '';
        if (teacherView) {
          const { data: classroom, error: classroomError } = await supabase
            .from('classrooms')
            .select('id, name')
            .eq('id', assignmentRow.classroom_id)
            .eq('teacher_id', user.id)
            .maybeSingle();
          if (classroomError) throw classroomError;
          if (!classroom) throw new Error('Nu ai acces la tema acestei clase.');
          classroomName = classroom.name;
        } else {
          if (!assignmentRow.published) throw new Error('Această temă este încă în draft.');

          const { data: membership, error: membershipError } = await supabase
            .from('classroom_members')
            .select('classroom_id')
            .eq('classroom_id', assignmentRow.classroom_id)
            .eq('student_id', user.id)
            .maybeSingle();
          if (membershipError) throw membershipError;
          if (!membership) throw new Error('Nu faci parte din clasa acestei teme.');

          const { data: classroom, error: classroomError } = await supabase
            .from('classrooms')
            .select('name')
            .eq('id', assignmentRow.classroom_id)
            .maybeSingle();
          if (classroomError) throw classroomError;
          classroomName = classroom?.name || 'Clasă';
        }

        const { data: assignmentProblemRows, error: assignmentProblemsError } = await supabase
          .from('assignment_problems')
          .select('problem_id, position')
          .eq('assignment_id', assignmentRow.id)
          .order('position');
        if (assignmentProblemsError) throw assignmentProblemsError;

        const problemIds = (assignmentProblemRows || []).map((item) => item.problem_id);
        let problemRows = [];
        if (problemIds.length > 0) {
          const { data, error: problemsError } = await supabase
            .from('problems')
            .select('id, title, difficulty, xp_reward, chapter_id, category_id, chapters(title, section), categories(name)')
            .in('id', problemIds);
          if (problemsError) throw problemsError;
          problemRows = data || [];
        }

        const problemsById = new Map(problemRows.map((problem) => [problem.id, problem]));
        const orderedProblems = (assignmentProblemRows || [])
          .map((item) => ({ ...item, problem: problemsById.get(item.problem_id) }))
          .filter((item) => item.problem);

        const { data: statusRows, error: statusesError } = problemIds.length === 0
          ? { data: [], error: null }
          : await supabase
            .from('user_problem_status')
            .select('problem_id, solved')
            .eq('user_id', user.id)
            .in('problem_id', problemIds);
        if (statusesError) throw statusesError;

        setAssignment({ ...assignmentRow, classroomName });
        setProblems(orderedProblems);
        setProgress(getAssignmentProgress(problemIds, statusRows || []));

        if (teacherView) {
          try {
            await loadStudentProgress();
          } catch (progressError) {
            console.error('Eroare la încărcarea progresului elevilor:', progressError.message);
            setStudentProgressError('Progresul elevilor nu a putut fi încărcat.');
          }
        }
      } catch (fetchError) {
        console.error('Eroare la încărcarea temei:', fetchError.message);
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, loadStudentProgress, teacherView, user]);

  useEffect(() => {
    if (!teacherView || !user || problems.length === 0) return undefined;

    let refreshTimer;
    const channel = supabase.channel(`assignment-progress:${assignmentId}`);
    problems.forEach(({ problem }) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_problem_status', filter: `problem_id=eq.${problem.id}` },
        () => {
          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(async () => {
            try {
              await loadStudentProgress();
            } catch (progressError) {
              console.error('Eroare la actualizarea progresului elevilor:', progressError.message);
              setStudentProgressError('Progresul elevilor nu a putut fi actualizat.');
            }
          }, 250);
        },
      );
    });
    channel.subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [assignmentId, loadStudentProgress, problems, teacherView, user]);

  const handleDelete = async () => {
    if (!assignment || !window.confirm(`Ștergi definitiv tema „${assignment.title}”?`)) return;

    setDeleting(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id);
      if (deleteError) throw deleteError;

      navigate('/teme', { replace: true });
    } catch (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoading title="Teme" />;
  }

  if (!user) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="flex flex-1 items-center justify-center p-4 sm:p-6"><div className="max-w-md rounded-2xl border border-border bg-ink p-6 text-center sm:p-8"><ClipboardList className="mx-auto h-8 w-8 text-accent" /><h1 className="mt-4 text-xl font-bold text-text-main">Intră în cont pentru a vedea tema</h1><Link to="/login" className="mt-5 inline-flex font-bold text-accent hover:text-text-main">Intră în cont</Link></div></div></div>;
  }

  if (error || !assignment) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="p-4 sm:p-6"><div className="mx-auto max-w-3xl rounded-2xl border border-hard/20 bg-hard/10 p-4 text-hard sm:p-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><div><p className="font-bold">Tema nu a putut fi afișată.</p><p className="mt-1 text-sm">{error || 'Tema nu a fost găsită.'}</p></div></div><Link to="/teme" className="mt-4 inline-flex font-bold underline">Înapoi la teme</Link></div></div></div>;
  }

  const teacherSummary = getTeacherSummary(studentProgress);

  return (
    <div className="flex h-full flex-col"><TopHeader title="Teme" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-5xl pb-10"><Link to="/teme" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la teme</Link>
      <section className="rounded-2xl border border-border bg-ink p-4 sm:p-6 md:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-bold text-accent"><ClipboardList className="h-5 w-5" />{assignment.classroomName}</div><h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">{assignment.title}</h1>{assignment.description && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-muted">{assignment.description}</p>}{assignment.due_at ? <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-muted"><CalendarClock className="h-4 w-4 text-accent" />Deadline: {formatDueAt(assignment.due_at)}</p> : <p className="mt-4 text-sm text-muted">Fără deadline</p>}{assignment.is_finalized && <p className="mt-4 flex max-w-2xl items-start gap-2 rounded-xl border border-medium/20 bg-medium/10 p-3 text-sm text-text-main"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-medium" /><span><strong>Tema este finalizată.</strong> {teacherView ? 'Elevii nu mai pot trimite soluții pentru problemele ei.' : 'Poți consulta problemele, însă nu mai poți trimite soluții.'}</span></p>}</div>{teacherView && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Link to={`/teme/${assignment.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent"><Pencil className="h-4 w-4" />Editează</Link><button type="button" onClick={handleDelete} disabled={deleting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-hard/30 px-3 py-2 text-sm font-bold text-hard transition-colors hover:bg-hard/10 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Șterge</button></div>}</div>
        <div className="mt-8 border-t border-border pt-6">
          {teacherView ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-bold uppercase tracking-wider text-muted">Elevi</p><p className="mt-2 text-2xl font-bold text-text-main">{studentProgress.length}</p></div><div className="rounded-xl border border-easy/20 bg-easy/10 p-3"><p className="text-xs font-bold uppercase tracking-wider text-easy">Finalizat</p><p className="mt-2 text-2xl font-bold text-text-main">{teacherSummary.completed}</p></div><div className="rounded-xl border border-medium/20 bg-medium/10 p-3"><p className="text-xs font-bold uppercase tracking-wider text-medium">În progres</p><p className="mt-2 text-2xl font-bold text-text-main">{teacherSummary.inProgress}</p></div><div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-bold uppercase tracking-wider text-muted">Nefăcut</p><p className="mt-2 text-2xl font-bold text-text-main">{teacherSummary.notStarted}</p></div><div className="rounded-xl border border-hard/20 bg-hard/10 p-3"><p className="text-xs font-bold uppercase tracking-wider text-hard">După deadline</p><p className="mt-2 text-2xl font-bold text-text-main">{teacherSummary.submittedAfterDeadline}</p></div><div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-bold uppercase tracking-wider text-muted">Medie</p><p className="mt-2 text-2xl font-bold text-text-main">{teacherSummary.average}%</p></div></div> : <AssignmentProgress solvedCount={progress.solvedCount} total={progress.total} dueAt={assignment.due_at} />}
        </div>
      </section>

      <section className="mt-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold text-text-main">Problemele temei</h2><p className="mt-1 text-sm text-muted">{teacherView ? 'Problemele incluse în tema publicată elevilor.' : 'Rezolvă-le în ordine sau alege problema cu care vrei să continui.'}</p></div><span className="rounded-md bg-accent/10 px-3 py-1 text-sm font-bold text-accent">{problems.length}</span></div><AssignmentProblemList problems={problems} solvedIds={progress.solvedIds} /></section>

      {teacherView && <section className="mt-6 rounded-2xl border border-border bg-ink p-4 sm:p-6"><div className="mb-5 flex items-center gap-2"><Users className="h-5 w-5 text-accent" /><div><h2 className="text-xl font-bold text-text-main">Progres elevi</h2><p className="mt-1 text-sm text-muted">Se actualizează automat când un elev rezolvă o problemă din temă.</p></div></div>{studentProgressError ? <p className="rounded-xl border border-hard/20 bg-hard/10 p-4 text-sm text-hard">{studentProgressError}</p> : studentProgress.length === 0 ? <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">Nu există elevi înscriși în această clasă.</p> : <div className="grid gap-3 lg:grid-cols-2">{studentProgress.map((student) => <StudentAssignmentProgressCard key={student.id} assignmentId={assignment.id} student={student} />)}</div>}</section>}
    </div></main></div>
  );
}
