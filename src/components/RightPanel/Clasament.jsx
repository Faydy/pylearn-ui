import { Trophy, ChevronRight } from 'lucide-react';

export default function Clasament() {
  // Date simulate. Observă proprietatea "isMe" care ne ajută să evidențiem utilizatorul curent.
  const leaderboardData = [
    { rank: 1, username: "Alex_Coder", xp: 2450, isMe: false },
    { rank: 2, username: "Tu", xp: 2120, isMe: true }, // Acesta este utilizatorul nostru
    { rank: 3, username: "Maria_Dev", xp: 1890, isMe: false },
    { rank: 4, username: "Ionut99", xp: 1540, isMe: false },
    { rank: 5, username: "Elena_Py", xp: 1200, isMe: false },
  ];

  // Funcție care atribuie culorile medaliilor pentru Top 3
  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return 'text-accent bg-accent/10 font-bold'; // Auriu (Locul 1)
      case 2: return 'text-text-main bg-border font-bold'; // Argintiu (Locul 2)
      case 3: return 'text-medium bg-medium/10 font-bold'; // Bronz (Locul 3 - folosim culoarea "medium")
      default: return 'text-muted bg-transparent font-medium'; // Restul locurilor
    }
  };

  return (
    <div className="bg-ink rounded-2xl border border-border p-5 mt-6">
      
      {/* Header-ul Componentei */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="text-text-main font-bold text-lg">Top Săptămânal</h3>
        </div>
      </div>

      {/* Lista Clasamentului */}
      <div className="flex flex-col gap-2">
        {leaderboardData.map((user) => (
          <div 
            key={user.rank} 
            className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
              user.isMe 
                ? 'bg-sidebar-hover border border-border' // Evidențiem vizual rândul utilizatorului
                : 'hover:bg-background/50 border border-transparent'
            }`}
          >
            
            {/* Partea stângă: Rang și Nume */}
            <div className="flex items-center gap-3">
              {/* Bulina cu numărul locului */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${getRankStyle(user.rank)}`}>
                {user.rank}
              </div>
              
              <span className={`text-sm ${user.isMe ? 'text-text-main font-bold' : 'text-muted font-medium'}`}>
                {user.username}
              </span>
            </div>

            {/* Partea dreaptă: Punctele (XP) */}
            <div className="text-sm font-bold text-text-main">
              {user.xp} <span className="text-xs text-muted font-normal uppercase">xp</span>
            </div>
            
          </div>
        ))}
      </div>

      {/* Butonul de la final pentru a deschide pagina completă */}
      <button className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-xs text-muted hover:text-accent transition-colors font-bold uppercase tracking-wider border-t border-border pt-4">
        Vezi tot clasamentul
        <ChevronRight className="w-4 h-4" />
      </button>

    </div>
  );
}