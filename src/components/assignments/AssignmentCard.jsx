import { ArrowRight, CalendarClock, ClipboardList, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import AssignmentProgress from './AssignmentProgress';
import { formatDueAt } from '../../utils/assignments';

export default function AssignmentCard({ assignment, teacherView = false }) {
  return (
    <article className="flex min-h-[260px] flex-col rounded-2xl border border-border bg-ink p-6 transition-all hover:border-muted">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-muted">
            <ClipboardList className="h-5 w-5 text-accent" />
            <span>{assignment.classroomName || 'Clasă'}</span>
          </div>
          <h2 className="line-clamp-2 text-xl font-bold text-text-main">{assignment.title}</h2>
          {assignment.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{assignment.description}</p>}
        </div>
        {teacherView && (
          <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${assignment.published ? 'border-easy/20 bg-easy/10 text-easy' : 'border-border bg-background text-muted'}`}>
            {assignment.published ? 'Publicată' : 'Draft'}
          </span>
        )}
      </div>

      <div className="mt-6">
        {teacherView ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <CalendarClock className="h-4 w-4" />
            {assignment.due_at ? `Deadline: ${formatDueAt(assignment.due_at)}` : 'Fără deadline'}
            <span className="ml-auto font-bold text-text-main">{assignment.total} probleme</span>
          </div>
        ) : (
          <AssignmentProgress
            solvedCount={assignment.solvedCount}
            total={assignment.total}
            dueAt={assignment.due_at}
            compact
          />
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <Link
          to={`/teme/${assignment.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-accent/90"
        >
          {teacherView ? 'Deschide tema' : 'Continuă'}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {teacherView && (
          <Link to={`/teme/${assignment.id}/edit`} className="inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-accent">
            <Pencil className="h-4 w-4" />
            Editează
          </Link>
        )}
      </div>
    </article>
  );
}
