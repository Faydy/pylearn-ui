import { Archive, Loader2, RefreshCw, Save, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ClassSettings({ classroom, onSave, onRegenerate, saving, regenerating }) {
  const [name, setName] = useState(classroom.name);
  const [description, setDescription] = useState(classroom.description || '');
  const [archived, setArchived] = useState(Boolean(classroom.archived));
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  useEffect(() => {
    setName(classroom.name);
    setDescription(classroom.description || '');
    setArchived(Boolean(classroom.archived));
  }, [classroom.archived, classroom.description, classroom.id, classroom.name]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ name, description, archived });
  };

  const handleRegenerate = async () => {
    try {
      await onRegenerate();
      setConfirmRegenerate(false);
    } catch {
      // The parent renders the database error next to the classroom header.
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-ink p-4 sm:p-6"><div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-accent" /><div><h2 className="text-xl font-bold text-text-main">Setări clasă</h2><p className="mt-1 text-sm text-muted">Doar tu poți modifica aceste date.</p></div></div><form onSubmit={handleSubmit} className="mt-6 space-y-5"><div><label htmlFor="settings-class-name" className="mb-2 block text-sm font-bold text-text-main">Nume clasă</label><input id="settings-class-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent" /></div><div><label htmlFor="settings-class-description" className="mb-2 block text-sm font-bold text-text-main">Descriere</label><textarea id="settings-class-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={4} className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent" /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4"><input type="checkbox" checked={archived} onChange={(event) => setArchived(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-current" /><span><span className="flex items-center gap-2 font-bold text-text-main"><Archive className="h-4 w-4 text-medium" />Arhivează clasa</span><span className="mt-1 block text-xs text-muted">Elevii existenți pot vedea clasa, dar codul nu mai permite intrări noi.</span></span></label><button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}<Save className="h-4 w-4" />Salvează setările</button></form><div className="mt-6 border-t border-border pt-5">{confirmRegenerate ? <div className="rounded-xl border border-medium/20 bg-medium/10 p-4"><p className="font-bold text-text-main">Sigur vrei să generezi un cod nou?</p><p className="mt-1 text-sm text-muted">Codul vechi nu va mai putea fi folosit pentru intrarea în clasă.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><button type="button" onClick={() => setConfirmRegenerate(false)} disabled={regenerating} className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-text-main">Anulează</button><button type="button" onClick={handleRegenerate} disabled={regenerating} className="inline-flex items-center justify-center gap-2 rounded-lg bg-medium px-3 py-2 text-sm font-bold text-ink disabled:opacity-50">{regenerating && <Loader2 className="h-4 w-4 animate-spin" />}Generează cod nou</button></div></div> : <button type="button" onClick={() => setConfirmRegenerate(true)} className="inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><RefreshCw className="h-4 w-4" />Generează cod nou</button>}</div></section>
  );
}
