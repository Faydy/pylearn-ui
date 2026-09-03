import { CalendarDays, CheckCircle2, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDifficultyClasses } from '../../utils/assignments';

function formatSolvedAt(value) {
  if (!value) return 'Dată indisponibilă';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă';
  return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export default function SolvedProblemCard({ problem }) {
  const chapter = [problem.chapter_section, problem.chapter_title].filter(Boolean).join(' · ');

  return <Link to={`/rezolvare/${problem.problem_id}`} className="group flex items-center gap-3 p-4 transition-colors hover:bg-sidebar-hover sm:p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-easy/10 text-easy"><CheckCircle2 className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate font-bold text-text-main transition-colors group-hover:text-accent">{problem.title}</span><span className="mt-1 flex flex-wrap items-center gap-2"><span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getDifficultyClasses(problem.difficulty)}`}>{problem.difficulty || 'Mixt'}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-accent"><Star className="h-3 w-3 fill-current" />+{problem.xp_reward || 0} XP</span>{chapter && <span className="max-w-full truncate text-xs text-muted">{chapter}</span>}</span><span className="mt-2 flex items-center gap-1 text-xs text-muted"><CalendarDays className="h-3.5 w-3.5" />Rezolvată pe {formatSolvedAt(problem.solved_at)}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" /></Link>;
}
