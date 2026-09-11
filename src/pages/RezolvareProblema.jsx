import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Editor from '@monaco-editor/react';
import {
    Loader2, Star, ChevronRight, Share2, Clock,
    FileText, SlidersHorizontal, Lightbulb, Play, Send,
    RotateCcw, Terminal, AlertTriangle, CheckCircle2, Coins, LockKeyhole, Code2
} from 'lucide-react';
import TopHeader from "../components/MainArea/TopHeader";
import SubmittedSolutions from '../components/profile/SubmittedSolutions';
import { getApiEndpoint, getApiErrorMessage, parseApiJson, runCode } from '../utils/api';
import { pythonEditorOptions } from '../utils/pythonEditorOptions';
import { registerPythonCompletionProvider } from '../utils/pythonCompletions';
import { useAuth } from '../AuthContext';

const PROBLEM_SUBMISSIONS_PAGE_SIZE = 20;
const AUTOCOMPLETE_STORAGE_KEY = 'pylearn-editor-autocomplete';

export default function RezolvareProblema() {
    const { id } = useParams();
    const { refreshAuth } = useAuth();
    const [problema, setProblema] = useState(null);
    const [loading, setLoading] = useState(true);

    const [code, setCode] = useState('');
    const editorRef = useRef(null);
    const [autocompleteEnabled, setAutocompleteEnabled] = useState(() => {
        try {
            return localStorage.getItem(AUTOCOMPLETE_STORAGE_KEY) !== 'false';
        } catch {
            return true;
        }
    });
    const [isSolved, setIsSolved] = useState(false);
    const [activeTab, setActiveTab] = useState('output');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [problemSubmissions, setProblemSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [submissionsError, setSubmissionsError] = useState('');
    const [hasMoreSubmissions, setHasMoreSubmissions] = useState(false);
    const [canViewSubmissions, setCanViewSubmissions] = useState(false);
    const [finalizedAssignment, setFinalizedAssignment] = useState(null);
    const [submissionLockError, setSubmissionLockError] = useState('');
    const isSubmissionLocked = Boolean(finalizedAssignment || submissionLockError);

    useEffect(() => {
        try {
            localStorage.setItem(AUTOCOMPLETE_STORAGE_KEY, String(autocompleteEnabled));
        } catch {
            // Keep the toggle usable when browser storage is unavailable.
        }
    }, [autocompleteEnabled]);

    const handleToggleAutocomplete = () => {
        if (autocompleteEnabled) {
            editorRef.current?.trigger('autocomplete-toggle', 'hideSuggestWidget', {});
            editorRef.current?.trigger('autocomplete-toggle', 'closeParameterHints', {});
        }
        setAutocompleteEnabled((enabled) => !enabled);
    };

    const handleEditorMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        const completionProvider = registerPythonCompletionProvider(monaco);
        // onMount runs once per editor, not on re-renders or problem-id changes.
        // Tie the registration to Monaco's lifetime, including React unmounts.
        editor.onDidDispose(() => completionProvider.dispose());
    }, []);

    const loadProblemSubmissions = useCallback(async ({ offset = 0, append = false } = {}) => {
        const problemId = Number(id);
        if (!Number.isInteger(problemId)) return;

        setSubmissionsLoading(true);
        setSubmissionsError('');
        const { data, error } = await supabase.rpc('get_own_problem_submission_history', {
            p_problem_id: problemId,
            p_offset: offset,
            p_limit: PROBLEM_SUBMISSIONS_PAGE_SIZE + 1,
        });

        if (error) {
            setSubmissionsError('Trimiterile nu au putut fi încărcate.');
            setSubmissionsLoading(false);
            return;
        }

        const receivedSubmissions = data || [];
        const nextSubmissions = receivedSubmissions.slice(0, PROBLEM_SUBMISSIONS_PAGE_SIZE);
        setProblemSubmissions((current) => {
            if (!append) return nextSubmissions;
            const knownIds = new Set(current.map((submission) => submission.submission_id));
            return [...current, ...nextSubmissions.filter((submission) => !knownIds.has(submission.submission_id))];
        });
        setHasMoreSubmissions(receivedSubmissions.length > PROBLEM_SUBMISSIONS_PAGE_SIZE);
        setSubmissionsLoading(false);
    }, [id]);

    const loadSubmissionSolution = async (submissionId) => {
        const { data, error } = await supabase.rpc('get_own_submission', {
            p_submission_id: submissionId,
        });

        if (error) throw error;
        if (!data?.[0]) throw new Error('Soluția nu a fost găsită.');
        return data[0];
    };

    useEffect(() => {
        const fetchProblemaSiStatus = async () => {
            try {
                setIsSolved(false);
                setProblemSubmissions([]);
                setSubmissionsError('');
                setHasMoreSubmissions(false);
                setFinalizedAssignment(null);
                setSubmissionLockError('');
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id;
                setCanViewSubmissions(Boolean(userId));

                const { data: problemData, error: problemError } = await supabase
                    .from('problems')
                    .select(`
                        *,
                        chapters ( title, section, grade_id )
                    `)
                    .eq('id', id)
                    .single();

                if (problemError) throw problemError;

                // The public client can obtain sample cases only through the scoped RPC.
                const { data: sampleTests, error: sampleError } = await supabase
                    .rpc('get_sample_test_cases', { p_problem_id: Number(id) });

                if (sampleError) throw sampleError;

                setProblema({ ...problemData, test_cases: sampleTests || [] });

                const codDeStart = problemData.starting_code || '# Scrie rezolvarea ta aici\n\n';
                const draftSalvat = localStorage.getItem(`draft-${id}`);
                setCode(draftSalvat || codDeStart);

                if (userId) {
                    const { data: finalizedAssignments, error: finalizedAssignmentError } = await supabase
                        .rpc('get_finalized_assignment_for_problem', { p_problem_id: Number(id) });

                    if (finalizedAssignmentError) {
                        console.error('Eroare la verificarea finalizării temei:', finalizedAssignmentError.message);
                        setSubmissionLockError('Nu am putut verifica dacă trimiterea este permisă pentru această problemă.');
                    } else {
                        setFinalizedAssignment(finalizedAssignments?.[0] || null);
                    }

                    const { data: problemStatus, error: statusError } = await supabase
                        .from('user_problem_status')
                        .select('solved')
                        .eq('problem_id', id)
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (!statusError && problemStatus?.solved) {
                        setIsSolved(true);
                    }

                    await loadProblemSubmissions();
                }

            } catch (error) {
                console.error("Eroare la aducerea datelor:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProblemaSiStatus();
    }, [id, loadProblemSubmissions]);

    // Salvare automată în localStorage, cu debounce
    useEffect(() => {
        if (!code || loading) return;

        const timeoutId = setTimeout(() => {
            localStorage.setItem(`draft-${id}`, code);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [code, id, loading]);

    const getDifficultyStyle = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'usor': return 'text-easy border-easy/50';
            case 'mediu': return 'text-medium border-medium/50';
            case 'greu': return 'text-hard border-hard/50';
            default: return 'text-muted border-border';
        }
    };

    const handleResetCode = () => {
        const codDeStart = problema?.starting_code || '# Scrie rezolvarea ta aici\n\n';
        setCode(codDeStart);
        localStorage.removeItem(`draft-${id}`);
    };

    const handleRun = async () => {
    setIsRunning(true);
    setActiveTab('output');
    setOutput('');
    setHasError(false);

    try {
        const sampleInput =
            problema.test_cases?.[0]?.input?.replace(/\\n/g, '\n') || '';
        const result = await runCode(code, sampleInput);
        setOutput(result.output || '(fără output)');
        setHasError(!result.success);
        if (!result.success) setActiveTab('erori');

    } catch (err) {
        setOutput(
            `Eroare de conexiune la server: ${err.message}`
        );

        setHasError(true);
        setActiveTab('erori');

    } finally {
        setIsRunning(false);
    }
};

    const handleSubmit = async () => {
    if (finalizedAssignment) {
        setActiveTab('rezultate');
        setSubmitResult({
            status: 'error',
            error: `Tema „${finalizedAssignment.assignment_title}” este finalizată. Nu mai poți trimite soluții pentru problemele ei.`,
        });
        return;
    }

    if (submissionLockError) {
        setActiveTab('rezultate');
        setSubmitResult({ status: 'error', error: submissionLockError });
        return;
    }

    setIsSubmitting(true);
    setActiveTab('rezultate');
    setSubmitResult(null);

    try {
        const {
            data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
            setSubmitResult({
                status: 'error',
                error: 'Trebuie să fii autentificat pentru a trimite soluția.'
            });

            return;
        }

        const submitEndpoint = getApiEndpoint('/submit');
        const response = await fetch(
            submitEndpoint,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',

                    Authorization:
                        `Bearer ${session.access_token}`,
                },

                body: JSON.stringify({
                    code,
                    problemId: id,
                }),
            }
        );

        const data = await parseApiJson(response);

        if (!response.ok) {
            setSubmitResult({
                status: 'error',
                error: getApiErrorMessage(
                    response,
                    data,
                    'Eroare necunoscută la trimitere.',
                ),
            });

            return;
        }

        setSubmitResult(data);

        setCanViewSubmissions(true);
        await loadProblemSubmissions();

        if (data.status === 'accepted') {
            setIsSolved(true);
            if (data.firstSolve) {
                try {
                    await refreshAuth();
                } catch (refreshError) {
                    console.error('Profilul nu a putut fi reîmprospătat după submit:', refreshError.message);
                }
            }
        }

    } catch (err) {
        setSubmitResult({
            status: 'error',
            error:
                `Eroare de conexiune: ${err.message}`
        });

    } finally {
        setIsSubmitting(false);
    }
};

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <TopHeader title="Se încarcă..." />
                <div className="flex justify-center items-center py-20 flex-1">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
            </div>
        );
    }

    if (!problema) {
        return (
            <div className="flex-1 p-4 text-center sm:p-6">
                <h2 className="text-2xl text-hard font-bold">Problema nu a fost găsită!</h2>
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-col bg-background">

            <div className="flex flex-1 flex-col p-4 sm:p-6">

                {/* === HEADER-UL PROBLEMEI === */}
                <div className="mb-6 shrink-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <Link to="/probleme" className="hover:text-accent transition-colors">Probleme</Link>
                        <ChevronRight className="w-4 h-4" />
                        
                        {/* AICI E REZOLVAREA: Transformăm textul într-un Link funcțional */}
                        {problema.chapters?.section && problema.chapters?.grade_id ? (
                            <Link 
                                to={`/probleme/clasa/${problema.chapters.grade_id}/sectiune/${encodeURIComponent(problema.chapters.section)}`}
                                className="hover:text-accent transition-colors"
                            >
                                {problema.chapters.section}
                            </Link>
                        ) : (
                            <span className="hover:text-accent transition-colors cursor-pointer">
                                {problema.chapters?.section || 'Secțiune'}
                            </span>
                        )}
                        
                        <ChevronRight className="w-4 h-4" />
                        <span className="min-w-0 truncate text-text-main">{problema.title}</span>
                    </div>

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <h1 className="min-w-0 text-2xl font-bold text-text-main sm:text-3xl">{problema.title}</h1>
                                <span className={`px-2.5 py-0.5 border rounded-full text-xs font-bold uppercase tracking-wider ${getDifficultyStyle(problema.difficulty)}`}>
                                    {problema.difficulty}
                                </span>
                                <span className="flex items-center gap-1 px-3 py-1 bg-easy/10 text-easy border border-easy/20 text-xs font-bold uppercase rounded-full">
                                    <Star className="w-3.5 h-3.5 fill-easy" />
                                    +{problema.xp_reward} XP
                                </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium sm:gap-6">
                                {isSolved ? (
                                    <div className="flex items-center gap-1.5 text-easy bg-easy/10 px-3 py-1 rounded-lg border border-easy/20">
                                        <CheckCircle2 className="w-4 h-4" /> Rezolvată
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-muted bg-ink px-3 py-1 rounded-lg border border-border">
                                        <Clock className="w-4 h-4" /> Nerezolvată
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                            <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-ink px-4 py-2 text-sm font-medium text-text-main transition-colors hover:border-accent">
                                <Star className="w-4 h-4" /> Favorite
                            </button>
                            <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-ink px-4 py-2 text-sm font-medium text-text-main transition-colors hover:border-accent">
                                <Share2 className="w-4 h-4" /> Distribuie
                            </button>
                        </div>
                    </div>
                </div>

                {finalizedAssignment && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-medium/20 bg-medium/10 p-4 text-text-main">
                        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-medium" />
                        <div><p className="font-bold">Tema „{finalizedAssignment.assignment_title}” este finalizată.</p><p className="mt-1 text-sm text-muted">Poți consulta enunțul și rula codul, dar nu mai poți trimite soluții pentru această problemă.</p></div>
                    </div>
                )}

                {submissionLockError && !finalizedAssignment && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-hard/20 bg-hard/10 p-4 text-hard">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                        <p className="text-sm font-bold">{submissionLockError}</p>
                    </div>
                )}

                {/* === LAYOUT BANC DE LUCRU === */}
                <div className="grid grid-cols-1 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-2 xl:gap-6">

                    {/* COLOANA STÂNGĂ (Enunț) */}
                    <div className="flex flex-col gap-4 pb-6 xl:min-h-0 xl:gap-6 xl:overflow-y-auto xl:pr-2 xl:pb-10">
                        <div className="rounded-2xl border border-border bg-ink p-4 sm:p-6">
                            <div className="flex items-center gap-2 text-text-main font-bold text-lg mb-4">
                                <FileText className="w-5 h-5 text-accent" /> Descriere
                            </div>
                            <p className="text-muted leading-relaxed whitespace-pre-wrap">
                                {problema.description}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-ink p-4 sm:p-6">
                            <div className="flex items-center gap-2 text-text-main font-bold text-lg mb-4">
                                <SlidersHorizontal className="w-5 h-5 text-medium" /> Constrângeri
                            </div>
                            <ul className="list-disc list-inside text-muted space-y-2 text-sm font-mono">
                                <li>Timp de execuție: {problema.time_limit_ms / 1000} secunde</li>
                                <li>Limită de memorie: {problema.memory_limit_mb} MB</li>
                            </ul>
                        </div>

                        {problema.test_cases && problema.test_cases.length > 0 && (
                            <div className="rounded-2xl border border-border bg-ink p-4 sm:p-6">
                                <div className="flex items-center gap-2 text-text-main font-bold text-lg mb-4">
                                    <Lightbulb className="w-5 h-5 text-easy" /> Exemplu
                                </div>

                                {problema.test_cases.map((test, index) => (
                                    <div key={index} className="mb-4 grid grid-cols-1 gap-4 last:mb-0 sm:grid-cols-2">
                                        <div className="bg-background border border-border rounded-xl p-4">
                                            <span className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2 block">Input</span>
                                            <pre className="text-text-main font-mono text-sm">{test.input.replace(/\\n/g, '\n')}</pre>
                                        </div>
                                        <div className="bg-background border border-border rounded-xl p-4">
                                            <span className="text-[10px] text-easy font-bold uppercase tracking-wider mb-2 block">Output</span>
                                            <pre className="text-easy font-mono text-sm">{test.expected_output.replace(/\\n/g, '\n')}</pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLOANA DREAPTĂ (Editor + Terminal) */}
                    <div className="@container/editor flex min-h-[42rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-[#1e1e1e] shadow-2xl xl:min-h-0">

                        {/* Toolbar Editor */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-[#2d2d2d] px-2 py-3 @[32rem]/editor:px-3 @[42rem]/editor:px-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="hidden shrink-0 gap-1.5 @[48rem]/editor:flex">
                                    <div className="w-3 h-3 rounded-full bg-hard"></div>
                                    <div className="w-3 h-3 rounded-full bg-medium"></div>
                                    <div className="w-3 h-3 rounded-full bg-easy"></div>
                                </div>
                                <div className="flex min-w-0 items-center gap-2 whitespace-nowrap rounded-lg border border-border/50 bg-[#1e1e1e] px-2 py-1 font-mono text-sm text-text-main @[34rem]/editor:px-3">
                                    <span className="hidden text-[#3b82f6] @[34rem]/editor:inline">Python</span>
                                    <span className="truncate" title="main.py">main.py</span>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1 @[32rem]/editor:gap-2">
                                <button
                                    type="button"
                                    onClick={handleToggleAutocomplete}
                                    aria-pressed={autocompleteEnabled}
                                    aria-label={autocompleteEnabled ? 'Dezactivează autocompletarea' : 'Activează autocompletarea'}
                                    title={autocompleteEnabled ? 'Dezactivează autocompletarea' : 'Activează autocompletarea'}
                                    className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${autocompleteEnabled ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20' : 'border-border text-muted hover:text-text-main'}`}
                                >
                                    <Code2 className="h-4 w-4" aria-hidden="true" />
                                    <span className="hidden @[42rem]/editor:inline">Autocompletare:</span>
                                    <span>Autocompletare</span>
                                </button>
                                <button
                                    onClick={handleResetCode}
                                    className="shrink-0 p-1.5 text-muted transition-colors hover:text-text-main"
                                    title="Resetează codul la varianta inițială"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleRun}
                                    disabled={isRunning}
                                    aria-label={isRunning ? 'Rulează...' : 'Rulează'}
                                    title={isRunning ? 'Rulează...' : 'Rulează codul'}
                                    className="flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-ink px-2 text-sm font-bold text-text-main transition-colors hover:border-text-main disabled:cursor-not-allowed disabled:opacity-50 @[32rem]/editor:px-3"
                                >
                                    {isRunning ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                    <span className="hidden @[32rem]/editor:inline">{isRunning ? 'Rulează...' : 'Rulează'}</span>
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isSubmissionLocked}
                                    aria-label={isSubmitting ? 'Se verifică...' : isSubmissionLocked ? 'Finalizată' : 'Trimite'}
                                    title={finalizedAssignment ? 'Tema este finalizată' : isSubmitting ? 'Se verifică...' : 'Trimite soluția'}
                                    className="flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-accent px-2 text-sm font-bold text-ink shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 @[32rem]/editor:px-3"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSubmissionLocked ? <LockKeyhole className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                    <span className="hidden @[32rem]/editor:inline">{isSubmitting ? 'Se verifică...' : isSubmissionLocked ? 'Finalizată' : 'Trimite'}</span>
                                </button>
                            </div>
                        </div>

                        {/* ZONA MONACO EDITOR */}
                        <div className="relative h-[min(60dvh,34rem)] flex-none overflow-hidden xl:h-auto xl:flex-1">
                            <Editor
                                height="100%"
                                defaultLanguage="python"
                                theme="vs-dark"
                                value={code}
                                onChange={(value) => setCode(value)}
                                onMount={handleEditorMount}
                                options={{
                                    ...pythonEditorOptions,
                                    // OFF stops automatic completion; Ctrl+Space can still
                                    // request completions from available language providers.
                                    quickSuggestions: autocompleteEnabled
                                        ? { other: true, comments: false, strings: true }
                                        : false,
                                    suggestOnTriggerCharacters: autocompleteEnabled,
                                    wordBasedSuggestions: autocompleteEnabled ? 'currentDocument' : 'off',
                                    parameterHints: { enabled: autocompleteEnabled },
                                    tabCompletion: autocompleteEnabled ? 'on' : 'off',
                                    suggest: { showWords: autocompleteEnabled },
                                    // Preserve Monaco's native inline support; no inline provider is added.
                                    inlineSuggest: { enabled: autocompleteEnabled },
                                }}
                            />
                        </div>

                        {/* TERMINAL / OUTPUT */}
                        <div className="flex h-56 shrink-0 flex-col border-t border-border/50 bg-[#1e1e1e] sm:h-48">
                            <div className="flex items-center gap-4 overflow-x-auto border-b border-border/50 px-4 pt-2 sm:gap-6 sm:px-6">
                                <button
                                    onClick={() => setActiveTab('output')}
                                    className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'output' ? 'border-accent text-text-main' : 'border-transparent text-muted hover:text-text-main'}`}
                                >
                                    <Terminal className="w-4 h-4" /> Output
                                </button>
                                <button
                                    onClick={() => setActiveTab('erori')}
                                    className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'erori' ? 'border-hard text-hard' : 'border-transparent text-muted hover:text-hard'}`}
                                >
                                    <AlertTriangle className="w-4 h-4" /> Erori
                                </button>
                                <button
                                    onClick={() => setActiveTab('rezultate')}
                                    className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rezultate' ? 'border-easy text-easy' : 'border-transparent text-muted hover:text-easy'}`}
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Rezultate
                                </button>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-muted">
                                {activeTab === 'output' && (
                                    output ? (
                                        <pre className={hasError ? 'text-hard/90 whitespace-pre-wrap' : 'text-text-main whitespace-pre-wrap'}>
                                            {output}
                                        </pre>
                                    ) : (
                                        <p>Apasă „Rulează" pentru a vedea rezultatul execuției.</p>
                                    )
                                )}
                                {activeTab === 'erori' && (
                                    hasError ? (
                                        <pre className="text-hard/90 whitespace-pre-wrap">{output}</pre>
                                    ) : (
                                        <p className="text-hard/70">Aici vor apărea erorile de sintaxă sau de execuție.</p>
                                    )
                                )}
                                {activeTab === 'rezultate' && (
                                    isSubmitting ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
                                            <Loader2 className="w-6 h-6 animate-spin text-accent" />
                                            <p className="text-sm">Se verifică soluția...</p>
                                        </div>
                                    ) : submitResult ? (
                                        submitResult.status === 'error' ? (
                                            <p className="text-hard/90">{submitResult.error}</p>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className={`font-bold ${submitResult.status === 'accepted' ? 'text-easy' : 'text-hard'}`}>
                                                    {submitResult.status === 'accepted' ? '✓ Acceptat' : `✗ ${submitResult.status}`}
                                                    {' — '}{submitResult.passedTests}/{submitResult.totalTests} teste trecute
                                                </div>
                                                {submitResult.status === 'accepted' && submitResult.firstSolve && (
                                                    <div className="rounded-xl border border-easy/20 bg-easy/10 p-3 text-sm font-bold text-easy">
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            <span>Prima rezolvare: +{Number(submitResult.xpAwarded) || 0} XP</span>
                                                            {Number(submitResult.coinsAwarded) > 0 && <span className="inline-flex items-center gap-1"><Coins className="h-4 w-4" />+{submitResult.coinsAwarded} monede</span>}
                                                        </div>
                                                        {submitResult.leveledUp && <p className="mt-2">Ai ajuns la nivelul {submitResult.newLevel}. <Link to="/shop" className="underline decoration-accent underline-offset-2 hover:text-text-main">Vezi Shop-ul</Link></p>}
                                                    </div>
                                                )}
                                                {submitResult.testResults.map((t, i) => (
                                                    <div key={i} className={`flex items-center gap-2 text-xs ${t.passed ? 'text-easy' : 'text-hard'}`}>
                                                        {t.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                        Test {i + 1}: {t.passed ? 'corect' : 'greșit'}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        <p className="text-easy/70">Trimite soluția pentru a rula testele ascunse. Aici vei vedea scorul obținut.</p>
                                    )
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {canViewSubmissions && <div className="mt-6"><SubmittedSolutions submissions={problemSubmissions} loading={submissionsLoading} error={submissionsError} hasMore={hasMoreSubmissions} onLoadMore={() => loadProblemSubmissions({ offset: problemSubmissions.length, append: true })} onLoadSolution={loadSubmissionSolution} title="Trimiterile tale pentru această problemă" description="Deschide orice trimitere pentru a vedea codul exact trimis." showProblemTitle={false} /></div>}
            </div>
        </div>
    );
}
