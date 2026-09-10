import { Code, Loader2 } from "lucide-react";
import useProblemRecommendations from '../../../hooks/useProblemRecommendations';
import { Link } from "react-router-dom"; 

export default function ProblemaComponent(){
  const { problems, loading: isLoading, error, isGuest } = useProblemRecommendations(1);
  const sugestie = problems[0];
  const isLoggedIn = !isGuest;

  const getDifficultyStyle = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'usor': return 'text-easy bg-easy/10';
      case 'mediu': return 'text-medium bg-medium/10';
      case 'greu': return 'text-hard bg-hard/10';
      default: return 'text-muted bg-background';
    }
  };

  // 1. Cât timp încarcă
  if (isLoading) {
    return (
      <div className="bg-ink border border-border p-6 rounded-2xl flex items-center justify-center h-full min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  // 2. PROTECȚIE NOUĂ: Dacă NU este logat
  if (!isLoggedIn) {
    return (
      <div className="bg-ink border border-border p-6 rounded-2xl flex flex-col justify-center h-full min-h-[200px]">
        <div className="flex items-center gap-2 text-muted font-bold mb-2">
          <Code className="w-5 h-5 text-accent" />
          <span className="text-sm uppercase tracking-wider">Sugestie pentru tine</span>
        </div>
        <p className="text-muted text-sm mt-2">
          Conectează-te pentru a primi sugestii de probleme personalizate în funcție de nivelul tău!
        </p>
      </div>
    );
  }

  if (error) return <p role="alert" className="rounded-2xl border border-border bg-ink p-6 text-sm text-muted">{error}</p>;

  // 3. Dacă a rezolvat TOT (și este logat, conform verificărilor de sus)
  if (!sugestie) {
    return (
      <div className="bg-ink border border-border p-6 rounded-2xl flex flex-col justify-center h-full min-h-[200px]">
        <div className="flex items-center gap-2 text-muted font-bold mb-2">
          <Code className="w-5 h-5 text-easy" />
          <span className="text-sm uppercase tracking-wider">Sugestie pentru tine</span>
        </div>
        <p className="text-muted text-sm mt-2">Ai rezolvat toate problemele din clasa ta! Ești un expert.</p>
      </div>
    );
  }

  // 4. Randarea sugestiei (când o găsește)
  return (
    <div className="bg-ink border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-muted transition-all h-full min-h-[200px]">
      <div>
        <div className="flex items-center gap-2 text-muted font-bold mb-2">
          <Code className="w-5 h-5 text-accent" />
          <span className="text-sm uppercase tracking-wider">Sugestie pentru tine</span>
        </div>
        <h3 className="text-xl font-bold text-text-main line-clamp-1">{sugestie.title}</h3>
        <p className="text-muted text-sm mt-2 line-clamp-2">
          {sugestie.description || "Încearcă să rezolvi această problemă pentru a-ți exersa logica și algoritmica."}
        </p>
      </div>
      
      <div className="flex justify-between items-end mt-6">
        <div className="flex gap-3 items-center">
          <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${getDifficultyStyle(sugestie.difficulty)}`}>
            {sugestie.difficulty}
          </span>
          <span className="text-sm font-bold text-muted">{sugestie.xp_reward} pct</span>
        </div>
        
        <Link 
          to={`/rezolvare/${sugestie.id}`}
          className="bg-transparent border border-border text-text-main hover:bg-background-hover px-5 py-2 rounded-full text-sm font-bold transition-colors"
        >
          Încearcă
        </Link>
      </div>
    </div>
  );
}