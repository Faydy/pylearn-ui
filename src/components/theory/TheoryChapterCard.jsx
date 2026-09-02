import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatLessonCount, sortTheoryLessons } from '../../utils/theory';

export default function TheoryChapterCard({ chapter, lessons = [] }) {
  const sortedLessons = sortTheoryLessons(lessons);

  return (
    <article className="rounded-2xl border border-border bg-ink p-5 transition-colors hover:border-muted sm:p-6">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-bold text-accent"><BookOpen className="h-4 w-4" />Capitol</div><h2 className="mt-3 text-xl font-bold text-text-main">{chapter.title}</h2></div><span className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-muted">{formatLessonCount(sortedLessons.length)}</span></div>
      {sortedLessons.length > 0 ? <ul className="mt-5 space-y-2">{sortedLessons.slice(0, 4).map((lesson) => <li key={lesson.id}><Link to={`/teorie/${lesson.id}`} className="group flex items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 text-sm transition-colors hover:border-border hover:bg-background"><span className="min-w-0 truncate font-medium text-text-main group-hover:text-accent">{lesson.title}</span>{lesson.estimated_read_minutes && <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted"><Clock className="h-3.5 w-3.5" />{lesson.estimated_read_minutes} min</span>}</Link></li>)}</ul> : <p className="mt-5 text-sm text-muted">Nu există lecții publicate pentru acest capitol.</p>}
      <Link to={`/teorie/capitol/${chapter.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent transition-colors hover:text-text-main">Vezi capitolul <ArrowRight className="h-4 w-4" /></Link>
    </article>
  );
}
