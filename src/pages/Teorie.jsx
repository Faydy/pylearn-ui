import { AlertTriangle, BookOpen, Loader2, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TheoryGradeCard from '../components/theory/TheoryGradeCard';
import TopHeader from '../components/MainArea/TopHeader';
import { supabase } from '../supabaseClient';
import { normalizeSearchText } from '../utils/search';
import { getRelationRow, getTheoryMessage } from '../utils/theory';

export default function Teorie() {
  const [grades, setGrades] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const normalizedSearch = normalizeSearchText(useDeferredValue(search));

  useEffect(() => {
    let cancelled = false;

    const loadTheory = async () => {
      setLoading(true);
      setError('');
      const [gradesResponse, lessonsResponse] = await Promise.all([
        supabase.from('grades').select('id, name, level').order('level', { ascending: true }),
        supabase.from('theory_lessons').select('id, title, summary, chapter_id, chapters!inner(id, title, section, grade_id, grades(id, name))').eq('published', true).order('title', { ascending: true }),
      ]);

      if (cancelled) return;
      if (gradesResponse.error || lessonsResponse.error) {
        setGrades([]);
        setLessons([]);
        setError(getTheoryMessage(gradesResponse.error || lessonsResponse.error, 'Teoria nu a putut fi încărcată.'));
      } else {
        setGrades(gradesResponse.data || []);
        setLessons(lessonsResponse.data || []);
      }
      setLoading(false);
    };

    loadTheory();
    return () => { cancelled = true; };
  }, []);

  const lessonCountsByGrade = lessons.reduce((counts, lesson) => {
    const gradeId = getRelationRow(lesson.chapters)?.grade_id;
    if (gradeId) counts.set(gradeId, (counts.get(gradeId) || 0) + 1);
    return counts;
  }, new Map());

  const searchResults = normalizedSearch ? lessons.filter((lesson) => {
    const chapter = getRelationRow(lesson.chapters);
    const grade = getRelationRow(chapter?.grades);
    return [lesson.title, chapter?.title, chapter?.section, grade?.name].some((value) => normalizeSearchText(value).includes(normalizedSearch));
  }).slice(0, 8) : [];

  return <div className="flex h-full flex-col"><TopHeader title="Teorie" /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto w-full max-w-7xl pb-10"><div className="mb-8"><div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-accent"><BookOpen className="h-4 w-4" />Învață cu PyLearn</div><h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">Teorie</h1><p className="mt-2 max-w-2xl text-muted">Învață conceptele pas cu pas înainte să treci la probleme.</p></div><div className="relative mb-8 max-w-xl"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută o lecție..." className="w-full rounded-xl border border-border bg-ink py-3 pl-12 pr-4 text-text-main outline-none transition-colors focus:border-accent" />{normalizedSearch && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl">{searchResults.length === 0 ? <p className="p-4 text-sm text-muted">Nu am găsit lecții care să corespundă căutării.</p> : searchResults.map((lesson) => { const chapter = getRelationRow(lesson.chapters); return <Link key={lesson.id} to={`/teorie/${lesson.id}`} className="block border-b border-border p-4 last:border-b-0 hover:bg-sidebar-hover"><p className="font-bold text-text-main">{lesson.title}</p><p className="mt-1 text-xs text-muted">{[chapter?.section, chapter?.title].filter(Boolean).join(' · ')}</p></Link>; })}</div>}</div>{loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : error ? <div className="rounded-2xl border border-hard/20 bg-hard/10 p-5 text-hard"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Teoria nu a putut fi încărcată.</p><p className="mt-1 text-sm">{error}</p></div></div></div> : grades.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-ink p-10 text-center"><BookOpen className="mx-auto h-9 w-9 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">Nu există clase disponibile.</h2></div> : <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">{grades.map((grade) => <TheoryGradeCard key={grade.id} grade={grade} lessonCount={lessonCountsByGrade.get(grade.id) || 0} />)}</div>}</div></main></div>;
}
