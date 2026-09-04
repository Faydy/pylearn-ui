import { CheckCircle2, Loader2, LockKeyhole, Trash2 } from 'lucide-react';

export default function AssignmentManagementActions({ assignment, finalizing, deleting, onFinalize, onDelete }) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-ink p-4 sm:p-6">
      <h2 className="text-xl font-bold text-text-main">Administrare temă</h2>
      <p className="mt-1 text-sm text-muted">Acțiunile de mai jos se aplică imediat temei salvate.</p>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {assignment.is_finalized ? (
          <div className="rounded-xl border border-easy/20 bg-easy/10 p-4">
            <p className="inline-flex items-center gap-2 font-bold text-easy"><CheckCircle2 className="h-5 w-5" />Tema este finalizată</p>
            <p className="mt-2 text-sm text-muted">Elevii nu mai pot trimite soluții pentru problemele acestei teme.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-medium/20 bg-medium/10 p-4">
            <p className="inline-flex items-center gap-2 font-bold text-text-main"><LockKeyhole className="h-5 w-5 text-medium" />Finalizează tema</p>
            <p className="mt-2 text-sm text-muted">Elevii vor putea consulta tema, dar nu vor mai putea trimite soluții pentru problemele ei.</p>
            <button type="button" onClick={onFinalize} disabled={finalizing || deleting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-medium px-3 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-medium/90 disabled:cursor-not-allowed disabled:opacity-50">
              {finalizing && <Loader2 className="h-4 w-4 animate-spin" />}
              Finalizează tema
            </button>
          </div>
        )}

        <div className="rounded-xl border border-hard/20 bg-hard/10 p-4">
          <p className="inline-flex items-center gap-2 font-bold text-hard"><Trash2 className="h-5 w-5" />Șterge tema</p>
          <p className="mt-2 text-sm text-muted">Tema și asocierea cu problemele ei vor fi șterse definitiv.</p>
          <button type="button" onClick={onDelete} disabled={finalizing || deleting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-hard/30 px-3 py-2.5 text-sm font-bold text-hard transition-colors hover:bg-hard/10 disabled:cursor-not-allowed disabled:opacity-50">
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Șterge tema
          </button>
        </div>
      </div>
    </section>
  );
}
