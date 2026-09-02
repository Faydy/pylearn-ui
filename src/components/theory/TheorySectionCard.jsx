import { ArrowRight, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatLessonCount } from '../../utils/theory';

export default function TheorySectionCard({ gradeId, section, chapterCount, lessonCount }) {
  return <Link to={`/teorie/clasa/${gradeId}/sectiune/${encodeURIComponent(section)}`} className="group rounded-2xl border border-border bg-ink p-5 transition-colors hover:border-accent sm:p-6"><div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Layers className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" /></div><h2 className="mt-6 text-xl font-bold text-text-main transition-colors group-hover:text-accent">{section}</h2><p className="mt-2 text-sm text-muted">{chapterCount} {chapterCount === 1 ? 'capitol' : 'capitole'} · {formatLessonCount(lessonCount)}</p></Link>;
}
