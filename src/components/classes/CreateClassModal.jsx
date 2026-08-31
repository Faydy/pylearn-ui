import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

export default function CreateClassModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Numele clasei este obligatoriu.');
      return;
    }

    setSaving(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim() });
    } catch (createError) {
      setError(createError.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/95 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="create-class-title">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-border bg-ink p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><h2 id="create-class-title" className="text-2xl font-bold text-text-main">Creează clasă</h2><p className="mt-2 text-sm text-muted">Vei primi automat un cod unic pe care îl poți trimite elevilor.</p></div><button type="button" onClick={onClose} disabled={saving} aria-label="Închide" className="rounded-lg p-2 text-muted transition-colors hover:bg-sidebar-hover hover:text-text-main"><X className="h-5 w-5" /></button></div>
        {error && <p className="mt-5 rounded-xl border border-hard/20 bg-hard/10 p-3 text-sm font-medium text-hard">{error}</p>}
        <div className="mt-6 space-y-5"><div><label htmlFor="class-name" className="mb-2 block text-sm font-bold text-text-main">Nume clasă *</label><input id="class-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoFocus className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent" placeholder="Matematică - Clasa a VII-a" /></div><div><label htmlFor="class-description" className="mb-2 block text-sm font-bold text-text-main">Descriere</label><textarea id="class-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={5} className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent" placeholder="Pregătire pentru Evaluarea Națională" /></div></div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:opacity-50">Anulează</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Creează clasa</button></div>
      </form>
    </div>
  );
}
