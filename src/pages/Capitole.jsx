import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Loader2, BookOpen, Code2, Star, ChevronRight, ArrowLeft } from "lucide-react";
import TopHeader from "../components/MainArea/TopHeader";

export default function Capitole() {
    const { gradeId } = useParams();
    const [clasa, setClasa] = useState(null);
    const [sectiuni, setSectiuni] = useState([]); // Acum ținem datele grupate pe secțiuni
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDate = async () => {
            try {
                // 1. Luăm detaliile clasei
                const { data: gradeData, error: gradeError } = await supabase
                    .from('grades')
                    .select('name')
                    .eq('id', gradeId)
                    .single();
                
                if (gradeError) throw gradeError;
                setClasa(gradeData);

                // 2. Luăm capitolele (acum includem și coloana "section")
                const { data: chaptersData, error: chaptersError } = await supabase
                    .from('chapters')
                    .select(`
                        id, 
                        title, 
                        section,
                        order_index,
                        problems ( id, title, difficulty, xp_reward )
                    `)
                    .eq('grade_id', gradeId)
                    .order('order_index', { ascending: true });
                
                if (chaptersError) throw chaptersError;
                
                // 3. LOGICA DE GRUPARE: Transformăm lista într-o structură grupată pe "section"
                const grupate = [];
                
                chaptersData.forEach(chapter => {
                    // Sortăm problemele din capitolul curent
                    const sortedProblems = chapter.problems ? chapter.problems.sort((a, b) => a.id - b.id) : [];
                    const chapterComplet = { ...chapter, problems: sortedProblems };
                    
                    // Găsim secțiunea (sau o creăm dacă e prima dată când dăm de ea)
                    const numeSectiune = chapter.section || 'Altele';
                    let grup = grupate.find(g => g.sectiune === numeSectiune);
                    
                    if (!grup) {
                        grup = { sectiune: numeSectiune, capitole: [] };
                        grupate.push(grup);
                    }
                    
                    grup.capitole.push(chapterComplet);
                });

                setSectiuni(grupate);
            } catch (error) {
                console.error("Eroare la extragerea datelor:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDate();
    }, [gradeId]);

    const getDifficultyStyle = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'usor': return 'text-easy bg-easy/10 border-easy/20';
            case 'mediu': return 'text-medium bg-medium/10 border-medium/20';
            case 'greu': return 'text-hard bg-hard/10 border-hard/20';
            default: return 'text-muted bg-background border-border';
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

    return (
        // Containerul principal nu are padding, ca să lase TopHeader-ul să se întindă la maxim
        <div className="flex flex-col h-full">
            
            <TopHeader title={clasa?.name || "Capitole"} />
            
            {/* Tot conținutul de sub header este învelit în acest div care are padding-ul (p-6) */}
            <div className="p-6 pb-10 overflow-y-auto flex-1">
                <div className="mb-8">
                    <Link to="/probleme" className="inline-flex items-center gap-2 text-muted hover:text-text-main transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la clase
                    </Link>
                    <h2 className="text-3xl font-bold text-text-main flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-accent" />
                        Curiculă {clasa?.name}
                    </h2>
                </div>

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
                                className="bg-accent/20 hover:bg-accent/30 transition-colors border-b border-accent/30 px-6 py-4 flex items-center justify-between group"
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
                                                {capitol.title}
                                            </h4>

                                            {/* Problemele */}
                                            <div className="grid grid-cols-1 gap-2">
                                                {capitol.problems && capitol.problems.length > 0 ? (
                                                    capitol.problems.map((problema) => (
                                                        <Link 
                                                            to={`/rezolvare/${problema.id}`} 
                                                            key={problema.id}
                                                            className="group flex items-center justify-between p-3 rounded-lg hover:bg-sidebar-hover transition-colors border border-transparent hover:border-border"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Code2 className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                                                                <span className="font-medium text-text-main group-hover:text-accent transition-colors text-sm">
                                                                    {problema.title}
                                                                </span>
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
            </div>
        </div>
    );
}