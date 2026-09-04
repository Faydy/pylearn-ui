import Editor from '@monaco-editor/react';
import { CheckCircle2, ChevronDown, ChevronUp, Clock3, Code2, Cpu, Loader2, MemoryStick, Send, XCircle } from 'lucide-react';
import { useState } from 'react';
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

function getSubmissionStatus(status) {
  if (status === 'accepted') {
    return {
      label: 'Acceptată',
      classes: 'border-easy/30 bg-easy/10 text-easy',
      Icon: CheckCircle2,
    };
  }

  if (status === 'wrong_answer') {
    return {
      label: 'Răspuns greșit',
      classes: 'border-hard/30 bg-hard/10 text-hard',
      Icon: XCircle,
    };
  }

  return {
    label: 'Trimisă',
    classes: 'border-border bg-background text-muted',
    Icon: Send,
  };
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

function SubmittedSolutionCard({ submission, onLoadSolution, showProblemTitle, submissionIndex }) {
  const [expanded, setExpanded] = useState(false);
  const [solution, setSolution] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState('');
  const status = getSubmissionStatus(submission.submission_status);
  const StatusIcon = status.Icon;

  const toggleSolution = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (!solution && submission.source_code) {
      setSolution(submission);
    } else if (!solution) {
      setLoadingSolution(true);
      setSolutionError('');
      try {
        const nextSolution = await onLoadSolution(submission.submission_id);
        setSolution(nextSolution);
      } catch (error) {
        setSolutionError(error.message || 'Soluția nu a putut fi încărcată.');
      } finally {
        setLoadingSolution(false);
      }
    }

    setExpanded(true);
  };

  return (
    <article className="border-b border-border last:border-b-0">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-text-main">
              {showProblemTitle ? (
                <Link
                  to={`/rezolvare/${submission.problem_id}`}
                  className="transition-colors hover:text-accent"
                >
                  {submission.problem_title}
                </Link>
              ) : `Submission ${submission.submission_number || submissionIndex + 1}`}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {showProblemTitle && <>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getDifficultyClasses(submission.problem_difficulty)}`}>
                  {submission.problem_difficulty || 'Mixt'}
                </span>
                <span className="text-xs font-bold text-accent">+{submission.xp_reward || 0} XP</span>
              </>}
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${status.classes}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </span>
            </div>
            {!showProblemTitle && <div className="mt-3"><SubmissionDetails submission={submission} /></div>}
          </div>

          <button
            type="button"
            onClick={toggleSolution}
            disabled={loadingSolution || (!submission.submission_id && !submission.source_code)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingSolution ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
            {expanded ? 'Ascunde codul' : 'Vezi codul'}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showProblemTitle && <SubmissionDetails submission={submission} />}
      </div>

      {expanded && (
        <div className="border-t border-border bg-background p-3 sm:p-4">
          {solutionError ? (
            <p className="rounded-lg border border-hard/20 bg-hard/10 p-3 text-sm text-hard">{solutionError}</p>
          ) : !solution?.source_code ? (
            <p className="rounded-lg border border-border bg-ink p-3 text-sm text-muted">Codul sursă nu este disponibil pentru această trimitere.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-[#1e1e1e]">
              <div className="border-b border-border/60 bg-[#2d2d2d] px-4 py-2 text-xs font-bold text-muted">Soluție trimisă</div>
              <Editor
                height="18rem"
                defaultLanguage="python"
                theme="vs-dark"
                value={solution.source_code}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  scrollBeyondLastLine: false,
                  padding: { top: 14, bottom: 14 },
                }}
              />
            </div>
          )}
        </div>
      )}
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
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-ink">
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-text-main"><Code2 className="h-5 w-5 text-accent" />{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      {loading && submissions.length === 0 ? (
        <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div>
      ) : error && submissions.length === 0 ? (
        <p className="p-5 text-sm text-hard">{error}</p>
      ) : submissions.length === 0 ? (
        <div className="p-8 text-center sm:p-12">
          <Code2 className="mx-auto h-9 w-9 text-muted" />
          <h3 className="mt-4 text-xl font-bold text-text-main">Nu ai trimis încă nicio soluție.</h3>
          <p className="mt-2 text-sm text-muted">După prima trimitere, codul și rezultatul vor apărea aici.</p>
        </div>
      ) : (
        <>
          {error && <p className="border-b border-hard/20 bg-hard/10 px-5 py-3 text-sm text-hard">{error}</p>}
          <div>{submissions.map((submission, submissionIndex) => <SubmittedSolutionCard key={submission.submission_id} submission={submission} onLoadSolution={onLoadSolution} showProblemTitle={showProblemTitle} submissionIndex={submissionIndex} />)}</div>
          {hasMore && (
            <div className="border-t border-border p-4 text-center">
              <button type="button" onClick={onLoadMore} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:opacity-50">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Încarcă mai multe
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
