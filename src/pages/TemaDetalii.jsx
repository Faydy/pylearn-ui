import { AlertTriangle, ArrowLeft, ClipboardList, Loader2, Pencil, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AssignmentProblemList from '../components/assignments/AssignmentProblemList';
import AssignmentProgress from '../components/assignments/AssignmentProgress';
import TopHeader from '../components/MainArea/TopHeader';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { getAssignmentProgress, getAssignmentStatus, isTeacher } from '../utils/assignments';

export default function TemaDetalii() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [problems, setProblems] = useState([]);
  const [progress, setProgress] = useState({ solvedCount: 0, total: 0, percentage: 0, solvedIds: new Set() });
  const [studentProgress, setStudentProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const teacherView = isTeacher(profile, user);

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
          .select('id, classroom_id, created_by, title, description, due_at, published, created_at')
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
          const { data: memberRows, error: membersError } = await supabase
            .from('classroom_members')
            .select('student_id')
            .eq('classroom_id', assignmentRow.classroom_id);
          if (membersError) throw membersError;

          const studentIds = (memberRows || []).map((member) => member.student_id);
          if (studentIds.length === 0) {
            setStudentProgress([]);
          } else {
            const [profilesResponse, statusesResponse] = await Promise.all([
              supabase.from('profiles').select('id, username').in('id', studentIds),
              problemIds.length === 0
                ? Promise.resolve({ data: [], error: null })
                : supabase.from('user_problem_status').select('user_id, problem_id, solved').in('user_id', studentIds).in('problem_id', problemIds),
            ]);

            if (profilesResponse.error) throw profilesResponse.error;
            if (statusesResponse.error) throw statusesResponse.error;

            const profileNames = new Map((profilesResponse.data || []).map((student) => [student.id, student.username]));
            const statusesByStudent = new Map();
            (statusesResponse.data || []).forEach((status) => {
              const currentStatuses = statusesByStudent.get(status.user_id) || [];
              currentStatuses.push(status);
              statusesByStudent.set(status.user_id, currentStatuses);
            });

            setStudentProgress(studentIds.map((studentId) => {
              const studentAssignmentProgress = getAssignmentProgress(problemIds, statusesByStudent.get(studentId) || []);
              return {
                id: studentId,
                username: profileNames.get(studentId) || 'Elev fără username',
                ...studentAssignmentProgress,
                status: getAssignmentStatus({ ...studentAssignmentProgress, dueAt: assignmentRow.due_at }),
              };
            }).sort((first, second) => first.username.localeCompare(second.username, 'ro')));
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
  }, [assignmentId, teacherView, user]);

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
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></div>;
  }

  if (!user) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="flex flex-1 items-center justify-center p-4 sm:p-6"><div className="max-w-md rounded-2xl border border-border bg-ink p-6 text-center sm:p-8"><ClipboardList className="mx-auto h-8 w-8 text-accent" /><h1 className="mt-4 text-xl font-bold text-text-main">Intră în cont pentru a vedea tema</h1><Link to="/login" className="mt-5 inline-flex font-bold text-accent hover:text-text-main">Intră în cont</Link></div></div></div>;
  }

  if (error || !assignment) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="p-4 sm:p-6"><div className="mx-auto max-w-3xl rounded-2xl border border-hard/20 bg-hard/10 p-4 text-hard sm:p-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><div><p className="font-bold">Tema nu a putut fi afișată.</p><p className="mt-1 text-sm">{error || 'Tema nu a fost găsită.'}</p></div></div><Link to="/teme" className="mt-4 inline-flex font-bold underline">Înapoi la teme</Link></div></div></div>;
  }

  return (
    <div className="flex h-full flex-col"><TopHeader title="Teme" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-5xl pb-10"><Link to="/teme" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la teme</Link>
      <section className="rounded-2xl border border-border bg-ink p-4 sm:p-6 md:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-bold text-accent"><ClipboardList className="h-5 w-5" />{assignment.classroomName}</div><h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">{assignment.title}</h1>{assignment.description && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-muted">{assignment.description}</p>}</div>{teacherView && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Link to={`/teme/${assignment.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent"><Pencil className="h-4 w-4" />Editează</Link><button type="button" onClick={handleDelete} disabled={deleting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-hard/30 px-3 py-2 text-sm font-bold text-hard transition-colors hover:bg-hard/10 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Șterge</button></div>}</div>
        <div className="mt-8 border-t border-border pt-6"><AssignmentProgress solvedCount={progress.solvedCount} total={progress.total} dueAt={assignment.due_at} /></div>
      </section>

      <section className="mt-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold text-text-main">Problemele temei</h2><p className="mt-1 text-sm text-muted">Rezolvă-le în ordine sau alege problema cu care vrei să continui.</p></div><span className="rounded-md bg-accent/10 px-3 py-1 text-sm font-bold text-accent">{problems.length}</span></div><AssignmentProblemList problems={problems} solvedIds={progress.solvedIds} /></section>

      {teacherView && <section className="mt-6 rounded-2xl border border-border bg-ink p-4 sm:p-6"><div className="mb-5 flex items-center gap-2"><Users className="h-5 w-5 text-accent" /><div><h2 className="text-xl font-bold text-text-main">Progres elevi</h2><p className="mt-1 text-sm text-muted">Progres calculat din problemele rezolvate, fără request-uri per elev.</p></div></div>{studentProgress.length === 0 ? <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">Nu există elevi în această clasă momentan.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wider text-muted"><tr><th className="px-3 py-3 font-bold">Elev</th><th className="px-3 py-3 font-bold">Progres</th><th className="px-3 py-3 font-bold">Status</th></tr></thead><tbody>{studentProgress.map((student) => <tr key={student.id} className="border-b border-border last:border-b-0"><td className="px-3 py-4 font-bold text-text-main"><Link to={`/profil/${student.id}`} className="transition-colors hover:text-accent">{student.username}</Link></td><td className="px-3 py-4 text-muted">{student.solvedCount} / {student.total} <span className="ml-1 text-xs">({student.percentage}%)</span></td><td className="px-3 py-4"><span className={`rounded-md px-2 py-1 text-xs font-bold ${student.status.tone === 'easy' ? 'bg-easy/10 text-easy' : student.status.tone === 'hard' ? 'bg-hard/10 text-hard' : student.status.tone === 'medium' ? 'bg-medium/10 text-medium' : 'bg-background text-muted'}`}>{student.status.label}</span></td></tr>)}</tbody></table></div>}</section>}
    </div></main></div>
  );
}
