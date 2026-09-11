import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function CurriculumBreadcrumbs({ grade, section, chapter }) {
  const items = [
    { title: 'Probleme', href: '/probleme' },
    grade && { title: grade.name, href: `/probleme/clasa/${grade.id}` },
    section && { title: section, href: `/probleme/clasa/${grade?.id}/sectiune/${encodeURIComponent(section)}` },
    chapter && { title: chapter.title },
  ].filter(Boolean);
  return <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted">
    {items.map((item, index) => <span key={index} className="inline-flex min-w-0 items-center gap-2">
      {index > 0 && <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {index === items.length - 1 ? <span aria-current="page" className="min-w-0 break-words text-text-main">{item.title}</span> : <Link to={item.href} className="min-w-0 break-words transition-colors hover:text-accent">{item.title}</Link>}
    </span>)}
  </nav>;
}
