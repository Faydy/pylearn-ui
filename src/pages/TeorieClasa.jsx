import { AlertTriangle, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TheorySectionCard from '../components/theory/TheorySectionCard';
import TopHeader from '../components/MainArea/TopHeader';
import { supabase } from '../supabaseClient';
import { getTheoryMessage } from '../utils/theory';

export default function TeorieClasa() {
  const { gradeId } = useParams();
  const [grade, setGrade] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadGradeTheory = async () => {
      setLoading(true);
      setError('');
      const [gradeResponse, chaptersResponse] = await Promise.all([
        supabase.from('grades').select('id, name').eq('id', gradeId).maybeSingle(),
        supabase.from('chapters').select('id, title, section, order_index, theory_lessons(id)').eq('grade_id', gradeId).eq('theory_lessons.published', true).order('order_index', { ascending: true }),
      ]);
      if (cancelled) return;
      if (gradeResponse.error || chaptersResponse.error || !gradeResponse.data) {
        setError(getTheoryMessage(gradeResponse.error || chaptersResponse.error, 'Clasa nu a putut fi încărcată.'));
      } else {
        setGrade(gradeResponse.data);
        const grouped = new Map();
        (chaptersResponse.data || []).forEach((chapter) => {
          const lessonCount = (chapter.theory_lessons || []).length;
          if (lessonCount === 0) return;
          const section = chapter.section || 'General';
          const current = grouped.get(section) || { section, chapterCount: 0, lessonCount: 0 };
          current.chapterCount += 1;
          current.lessonCount += lessonCount;
          grouped.set(section, current);
        });
        setSections([...grouped.values()]);
      }
      setLoading(false);
    };
    loadGradeTheory();
    return () => { cancelled = true; };
  }, [gradeId]);

  return <div className="flex h-full flex-col"><TopHeader title="Teorie" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-6xl pb-10"><Link to="/teorie" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la teorie</Link>{loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : error ? <div className="rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><AlertTriangle className="inline h-5 w-5" /><p className="mt-2 font-bold">{error}</p></div> : <><div className="mb-8"><div className="flex items-center gap-2 text-sm font-bold text-accent"><BookOpen className="h-4 w-4" />Teorie</div><h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">{grade?.name}</h1><p className="mt-2 text-muted">Alege o secțiune pentru a descoperi lecțiile disponibile.</p></div>{sections.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-ink p-10 text-center"><BookOpen className="mx-auto h-9 w-9 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">Nu există lecții pentru această clasă încă.</h2><p className="mt-2 text-sm text-muted">Revino în curând pentru conținut nou.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sections.map((section) => <TheorySectionCard key={section.section} gradeId={grade.id} {...section} />)}</div>}</>}</div></main></div>;
}
