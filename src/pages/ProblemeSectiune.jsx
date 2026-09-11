import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import TopHeader from '../components/MainArea/TopHeader';
import ProblemFilters from '../components/problems/ProblemFilters';
import ProblemResults from '../components/problems/ProblemResults';
import ProblemCard from '../components/problems/ProblemCard';
import CurriculumBreadcrumbs from '../components/problems/CurriculumBreadcrumbs';
import CurriculumProgress from '../components/problems/CurriculumProgress';
import useProblemBrowser from '../hooks/useProblemBrowser';
import useProblemCurriculum from '../hooks/useProblemCurriculum';
import { sectionValue } from '../utils/problemFilters';

export default function ProblemeSectiune() {
  const { chapterId } = useParams();
  const browser = useProblemBrowser({ chapterId });
  const curriculum = useProblemCurriculum({ chapterId });
  const chapter = curriculum.chapters[0] || browser.metadata?.chapters.find((item) => String(item.id) === chapterId);
  const grade = curriculum.grade || browser.metadata?.grades.find((item) => String(item.id) === String(chapter?.grade_id));
  const section = chapter ? sectionValue(chapter) : undefined;
  const title = chapter?.title || 'Probleme din capitol';
  const backHref = grade ? `/probleme/clasa/${grade.id}/sectiune/${encodeURIComponent(section)}` : '/probleme';
  const progress = curriculum.chapters[0];
  return <div className="flex h-full min-w-0 flex-col">
    <TopHeader title={title} />
    <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-10 sm:p-6">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        <CurriculumBreadcrumbs grade={grade} section={section} chapter={chapter} />
        <div className="mb-6">
          <Link to={backHref} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la secțiune</Link>
          <h1 className="flex items-start gap-3 break-words text-2xl font-bold text-text-main sm:text-3xl"><Layers className="h-8 w-8 shrink-0 text-accent" /><span className="min-w-0">{title}</span></h1>
          <p className="mt-2 text-muted">Alege o problemă și începe să exersezi.</p>
          {curriculum.loading ? <p role="status" className="mt-4 text-sm text-muted">Se încarcă progresul…</p>
            : curriculum.error ? <p role="alert" className="mt-4 text-sm text-hard">{curriculum.error} <button onClick={curriculum.retry} className="font-bold underline">Reîncearcă</button></p>
              : progress && <div className="mt-5 rounded-2xl border border-border bg-ink p-5"><CurriculumProgress total={Number(progress.total_problem_count)} solved={Number(progress.solved_problem_count || 0)} personal={curriculum.personal} label={`Progres ${title}`} /></div>}
        </div>
        <ProblemFilters browser={browser} placeholder="Caută în acest capitol..." />
        <ProblemResults browser={browser} emptyMessage="Nu există probleme disponibile pentru acest capitol încă."><div className="flex flex-col gap-4">{browser.problems.map((problem) => <ProblemCard key={problem.id} problem={problem} />)}</div></ProblemResults>
      </div>
    </main>
  </div>;
}
