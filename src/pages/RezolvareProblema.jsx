import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Editor from '@monaco-editor/react';
import {
    Loader2, Star, ChevronRight, Share2, Clock,
    FileText, SlidersHorizontal, Lightbulb, Play, Send,
    RotateCcw, Terminal, AlertTriangle, CheckCircle2
} from 'lucide-react';
import TopHeader from "../components/MainArea/TopHeader";
import SubmittedSolutions from '../components/profile/SubmittedSolutions';

const PROBLEM_SUBMISSIONS_PAGE_SIZE = 20;

export default function RezolvareProblema() {
    const { id } = useParams();
    const [problema, setProblema] = useState(null);
    const [loading, setLoading] = useState(true);

    const [code, setCode] = useState('');
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

                // Testele ascunse NU se mai cer deloc din frontend — filtrare pe server, nu în JS
                const { data: sampleTests, error: sampleError } = await supabase
                    .from('test_cases')
                    .select('input, expected_output, is_sample')
                    .eq('problem_id', id)
                    .eq('is_sample', true);

                if (sampleError) throw sampleError;

                setProblema({ ...problemData, test_cases: sampleTests || [] });

                const codDeStart = problemData.starting_code || '# Scrie rezolvarea ta aici\n\n';
                const draftSalvat = localStorage.getItem(`draft-${id}`);
                setCode(draftSalvat || codDeStart);

                if (userId) {
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

        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/run`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    input: sampleInput,
                }),
            }
        );

        const data = await response.json();

        if (data.success) {
            setOutput(data.output || '(fără output)');
            setHasError(false);
        } else {
            setOutput(
                data.output ||
                'Eroare necunoscută la execuție.'
            );

            setHasError(true);
            setActiveTab('erori');
        }

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

        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/submit`,
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

        const data = await response.json();

        if (!response.ok) {
            setSubmitResult({
                status: 'error',

                error:
                    data.error ||
                    data.output ||
                    'Eroare necunoscută'
            });

            return;
        }

        setSubmitResult(data);

        setCanViewSubmissions(true);
        await loadProblemSubmissions();

        if (data.status === 'accepted') {
            setIsSolved(true);
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
                    <div className="flex min-h-[42rem] flex-col overflow-hidden rounded-2xl border border-border bg-[#1e1e1e] shadow-2xl xl:min-h-0">

                        {/* Toolbar Editor */}
                        <div className="flex flex-col gap-3 border-b border-border/50 bg-[#2d2d2d] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <div className="hidden gap-1.5 sm:flex">
                                    <div className="w-3 h-3 rounded-full bg-hard"></div>
                                    <div className="w-3 h-3 rounded-full bg-medium"></div>
                                    <div className="w-3 h-3 rounded-full bg-easy"></div>
                                </div>
                                <div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-1 rounded-lg text-sm text-text-main font-mono border border-border/50">
                                    <span className="text-[#3b82f6]">Python</span> main.py
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <button
                                    onClick={handleResetCode}
                                    className="text-muted hover:text-text-main p-1.5 transition-colors"
                                    title="Resetează codul la varianta inițială"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleRun}
                                    disabled={isRunning}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-ink px-4 py-1.5 text-sm font-bold text-text-main transition-colors hover:border-text-main disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                                >
                                    {isRunning ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                    {isRunning ? 'Rulează...' : 'Rulează'}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-bold text-ink shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {isSubmitting ? 'Se verifică...' : 'Trimite'}
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
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 15,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                                    fontLigatures: true,
                                    scrollBeyondLastLine: false,
                                    roundedSelection: false,
                                    padding: { top: 16 },
                                    smoothScrolling: true,
                                    cursorBlinking: "smooth",
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
