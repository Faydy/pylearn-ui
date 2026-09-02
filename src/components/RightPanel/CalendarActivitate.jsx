import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Calendar as CalendarIcon, Loader2, Check } from 'lucide-react';

export default function CalendarActivitate() {
  const [activityMap, setActivityMap] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Calculăm Lunea din săptămâna curentă
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // 0 = Luni, 1 = Marți, ..., 6 = Duminică
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayIndex);

  useEffect(() => {
    const fetchActivityHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Formatăm data de Luni pentru Supabase (YYYY-MM-DD)
        const pad = (n) => n.toString().padStart(2, '0');
        const startDateStr = `${startOfWeek.getFullYear()}-${pad(startOfWeek.getMonth() + 1)}-${pad(startOfWeek.getDate())}`;

        const { data, error } = await supabase
          .from('activity_log')
          .select('activity_date, problems_solved_count')
          .eq('user_id', userId)
          .gte('activity_date', startDateStr);

        if (error) throw error;

        const map = {};
        if (data) {
          data.forEach(item => {
            if (item.problems_solved_count > 0) {
              map[item.activity_date] = true;
            }
          });
        }
        
        setActivityMap(map);

      } catch (error) {
        console.error("Eroare la extragerea activității:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zileSaptamana = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

  // 2. Generăm strict cele 7 zile ale săptămânii curente
  const activityData = Array.from({ length: 7 }, (_, index) => {
    const dateObj = new Date(startOfWeek);
    dateObj.setDate(dateObj.getDate() + index);
    
    const pad = (n) => n.toString().padStart(2, '0');
    const dbDateStr = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
    
    const isToday = dateObj.toDateString() === today.toDateString();
    // Resetăm orele la 00:00 pentru o comparație corectă strict pe zile
    const isFuture = dateObj.setHours(0,0,0,0) > today.setHours(0,0,0,0); 
    
    const isActive = !!activityMap[dbDateStr];
    
    return {
      label: zileSaptamana[index],
      date: dateObj.toLocaleDateString('ro-RO'),
      isActive: isActive,
      isToday: isToday,
      isFuture: isFuture
    };
  });

  return (
    <div className="relative rounded-2xl border border-border bg-ink p-5 sm:p-6">
      
      {/* Overlay de încărcare */}
      {loading && (
        <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-10">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-bold text-text-main">Săptămâna aceasta</h3>
          </div>
          <p className="text-sm text-muted">Zile în care ai rezolvat probleme.</p>
        </div>
      </div>

      {/* Containerul pentru săptămână */}
      {/* Containerul pentru săptămână */}
      <div className="grid grid-cols-7 gap-2 py-4 w-full">
        {activityData.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2.5">
            
            {/* Numele Zilei (ex: LUN, MAR) */}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              day.isToday ? 'text-accent' : (day.isFuture ? 'text-muted/40' : 'text-muted')
            }`}>
              {day.label}
            </span>

            {/* Pătrățelul de Activitate */}
            <div 
              title={day.isFuture ? '' : (day.isToday ? 'Azi' : (day.isActive ? `Ai rezolvat probleme pe ${day.date}` : `Nicio activitate pe ${day.date}`))}
              className={`
                w-full aspect-square max-w-[34px] rounded-lg flex items-center justify-center border transition-all duration-300
                ${day.isFuture 
                  ? 'bg-transparent border-border/50 opacity-50' 
                  : day.isActive 
                    ? 'bg-accent border-accent text-ink shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]' 
                    : 'bg-background border-border hover:border-muted' 
                }
                ${day.isToday ? 'ring-2 ring-accent/60 ring-offset-2 ring-offset-ink scale-105' : ''} 
              `}
            >
              {day.isActive && !day.isFuture && (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
            </div>
            
          </div>
        ))}
      </div>
      
    </div>
  );
}
