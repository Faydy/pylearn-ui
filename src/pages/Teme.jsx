import { AlertTriangle, ClipboardList, LogIn, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AssignmentCard from '../components/assignments/AssignmentCard';
import TopHeader from '../components/MainArea/TopHeader';
import PageLoading from '../components/PageLoading';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { getAssignmentProgress, isTeacher } from '../utils/assignments';

export default function Teme() {
  const { user, profile, loading: authLoading } = useAuth();
  const teacherView = isTeacher(profile, user);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data: classroomSourceRows, error: classroomsError } = teacherView
          ? await supabase.from('classrooms').select('id, name').eq('teacher_id', user.id).order('name')
          : await supabase.from('classroom_members').select('classroom_id').eq('student_id', user.id);

        if (classroomsError) throw classroomsError;

        let classroomDetails = classroomSourceRows || [];
        if (!teacherView && classroomDetails.length > 0) {
          const classroomIdsForStudent = classroomDetails.map((membership) => membership.classroom_id);
          const { data: studentClassrooms, error: studentClassroomsError } = await supabase
            .from('classrooms')
            .select('id, name')
            .in('id', classroomIdsForStudent);
          if (studentClassroomsError) throw studentClassroomsError;
          classroomDetails = studentClassrooms || [];
        }
        const classroomIds = classroomDetails.map((classroom) => classroom.id);

        if (classroomIds.length === 0) {
          setAssignments([]);
          return;
        }

        let assignmentsQuery = supabase
          .from('assignments')
          .select('id, classroom_id, created_by, title, description, due_at, published, is_finalized, created_at')
          .in('classroom_id', classroomIds)
          .order('created_at', { ascending: false });

        if (!teacherView) {
          assignmentsQuery = assignmentsQuery.eq('published', true);
        }

        const { data: assignmentRows, error: assignmentsError } = await assignmentsQuery;
        if (assignmentsError) throw assignmentsError;

        const assignmentIds = (assignmentRows || []).map((assignment) => assignment.id);
        if (assignmentIds.length === 0) {
          setAssignments([]);
          return;
        }

        const { data: assignmentProblems, error: assignmentProblemsError } = await supabase
          .from('assignment_problems')
          .select('assignment_id, problem_id')
          .in('assignment_id', assignmentIds);
        if (assignmentProblemsError) throw assignmentProblemsError;

        const problemIds = [...new Set((assignmentProblems || []).map((item) => item.problem_id))];
        let statuses = [];

        if (!teacherView && problemIds.length > 0) {
          const { data, error: statusesError } = await supabase
            .from('user_problem_status')
            .select('problem_id, solved')
            .eq('user_id', user.id)
            .in('problem_id', problemIds);
          if (statusesError) throw statusesError;
          statuses = data || [];
        }

        const classroomNames = new Map(classroomDetails.map((classroom) => [classroom.id, classroom.name]));
        const problemsByAssignment = new Map();
        (assignmentProblems || []).forEach((item) => {
          const currentProblemIds = problemsByAssignment.get(item.assignment_id) || [];
          currentProblemIds.push(item.problem_id);
          problemsByAssignment.set(item.assignment_id, currentProblemIds);
        });

        setAssignments((assignmentRows || []).map((assignment) => {
          const progress = getAssignmentProgress(problemsByAssignment.get(assignment.id) || [], statuses);
          return {
            ...assignment,
            classroomName: classroomNames.get(assignment.classroom_id),
            ...progress,
          };
        }));
      } catch (fetchError) {
        console.error('Eroare la încărcarea temelor:', fetchError.message);
        setError(fetchError.message);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [teacherView, user]);

  if (authLoading || (user && loading)) {
    return <PageLoading title="Teme" />;
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="flex flex-1 items-center justify-center p-4 sm:p-6"><div className="max-w-md rounded-2xl border border-border bg-ink p-6 text-center sm:p-8"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent"><ClipboardList className="h-6 w-6" /></div><h1 className="mt-5 text-2xl font-bold text-text-main">Temele tale te așteaptă</h1><p className="mt-3 text-muted">Intră în cont pentru a vedea temele primite și progresul tău.</p><Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90"><LogIn className="h-4 w-4" />Intră în cont</Link></div></div></div>
    );
  }

  return (
    <div className="flex h-full flex-col"><TopHeader title="Teme" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-7xl pb-10"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">{teacherView ? 'Spațiul profesorului' : 'Spațiul elevului'}</p><h1 className="mt-2 text-2xl font-bold text-text-main sm:text-3xl">{teacherView ? 'Temele claselor mele' : 'Temele mele'}</h1><p className="mt-2 text-muted">{teacherView ? 'Creează, publică și urmărește progresul elevilor.' : 'Urmărește progresul și continuă de unde ai rămas.'}</p></div>{teacherView && <Link to="/teme/noua" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90 sm:w-auto"><Plus className="h-5 w-5" />Creează temă</Link>}</div>

      {error ? <div className="flex items-start gap-3 rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Temele nu au putut fi încărcate.</p><p className="mt-1 text-sm">{error}</p></div></div> : assignments.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-ink p-6 text-center sm:p-10"><ClipboardList className="mx-auto h-8 w-8 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">{teacherView ? 'Nu ai creat încă nicio temă.' : 'Nu ai nicio temă momentan.'}</h2><p className="mt-2 text-sm text-muted">{teacherView ? 'Creează prima temă pentru una dintre clasele tale.' : 'Temele publicate de profesorii claselor tale vor apărea aici.'}</p>{teacherView && <Link to="/teme/noua" className="mt-5 inline-flex items-center gap-2 font-bold text-accent hover:text-text-main"><Plus className="h-4 w-4" />Creează temă</Link>}</div> : <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">{assignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} teacherView={teacherView} />)}</div>}
    </div></main></div>
  );
}
