import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { getDeleteClassroomMessage } from '../../utils/classrooms';

export default function DeleteClassAction({ classroom, disabled = false }) {
  const navigate = useNavigate();
  const id = useId();
  const dialog = useRef(null);
  const trigger = useRef(null);
  const cancel = useRef(null);
  const busy = useRef(false);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = dialog.current;
    if (open) { element.showModal(); cancel.current?.focus(); }
    return () => element?.close();
  }, [open]);

  const close = () => {
    if (busy.current) return;
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  };
  const remove = async (event) => {
    event.preventDefault();
    if (busy.current || confirmation !== classroom.name) return;
    busy.current = true;
    setDeleting(true);
    setError('');
    try {
      const { error: deleteError } = await supabase.rpc('delete_classroom', {
        p_classroom_id: classroom.id,
        p_confirmation_name: confirmation,
      });
      if (deleteError) throw deleteError;
      navigate('/clase', { replace: true, state: { successMessage: 'Clasa a fost ștearsă definitiv.' } });
    } catch (deleteError) {
      setError(getDeleteClassroomMessage(deleteError));
      busy.current = false;
      setDeleting(false);
    }
  };

  return <div className="mt-6 rounded-xl border border-hard/25 bg-hard/10 p-4">
    <h3 className="font-bold text-hard">Ștergere definitivă</h3>
    <p className="mt-2 text-sm text-muted">Șterge clasa și datele asociate acesteia. Acțiunea nu poate fi anulată.</p>
    <button ref={trigger} type="button" disabled={disabled} onClick={() => { setConfirmation(''); setError(''); setOpen(true); }} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hard/40 px-4 py-2 text-sm font-bold text-hard hover:bg-hard/10 focus-visible:outline-2 focus-visible:outline-hard disabled:opacity-50">
      <Trash2 aria-hidden="true" className="h-4 w-4" />Șterge clasa
    </button>
    {open && createPortal(<dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-warning`} onCancel={(event) => { event.preventDefault(); close(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-hard/30 bg-sidebar p-5 text-text-main shadow-2xl backdrop:bg-background/80 backdrop:backdrop-blur-sm sm:p-6">
      <form onSubmit={remove} aria-busy={deleting}>
        <h2 id={`${id}-title`} className="flex items-center gap-2 text-xl font-bold text-hard"><Trash2 aria-hidden="true" className="h-5 w-5 shrink-0" />Șterge clasa definitiv</h2>
        <div id={`${id}-warning`} className="mt-4 space-y-2 text-sm text-muted">
          <p>Clasa <strong className="break-words text-text-main">{classroom.name}</strong> va fi ștearsă definitiv. Acțiunea nu poate fi anulată.</p>
          <p>Se vor șterge înscrierile elevilor, temele clasei, asocierile temelor cu problemele, anunțurile și notificările asociate. Codul clasei nu va mai funcționa.</p>
          <p>Conturile elevilor, problemele și progresul lor general se păstrează.</p>
        </div>
        <label htmlFor={`${id}-name`} className="mb-2 mt-5 block text-sm font-bold">Pentru confirmare, scrie exact numele clasei:</label>
        <p className="mb-3 break-words rounded-lg border border-border bg-background p-3 text-sm font-semibold">{classroom.name}</p>
        <input id={`${id}-name`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={deleting} autoComplete="off" spellCheck={false} className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-text-main outline-none focus:border-hard focus:ring-1 focus:ring-hard disabled:opacity-50" />
        {error && <p role="alert" className="mt-4 rounded-xl border border-hard/25 bg-hard/10 p-3 text-sm text-hard">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancel} type="button" disabled={deleting} onClick={close} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50">Anulează</button>
          <button type="submit" disabled={deleting || confirmation !== classroom.name} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hard/40 bg-hard/15 px-4 py-2 text-sm font-bold text-hard hover:bg-hard/25 focus-visible:outline-2 focus-visible:outline-hard disabled:cursor-not-allowed disabled:opacity-40">
            {deleting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}{deleting ? 'Se șterge…' : 'Șterge definitiv'}
          </button>
        </div>
      </form>
    </dialog>, document.body)}
  </div>;
}
