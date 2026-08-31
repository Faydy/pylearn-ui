import { Check, Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function ClassCode({ code, onRegenerate, regenerating = false }) {
  const [copyState, setCopyState] = useState('');

  const handleCopy = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopyState('Cod copiat!');
    } catch {
      setCopyState('Nu am putut copia codul.');
    }
  };

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/10 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Cod clasă</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <code className="rounded-lg border border-accent/20 bg-background px-3 py-2 font-mono text-xl font-bold tracking-[0.18em] text-text-main">{code}</code>
        <button type="button" onClick={handleCopy} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent">
          {copyState === 'Cod copiat!' ? <Check className="h-4 w-4 text-easy" /> : <Copy className="h-4 w-4" />}
          Copiază
        </button>
      </div>
      {copyState && <p className={`mt-2 text-xs font-bold ${copyState === 'Cod copiat!' ? 'text-easy' : 'text-hard'}`}>{copyState}</p>}
      {onRegenerate && (
        <button type="button" onClick={onRegenerate} disabled={regenerating} className="mt-4 text-sm font-bold text-muted transition-colors hover:text-text-main disabled:cursor-not-allowed disabled:opacity-50">
          {regenerating && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
          Generează cod nou
        </button>
      )}
    </div>
  );
}
