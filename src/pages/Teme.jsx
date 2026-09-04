import { AlertTriangle, ArrowLeft, ArrowRight, ClipboardList, LogIn, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AssignmentCard from '../components/assignments/AssignmentCard';
import TopHeader from '../components/MainArea/TopHeader';
import PageLoading from '../components/PageLoading';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { getAssignmentLifecycle, getAssignmentProgress, isTeacher } from '../utils/assignments';

const HISTORY_FILTERS = [
  { id: 'all', label: 'Toate' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Finalizate' },
  { id: 'expired', label: 'Expirate' },
];

function getTimestamp(value, fallback = Number.NEGATIVE_INFINITY) {
  if (!value) return fallback;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? fallback : timestamp;
}

function sortActiveAssignments(assignments) {
  return [...assignments].sort((first, second) => (
    getTimestamp(first.due_at, Number.POSITIVE_INFINITY) - getTimestamp(second.due_at, Number.POSITIVE_INFINITY)
    || getTimestamp(second.created_at) - getTimestamp(first.created_at)
  ));
}

function sortAssignmentHistory(assignments) {
  const stateOrder = { active: 0, completed: 1, expired: 2 };

  return [...assignments].sort((first, second) => {
    const stateDifference = stateOrder[first.lifecycle.state] - stateOrder[second.lifecycle.state];
    if (stateDifference !== 0) return stateDifference;

    if (first.lifecycle.state === 'active') {
      return getTimestamp(first.due_at, Number.POSITIVE_INFINITY) - getTimestamp(second.due_at, Number.POSITIVE_INFINITY)
        || getTimestamp(second.created_at) - getTimestamp(first.created_at);
    }

    return getTimestamp(second.due_at, getTimestamp(second.created_at)) - getTimestamp(first.due_at, getTimestamp(first.created_at));
  });
}

export default function Teme({ showAll = false }) {
  const { user, profile, loading: authLoading } = useAuth();
  const teacherView = isTeacher(profile, user);
  const studentHistoryView = showAll && !teacherView;
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [now, setNow] = useState(Date.now());

  const fetchAssignments = useCallback(async () => {
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

      if (!teacherView) assignmentsQuery = assignmentsQuery.eq('published', true);

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

      setAssignments((assignmentRows || []).map((assignment) => ({
        ...assignment,
        classroomName: classroomNames.get(assignment.classroom_id),
        ...getAssignmentProgress(problemsByAssignment.get(assignment.id) || [], statuses),
      })));
      setNow(Date.now());
    } catch (fetchError) {
      console.error('Eroare la încărcarea temelor:', fetchError.message);
      setError(fetchError.message);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [teacherView, user]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (!user || teacherView) return undefined;

    const refreshClock = window.setInterval(() => setNow(Date.now()), 60_000);
    const channel = supabase
      .channel(`my-assignment-progress:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_problem_status', filter: `user_id=eq.${user.id}` },
        () => fetchAssignments(),
      )
      .subscribe();

    return () => {
      window.clearInterval(refreshClock);
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments, teacherView, user]);

  const assignmentsWithLifecycle = useMemo(() => assignments.map((assignment) => ({
    ...assignment,
    lifecycle: getAssignmentLifecycle({
      solvedCount: assignment.solvedCount,
      total: assignment.total,
      dueAt: assignment.due_at,
      now,
    }),
  })), [assignments, now]);

  const historyCounts = useMemo(() => assignmentsWithLifecycle.reduce((counts, assignment) => {
    counts[assignment.lifecycle.state] += 1;
    return counts;
  }, { active: 0, completed: 0, expired: 0 }), [assignmentsWithLifecycle]);

  const displayedAssignments = useMemo(() => {
    if (teacherView) return assignmentsWithLifecycle;

    if (!studentHistoryView) {
      return sortActiveAssignments(assignmentsWithLifecycle.filter((assignment) => assignment.lifecycle.state === 'active'));
    }

    const filteredAssignments = historyFilter === 'all'
      ? assignmentsWithLifecycle
      : assignmentsWithLifecycle.filter((assignment) => assignment.lifecycle.state === historyFilter);
    return sortAssignmentHistory(filteredAssignments);
  }, [assignmentsWithLifecycle, historyFilter, studentHistoryView, teacherView]);

  if (authLoading || (user && loading)) return <PageLoading title="Teme" />;

  if (!user) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="flex flex-1 items-center justify-center p-4 sm:p-6"><div className="max-w-md rounded-2xl border border-border bg-ink p-6 text-center sm:p-8"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent"><ClipboardList className="h-6 w-6" /></div><h1 className="mt-5 text-2xl font-bold text-text-main">Temele tale te așteaptă</h1><p className="mt-3 text-muted">Intră în cont pentru a vedea temele primite și progresul tău.</p><Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90"><LogIn className="h-4 w-4" />Intră în cont</Link></div></div></div>;
  }

  const heading = teacherView ? 'Temele claselor mele' : (studentHistoryView ? 'Toate temele' : 'Temele mele');
  const description = teacherView
    ? 'Creează, publică și urmărește progresul elevilor.'
    : (studentHistoryView ? 'Consultă temele active, finalizate și expirate.' : 'Urmărește progresul și continuă de unde ai rămas.');
  const emptyTitle = teacherView
    ? 'Nu ai creat încă nicio temă.'
    : (studentHistoryView ? 'Nu există teme pentru filtrul selectat.' : 'Nu ai nicio temă activă.');
  const emptyDescription = teacherView
    ? 'Creează prima temă pentru una dintre clasele tale.'
    : (studentHistoryView ? 'Alege un alt filtru sau revino mai târziu.' : 'Temele finalizate sau expirate pot fi găsite în „Vezi toate temele”.');

  return (
    <div className="flex h-full flex-col">
      <TopHeader title={studentHistoryView ? 'Toate temele' : 'Teme'} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl pb-10">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">{teacherView ? 'Spațiul profesorului' : 'Spațiul elevului'}</p>
              <h1 className="mt-2 text-2xl font-bold text-text-main sm:text-3xl">{heading}</h1>
              <p className="mt-2 text-muted">{description}</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {studentHistoryView && <Link to="/teme" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 font-bold text-text-main transition-colors hover:border-accent hover:text-accent"><ArrowLeft className="h-4 w-4" />Teme active</Link>}
              {!teacherView && !studentHistoryView && <Link to="/teme/toate" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 font-bold text-text-main transition-colors hover:border-accent hover:text-accent">Vezi toate temele<ArrowRight className="h-4 w-4" /></Link>}
              {teacherView && <Link to="/teme/noua" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90"><Plus className="h-5 w-5" />Creează temă</Link>}
            </div>
          </div>

          {studentHistoryView && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filtre teme">
              {HISTORY_FILTERS.map((filter) => {
                const count = filter.id === 'all' ? assignmentsWithLifecycle.length : historyCounts[filter.id];
                const active = historyFilter === filter.id;
                return <button key={filter.id} type="button" onClick={() => setHistoryFilter(filter.id)} aria-pressed={active} className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${active ? 'border-accent bg-accent text-ink' : 'border-border bg-ink text-muted hover:border-accent hover:text-text-main'}`}>{filter.label} <span className="opacity-75">{count}</span></button>;
              })}
            </div>
          )}

          {error ? <div className="flex items-start gap-3 rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Temele nu au putut fi încărcate.</p><p className="mt-1 text-sm">{error}</p></div></div> : displayedAssignments.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-ink p-6 text-center sm:p-10"><ClipboardList className="mx-auto h-8 w-8 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">{emptyTitle}</h2><p className="mt-2 text-sm text-muted">{emptyDescription}</p>{teacherView && <Link to="/teme/noua" className="mt-5 inline-flex items-center gap-2 font-bold text-accent hover:text-text-main"><Plus className="h-4 w-4" />Creează temă</Link>}{!teacherView && !studentHistoryView && <Link to="/teme/toate" className="mt-5 inline-flex items-center gap-2 font-bold text-accent hover:text-text-main">Vezi toate temele <ArrowRight className="h-4 w-4" /></Link>}</div> : <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">{displayedAssignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} teacherView={teacherView} studentActionLabel={studentHistoryView ? 'Vezi tema' : undefined} now={now} />)}</div>}
        </div>
      </main>
    </div>
  );
}
