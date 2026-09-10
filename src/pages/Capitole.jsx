import SolvedProblemBadge from '../components/problems/SolvedProblemBadge';
import { isProblemSolved } from '../utils/solvedProblems';
import { useParams, Link } from "react-router-dom";
import { BookOpen, Code2, Star, ChevronRight, ArrowLeft } from "lucide-react";
import TopHeader from "../components/MainArea/TopHeader";
import ProblemFilters from '../components/problems/ProblemFilters';
import ProblemResults from '../components/problems/ProblemResults';
import useProblemBrowser from '../hooks/useProblemBrowser';
import { sectionValue } from '../utils/problemFilters';

export default function Capitole() {
    const { gradeId } = useParams();
    const browser = useProblemBrowser({ gradeId, grouped: true });
    const clasa = browser.metadata?.grades.find((grade) => String(grade.id) === gradeId);
    const problemsByChapter = new Map();
    for (const problem of browser.problems) {
        const key = String(problem.chapter_id);
        if (!problemsByChapter.has(key)) problemsByChapter.set(key, []);
        problemsByChapter.get(key).push(problem);
    }
    const sectiuni = [];
    for (const chapter of browser.chapters) {
        const problems = problemsByChapter.get(String(chapter.id)) || [];
        // Empty chapters stay visible in the original unfiltered curriculum.
        if (!problems.length && (browser.activeCount > 0 || browser.total > 30)) continue;
        const name = sectionValue(chapter);
        let group = sectiuni.find((item) => item.sectiune === name);
        if (!group) { group = { sectiune: name, capitole: [] }; sectiuni.push(group); }
        group.capitole.push({ ...chapter, problems });
    }

    const getDifficultyStyle = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'usor': return 'text-easy bg-easy/10 border-easy/20';
            case 'mediu': return 'text-medium bg-medium/10 border-medium/20';
            case 'greu': return 'text-hard bg-hard/10 border-hard/20';
            default: return 'text-muted bg-background border-border';
        }
    };

    return (
        // Containerul principal nu are padding, ca să lase TopHeader-ul să se întindă la maxim
        <div className="flex flex-col h-full">
            
            <TopHeader title={clasa?.name || "Capitole"} />
            
            {/* Tot conținutul de sub header este învelit în acest div care are padding-ul (p-6) */}
            <div className="flex-1 overflow-y-auto p-4 pb-10 sm:p-6">
                <div className="mb-8">
                    <Link to="/probleme" className="inline-flex items-center gap-2 text-muted hover:text-text-main transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la clase
                    </Link>
                    <h2 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-text-main sm:text-3xl">
                        <BookOpen className="w-8 h-8 text-accent" />
                        Curiculă {clasa?.name}
                    </h2>
                </div>

                <ProblemFilters browser={browser} placeholder="Filtrează problemele din această clasă..." grouped />
                <ProblemResults browser={browser}>
                {/* Lista de Secțiuni (Cutii Mari) */}
                <div className="flex flex-col gap-8">
                    {sectiuni.length === 0 ? (
                        <div className="text-center py-10 bg-ink border border-border rounded-2xl">
                            <p className="text-muted">Nu există capitole adăugate încă.</p>
                        </div>
                    ) : (
                        sectiuni.map((grup, grupIndex) => (
                            <div key={grupIndex} className="bg-ink border border-border rounded-2xl overflow-hidden shadow-lg">
                                
                                {/* Header-ul Albastru - Acum este un link interactiv! */}
                            <Link 
                                to={`/probleme/clasa/${gradeId}/sectiune/${encodeURIComponent(grup.sectiune)}`}
                                className="group flex flex-col gap-2 border-b border-accent/30 bg-accent/20 px-4 py-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                            >
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-accent group-hover:text-text-main transition-colors">
                                        {grup.sectiune}
                                    </h3>
                                    {/* O mică săgeată care apare la hover ca să indice că poți da click */}
                                    <ChevronRight className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-accent/80 text-sm font-bold">
                                    {grup.capitole.length} capitole
                                </span>
                            </Link>

                                {/* Lista de Capitole */}
                                <div className="p-4 flex flex-col gap-4">
                                    {grup.capitole.map((capitol) => (
                                        <div key={capitol.id} className="bg-background border border-border rounded-xl p-4">
                                            
                                            <h4 className="text-lg font-bold text-text-main mb-3 border-b border-border pb-2">
                                                <Link to={`/probleme/capitol/${capitol.id}`} className="hover:text-accent hover:underline">{capitol.title}</Link>
                                            </h4>

                                            {/* Problemele */}
                                            <div className="grid grid-cols-1 gap-2">
                                                {capitol.problems && capitol.problems.length > 0 ? (
                                                    capitol.problems.map((problema) => (
                                                        <Link 
                                                            to={`/rezolvare/${problema.id}`} 
                                                            key={problema.id}
                                                        className={`group flex min-w-0 flex-col gap-3 rounded-lg border ${isProblemSolved(problema) ? 'border-easy/40' : 'border-transparent'} p-3 transition-colors hover:border-border hover:bg-sidebar-hover sm:flex-row sm:items-center sm:justify-between`}
                                                        >
                                                            <div className="flex min-w-0 flex-wrap items-center gap-3">
                                                                <Code2 className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                                                                <span className="min-w-0 break-words text-sm font-medium text-text-main transition-colors group-hover:text-accent">
                                                                    {problema.title}
                                                                </span>
                                                                <SolvedProblemBadge isSolved={isProblemSolved(problema)} />
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getDifficultyStyle(problema.difficulty)}`}>
                                                                    {problema.difficulty}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1 text-xs font-bold text-easy">
                                                                    <Star className="w-3 h-3 fill-easy" />
                                                                    {problema.xp_reward} XP
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                                                            </div>
                                                        </Link>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-muted italic px-3 py-1">Nicio problemă adăugată.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </ProblemResults>
            </div>
        </div>
    );
}
