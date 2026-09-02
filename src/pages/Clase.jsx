import { AlertTriangle, DoorOpen, GraduationCap, LogIn, Plus, School } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import ClassCard from '../components/classes/ClassCard';
import CreateClassModal from '../components/classes/CreateClassModal';
import JoinClassModal from '../components/classes/JoinClassModal';
import TopHeader from '../components/MainArea/TopHeader';
import { supabase } from '../supabaseClient';
import { isTeacher } from '../utils/assignments';
import { getSupabaseMessage } from '../utils/classrooms';

function LoadingCards() {
  return <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="min-h-[260px] animate-pulse rounded-2xl border border-border bg-ink p-5 sm:p-6"><div className="h-4 w-20 rounded bg-sidebar" /><div className="mt-5 h-7 w-3/4 rounded bg-sidebar" /><div className="mt-3 h-4 w-full rounded bg-sidebar" /><div className="mt-2 h-4 w-2/3 rounded bg-sidebar" /><div className="mt-10 h-16 rounded-xl bg-sidebar" /></div>)}</div>;
}

export default function Clase() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const teacherView = isTeacher(profile, user);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchClassrooms = async () => {
      if (!user) {
        setClassrooms([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        if (teacherView) {
          const { data: classroomRows, error: classroomsError } = await supabase
            .from('classrooms')
            .select('id, name, description, join_code, created_at, archived')
            .eq('teacher_id', user.id)
            .order('created_at', { ascending: false });
          if (classroomsError) throw classroomsError;

          const classroomIds = (classroomRows || []).map((classroom) => classroom.id);
          let membershipRows = [];
          if (classroomIds.length > 0) {
            const { data, error: membersError } = await supabase
              .from('classroom_members')
              .select('classroom_id')
              .in('classroom_id', classroomIds);
            if (membersError) throw membersError;
            membershipRows = data || [];
          }

          const studentCounts = new Map();
          membershipRows.forEach((membership) => {
            studentCounts.set(membership.classroom_id, (studentCounts.get(membership.classroom_id) || 0) + 1);
          });

          if (!cancelled) {
            setClassrooms((classroomRows || []).map((classroom) => ({
              ...classroom,
              studentCount: studentCounts.get(classroom.id) || 0,
            })));
          }
        } else {
          const { data: membershipRows, error: membershipsError } = await supabase
            .from('classroom_members')
            .select('classroom_id, joined_at')
            .eq('student_id', user.id)
            .order('joined_at', { ascending: false });
          if (membershipsError) throw membershipsError;

          const classroomIds = (membershipRows || []).map((membership) => membership.classroom_id);
          if (classroomIds.length === 0) {
            if (!cancelled) setClassrooms([]);
            return;
          }

          const { data: classroomRows, error: classroomsError } = await supabase
            .from('classrooms')
            .select('id, name, description, teacher_id, created_at, archived')
            .in('id', classroomIds);
          if (classroomsError) throw classroomsError;

          const teacherIds = [...new Set((classroomRows || []).map((classroom) => classroom.teacher_id))];
          let teacherRows = [];
          if (teacherIds.length > 0) {
            const { data, error: teachersError } = await supabase
              .from('profiles')
              .select('id, username')
              .in('id', teacherIds);
            if (teachersError) console.warn('Numele profesorilor nu au putut fi încărcate:', teachersError.message);
            teacherRows = data || [];
          }

          const teachersById = new Map(teacherRows.map((teacher) => [teacher.id, teacher.username]));
          const membershipsByClassroom = new Map((membershipRows || []).map((membership) => [membership.classroom_id, membership]));
          const rowsById = new Map((classroomRows || []).map((classroom) => [classroom.id, classroom]));

          if (!cancelled) {
            setClassrooms(classroomIds.map((classroomId) => {
              const classroom = rowsById.get(classroomId);
              if (!classroom) return null;
              return {
                ...classroom,
                joined_at: membershipsByClassroom.get(classroomId)?.joined_at,
                teacherName: teachersById.get(classroom.teacher_id),
              };
            }).filter(Boolean));
          }
        }
      } catch (fetchError) {
        console.error('Eroare la încărcarea claselor:', fetchError.message);
        if (!cancelled) {
          setError(getSupabaseMessage(fetchError, 'Clasele nu au putut fi încărcate.'));
          setClassrooms([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchClassrooms();
    return () => { cancelled = true; };
  }, [teacherView, user]);

  const handleCreate = async ({ name, description }) => {
    const { data, error: createError } = await supabase.rpc('create_classroom', {
      p_name: name,
      p_description: description || null,
    });
    if (createError) throw new Error(getSupabaseMessage(createError, 'Clasa nu a putut fi creată.'));

    const classroom = data?.[0];
    if (!classroom) throw new Error('Clasa a fost creată, dar nu a putut fi deschisă. Reîncarcă pagina.');
    navigate(`/clase/${classroom.id}`, { state: { successMessage: 'Clasa a fost creată cu succes!' } });
  };

  const handleJoin = async (code) => {
    const { data, error: joinError } = await supabase.rpc('join_classroom_by_code', { p_code: code });
    if (joinError) throw new Error(getSupabaseMessage(joinError, 'Nu ai putut intra în această clasă.'));

    const classroom = data?.[0];
    if (!classroom) throw new Error('Clasa a fost găsită, dar nu a putut fi deschisă. Reîncarcă pagina.');
    navigate(`/clase/${classroom.id}`, { state: { successMessage: 'Ai intrat în clasă cu succes!' } });
  };

  if (authLoading || (user && loading)) {
    return <div className="flex h-full flex-col"><TopHeader title="Clase" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-7xl"><LoadingCards /></div></main></div>;
  }

  if (!user) {
    return <div className="flex h-full flex-col"><TopHeader title="Clase" /><main className="flex flex-1 items-center justify-center p-4 sm:p-6"><div className="max-w-md rounded-2xl border border-border bg-ink p-6 text-center sm:p-8"><School className="mx-auto h-10 w-10 text-accent" /><h1 className="mt-5 text-2xl font-bold text-text-main">Clasele tale te așteaptă</h1><p className="mt-3 text-muted">Intră în cont pentru a crea sau pentru a te alătura unei clase.</p><Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90"><LogIn className="h-4 w-4" />Intră în cont</Link></div></main></div>;
  }

  return (
    <div className="flex h-full flex-col"><TopHeader title="Clase" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-7xl pb-10"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">{teacherView ? 'Spațiul profesorului' : 'Spațiul elevului'}</p><h1 className="mt-2 text-2xl font-bold text-text-main sm:text-3xl">Clasele mele</h1><p className="mt-2 text-muted">{teacherView ? 'Creează clase și oferă elevilor un cod unic de acces.' : 'Păstrează toate clasele și temele tale într-un singur loc.'}</p></div><button type="button" onClick={() => teacherView ? setShowCreate(true) : setShowJoin(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90 sm:w-auto">{teacherView ? <Plus className="h-5 w-5" /> : <DoorOpen className="h-5 w-5" />}{teacherView ? 'Creează clasă' : 'Intră într-o clasă'}</button></div>

      {error ? <div className="flex items-start gap-3 rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Clasele nu au putut fi încărcate.</p><p className="mt-1 text-sm">{error}</p></div></div> : classrooms.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-ink p-6 text-center sm:p-10"><GraduationCap className="mx-auto h-9 w-9 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">{teacherView ? 'Nu ai creat încă nicio clasă.' : 'Nu faci parte încă din nicio clasă.'}</h2><p className="mt-2 text-sm text-muted">{teacherView ? 'Creează prima clasă și trimite codul elevilor tăi.' : 'Folosește codul primit de la profesor pentru a intra într-o clasă.'}</p><button type="button" onClick={() => teacherView ? setShowCreate(true) : setShowJoin(true)} className="mt-5 inline-flex items-center gap-2 font-bold text-accent transition-colors hover:text-text-main">{teacherView ? <Plus className="h-4 w-4" /> : <DoorOpen className="h-4 w-4" />}{teacherView ? 'Creează clasă' : 'Intră într-o clasă'}</button></div> : <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">{classrooms.map((classroom) => <ClassCard key={classroom.id} classroom={classroom} teacherView={teacherView} />)}</div>}
    </div></main>{showCreate && <CreateClassModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}{showJoin && <JoinClassModal onClose={() => setShowJoin(false)} onJoin={handleJoin} />}</div>
  );
}
