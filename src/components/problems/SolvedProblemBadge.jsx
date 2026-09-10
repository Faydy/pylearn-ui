import { CheckCircle2 } from 'lucide-react';

export default function SolvedProblemBadge({ isSolved }) {
  if (isSolved !== true) return null;
  return <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-easy/25 bg-easy/10 px-2 py-0.5 text-xs font-bold normal-case text-easy"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />Rezolvată</span>;
}
