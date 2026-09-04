import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const navigationLinks = [
  { label: 'Teorie', to: '/teorie' },
  { label: 'Probleme', to: '/probleme' },
  { label: 'Clase', to: '/clase' },
  { label: 'Activitate', to: '/' },
];

const linkClasses = 'w-fit text-sm font-medium text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-sidebar" aria-label="Informații PyLearn">
      <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-7 sm:px-6 sm:py-8 md:grid-cols-[minmax(0,1.4fr)_minmax(9rem,0.7fr)_minmax(12rem,0.9fr)] md:gap-8 lg:px-8">
        <section>
          <p className="text-lg font-bold text-text-main">py<span className="text-accent">Learn</span></p>
          <p className="mt-2 text-sm text-muted">Învață. Exersează. Progresează.</p>
        </section>

        <nav aria-label="Navigare footer">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-text-main">Navigare</h2>
          <div className="mt-3 flex flex-col items-start gap-2.5">
            {navigationLinks.map((link) => <Link key={link.to} to={link.to} className={linkClasses}>{link.label}</Link>)}
          </div>
        </nav>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-text-main">Contact</h2>
          <a href="mailto:contact@pylearn.ro" className={`mt-3 inline-flex items-center gap-2 ${linkClasses}`}>
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            contact@pylearn.ro
          </a>
        </section>
      </div>

      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted sm:px-6 lg:px-8">
        © {new Date().getFullYear()} PyLearn
      </div>
    </footer>
  );
}
