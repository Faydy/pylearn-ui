import { Compass, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/MainArea/TopHeader';

export default function NotFound() {
  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Pagina nu există" />
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <section className="w-full max-w-xl rounded-2xl border border-border bg-ink p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Compass className="h-7 w-7" />
          </div>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-accent">404</p>
          <h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">Pagina căutată nu a fost găsită.</h1>
          <p className="mt-3 text-muted">
            Verifică adresa sau revino la dashboard pentru a continua în PyLearn.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90"
          >
            <Home className="h-4 w-4" />
            Înapoi la dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}
