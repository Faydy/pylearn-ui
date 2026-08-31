import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Loader2, Code2, ChevronRight, Star, ArrowLeft, Search, Layers } from "lucide-react";
import TopHeader from "../components/MainArea/TopHeader";

export default function ProblemeSectiune() {
    const { gradeId, sectionName } = useParams();
    const numeSectiuneReal = decodeURIComponent(sectionName); // Decodăm URL-ul înapoi în text normal
    
    const [probleme, setProbleme] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProblemeDinSectiune = async () => {
            try {
                // Magia Supabase (Inner Join): Aducem doar problemele legate de capitolele care
                // au grade_id-ul și section-ul specifice URL-ului nostru!
                const { data, error } = await supabase
                    .from('problems')
                    .select(`
                        *,
                        chapters!inner(grade_id, section)
                    `)
                    .eq('chapters.grade_id', gradeId)
                    .eq('chapters.section', numeSectiuneReal)
                    .order('id', { ascending: true });
                
                if (error) throw error;
                setProbleme(data);
            } catch (error) {
                console.error("Eroare la extragerea datelor:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProblemeDinSectiune();
    }, [gradeId, numeSectiuneReal]);

    const getDifficultyStyle = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'usor': return 'bg-easy/10 text-easy border-easy/20';
            case 'mediu': return 'bg-medium/10 text-medium border-medium/20';
            case 'greu': return 'bg-hard/10 text-hard border-hard/20';
            default: return 'bg-background text-muted border-border';
        }
    };

    const filteredProbleme = probleme.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <TopHeader title={numeSectiuneReal} />
            
            <div className="p-6 pb-10 overflow-y-auto flex-1">
                <div className="mb-8">
                    {/* Butonul de back ne duce fix înapoi la clasa de unde am venit */}
                    <Link to={`/probleme/clasa/${gradeId}`} className="inline-flex items-center gap-2 text-muted hover:text-text-main transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la capitole
                    </Link>
                    <h2 className="text-3xl font-bold text-text-main flex items-center gap-3">
                        <Layers className="w-8 h-8 text-accent" />
                        {numeSectiuneReal}
                    </h2>
                    <p className="text-muted mt-2">Toate problemele din această secțiune, gata de rezolvat.</p>
                </div>

                <div className="relative mb-6 max-w-xl">
                    <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="Filtrează în această secțiune..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-ink border border-border text-text-main rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredProbleme.length === 0 ? (
                            <div className="text-center py-10 bg-ink border border-border rounded-2xl">
                                <p className="text-muted">Nu am găsit probleme care să corespundă căutării.</p>
                            </div>
                        ) : (
                            filteredProbleme.map(problema => (
                                <Link 
                                    to={`/rezolvare/${problema.id}`} 
                                    key={problema.id}
                                    className="group bg-ink border border-border p-5 rounded-2xl flex flex-col gap-3 hover:border-accent hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between w-full">
                                        <div className="flex items-start gap-4">
                                            <div className="text-muted group-hover:text-accent transition-colors mt-1">
                                                <Code2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-text-main font-bold group-hover:text-accent transition-colors text-lg">
                                                    {problema.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2.5 py-0.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider ${getDifficultyStyle(problema.difficulty)}`}>
                                                        {problema.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5 shrink-0">
                                            <div className="flex items-center gap-1 text-sm font-bold text-easy bg-easy/10 px-3 py-1.5 rounded-xl border border-easy/20">
                                                <Star className="w-4 h-4 fill-easy" />
                                                {problema.xp_reward} XP
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors hidden sm:block" />
                                        </div>
                                    </div>

                                    {problema.description && (
                                        <div className="pl-9">
                                            <p className="text-sm text-muted line-clamp-2">
                                                {problema.description}
                                            </p>
                                        </div>
                                    )}
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}