import { AlertTriangle, ArrowLeft, Bell, BookOpen, CheckCircle2, ClipboardList, DoorOpen, GraduationCap, Loader2, LogOut, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import ClassAnnouncements from '../components/classes/ClassAnnouncements';
import ClassAssignments from '../components/classes/ClassAssignments';
import ClassCode from '../components/classes/ClassCode';
import ClassMembers from '../components/classes/ClassMembers';
import ClassSettings from '../components/classes/ClassSettings';
import TopHeader from '../components/MainArea/TopHeader';
import { supabase } from '../supabaseClient';
import { getSupabaseMessage } from '../utils/classrooms';

export default function DetaliiClasa() {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [error, setError] = useState('');
  const [membersError, setMembersError] = useState('');
  const [assignmentsError, setAssignmentsError] = useState('');
  const [announcementsError, setAnnouncementsError] = useState('');
  const [notice, setNotice] = useState(location.state?.successMessage ? { text: location.state.successMessage, type: 'success' } : { text: '', type: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [savingSettings, setSavingSettings] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const classroomId = Number(classId);
  const ownerView = classroom?.teacher_id === user?.id;

  useEffect(() => {
    let cancelled = false;

    const fetchClassroom = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (!Number.isInteger(classroomId) || classroomId <= 0) {
        setError('Identificatorul clasei nu este valid.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setMembersLoading(true);
      setAssignmentsLoading(true);
      setAnnouncementsLoading(true);
      setError('');
      setMembersError('');
      setAssignmentsError('');
      setAnnouncementsError('');

      try {
        const { data: detailsRows, error: detailsError } = await supabase.rpc('get_classroom_details', {
          p_classroom_id: classroomId,
        });
        if (detailsError) throw detailsError;

        const details = detailsRows?.[0];
        if (!details) throw new Error('Clasa nu a fost găsită sau nu ai acces la ea.');
        if (cancelled) return;
        setClassroom(details);

        const teacherOwnsClass = details.teacher_id === user.id;
        let assignmentsQuery = supabase
          .from('assignments')
          .select('id, title, description, due_at, published, created_at')
          .eq('classroom_id', classroomId)
          .order('created_at', { ascending: false });
        if (!teacherOwnsClass) assignmentsQuery = assignmentsQuery.eq('published', true);

        const [assignmentsResponse, membersResponse, announcementsResponse] = await Promise.all([
          assignmentsQuery,
          teacherOwnsClass
            ? supabase.rpc('get_classroom_members', { p_classroom_id: classroomId })
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from('classroom_announcements')
            .select('id, title')
            .eq('classroom_id', classroomId),
        ]);

        if (!cancelled) {
          if (assignmentsResponse.error) {
            setAssignmentsError(getSupabaseMessage(assignmentsResponse.error, 'Temele nu au putut fi încărcate.'));
            setAssignments([]);
          } else {
            setAssignments(assignmentsResponse.data || []);
          }

          if (membersResponse.error) {
            setMembersError(getSupabaseMessage(membersResponse.error, 'Elevii nu au putut fi încărcați.'));
            setMembers([]);
          } else {
            setMembers(membersResponse.data || []);
          }

          if (announcementsResponse.error) {
            setAnnouncementsError(getSupabaseMessage(announcementsResponse.error, 'Anunțurile nu au putut fi încărcate.'));
            setAnnouncements([]);
          } else {
            setAnnouncements(announcementsResponse.data || []);
          }
        }
      } catch (fetchError) {
        console.error('Eroare la încărcarea clasei:', fetchError.message);
        if (!cancelled) {
          setError(getSupabaseMessage(fetchError, 'Clasa nu a putut fi încărcată.'));
          setClassroom(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setMembersLoading(false);
          setAssignmentsLoading(false);
          setAnnouncementsLoading(false);
        }
      }
    };

    fetchClassroom();
    return () => { cancelled = true; };
  }, [classroomId, user]);

  const handleSaveSettings = async ({ name, description, archived }) => {
    setSavingSettings(true);
    setNotice({ text: '', type: '' });

    try {
      const { data, error: updateError } = await supabase.rpc('update_classroom_details', {
        p_classroom_id: classroomId,
        p_name: name,
        p_description: description || null,
        p_archived: archived,
      });
      if (updateError) throw updateError;
      if (!data?.[0]) throw new Error('Setările au fost salvate, dar clasa nu a putut fi actualizată local.');

      setClassroom((currentClassroom) => ({ ...currentClassroom, ...data[0] }));
      setNotice({ text: 'Setările clasei au fost salvate.', type: 'success' });
    } catch (saveError) {
      setNotice({ text: getSupabaseMessage(saveError, 'Setările nu au putut fi salvate.'), type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRegenerateCode = async () => {
    setRegeneratingCode(true);
    setNotice({ text: '', type: '' });

    try {
      const { data, error: regenerateError } = await supabase.rpc('regenerate_classroom_code', {
        p_classroom_id: classroomId,
      });
      if (regenerateError) throw regenerateError;
      if (!data?.[0]) throw new Error('Codul nu a putut fi actualizat.');

      setClassroom((currentClassroom) => ({ ...currentClassroom, ...data[0] }));
      setNotice({ text: 'A fost generat un cod nou pentru clasă.', type: 'success' });
    } catch (regenerateError) {
      setNotice({ text: getSupabaseMessage(regenerateError, 'Codul nou nu a putut fi generat.'), type: 'error' });
      throw regenerateError;
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    setNotice({ text: '', type: '' });

    try {
      const { error: leaveError } = await supabase.rpc('leave_classroom', {
        p_classroom_id: classroomId,
      });
      if (leaveError) throw leaveError;
      navigate('/clase', { replace: true });
    } catch (leaveError) {
      setNotice({ text: getSupabaseMessage(leaveError, 'Nu ai putut părăsi această clasă.'), type: 'error' });
      setLeaving(false);
      setConfirmLeave(false);
    }
  };

  if (authLoading || (user && loading)) {
    return <div className="flex h-full flex-col"><TopHeader title="Clase" /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></div>;
  }

  if (!user) {
    return <div className="flex h-full flex-col"><TopHeader title="Clase" /><div className="flex flex-1 items-center justify-center p-4 sm:p-6"><div className="max-w-md rounded-2xl border border-border bg-ink p-6 text-center sm:p-8"><DoorOpen className="mx-auto h-9 w-9 text-accent" /><h1 className="mt-4 text-xl font-bold text-text-main">Intră în cont pentru a vedea clasa</h1><Link to="/login" className="mt-5 inline-flex font-bold text-accent transition-colors hover:text-text-main">Intră în cont</Link></div></div></div>;
  }

  if (error || !classroom) {
    return <div className="flex h-full flex-col"><TopHeader title="Clase" /><main className="p-4 sm:p-6"><div className="mx-auto max-w-3xl rounded-2xl border border-hard/20 bg-hard/10 p-4 text-hard sm:p-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Clasa nu a putut fi afișată.</p><p className="mt-1 text-sm">{error || 'Clasa nu a fost găsită.'}</p></div></div><Link to="/clase" className="mt-4 inline-flex font-bold underline">Înapoi la clase</Link></div></main></div>;
  }

  const tabs = [
    { id: 'overview', label: 'Prezentare', icon: GraduationCap },
    { id: 'assignments', label: 'Teme', icon: ClipboardList },
    { id: 'announcements', label: 'Anunțuri', icon: Bell },
    ...(ownerView ? [{ id: 'members', label: `Elevi (${classroom.student_count || 0})`, icon: Users }] : []),
  ];

  return (
    <div className="flex h-full flex-col"><TopHeader title="Clase" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-6xl pb-10"><Link to="/clase" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la clase</Link>
      <section className="rounded-2xl border border-border bg-ink p-4 sm:p-6 md:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-bold text-accent"><GraduationCap className="h-5 w-5" />Clasă PyLearn</div><h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">{classroom.name}</h1><p className="mt-3 text-muted">Profesor: <span className="font-bold text-text-main">{classroom.teacher_username || 'Profesor PyLearn'}</span></p></div><div className="flex flex-wrap gap-2"><span className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-muted">{classroom.student_count || 0} {Number(classroom.student_count) === 1 ? 'elev' : 'elevi'}</span>{classroom.archived && <span className="rounded-lg border border-medium/20 bg-medium/10 px-3 py-2 text-sm font-bold text-medium">Arhivată</span>}</div></div>{classroom.description && <p className="mt-6 max-w-3xl whitespace-pre-wrap text-muted">{classroom.description}</p>}</section>

      {notice.text && <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${notice.type === 'error' ? 'border-hard/20 bg-hard/10 text-hard' : 'border-easy/20 bg-easy/10 text-easy'}`}>{notice.type === 'error' ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}<p className="font-bold">{notice.text}</p></div>}

      <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-border pb-px" aria-label="Secțiuni clasă">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text-main'}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}</nav>

      {activeTab === 'overview' && <div className="mt-6 grid gap-6 lg:grid-cols-5"><section className="rounded-2xl border border-border bg-ink p-4 sm:p-6 lg:col-span-3"><h2 className="text-xl font-bold text-text-main">Despre această clasă</h2><p className="mt-3 text-muted">{classroom.description || 'Profesorul nu a adăugat încă o descriere pentru această clasă.'}</p><div className="mt-7 grid gap-4 sm:grid-cols-2"><Link to="/teme" className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-accent"><BookOpen className="h-5 w-5 text-accent" /><p className="mt-3 font-bold text-text-main">Teme și exerciții</p><p className="mt-1 text-sm text-muted">Vezi temele asociate acestei clase.</p></Link><div className="rounded-xl border border-border bg-background p-4"><Users className="h-5 w-5 text-accent" /><p className="mt-3 font-bold text-text-main">Comunitatea clasei</p><p className="mt-1 text-sm text-muted">{classroom.student_count || 0} {Number(classroom.student_count) === 1 ? 'elev participă' : 'elevi participă'}.</p></div></div></section><div className="space-y-6 lg:col-span-2">{ownerView ? <><ClassCode code={classroom.join_code} /><ClassSettings classroom={classroom} onSave={handleSaveSettings} onRegenerate={handleRegenerateCode} saving={savingSettings} regenerating={regeneratingCode} /></> : <section className="rounded-2xl border border-border bg-ink p-4 sm:p-6"><h2 className="text-xl font-bold text-text-main">Acțiuni clasă</h2><p className="mt-2 text-sm text-muted">Poți reveni oricând folosind codul oferit de profesor.</p>{confirmLeave ? <div className="mt-5 rounded-xl border border-hard/20 bg-hard/10 p-4"><p className="font-bold text-text-main">Părăsești clasa?</p><p className="mt-1 text-sm text-muted">Va trebui să folosești din nou codul clasei pentru a reveni.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><button type="button" onClick={() => setConfirmLeave(false)} disabled={leaving} className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-text-main">Anulează</button><button type="button" onClick={handleLeave} disabled={leaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hard px-3 py-2 text-sm font-bold text-ink disabled:opacity-50">{leaving && <Loader2 className="h-4 w-4 animate-spin" />}Părăsește clasa</button></div></div> : <button type="button" onClick={() => setConfirmLeave(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-hard/30 px-3 py-2 text-sm font-bold text-hard transition-colors hover:bg-hard/10"><LogOut className="h-4 w-4" />Părăsește clasa</button>}</section>}</div></div>}
      {activeTab === 'assignments' && <section className="mt-6"><div className="mb-4"><h2 className="text-xl font-bold text-text-main">Teme</h2><p className="mt-1 text-sm text-muted">{ownerView ? 'Toate temele acestei clase, inclusiv drafturile.' : 'Temele publicate de profesor.'}</p></div><ClassAssignments assignments={assignments} loading={assignmentsLoading} error={assignmentsError} teacherView={ownerView} /></section>}
      {activeTab === 'announcements' && <section className="mt-6"><div className="mb-4"><h2 className="text-xl font-bold text-text-main">Anunțuri</h2><p className="mt-1 text-sm text-muted">Mesajele disponibile pentru această clasă.</p></div><ClassAnnouncements announcements={announcements} loading={announcementsLoading} error={announcementsError} /></section>}
      {activeTab === 'members' && ownerView && <section className="mt-6"><div className="mb-4"><h2 className="text-xl font-bold text-text-main">Elevi ({classroom.student_count || 0})</h2><p className="mt-1 text-sm text-muted">Lista elevilor înscriși în această clasă.</p></div><ClassMembers members={members} loading={membersLoading} error={membersError} /></section>}
    </div></main></div>
  );
}
