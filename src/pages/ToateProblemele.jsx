import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom"; // <-- Am adăugat useSearchParams
import { supabase } from "../supabaseClient";
import { Loader2, Code2, ChevronRight, Star, ArrowLeft, Search, Hash } from "lucide-react"; // <-- Am adăugat Hash
import TopHeader from "../components/MainArea/TopHeader";
import { normalizeSearchText } from "../utils/search";

export default function ToateProblemele() {
    // 1. Extragem parametrul 'categorie' din adresa URL
    const [searchParams] = useSearchParams();
    const categorieSlug = searchParams.get('categorie');

    const [probleme, setProbleme] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProbleme = async () => {
            setLoading(true);
            try {
                // 1. Definim clauza SELECT în funcție de existența parametrului
                const selectQuery = categorieSlug 
                    ? '*, categories!inner(id, name, slug)' 
                    : '*, categories(id, name, slug)';

                // 2. Inițiem interogarea corect
                let query = supabase
                    .from('problems')
                    .select(selectQuery);

                // 3. Adăugăm filtrul doar dacă s-a dat click pe o categorie
                if (categorieSlug) {
                    query = query.eq('categories.slug', categorieSlug);
                }
                
                // 4. Abia la final adăugăm ordonarea
                query = query.order('id', { ascending: true });
                
                const { data, error } = await query;
                
                if (error) throw error;
                
                // Dacă totul merge bine, setăm datele
                setProbleme(data || []);
            } catch (error) {
                console.error("Eroare la extragerea datelor:", error.message);
                // În caz de eroare, setăm un array gol ca să nu crape aplicația
                setProbleme([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProbleme();
    }, [categorieSlug]);

    const getDifficultyStyle = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'usor': return 'bg-easy/10 text-easy border-easy/20';
            case 'mediu': return 'bg-medium/10 text-medium border-medium/20';
            case 'greu': return 'bg-hard/10 text-hard border-hard/20';
            default: return 'bg-background text-muted border-border';
        }
    };

    const normalizedSearchQuery = normalizeSearchText(searchQuery);
    const filteredProbleme = probleme.filter(p =>
        normalizeSearchText(p.title).includes(normalizedSearchQuery)
    );

    // Titlu și mesaj dinamic pentru antet
    const numeCategorieActive = probleme.length > 0 && categorieSlug ? probleme[0].categories.name : categorieSlug;

    return (
        <div className="flex flex-col h-full">
            <TopHeader title={categorieSlug ? "Probleme filtrate" : "Toate problemele"} />
            
            <div className="p-6 pb-10 overflow-y-auto flex-1">
                <div className="mb-8">
                    <Link to="/probleme" className="inline-flex items-center gap-2 text-muted hover:text-text-main transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la clase
                    </Link>
                    
                    <h2 className="text-3xl font-bold text-text-main flex items-center gap-3 capitalize">
                        {categorieSlug ? <Hash className="w-8 h-8 text-accent" /> : <Code2 className="w-8 h-8 text-accent" />}
                        {categorieSlug ? numeCategorieActive : "Toate Problemele"}
                    </h2>
                    
                    <p className="text-muted mt-2">
                        {categorieSlug 
                            ? "Aici găsești toate problemele asociate acestui concept." 
                            : "Caută, filtrează și rezolvă orice problemă de pe platformă."}
                    </p>
                </div>

                {/* Bara de Căutare */}
                <div className="relative mb-6 max-w-xl">
                    <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder={categorieSlug ? `Caută în ${numeCategorieActive}...` : "Caută o problemă după titlu..."}
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
                                <p className="text-muted">Nu am găsit nicio problemă care să corespundă căutării.</p>
                                {categorieSlug && (
                                    <Link to="/probleme/toate" className="text-accent hover:underline mt-2 inline-block">
                                        Vezi toată arhiva
                                    </Link>
                                )}
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
                                                    {/* Afișăm categoria pe card, dacă există */}
                                                    {problema.categories && (
                                                        <span className="px-2.5 py-0.5 border border-border bg-background rounded-lg text-[10px] font-bold text-muted uppercase tracking-wider">
                                                            {problema.categories.name}
                                                        </span>
                                                    )}
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
