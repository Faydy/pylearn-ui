import { AlertTriangle, ArrowLeft, Layers, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TheoryChapterCard from '../components/theory/TheoryChapterCard';
import TopHeader from '../components/MainArea/TopHeader';
import { supabase } from '../supabaseClient';
import { getTheoryMessage, sortTheoryLessons } from '../utils/theory';

export default function TeorieSectiune() {
  const { gradeId, sectionName } = useParams();
  const section = decodeURIComponent(sectionName);
  const [grade, setGrade] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadSection = async () => {
      setLoading(true);
      setError('');
      const [gradeResponse, chaptersResponse] = await Promise.all([
        supabase.from('grades').select('id, name').eq('id', gradeId).maybeSingle(),
        supabase.from('chapters').select('id, title, section, order_index, theory_lessons(id, title, summary, order_index, estimated_read_minutes)').eq('grade_id', gradeId).eq('section', section).eq('theory_lessons.published', true).order('order_index', { ascending: true }),
      ]);
      if (cancelled) return;
      if (gradeResponse.error || chaptersResponse.error || !gradeResponse.data) {
        setError(getTheoryMessage(gradeResponse.error || chaptersResponse.error, 'Secțiunea nu a putut fi încărcată.'));
      } else {
        setGrade(gradeResponse.data);
        setChapters((chaptersResponse.data || []).filter((chapter) => chapter.theory_lessons?.length > 0).map((chapter) => ({ ...chapter, theory_lessons: sortTheoryLessons(chapter.theory_lessons) })));
      }
      setLoading(false);
    };
    loadSection();
    return () => { cancelled = true; };
  }, [gradeId, section]);

  return <div className="flex h-full flex-col"><TopHeader title={section} /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-6xl pb-10"><Link to={`/teorie/clasa/${gradeId}`} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la {grade?.name || 'clasă'}</Link>{loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : error ? <div className="rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><AlertTriangle className="inline h-5 w-5" /><p className="mt-2 font-bold">{error}</p></div> : <><div className="mb-8"><div className="flex items-center gap-2 text-sm font-bold text-accent"><Layers className="h-4 w-4" />{grade?.name}</div><h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">{section}</h1><p className="mt-2 text-muted">Parcurge lecțiile organizate pe capitole.</p></div>{chapters.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-ink p-10 text-center"><Layers className="mx-auto h-9 w-9 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">Nu există lecții pentru această secțiune încă.</h2></div> : <div className="grid gap-4 lg:grid-cols-2">{chapters.map((chapter) => <TheoryChapterCard key={chapter.id} chapter={chapter} lessons={chapter.theory_lessons} />)}</div>}</>}</div></main></div>;
}
