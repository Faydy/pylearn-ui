import SolvedProblemBadge from './SolvedProblemBadge';
import { isProblemSolved } from '../../utils/solvedProblems';
import { ChevronRight, Code2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DIFFICULTIES } from '../../utils/problemFilters';

export default function ProblemCard({ problem, showCategory = false }) {
  const isSolved = isProblemSolved(problem);
  const difficultyStyle = { usor: 'bg-easy/10 text-easy border-easy/20', mediu: 'bg-medium/10 text-medium border-medium/20', greu: 'bg-hard/10 text-hard border-hard/20' };
  return (
    <Link to={`/rezolvare/${problem.id}`} className={`group flex min-w-0 flex-col gap-3 rounded-2xl border ${isSolved ? 'border-easy/40' : 'border-border'} bg-ink p-4 transition-all duration-300 hover:border-accent hover:shadow-lg sm:p-5`}>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="mt-1 shrink-0 text-muted transition-colors group-hover:text-accent"><Code2 className="h-5 w-5" /></div>
          <div className="min-w-0"><h4 className="break-words text-lg font-bold text-text-main transition-colors group-hover:text-accent">{problem.title}</h4><div className="mt-1 flex flex-wrap items-center gap-2"><SolvedProblemBadge isSolved={isSolved} /><span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyStyle[problem.difficulty] || 'border-border bg-background text-muted'}`}>{DIFFICULTIES.find((item) => item.value === problem.difficulty)?.label || problem.difficulty}</span>{showCategory && problem.categories && <span className="rounded-lg border border-border bg-background px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">{problem.categories.name}</span>}</div></div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-5"><div className="flex items-center gap-1 rounded-xl border border-easy/20 bg-easy/10 px-3 py-1.5 text-sm font-bold text-easy"><Star className="h-4 w-4 fill-easy" />{problem.xp_reward} XP</div><ChevronRight className="hidden h-5 w-5 text-muted transition-colors group-hover:text-accent sm:block" /></div>
      </div>
      {problem.description && <div className="sm:pl-9"><p className="line-clamp-2 break-words text-sm text-muted">{problem.description}</p></div>}
    </Link>
  );
}
