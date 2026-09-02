import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TopHeader from '../components/MainArea/TopHeader';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { formatReadTime, getRelationRow, getTheoryMessage, sortTheoryLessons } from '../utils/theory';

export default function TeorieCapitol() {
  const { chapterId } = useParams();
  const { user } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadChapter = async () => {
      setLoading(true);
      setError('');
      const [chapterResponse, lessonsResponse] = await Promise.all([
        supabase.from('chapters').select('id, title, section, grade_id, grades(id, name)').eq('id', chapterId).maybeSingle(),
        supabase.from('theory_lessons').select('id, title, summary, order_index, estimated_read_minutes').eq('chapter_id', chapterId).eq('published', true).order('order_index', { ascending: true }).order('id', { ascending: true }),
      ]);
      if (cancelled) return;
      if (chapterResponse.error || lessonsResponse.error || !chapterResponse.data) {
        setError(getTheoryMessage(chapterResponse.error || lessonsResponse.error, 'Capitolul nu a putut fi încărcat.'));
        setLoading(false);
        return;
      }

      const nextLessons = sortTheoryLessons(lessonsResponse.data || []);
      setChapter(chapterResponse.data);
      setLessons(nextLessons);

      if (user?.id && nextLessons.length > 0) {
        const { data: progressRows, error: progressError } = await supabase.from('user_theory_progress').select('theory_id, completed').eq('user_id', user.id).in('theory_id', nextLessons.map((lesson) => lesson.id));
        if (!cancelled && !progressError) setCompletedIds(new Set((progressRows || []).filter((progress) => progress.completed).map((progress) => Number(progress.theory_id))));
      }
      if (!cancelled) setLoading(false);
    };
    loadChapter();
    return () => { cancelled = true; };
  }, [chapterId, user?.id]);

  const grade = getRelationRow(chapter?.grades);
  const backHref = grade ? `/teorie/clasa/${grade.id}/sectiune/${encodeURIComponent(chapter.section || 'General')}` : '/teorie';

  return <div className="flex h-full flex-col"><TopHeader title="Teorie" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-5xl pb-10"><Link to={backHref} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la secțiune</Link>{loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : error ? <div className="rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><AlertTriangle className="inline h-5 w-5" /><p className="mt-2 font-bold">{error}</p></div> : <><div className="rounded-2xl border border-border bg-ink p-5 sm:p-7"><div className="flex items-center gap-2 text-sm font-bold text-accent"><BookOpen className="h-4 w-4" />{[grade?.name, chapter.section].filter(Boolean).join(' · ')}</div><h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">{chapter.title}</h1><p className="mt-3 text-muted">Alege o lecție și parcurge capitolul în ritmul tău.</p>{user && <p className="mt-5 text-sm font-bold text-muted">{completedIds.size} / {lessons.length} lecții parcurse</p>}</div>{lessons.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border bg-ink p-10 text-center"><BookOpen className="mx-auto h-8 w-8 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">Nu există încă lecții pentru acest capitol.</h2></div> : <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-ink">{lessons.map((lesson, index) => <Link key={lesson.id} to={`/teorie/${lesson.id}`} className={`group flex items-center gap-4 p-4 transition-colors hover:bg-sidebar-hover sm:p-5 ${index < lessons.length - 1 ? 'border-b border-border' : ''}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${completedIds.has(Number(lesson.id)) ? 'bg-easy/10 text-easy' : 'bg-background text-muted'}`}>{completedIds.has(Number(lesson.id)) ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-mono text-sm font-bold">{index + 1}</span>}</span><span className="min-w-0 flex-1"><span className="block font-bold text-text-main transition-colors group-hover:text-accent">{lesson.title}</span>{lesson.summary && <span className="mt-1 block line-clamp-1 text-sm text-muted">{lesson.summary}</span>}<span className="mt-2 inline-flex items-center gap-1 text-xs text-muted"><Clock className="h-3.5 w-3.5" />{formatReadTime(lesson.estimated_read_minutes)}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" /></Link>)}</div>}</>}</div></main></div>;
}
