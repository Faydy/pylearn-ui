import { CheckCircle2, Circle, Clock3, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDifficultyClasses } from '../../utils/assignments';

export default function AssignmentProblemList({ problems, solvedIds, editable = false, onMove, onRemove }) {
  if (problems.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">Tema nu are probleme încă.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-ink">
      {problems.map((item, index) => {
        const problem = item.problem || item;
        const isSolved = solvedIds?.has(problem.id);
        const chapterName = problem.chapters?.title || problem.chapters?.section;
        const categoryName = problem.categories?.name;

        return (
          <div key={problem.id} className={`flex items-center gap-4 p-4 ${index < problems.length - 1 ? 'border-b border-border' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSolved ? 'bg-easy/10 text-easy' : 'bg-background text-muted'}`}>
              {isSolved ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              {editable ? (
                <p className="truncate font-bold text-text-main">{problem.title}</p>
              ) : (
                <Link to={`/rezolvare/${problem.id}`} className="truncate font-bold text-text-main transition-colors hover:text-accent">{problem.title}</Link>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className={`rounded-md border px-2 py-0.5 font-bold ${getDifficultyClasses(problem.difficulty)}`}>{problem.difficulty || 'Mixt'}</span>
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-accent" />+{problem.xp_reward || 0} XP</span>
                {(chapterName || categoryName) && <span>{[chapterName, categoryName].filter(Boolean).join(' · ')}</span>}
              </div>
            </div>

            {editable ? (
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="rounded-md border border-border px-2 py-1 text-xs font-bold text-muted hover:text-text-main disabled:cursor-not-allowed disabled:opacity-40">Sus</button>
                <button type="button" onClick={() => onMove(index, 1)} disabled={index === problems.length - 1} className="rounded-md border border-border px-2 py-1 text-xs font-bold text-muted hover:text-text-main disabled:cursor-not-allowed disabled:opacity-40">Jos</button>
                <button type="button" onClick={() => onRemove(problem.id)} className="ml-1 rounded-md border border-hard/30 px-2 py-1 text-xs font-bold text-hard hover:bg-hard/10">Elimină</button>
              </div>
            ) : (
              <div className="hidden shrink-0 items-center gap-1.5 text-xs font-bold text-muted sm:flex">
                {isSolved ? <><CheckCircle2 className="h-4 w-4 text-easy" />Rezolvată</> : <><Clock3 className="h-4 w-4" />Nerezolvată</>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
