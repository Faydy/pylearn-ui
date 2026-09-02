import { ArrowRight, CalendarDays, GraduationCap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import ClassCode from './ClassCode';
import { formatClassroomDate, formatStudentCount } from '../../utils/classrooms';

export default function ClassCard({ classroom, teacherView }) {
  return (
    <article className="flex min-h-[260px] flex-col rounded-2xl border border-border bg-ink p-4 transition-colors hover:border-muted sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-accent"><GraduationCap className="h-5 w-5" />Clasă</div>
          <h2 className="mt-3 line-clamp-2 text-xl font-bold text-text-main">{classroom.name}</h2>
          {classroom.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{classroom.description}</p>}
        </div>
        {classroom.archived && <span className="shrink-0 rounded-md border border-medium/20 bg-medium/10 px-2 py-1 text-xs font-bold text-medium">Arhivată</span>}
      </div>

      <div className="mt-6 space-y-3">
        {teacherView ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted"><Users className="h-4 w-4" />{formatStudentCount(classroom.studentCount)}</div>
            <ClassCode code={classroom.join_code} />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted"><Users className="h-4 w-4" />Profesor: <span className="font-bold text-text-main">{classroom.teacherName || 'Profesor PyLearn'}</span></div>
            {classroom.joined_at && <div className="flex items-center gap-2 text-sm text-muted"><CalendarDays className="h-4 w-4" />Ai intrat la {formatClassroomDate(classroom.joined_at)}</div>}
          </>
        )}
      </div>

      <Link to={`/clase/${classroom.id}`} className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-sm font-bold text-accent transition-colors hover:text-text-main">Vezi clasa <ArrowRight className="h-4 w-4" /></Link>
    </article>
  );
}
