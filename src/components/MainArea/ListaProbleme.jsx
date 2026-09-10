import { Circle, ChevronRight, Loader2 } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import useProblemRecommendations from '../../hooks/useProblemRecommendations';

export default function ListaProbleme() {
  const { problems, loading: isLoading, error, isGuest } = useProblemRecommendations(5);

  // Funcție pentru culorile dificultății (adaptată pentru baza ta de date)
  const getDifficultyStyle = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'usor': return 'text-easy bg-easy/10 border-easy/20';
      case 'mediu': return 'text-medium bg-medium/10 border-medium/20';
      case 'greu': return 'text-hard bg-hard/10 border-hard/20';
      default: return 'text-muted bg-border';
    }
  };

  // State de încărcare
  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <h3 className="text-xl font-bold text-text-main">{isGuest ? 'Probleme de explorat' : 'Probleme Recomandate'}</h3>
            <p className="text-sm text-muted">{isGuest ? 'Începe să exersezi, fără să creezi un cont.' : 'Exersează conceptele învățate recent.'}</p>
          </div>
        </div>
        <div className="bg-ink border border-border rounded-2xl flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      
      {/* Header-ul Listei */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h3 className="text-xl font-bold text-text-main">{isGuest ? 'Probleme de explorat' : 'Probleme Recomandate'}</h3>
          <p className="text-sm text-muted">{isGuest ? 'Începe să exersezi, fără să creezi un cont.' : 'Exersează conceptele învățate recent.'}</p>
        </div>
      </div>

      {/* Containerul Listei */}
      <div className="bg-ink border border-border rounded-2xl overflow-hidden flex flex-col">
        {error ? <p role="alert" className="p-4 text-sm text-muted">{error}</p> : problems.length === 0 ? (
          <div className="p-8 text-center text-muted">
            {isGuest ? 'Nu există probleme disponibile momentan.' : 'Nu mai ai probleme nerezolvate la acest nivel. Ești un expert!'}
          </div>
        ) : (
          problems.map((problem, index) => (
            <Link 
              to={`/rezolvare/${problem.id}`}
              key={problem.id}
              className={`flex items-center justify-between p-4 transition-colors group cursor-pointer hover:bg-sidebar-hover
                ${index !== problems.length - 1 ? 'border-b border-border' : ''} 
              `}
            >
              
              {/* Partea Stângă: Status, Titlu, Categorie */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex-shrink-0">
                  <Circle className="w-5 h-5 text-muted group-hover:text-accent transition-colors" aria-hidden="true" />
                </div>
                
                <div className="flex min-w-0 flex-col">
                  <span className="break-words font-bold text-sm md:text-base text-text-main transition-colors group-hover:text-accent">
                    {problem.title}
                  </span>
                  <span className="text-xs text-muted font-medium mt-0.5">
                    {problem.chapters?.section || 'Algoritmică'}
                  </span>
                </div>
              </div>

              {/* Partea Dreaptă: Dificultate, Puncte, Acțiune */}
              <div className="flex shrink-0 items-center gap-3 sm:gap-6">
                
                {/* Dificultate (Ascunsă pe ecrane foarte mici pentru a nu aglomera) */}
                <span className={`hidden sm:inline-block px-2.5 py-1 rounded-md text-xs font-bold border capitalize ${getDifficultyStyle(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>

                {/* Puncte */}
                <div className="text-sm font-bold text-text-main w-12 text-right">
                  {problem.xp_reward} <span className="text-[10px] text-muted uppercase font-normal">xp</span>
                </div>

                {/* Săgeată indicatoare */}
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
                
              </div>
              
            </Link>
          ))
        )}
      </div>
      
      {/* Buton "Vezi mai multe" */}
      <NavLink 
        to="/probleme/toate" 
        className="block w-full mt-4 py-3 text-center rounded-xl border border-dashed border-border text-sm font-bold text-muted hover:text-text-main hover:border-muted hover:bg-ink transition-all"
      >
        Explorează toată arhiva de probleme
      </NavLink>

    </div>
  );
}
