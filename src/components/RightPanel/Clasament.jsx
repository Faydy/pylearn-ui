import { useState, useEffect } from 'react';
import { Trophy, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { NavLink } from 'react-router-dom';

export default function Clasament() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasament = async () => {
      try {
        // 1. Aflăm cine e logat
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;

        // 2. Aducem primii 5 campioni
        const { data: top5, error: topError } = await supabase
          .from('profiles')
          .select('id, username, total_xp')
          .order('total_xp', { ascending: false })
          .limit(5);

        if (topError) throw topError;

        // Dacă nu avem un user logat, afișăm pur și simplu top 5 și ne oprim
        if (!currentUserId) {
          setLeaderboardData(top5.map((u, i) => ({ ...u, rank: i + 1, isMe: false })));
          return;
        }

        // 3. Verificăm dacă utilizatorul nostru este deja în Top 5
        const userInTop5Index = top5.findIndex(u => u.id === currentUserId);

        if (userInTop5Index !== -1) {
          // E în Top 5! Afișăm lista normal
          setLeaderboardData(top5.map((u, i) => ({ 
            ...u, 
            rank: i + 1, 
            isMe: u.id === currentUserId 
          })));
        } else {
          // NU e în Top 5. Păstrăm primii 4, și adăugăm userul la final
          const top4 = top5.slice(0, 4).map((u, i) => ({ ...u, rank: i + 1, isMe: false }));

          // Aducem datele userului curent
          const { data: myProfile } = await supabase
            .from('profiles')
            .select('id, username, total_xp')
            .eq('id', currentUserId)
            .maybeSingle();

          if (myProfile) {
            // Calculăm locul lui aflând CÂȚI useri au XP STRICT MAI MARE decât el
            const { count } = await supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .gt('total_xp', myProfile.total_xp);

            const myRank = (count || 0) + 1; // Locul = (Câți sunt mai buni) + 1

            // Adăugăm userul la finalul listei
            top4.push({
              ...myProfile,
              rank: myRank,
              isMe: true,
              isSeparator: true // Un marcaj special pentru design
            });
          }
          
          setLeaderboardData(top4);
        }
      } catch (error) {
        console.error("Eroare la încărcarea clasamentului:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasament();
  }, []);

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return 'text-accent bg-accent/10 font-bold';
      case 2: return 'text-text-main bg-border font-bold';
      case 3: return 'text-medium bg-medium/10 font-bold';
      default: return 'text-muted bg-transparent font-medium';
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-ink p-5">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="text-text-main font-bold text-lg">Top Săptămânal</h3>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[150px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full flex-1">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : leaderboardData.length > 0 ? (
          leaderboardData.map((user, index) => {
            // Dacă am sărit de la locul 4 la locul 150, punem un mic separator vizual (o linie subțire)
            const showSeparator = user.isSeparator;

            return (
              <div key={user.id} className="flex flex-col">
                
                {/* Trei puncte ajutătoare dacă s-au sărit locuri */}
                {showSeparator && (
                  <div className="flex justify-center my-1">
                    <span className="text-muted text-xs tracking-[0.2em]">...</span>
                  </div>
                )}

                <div 
                  className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                    user.isMe 
                      ? 'bg-sidebar-hover border border-border shadow-sm' 
                      : 'hover:bg-background/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${getRankStyle(user.rank)}`}>
                      {user.rank}
                    </div>
                    
                    <NavLink to={`/profil/${user.id}`} className={`text-sm transition-colors hover:text-accent ${user.isMe ? 'text-text-main font-bold' : 'text-muted font-medium'}`}>
                      {user.username}
                    </NavLink>
                  </div>

                  <div className="text-sm font-bold text-text-main">
                    {user.total_xp} <span className="text-xs text-muted font-normal uppercase">xp</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted text-center py-4">Nu există date suficiente.</p>
        )}
      </div>

      <NavLink to="/scoruri" className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-xs text-muted hover:text-accent transition-colors font-bold uppercase tracking-wider border-t border-border pt-4">
        Vezi tot clasamentul
        <ChevronRight className="w-4 h-4" />
      </NavLink>
    </div>
  );
}
