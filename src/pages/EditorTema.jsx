import { AlertTriangle, ArrowLeft, ClipboardPlus, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AssignmentForm from '../components/assignments/AssignmentForm';
import TopHeader from '../components/MainArea/TopHeader';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { isTeacher } from '../utils/assignments';

export default function EditorTema() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [initialProblemIds, setInitialProblemIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const teacherView = isTeacher(profile, user);
  const editing = Boolean(assignmentId);

  useEffect(() => {
    const fetchEditorData = async () => {
      if (!user || !teacherView) {
        setLoading(false);
        return;
      }

      try {
        const { data: classroomRows, error: classroomsError } = await supabase
          .from('classrooms')
          .select('id, name')
          .eq('teacher_id', user.id)
          .order('name');
        if (classroomsError) throw classroomsError;
        setClassrooms(classroomRows || []);

        if (!assignmentId) return;

        const { data: assignmentRow, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, classroom_id, created_by, title, description, due_at, published')
          .eq('id', assignmentId)
          .maybeSingle();
        if (assignmentError) throw assignmentError;
        if (!assignmentRow || !classroomRows?.some((classroom) => classroom.id === assignmentRow.classroom_id)) {
          throw new Error('Nu ai acces la această temă.');
        }

        const { data: assignmentProblems, error: assignmentProblemsError } = await supabase
          .from('assignment_problems')
          .select('problem_id, position')
          .eq('assignment_id', assignmentId)
          .order('position');
        if (assignmentProblemsError) throw assignmentProblemsError;

        setAssignment(assignmentRow);
        setInitialProblemIds((assignmentProblems || []).map((item) => item.problem_id));
      } catch (fetchError) {
        setMessage({ text: fetchError.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchEditorData();
  }, [assignmentId, teacherView, user]);

  const handleSave = async (values) => {
    const normalizedTitle = values.title.trim();
    if (normalizedTitle.length === 0) {
      setMessage({ text: 'Titlul este obligatoriu.', type: 'error' });
      return;
    }
    if (!values.classroomId) {
      setMessage({ text: 'Alege clasa pentru această temă.', type: 'error' });
      return;
    }
    if (values.selectedProblems.length === 0) {
      setMessage({ text: 'Adaugă cel puțin o problemă în temă.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: '', type: '' });
    let associationsStage = false;
    let savedAssignment = assignment;

    try {
      const payload = {
        classroom_id: Number(values.classroomId),
        title: normalizedTitle,
        description: values.description.trim() || null,
        due_at: values.dueAt ? new Date(values.dueAt).toISOString() : null,
        published: values.published,
      };

      if (editing) {
        const { data, error } = await supabase
          .from('assignments')
          .update(payload)
          .eq('id', assignment.id)
          .select('id, classroom_id, created_by, title, description, due_at, published')
          .single();
        if (error) throw error;
        savedAssignment = data;

        associationsStage = true;
        const { error: deleteError } = await supabase
          .from('assignment_problems')
          .delete()
          .eq('assignment_id', assignment.id);
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from('assignments')
          .insert({ ...payload, created_by: user.id })
          .select('id, classroom_id, created_by, title, description, due_at, published')
          .single();
        if (error) throw error;
        savedAssignment = data;
        associationsStage = true;
      }

      const relationshipRows = values.selectedProblems.map((problem, index) => ({
        assignment_id: savedAssignment.id,
        problem_id: problem.id,
        position: index + 1,
      }));
      const { error: relationshipError } = await supabase
        .from('assignment_problems')
        .insert(relationshipRows);
      if (relationshipError) throw relationshipError;

      navigate(`/teme/${savedAssignment.id}`, { replace: true });
    } catch (saveError) {
      const prefix = associationsStage
        ? editing
          ? 'Datele temei au fost actualizate, dar lista problemelor nu a putut fi salvată.'
          : 'Tema a fost creată, dar lista problemelor nu a putut fi salvată.'
        : 'Tema nu a putut fi salvată.';
      setMessage({ text: `${prefix} ${saveError.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></div>;
  }

  if (!user || !teacherView) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="flex flex-1 items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-border bg-ink p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-hard" /><h1 className="mt-4 text-xl font-bold text-text-main">Acces rezervat profesorilor</h1><p className="mt-2 text-sm text-muted">Doar profesorii pot crea și modifica teme.</p><Link to="/teme" className="mt-5 inline-flex font-bold text-accent hover:text-text-main">Înapoi la teme</Link></div></div></div>;
  }

  if (message.type === 'error' && !assignment && editing) {
    return <div className="flex h-full flex-col"><TopHeader title="Teme" /><div className="p-6"><div className="mx-auto max-w-3xl rounded-2xl border border-hard/20 bg-hard/10 p-6 text-hard"><p className="font-bold">Tema nu a putut fi deschisă.</p><p className="mt-2 text-sm">{message.text}</p><Link to="/teme" className="mt-4 inline-flex font-bold underline">Înapoi la teme</Link></div></div></div>;
  }

  return (
    <div className="flex h-full flex-col"><TopHeader title={editing ? 'Editează tema' : 'Temă nouă'} /><main className="flex-1 overflow-y-auto p-6"><div className="mx-auto w-full max-w-7xl pb-10"><Link to={editing ? `/teme/${assignmentId}` : '/teme'} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi</Link><div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-accent/10 p-3 text-accent"><ClipboardPlus className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold text-text-main">{editing ? 'Editează tema' : 'Creează o temă'}</h1><p className="mt-1 text-muted">Selectează probleme existente și publică atunci când tema este gata.</p></div></div>{message.text && <div className="mb-6 rounded-xl border border-hard/20 bg-hard/10 p-4 text-sm text-hard">{message.text}</div>}{classrooms.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-ink p-8 text-center"><h2 className="text-xl font-bold text-text-main">Nu ai clase disponibile.</h2><p className="mt-2 text-sm text-muted">O temă poate fi creată numai într-o clasă pe care o administrezi.</p></div> : <AssignmentForm classrooms={classrooms} assignment={assignment} initialProblemIds={initialProblemIds} onSave={handleSave} saving={saving} />}</div></main></div>
  );
}
