import { CheckCircle2, CircleCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TheoryProgress({ user, completed, saving, onComplete }) {
  if (!user) return <section className="rounded-2xl border border-border bg-ink p-5"><h2 className="font-bold text-text-main">Păstrează progresul lecțiilor</h2><p className="mt-2 text-sm text-muted">Intră în cont pentru a marca lecția ca parcursă.</p><Link to="/login" className="mt-4 inline-flex font-bold text-accent transition-colors hover:text-text-main">Intră în cont</Link></section>;
  if (completed) return <section className="flex items-center gap-3 rounded-2xl border border-easy/20 bg-easy/10 p-5"><CheckCircle2 className="h-6 w-6 shrink-0 text-easy" /><div><h2 className="font-bold text-text-main">Lecție parcursă</h2><p className="mt-1 text-sm text-muted">Progresul tău a fost actualizat.</p></div></section>;

  return <section className="rounded-2xl border border-border bg-ink p-5"><h2 className="font-bold text-text-main">Ai terminat lecția?</h2><p className="mt-2 text-sm text-muted">Marcheaz-o ca parcursă pentru a urmări mai ușor unde ai rămas.</p><button type="button" onClick={onComplete} disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleCheck className="h-4 w-4" />}Am terminat lecția</button></section>;
}
