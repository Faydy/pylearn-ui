import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';

export default function ContinueComponent({ categorie, titlu, procentaj, to }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-ink p-3 transition-colors hover:border-muted">
      <div className="flex flex-1 flex-col p-2">
        <p className="pb-2 text-xs font-mono text-muted">{categorie}</p>
        <h3 className="line-clamp-2 font-semibold text-text-main">{titlu}</h3>
        <ProgressBar procentaj={procentaj} />
      </div>
      <Link
        to={to}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-bold text-background transition-colors hover:bg-accent/90"
      >
        <Play className="h-4 w-4" />
        Continuă
      </Link>
    </article>
  );
}
