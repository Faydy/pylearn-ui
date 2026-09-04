import { CheckCircle2, ChevronRight, ClockAlert, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarUrl, getProfileAvatarSeed } from '../../utils/profile';
import { getAssignmentStatus } from '../../utils/assignments';

const statusClasses = {
  easy: 'border-easy/20 bg-easy/10 text-easy',
  medium: 'border-medium/20 bg-medium/10 text-medium',
  muted: 'border-border bg-background text-muted',
};

export default function StudentAssignmentProgressCard({ assignmentId, student }) {
  const status = getAssignmentStatus({
    solvedCount: student.solvedCount,
    total: student.total,
  });

  return (
    <Link
      to={`/teme/${assignmentId}/elev/${student.id}`}
      className="group block rounded-xl border border-border bg-background p-4 outline-none transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-center gap-3">
        <img
          src={getAvatarUrl(getProfileAvatarSeed(student))}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full border border-border bg-sidebar"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-text-main transition-colors group-hover:text-accent">{student.username || 'Elev PyLearn'}</p>
          <p className="mt-0.5 text-xs text-muted">{student.solvedCount} / {student.total} probleme</p>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${statusClasses[status.tone]}`}>
          {status.label}
        </span>
      </div>

      {student.submittedAfterDeadline && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-hard/20 bg-hard/10 px-2 py-1 text-xs font-bold text-hard">
          <ClockAlert className="h-3.5 w-3.5" />
          A trimis după deadline
        </p>
      )}

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink">
        <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${student.percentage}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 font-bold text-muted">
          {student.solvedCount === student.total && student.total > 0 ? <CheckCircle2 className="h-4 w-4 text-easy" /> : <Code2 className="h-4 w-4 text-accent" />}
          {student.percentage}% finalizat
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-accent">Vezi detalii <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
}
