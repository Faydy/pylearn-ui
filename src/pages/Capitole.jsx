import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import TopHeader from '../components/MainArea/TopHeader';
import CurriculumBreadcrumbs from '../components/problems/CurriculumBreadcrumbs';
import CurriculumProgress from '../components/problems/CurriculumProgress';
import useProblemCurriculum from '../hooks/useProblemCurriculum';
import { sectionValue } from '../utils/problemFilters';

export default function Capitole() {
  const { gradeId, sectionName } = useParams();
  const curriculum = useProblemCurriculum({ gradeId });
  const { grade, personal, loading, error } = curriculum;
  const chapters = curriculum.chapters.filter((chapter) => !sectionName || sectionValue(chapter) === sectionName);
  const sections = new Map();
  for (const chapter of chapters) {
    const section = sectionValue(chapter);
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push(chapter);
  }
  const total = chapters.reduce((sum, chapter) => sum + Number(chapter.total_problem_count), 0);
  const solved = chapters.reduce((sum, chapter) => sum + Number(chapter.solved_problem_count || 0), 0);
  const title = sectionName || grade?.name || 'Programa clasei';
  const archiveParams = new URLSearchParams({ grade: gradeId });
  if (sectionName) archiveParams.set('section', sectionName);

  return <div className="flex h-full min-w-0 flex-col">
    <TopHeader title={title} />
    <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-10 sm:p-6">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        <CurriculumBreadcrumbs grade={grade} section={sectionName} />
        <Link to={sectionName ? `/probleme/clasa/${gradeId}` : '/probleme'} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />{sectionName ? 'Înapoi la clasă' : 'Înapoi la clase'}</Link>
        {loading ? <div role="status" className="flex justify-center gap-3 py-16 text-muted"><Loader2 className="h-6 w-6 animate-spin text-accent" />Se încarcă programa…</div>
          : error ? <div role="alert" className="rounded-2xl border border-hard/25 bg-hard/10 p-5 text-hard"><p>{error}</p><button onClick={curriculum.retry} className="mt-4 min-h-11 font-bold underline">Încearcă din nou</button></div>
          : !grade ? <p className="rounded-2xl border border-border p-6 text-muted">Clasa nu a fost găsită.</p>
          : <>
            <h1 className="break-words text-2xl font-bold text-text-main sm:text-3xl">{title}</h1>
            <p className="mt-2 text-muted">Alege un capitol și exersează pas cu pas.</p>
            <section aria-label={personal ? 'Progres general' : 'Probleme disponibile'} className="mt-6">
              <Link to={`/probleme/toate?${archiveParams}`} className="group block rounded-2xl border border-border bg-ink p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-accent sm:p-6">
                <h2 className="mb-3 font-bold text-text-main group-hover:text-accent">{personal ? 'Progres general' : 'Probleme disponibile'}</h2>
                <CurriculumProgress total={total} solved={solved} personal={personal} label={`Progres ${title}`} />
                <span className="mt-4 flex items-center justify-between gap-3 text-sm font-bold text-accent"><span>Vezi toate problemele {sectionName ? 'din secțiune' : 'clasei'}</span><ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" /></span>
              </Link>
              {!personal && <p className="mt-3 text-sm text-muted"><Link to="/login" className="font-bold text-accent hover:underline">Intră în cont</Link> pentru a-ți urmări progresul.</p>}
            </section>
            {chapters.length === 0 ? <p className="mt-8 rounded-2xl border border-dashed border-border p-6 text-muted">Nu există capitole adăugate încă.</p>
              : <div className="mt-8 space-y-8">{[...sections].map(([section, rows]) => <section key={section} aria-label={section}>
                <h2 className="mb-4 break-words text-sm font-bold uppercase tracking-wider text-accent">{section}</h2>
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">{rows.map((chapter) => {
                  const count = Number(chapter.total_problem_count);
                  const done = Number(chapter.solved_problem_count || 0);
                  const completed = personal && count > 0 && count === done;
                  return <Link key={chapter.chapter_id} to={`/probleme/capitol/${chapter.chapter_id}`} className={`group flex min-w-0 flex-col rounded-2xl border ${completed ? 'border-easy/40' : 'border-border'} bg-ink p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-accent`}>
                    <div className="mb-5 flex items-start gap-3"><BookOpen className="mt-1 h-5 w-5 shrink-0 text-accent" /><h3 className="min-w-0 flex-1 break-words text-lg font-bold text-text-main group-hover:text-accent">{chapter.title}</h3><ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted group-hover:text-accent" /></div>
                    <div className="mt-auto"><CurriculumProgress total={count} solved={done} personal={personal && count > 0} label={`Progres ${chapter.title}`} /></div>
                    {completed && <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-easy"><CheckCircle2 className="h-4 w-4" />Capitol complet</span>}
                    {count === 0 && <span className="mt-3 text-xs font-bold text-muted">În curând</span>}
                  </Link>;
                })}</div>
              </section>)}</div>}
          </>}
      </div>
    </main>
  </div>;
}
