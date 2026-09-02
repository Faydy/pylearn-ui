import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatLessonCount } from '../../utils/theory';

export default function TheoryGradeCard({ grade, lessonCount }) {
  return <Link to={`/teorie/clasa/${grade.id}`} className="group flex min-h-52 flex-col justify-between rounded-2xl border border-border bg-ink p-5 transition-all hover:-translate-y-1 hover:border-accent sm:p-6"><div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent"><GraduationCap className="h-6 w-6" /></span><span className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-muted">{formatLessonCount(lessonCount)}</span></div><div><h2 className="text-2xl font-bold text-text-main transition-colors group-hover:text-accent">{grade.name}</h2><p className="mt-2 flex items-center gap-2 text-sm text-muted"><BookOpen className="h-4 w-4" />Explorează lecțiile disponibile</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent">Vezi teoria <ArrowRight className="h-4 w-4" /></span></div></Link>;
}
