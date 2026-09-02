import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { Loader2, GraduationCap, ChevronRight, BookOpen, Code2, Flame, Hash, ArrowRight } from "lucide-react";
import TopHeader from "../components/MainArea/TopHeader";

export default function Probleme() {
    const [clase, setClase] = useState([]);
    const [categorii, setCategorii] = useState([]);
    const [provocareZilnica, setProvocareZilnica] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Extragem Clasele (din tabelul 'grades')
                const cerereClase = supabase
                    .from('grades')
                    .select('*')
                    .order('level', { ascending: true });

                // 2. Extragem "Provocarea Zilei" 
                // Neavând o coloană specifică, luăm cea mai recent adăugată problemă
                const cerereProvocare = supabase
                    .from('problems')
                    .select('id, title, description, difficulty, xp_reward')
                    .order('created_at', { ascending: false }) 
                    .limit(1)
                    .maybeSingle();

                // 3. Extragem Categoriile Populare (din tabelul 'categories')
                const cerereCategorii = supabase
                    .from('categories')
                    .select('id, name, slug')
                    .limit(6);

                // Rulăm toate interogările simultan
                const [raspunsClase, raspunsProvocare, raspunsCategorii] = await Promise.all([
                    cerereClase,
                    cerereProvocare,
                    cerereCategorii
                ]);

                if (raspunsClase.error) throw raspunsClase.error;
                setClase(raspunsClase.data || []);

                if (raspunsProvocare.data) {
                    setProvocareZilnica(raspunsProvocare.data);
                }

                if (raspunsCategorii.data) {
                    setCategorii(raspunsCategorii.data);
                }

            } catch (error) {
                console.error("Eroare la extragerea datelor:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getDifficultyStyle = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'usor': return 'text-easy bg-easy/10';
            case 'mediu': return 'text-medium bg-medium/10';
            case 'greu': return 'text-hard bg-hard/10';
            default: return 'text-muted bg-background';
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            <TopHeader title="Probleme" />
            
            <div className="flex w-full flex-1 flex-col items-center overflow-y-auto p-4 sm:p-6">
                <div className="w-full max-w-7xl pb-10">
                    
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main sm:text-3xl">Alege nivelul tău</h2>
                        <p className="mt-2 text-base text-muted sm:text-lg">Selectează clasa pentru a accesa capitolele și problemele specifice.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">
                            
                            {/* --- GRID-UL CU CLASE --- */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
                                {clase?.map((clasa) => (
                                    <Link 
                                        to={`/probleme/clasa/${clasa.id}`} 
                                        key={clasa.id}
                                        className="group flex min-h-[190px] flex-col justify-between rounded-3xl border border-border bg-ink p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)] sm:min-h-[220px] sm:p-6"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center group-hover:text-accent group-hover:border-accent/50 transition-colors">
                                                <GraduationCap className="w-7 h-7" />
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-accent group-hover:border-accent group-hover:text-ink transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-2xl font-bold text-text-main group-hover:text-accent transition-colors">
                                                {clasa.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-3 text-sm text-muted">
                                                <BookOpen className="w-4 h-4" />
                                                <span>Vezi curicula completă</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* --- BANNER TOATE PROBLEMELE --- */}
                            <Link 
                                to="/probleme/toate" 
                                className="group relative mt-2 flex flex-col items-start gap-5 overflow-hidden rounded-3xl border border-border bg-ink p-5 transition-all duration-300 hover:border-accent hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.15)] sm:flex-row sm:items-center sm:justify-between sm:p-6 md:p-8"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative z-10 flex min-w-0 items-start gap-4 sm:items-center sm:gap-6">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background transition-colors group-hover:border-accent/50 group-hover:text-accent sm:h-16 sm:w-16">
                                        <Code2 className="w-8 h-8" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold text-text-main transition-colors group-hover:text-accent sm:text-2xl">
                                            Explorează toate problemele
                                        </h3>
                                        <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
                                            Nu vrei să urmezi curicula? Caută probleme specifice sau filtrează arhiva completă după nivelul de dificultate și categorie.
                                        </p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-accent group-hover:border-accent group-hover:text-ink transition-all shrink-0 hidden md:flex relative z-10">
                                    <ChevronRight className="w-6 h-6" />
                                </div>
                            </Link>
                            
                            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
                                
                                {/* --- CONCEPTE POPULARE (Folosind tabelul categories) --- */}
                                <div className="xl:col-span-2 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Hash className="w-5 h-5 text-accent" />
                                        <h3 className="text-xl font-bold text-text-main">Explorează după concept</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {categorii.map((cat) => (
                                            <Link 
                                                key={cat.id}
                                                to={`/probleme/toate?categorie=${cat.slug}`}
                                                className="bg-ink border border-border hover:border-accent hover:text-accent text-muted px-5 py-3 rounded-xl text-sm font-medium transition-colors"
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                        {categorii.length === 0 && (
                                            <p className="text-sm text-muted">Nu există categorii momentan.</p>
                                        )}
                                    </div>
                                </div>

                                {/* --- PROBLEMA ZILEI (Cea mai nouă problemă) --- */}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Flame className="w-5 h-5 text-orange-500" />
                                        <h3 className="text-xl font-bold text-text-main">Problemă Nouă</h3>
                                    </div>
                                    
                                    {provocareZilnica ? (
                                        <div className="bg-ink border border-orange-500/30 p-6 rounded-3xl relative overflow-hidden group hover:border-orange-500/60 transition-colors flex-1 flex flex-col">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                                            
                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${getDifficultyStyle(provocareZilnica.difficulty)}`}>
                                                        {provocareZilnica.difficulty || 'Mixt'}
                                                    </span>
                                                    <span className="text-sm font-bold text-muted">{provocareZilnica.xp_reward || 0} XP</span>
                                                </div>
                                                <h4 className="text-lg font-bold text-text-main mb-2 line-clamp-1">
                                                    {provocareZilnica.title}
                                                </h4>
                                                <p className="text-sm text-muted mb-6 line-clamp-2 flex-1">
                                                    {provocareZilnica.description}
                                                </p>
                                                <Link 
                                                    to={`/rezolvare/${provocareZilnica.id}`} 
                                                    className="flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors mt-auto"
                                                >
                                                    Rezolvă acum <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-ink border border-border p-6 rounded-3xl flex-1 flex flex-col items-center justify-center text-center">
                                            <p className="text-muted text-sm">Nicio problemă disponibilă momentan.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
