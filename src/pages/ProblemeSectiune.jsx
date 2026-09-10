import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import TopHeader from '../components/MainArea/TopHeader';
import ProblemFilters from '../components/problems/ProblemFilters';
import ProblemResults from '../components/problems/ProblemResults';
import ProblemCard from '../components/problems/ProblemCard';
import useProblemBrowser from '../hooks/useProblemBrowser';

export default function ProblemeSectiune() {
  // React Router already decodes route parameters, including literal percent signs.
  const { gradeId, sectionName, chapterId } = useParams();
  const browser = useProblemBrowser({ gradeId, section: sectionName, chapterId });
  const chapter = chapterId ? browser.metadata?.chapters.find((item) => String(item.id) === chapterId) : null;
  const title = chapterId ? chapter?.title || 'Probleme din capitol' : sectionName;
  const parentGrade = gradeId || chapter?.grade_id;
  const backHref = chapter?.section ? `/probleme/clasa/${parentGrade}/sectiune/${encodeURIComponent(chapter.section)}` : parentGrade ? `/probleme/clasa/${parentGrade}` : '/probleme';
  return (
    <div className="flex h-full min-w-0 flex-col">
      <TopHeader title={title} />
      <div className="min-w-0 flex-1 overflow-y-auto p-4 pb-10 sm:p-6">
        <div className="mb-8">
          <Link to={backHref} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />{chapter?.section ? 'Înapoi la secțiune' : 'Înapoi la capitole'}</Link>
          <h2 className="flex items-start gap-3 break-words text-2xl font-bold text-text-main sm:text-3xl"><Layers className="h-8 w-8 shrink-0 text-accent" /><span className="min-w-0">{title}</span></h2>
          <p className="mt-2 text-muted">{chapterId ? 'Toate problemele din acest capitol, gata de rezolvat.' : 'Toate problemele din această secțiune, gata de rezolvat.'}</p>
        </div>
        <ProblemFilters browser={browser} placeholder={chapterId ? 'Filtrează în acest capitol...' : 'Filtrează în această secțiune...'} />
        <ProblemResults browser={browser} emptyMessage={chapterId ? 'Nu există probleme disponibile pentru acest capitol încă.' : 'Nu există probleme disponibile în această secțiune încă.'}><div className="flex flex-col gap-4">{browser.problems.map((problem) => <ProblemCard key={problem.id} problem={problem} />)}</div></ProblemResults>
      </div>
    </div>
  );
}
