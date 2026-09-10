import useProblemBrowser from '../../hooks/useProblemBrowser';
import ProblemCard from './ProblemCard';
import ProblemFilters from './ProblemFilters';
import ProblemResults from './ProblemResults';

export default function ProblemBrowser({ gradeId, section, chapterId, placeholder, showCategory = false }) {
  const browser = useProblemBrowser({ gradeId, section, chapterId });
  return <><ProblemFilters browser={browser} placeholder={placeholder} /><ProblemResults browser={browser}><div className="flex flex-col gap-4">{browser.problems.map((problem) => <ProblemCard key={problem.id} problem={problem} showCategory={showCategory} />)}</div></ProblemResults></>;
}
