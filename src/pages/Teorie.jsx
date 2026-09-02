import { BookOpen, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/MainArea/TopHeader';

export default function Teorie() {
  return (
    <div className="flex min-h-full flex-col">
      <TopHeader title="Teorie" />
      <main className="flex flex-1 items-center p-4 sm:p-6">
        <section className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-ink p-6 text-center shadow-xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-text-main sm:text-3xl">Zona de teorie este în pregătire</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">Până când lecțiile vor fi disponibile, poți explora problemele și exersa direct în editorul PyLearn.</p>
          <Link to="/probleme" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-ink transition-colors hover:bg-accent/90 sm:w-auto">
            <Code2 className="h-5 w-5" />Explorează problemele
          </Link>
        </section>
      </main>
    </div>
  );
}
