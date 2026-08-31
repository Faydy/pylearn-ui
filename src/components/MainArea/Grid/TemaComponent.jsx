import { ArrowRight, ClipboardList, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';

export default function TemaComponent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-[200px] flex-col justify-between rounded-2xl border border-border bg-ink p-6 transition-all hover:border-muted">
        <div>
          <div className="mb-2 flex items-center gap-2 font-bold text-muted">
            <ClipboardList className="h-5 w-5 text-accent" />
            <span className="text-sm uppercase tracking-wider">Teme</span>
          </div>
          <h3 className="text-xl font-bold text-text-main">Temele tale</h3>
          <p className="mt-2 text-sm text-muted">Loghează-te pentru a vedea temele tale curente.</p>
        </div>

        <Link
          to="/login"
          className="mt-6 flex w-fit items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-ink"
        >
          <LogIn className="h-4 w-4" />
          Intră în cont
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[200px] flex-col justify-between rounded-2xl border border-border bg-ink p-6 transition-all hover:border-muted">
      <div>
        <div className="mb-2 flex items-center gap-2 font-bold text-muted">
          <ClipboardList className="h-5 w-5 text-accent" />
          <span className="text-sm uppercase tracking-wider">Teme</span>
        </div>
        <h3 className="text-xl font-bold text-text-main">Temele tale</h3>
        <p className="mt-2 text-sm text-muted">Vezi temele publicate, progresul și problemele pe care le ai de rezolvat.</p>
      </div>

      <Link to="/teme" className="mt-6 flex w-fit items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-white">Deschide temele<ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}
