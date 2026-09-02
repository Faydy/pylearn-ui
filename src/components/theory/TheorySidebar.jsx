import { CheckCircle2, ChevronRight, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sortTheoryLessons } from '../../utils/theory';

function LessonLinks({ chapterTitle, lessons, activeLessonId, completedIds }) {
  return <><h2 className="text-sm font-bold text-text-main">{chapterTitle}</h2><div className="mt-3 space-y-1">{sortTheoryLessons(lessons).map((lesson) => { const lessonId = Number(lesson.id); const active = lessonId === Number(activeLessonId); const completed = completedIds.has(lessonId); return <Link key={lesson.id} to={`/teorie/${lesson.id}`} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-background hover:text-text-main'}`}>{completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-easy" /> : <ChevronRight className="h-4 w-4 shrink-0" />}<span className="min-w-0 truncate">{lesson.title}</span></Link>; })}</div></>;
}

export default function TheorySidebar({ chapterTitle, lessons, activeLessonId, completedIds }) {
  return <><aside className="hidden self-start rounded-2xl border border-border bg-ink p-4 lg:block lg:sticky lg:top-6"><LessonLinks chapterTitle={chapterTitle} lessons={lessons} activeLessonId={activeLessonId} completedIds={completedIds} /></aside><details className="rounded-xl border border-border bg-ink p-4 lg:hidden"><summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-text-main"><List className="h-4 w-4 text-accent" />Cuprins capitol</summary><div className="mt-4"><LessonLinks chapterTitle={chapterTitle} lessons={lessons} activeLessonId={activeLessonId} completedIds={completedIds} /></div></details></>;
}
