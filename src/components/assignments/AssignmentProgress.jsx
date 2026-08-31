import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { formatDueAt, getAssignmentStatus } from '../../utils/assignments';

const statusClasses = {
  easy: 'border-easy/20 bg-easy/10 text-easy',
  medium: 'border-medium/20 bg-medium/10 text-medium',
  hard: 'border-hard/20 bg-hard/10 text-hard',
  muted: 'border-border bg-background text-muted',
};

export default function AssignmentProgress({ solvedCount, total, dueAt, compact = false }) {
  const percentage = total === 0 ? 0 : Math.round((solvedCount / total) * 100);
  const status = getAssignmentStatus({ solvedCount, total, dueAt });

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClasses[status.tone]}`}>
          {status.label}
        </span>
        <span className="text-sm font-bold text-text-main">{solvedCount} / {total} probleme</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-easy" />{percentage}% finalizat</span>
        {dueAt && <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" />Deadline: {formatDueAt(dueAt)}</span>}
      </div>
    </div>
  );
}
