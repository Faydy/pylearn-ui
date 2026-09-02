import { DoorOpen, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { normalizeClassCode } from '../../utils/classrooms';

export default function JoinClassModal({ onClose, onJoin }) {
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Codul introdus nu este valid.');
      return;
    }

    setSaving(true);
    try {
      await onJoin(code);
    } catch (joinError) {
      setError(joinError.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="join-class-title">
      <form onSubmit={handleSubmit} className="my-auto w-full max-w-md rounded-2xl border border-border bg-ink p-4 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><DoorOpen className="h-6 w-6" /></div><h2 id="join-class-title" className="mt-4 text-2xl font-bold text-text-main">Intră într-o clasă</h2><p className="mt-2 text-sm text-muted">Introdu codul primit de la profesor.</p></div><button type="button" onClick={onClose} disabled={saving} aria-label="Închide" className="rounded-lg p-2 text-muted transition-colors hover:bg-sidebar-hover hover:text-text-main"><X className="h-5 w-5" /></button></div>{error && <p className="mt-5 rounded-xl border border-hard/20 bg-hard/10 p-3 text-sm font-medium text-hard">{error}</p>}<div className="mt-6"><label htmlFor="class-code" className="mb-2 block text-sm font-bold text-text-main">Cod clasă</label><input id="class-code" value={code} onChange={(event) => setCode(normalizeClassCode(event.target.value))} maxLength={6} autoFocus autoComplete="off" className="w-full rounded-xl border border-border bg-background px-3 py-4 text-center font-mono text-xl font-bold tracking-[0.25em] text-text-main outline-none transition-colors focus:border-accent sm:px-4 sm:text-2xl sm:tracking-[0.38em]" placeholder="X7K9PQ" /></div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:opacity-50">Anulează</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Intră în clasă</button></div></form>
    </div>
  );
}
