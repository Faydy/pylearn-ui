import { CheckCircle2, Circle, PlayCircle, ChevronRight, Filter } from 'lucide-react';

export default function ListaProbleme() {
  // Date simulate. Starea (status) poate fi: 'completed', 'in-progress' sau 'todo'
  const problems = [
    { id: 1, title: "Suma elementelor pare", category: "Structuri Repetitive", difficulty: "Ușor", status: "completed", points: 10 },
    { id: 2, title: "Căutare Binară pe Șir", category: "Algoritmi", difficulty: "Mediu", status: "in-progress", points: 25 },
    { id: 3, title: "Validare Paranteze", category: "Stive", difficulty: "Mediu", status: "todo", points: 30 },
    { id: 4, title: "Problema Rucsacului", category: "Programare Dinamică", difficulty: "Greu", status: "todo", points: 50 },
    { id: 5, title: "Inversare Șir de Caractere", category: "Șiruri (Strings)", difficulty: "Ușor", status: "todo", points: 15 },
  ];

  // Funcție pentru culorile dificultății
  const getDifficultyStyle = (diff) => {
    switch (diff) {
      case 'Ușor': return 'text-easy bg-easy/10 border-easy/20';
      case 'Mediu': return 'text-medium bg-medium/10 border-medium/20';
      case 'Greu': return 'text-hard bg-hard/10 border-hard/20';
      default: return 'text-muted bg-border';
    }
  };

  // Funcție pentru iconița de status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': 
        return <CheckCircle2 className="w-5 h-5 text-easy" title="Rezolvat" />;
      case 'in-progress': 
        return <PlayCircle className="w-5 h-5 text-accent" title="În lucru" />;
      case 'todo': 
      default:
        return <Circle className="w-5 h-5 text-muted hover:text-text-main transition-colors" title="Nerezolvat" />;
    }
  };

  return (
    <div className="mt-8">
      
      {/* Header-ul Listei */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h3 className="text-xl font-bold text-text-main">Probleme Recomandate</h3>
          <p className="text-sm text-muted">Exersează conceptele învățate recent.</p>
        </div>
      </div>

      {/* Containerul Listei */}
      <div className="bg-ink border border-border rounded-2xl overflow-hidden flex flex-col">
        {problems.map((problem, index) => (
          <div 
            key={problem.id}
            className={`flex items-center justify-between p-4 transition-colors group cursor-pointer hover:bg-sidebar-hover
              ${index !== problems.length - 1 ? 'border-b border-border' : ''} 
            `}
          >
            
            {/* Partea Stângă: Status, Titlu, Categorie */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {getStatusIcon(problem.status)}
              </div>
              
              <div className="flex flex-col">
                <span className={`font-bold text-sm md:text-base transition-colors group-hover:text-accent
                  ${problem.status === 'completed' ? 'text-muted line-through opacity-70' : 'text-text-main'}
                `}>
                  {problem.title}
                </span>
                <span className="text-xs text-muted font-medium mt-0.5">
                  {problem.category}
                </span>
              </div>
            </div>

            {/* Partea Dreaptă: Dificultate, Puncte, Acțiune */}
            <div className="flex items-center gap-6">
              
              {/* Dificultate (Ascunsă pe ecrane foarte mici pentru a nu aglomera) */}
              <span className={`hidden sm:inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${getDifficultyStyle(problem.difficulty)}`}>
                {problem.difficulty}
              </span>

              {/* Puncte */}
              <div className="text-sm font-bold text-text-main w-12 text-right">
                {problem.points} <span className="text-[10px] text-muted uppercase font-normal">xp</span>
              </div>

              {/* Săgeată indicatoare */}
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
              
            </div>
            
          </div>
        ))}
      </div>
      
      {/* Buton "Vezi mai multe" */}
      <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-border text-sm font-bold text-muted hover:text-text-main hover:border-muted hover:bg-ink transition-all">
        Explorează toată arhiva de probleme
      </button>

    </div>
  );
}