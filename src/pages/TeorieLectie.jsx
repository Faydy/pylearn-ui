import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import RelatedProblems from '../components/theory/RelatedProblems';
import TheoryContent from '../components/theory/TheoryContent';
import TheoryProgress from '../components/theory/TheoryProgress';
import TheorySidebar from '../components/theory/TheorySidebar';
import TopHeader from '../components/MainArea/TopHeader';
import { supabase } from '../supabaseClient';
import { formatReadTime, getRelationRow, getTheoryMessage, sortTheoryLessons } from '../utils/theory';

export default function TeorieLectie() {
  const { theoryId } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [chapterLessons, setChapterLessons] = useState([]);
  const [problems, setProblems] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressError, setProgressError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadLesson = async () => {
      setLoading(true);
      setError('');
      setProgressError('');
      const { data: lessonRow, error: lessonError } = await supabase.from('theory_lessons').select('id, title, content, summary, chapter_id, order_index, estimated_read_minutes, chapters!inner(id, title, section, grade_id, grades(id, name))').eq('id', theoryId).maybeSingle();
      if (cancelled) return;
      if (lessonError || !lessonRow) {
        setLesson(null);
        setError(getTheoryMessage(lessonError, 'Lecția nu a fost găsită.'));
        setLoading(false);
        return;
      }

      const chapter = getRelationRow(lessonRow.chapters);
      const [lessonsResponse, problemsResponse] = await Promise.all([
        supabase.from('theory_lessons').select('id, title, order_index, estimated_read_minutes').eq('chapter_id', lessonRow.chapter_id).eq('published', true).order('order_index', { ascending: true }).order('id', { ascending: true }),
        supabase.from('problems').select('id, title, description, difficulty, xp_reward').eq('chapter_id', lessonRow.chapter_id).order('id', { ascending: true }).limit(4),
      ]);
      if (cancelled) return;
      if (lessonsResponse.error || problemsResponse.error) {
        setError(getTheoryMessage(lessonsResponse.error || problemsResponse.error, 'Datele lecției nu au putut fi încărcate.'));
        setLoading(false);
        return;
      }

      const nextLessons = sortTheoryLessons(lessonsResponse.data || []);
      setLesson({ ...lessonRow, chapters: chapter });
      setChapterLessons(nextLessons);
      setProblems(problemsResponse.data || []);

      if (user?.id && nextLessons.length > 0) {
        const { data: progressRows, error: progressLoadError } = await supabase.from('user_theory_progress').select('theory_id, completed').eq('user_id', user.id).in('theory_id', nextLessons.map((chapterLesson) => chapterLesson.id));
        if (!cancelled && !progressLoadError) setCompletedIds(new Set((progressRows || []).filter((progress) => progress.completed).map((progress) => Number(progress.theory_id))));
      }
      if (!cancelled) setLoading(false);
    };
    loadLesson();
    return () => { cancelled = true; };
  }, [theoryId, user?.id]);

  const handleComplete = async () => {
    if (!lesson) return;
    setSavingProgress(true);
    setProgressError('');
    const { error: completeError } = await supabase.rpc('complete_theory_lesson', { p_theory_id: lesson.id });
    if (completeError) {
      setProgressError(getTheoryMessage(completeError, 'Lecția nu a putut fi marcată ca parcursă.'));
    } else {
      setCompletedIds((currentIds) => new Set([...currentIds, Number(lesson.id)]));
    }
    setSavingProgress(false);
  };

  if (loading) return <div className="flex h-full flex-col"><TopHeader title="Teorie" /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></div>;
  if (error || !lesson) return <div className="flex h-full flex-col"><TopHeader title="Teorie" /><main className="p-4 sm:p-6"><div className="mx-auto max-w-3xl rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><AlertTriangle className="inline h-5 w-5" /><h1 className="mt-3 text-xl font-bold">Lecția nu a putut fi încărcată.</h1><p className="mt-2 text-sm">{error || 'Lecția nu a fost găsită.'}</p><Link to="/teorie" className="mt-5 inline-flex font-bold underline">Înapoi la teorie</Link></div></main></div>;

  const chapter = lesson.chapters;
  const grade = getRelationRow(chapter?.grades);
  const activeLessonId = Number(lesson.id);
  const activeIndex = chapterLessons.findIndex((chapterLesson) => Number(chapterLesson.id) === activeLessonId);
  const previousLesson = chapterLessons[activeIndex - 1];
  const nextLesson = chapterLessons[activeIndex + 1];

  return <div className="flex h-full flex-col"><TopHeader title="Teorie" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-7xl pb-10"><nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb"><Link to="/teorie" className="font-bold transition-colors hover:text-accent">Teorie</Link><ChevronRight className="h-4 w-4" />{grade && <><Link to={`/teorie/clasa/${grade.id}`} className="font-bold transition-colors hover:text-accent">{grade.name}</Link><ChevronRight className="h-4 w-4" /></>}{chapter?.section && <><Link to={`/teorie/clasa/${grade?.id}/sectiune/${encodeURIComponent(chapter.section)}`} className="font-bold transition-colors hover:text-accent">{chapter.section}</Link><ChevronRight className="h-4 w-4" /></>}<Link to={`/teorie/capitol/${chapter.id}`} className="font-bold transition-colors hover:text-accent">{chapter.title}</Link></nav><Link to={`/teorie/capitol/${chapter.id}`} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la capitol</Link><div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]"><TheorySidebar chapterTitle={chapter.title} lessons={chapterLessons} activeLessonId={activeLessonId} completedIds={completedIds} /><div className="min-w-0"><section className="rounded-2xl border border-border bg-ink p-5 sm:p-8"><div className="flex items-center gap-2 text-sm font-bold text-accent"><BookOpen className="h-4 w-4" />{chapter.title}</div><h1 className="mt-4 text-3xl font-bold leading-tight text-text-main sm:text-4xl">{lesson.title}</h1><div className="mt-4 flex items-center gap-2 text-sm text-muted"><Clock className="h-4 w-4" />{formatReadTime(lesson.estimated_read_minutes)}</div>{lesson.summary && <p className="mt-6 rounded-xl border border-accent/20 bg-accent/10 p-4 text-lg leading-7 text-text-main">{lesson.summary}</p>}<div className="mt-8 border-t border-border pt-8"><TheoryContent content={lesson.content} /></div></section>{progressError && <p className="mt-5 rounded-xl border border-hard/20 bg-hard/10 p-4 text-sm text-hard">{progressError}</p>}<div className="mt-6"><TheoryProgress user={user} completed={completedIds.has(activeLessonId)} saving={savingProgress} onComplete={handleComplete} /></div><nav className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Navigare lecții">{previousLesson ? <Link to={`/teorie/${previousLesson.id}`} className="group rounded-xl border border-border bg-ink p-4 transition-colors hover:border-accent"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted"><ArrowLeft className="h-4 w-4" />Lecția anterioară</span><span className="mt-2 block font-bold text-text-main transition-colors group-hover:text-accent">{previousLesson.title}</span></Link> : <span />}{nextLesson ? <Link to={`/teorie/${nextLesson.id}`} className="group rounded-xl border border-border bg-ink p-4 text-right transition-colors hover:border-accent"><span className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Lecția următoare<ArrowRight className="h-4 w-4" /></span><span className="mt-2 block font-bold text-text-main transition-colors group-hover:text-accent">{nextLesson.title}</span></Link> : <span />}</nav><RelatedProblems problems={problems} gradeId={grade?.id} section={chapter.section} /></div></div></div></main></div>;
}
