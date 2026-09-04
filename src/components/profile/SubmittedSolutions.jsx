import Editor from '@monaco-editor/react';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Clock3, Code2, Cpu, Loader2, LockKeyhole, MemoryStick, Send, TriangleAlert, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDifficultyClasses } from '../../utils/assignments';

function formatSubmittedAt(value) {
  if (!value) return 'Dată indisponibilă';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă';

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getSubmissionStatus(value) {
  const status = value?.toLowerCase();

  if (status === 'accepted') {
    return { label: 'Acceptată', classes: 'border-easy/30 bg-easy/10 text-easy', Icon: CheckCircle2 };
  }

  if (status === 'wrong_answer') {
    return { label: 'Răspuns greșit', classes: 'border-hard/30 bg-hard/10 text-hard', Icon: XCircle };
  }

  if (status === 'runtime_error') {
    return { label: 'Eroare la execuție', classes: 'border-hard/30 bg-hard/10 text-hard', Icon: TriangleAlert };
  }

  if (status === 'compile_error') {
    return { label: 'Eroare de compilare', classes: 'border-hard/30 bg-hard/10 text-hard', Icon: TriangleAlert };
  }

  if (status === 'time_limit_exceeded') {
    return { label: 'Limită de timp depășită', classes: 'border-medium/30 bg-medium/10 text-medium', Icon: Clock3 };
  }

  if (status === 'memory_limit_exceeded') {
    return { label: 'Limită de memorie depășită', classes: 'border-medium/30 bg-medium/10 text-medium', Icon: MemoryStick };
  }

  return { label: 'Trimisă', classes: 'border-border bg-background text-muted', Icon: Send };
}

function SubmissionDetails({ submission }) {
  const runtime = submission.runtime_ms === null || submission.runtime_ms === undefined
    ? 'Indisponibil'
    : `${submission.runtime_ms} ms`;
  const memory = submission.memory_kb === null || submission.memory_kb === undefined
    ? 'Indisponibilă'
    : `${(submission.memory_kb / 1024).toLocaleString('ro-RO', { maximumFractionDigits: 2 })} MB`;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
      <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />Trimisă pe {formatSubmittedAt(submission.submitted_at)}</span>
      <span className="inline-flex items-center gap-2 font-semibold text-text-main"><Cpu className="h-4 w-4 text-accent" />Timp: {runtime}</span>
      <span className="inline-flex items-center gap-2 font-semibold text-text-main"><MemoryStick className="h-4 w-4 text-accent" />Memorie: {memory}</span>
    </div>
  );
}

function SubmissionCodeDialog({ solution, onClose }) {
  useEffect(() => {
    if (!solution) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, solution]);

  if (!solution) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-background/90 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" onMouseDown={onClose}>
      <section className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-border bg-ink shadow-2xl sm:max-h-[86dvh] sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="submission-code-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0"><p className="text-sm font-bold text-accent">Soluție trimisă</p><h2 id="submission-code-title" className="mt-1 truncate text-lg font-bold text-text-main">{solution.problem_title || `Submission ${solution.submission_number || ''}`}</h2><p className="mt-1 text-xs text-muted">{formatSubmittedAt(solution.submitted_at)}</p></div>
          <button type="button" onClick={onClose} aria-label="Închide soluția" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted transition-colors hover:border-accent hover:text-text-main"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          <div className="overflow-hidden rounded-xl border border-border bg-[#1e1e1e]">
            <Editor
              height="min(58dvh, 38rem)"
              defaultLanguage="python"
              theme="vs-dark"
              value={solution.source_code}
              options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", scrollBeyondLastLine: false, padding: { top: 14, bottom: 14 } }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function LockedSolution({ problemId }) {
  return (
    <div className="flex max-w-sm items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-muted">
      <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <span>Soluția este ascunsă până când rezolvi și tu această problemă. <Link to={`/rezolvare/${problemId}`} className="font-bold text-accent hover:text-text-main">Rezolvă problema</Link></span>
    </div>
  );
}

function InlineCodeViewer({ solution, solutionError }) {
  if (solutionError) return <p className="rounded-lg border border-hard/20 bg-hard/10 p-3 text-sm text-hard">{solutionError}</p>;
  if (!solution?.source_code) return <p className="rounded-lg border border-border bg-ink p-3 text-sm text-muted">Codul sursă nu este disponibil pentru această trimitere.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#1e1e1e]">
      <div className="border-b border-border/60 bg-[#2d2d2d] px-4 py-2 text-xs font-bold text-muted">Soluție trimisă</div>
      <Editor height="18rem" defaultLanguage="python" theme="vs-dark" value={solution.source_code} options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", scrollBeyondLastLine: false, padding: { top: 14, bottom: 14 } }} />
    </div>
  );
}

function SubmittedSolutionCard({ submission, onLoadSolution, showProblemTitle, submissionIndex, codePresentation, onOpenCodeModal }) {
  const [expanded, setExpanded] = useState(false);
  const [solution, setSolution] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState('');
  const status = getSubmissionStatus(submission.submission_status);
  const StatusIcon = status.Icon;
  const canViewCode = submission.can_view_code !== false;
  const canLoadCode = Boolean(submission.source_code) || typeof onLoadSolution === 'function';

  const openSolution = async () => {
    if (!canViewCode || !canLoadCode) return;

    if (submission.source_code) {
      if (codePresentation === 'modal') onOpenCodeModal(submission);
      else {
        setSolution(submission);
        setExpanded(true);
      }
      return;
    }

    setLoadingSolution(true);
    setSolutionError('');
    try {
      const nextSolution = await onLoadSolution(submission.submission_id);
      if (!nextSolution?.source_code) throw new Error('Codul sursă nu este disponibil pentru această trimitere.');
      if (codePresentation === 'modal') onOpenCodeModal(nextSolution);
      else {
        setSolution(nextSolution);
        setExpanded(true);
      }
    } catch (error) {
      setSolutionError(error.message || 'Soluția nu a putut fi încărcată.');
      if (codePresentation !== 'modal') setExpanded(true);
    } finally {
      setLoadingSolution(false);
    }
  };

  const toggleSolution = () => {
    if (codePresentation === 'modal') {
      openSolution();
      return;
    }

    if (expanded) {
      setExpanded(false);
      return;
    }
    openSolution();
  };

  return (
    <article className="border-b border-border last:border-b-0">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-text-main">
              {showProblemTitle ? <Link to={`/rezolvare/${submission.problem_id}`} className="transition-colors hover:text-accent">{submission.problem_title}</Link> : `Submission ${submission.submission_number || submissionIndex + 1}`}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {showProblemTitle && <><span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getDifficultyClasses(submission.problem_difficulty)}`}>{submission.problem_difficulty || 'Mixt'}</span><span className="text-xs font-bold text-accent">+{submission.xp_reward || 0} XP</span></>}
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${status.classes}`}><StatusIcon className="h-3.5 w-3.5" />{status.label}</span>
              {typeof submission.solved === 'boolean' && <span className={`inline-flex items-center gap-1 text-xs font-bold ${submission.solved ? 'text-easy' : 'text-muted'}`}>{submission.solved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}{submission.solved ? 'Problemă rezolvată' : 'Încă nerezolvată'}</span>}
            </div>
            {!showProblemTitle && <div className="mt-3"><SubmissionDetails submission={submission} /></div>}
          </div>

          {!canViewCode ? <LockedSolution problemId={submission.problem_id} /> : canLoadCode ? <button type="button" onClick={toggleSolution} disabled={loadingSolution} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50">{loadingSolution ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}{codePresentation === 'inline' && expanded ? 'Ascunde codul' : 'Vezi codul'}{codePresentation === 'inline' && (expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}</button> : <span className="text-sm font-bold text-muted">Cod indisponibil</span>}
        </div>

        {showProblemTitle && <SubmissionDetails submission={submission} />}
      </div>

      {codePresentation === 'inline' && expanded && <div className="border-t border-border bg-background p-3 sm:p-4"><InlineCodeViewer solution={solution} solutionError={solutionError} /></div>}
    </article>
  );
}

export default function SubmittedSolutions({
  submissions,
  loading,
  error,
  hasMore,
  onLoadMore,
  onLoadSolution,
  title = 'Soluții trimise',
  description = 'Istoricul privat al soluțiilor trimise de tine.',
  showProblemTitle = true,
  codePresentation = 'inline',
  emptyTitle = 'Nu ai trimis încă nicio soluție.',
  emptyDescription = 'După prima trimitere, codul și rezultatul vor apărea aici.',
}) {
  const [modalSolution, setModalSolution] = useState(null);

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-border bg-ink">
        <div className="border-b border-border px-5 py-5 sm:px-6"><h2 className="flex items-center gap-2 text-xl font-bold text-text-main"><Code2 className="h-5 w-5 text-accent" />{title}</h2><p className="mt-1 text-sm text-muted">{description}</p></div>

        {loading && submissions.length === 0 ? <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div> : error && submissions.length === 0 ? <p className="p-5 text-sm text-hard">{error}</p> : submissions.length === 0 ? <div className="p-8 text-center sm:p-12"><Code2 className="mx-auto h-9 w-9 text-muted" /><h3 className="mt-4 text-xl font-bold text-text-main">{emptyTitle}</h3><p className="mt-2 text-sm text-muted">{emptyDescription}</p></div> : <>{error && <p className="border-b border-hard/20 bg-hard/10 px-5 py-3 text-sm text-hard">{error}</p>}<div>{submissions.map((submission, submissionIndex) => <SubmittedSolutionCard key={submission.submission_id} submission={submission} onLoadSolution={onLoadSolution} showProblemTitle={showProblemTitle} submissionIndex={submissionIndex} codePresentation={codePresentation} onOpenCodeModal={setModalSolution} />)}</div>{hasMore && <div className="border-t border-border p-4 text-center"><button type="button" onClick={onLoadMore} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Încarcă mai multe</button></div>}</>}
      </section>
      {codePresentation === 'modal' && <SubmissionCodeDialog solution={modalSolution} onClose={() => setModalSolution(null)} />}
    </>
  );
}
