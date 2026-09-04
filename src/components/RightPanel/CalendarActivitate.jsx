import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabaseClient';
import { addLocalDays, getLocalDateKey, getStartOfLocalWeek } from '../../utils/activity';

export default function CalendarActivitate() {
  const { user, loading: authLoading } = useAuth();
  const [activityMap, setActivityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const startOfWeek = getStartOfLocalWeek(now);
  const startOfWeekKey = getLocalDateKey(startOfWeek);
  const todayKey = getLocalDateKey(now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const fetchActivityHistory = async () => {
      if (authLoading) return;

      if (!user?.id) {
        if (isCurrent) {
          setActivityMap({});
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const weekStart = new Date(`${startOfWeekKey}T00:00:00`);
        const weekEnd = addLocalDays(weekStart, 7);
        const { data, error } = await supabase
          .from('submissions')
          .select('submitted_at')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .gte('submitted_at', weekStart.toISOString())
          .lt('submitted_at', weekEnd.toISOString());

        if (error) throw error;
        if (!isCurrent) return;

        const nextActivityMap = {};
        (data || []).forEach((submission) => {
          const activityDate = getLocalDateKey(submission.submitted_at);
          if (activityDate) nextActivityMap[activityDate] = true;
        });

        setActivityMap(nextActivityMap);
      } catch (error) {
        console.error('Eroare la extragerea activității:', error.message);
        if (isCurrent) setActivityMap({});
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchActivityHistory();
    return () => {
      isCurrent = false;
    };
  }, [authLoading, startOfWeekKey, user?.id]);

  const zileSaptamana = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

  const activityData = Array.from({ length: 7 }, (_, index) => {
    const dateObj = addLocalDays(startOfWeek, index);
    const dateKey = getLocalDateKey(dateObj);
    const isToday = dateKey === todayKey;
    const isFuture = dateKey > todayKey;

    return {
      label: zileSaptamana[index],
      date: dateObj.toLocaleDateString('ro-RO'),
      isActive: !isFuture && Boolean(activityMap[dateKey]),
      isToday,
      isFuture,
    };
  });

  return (
    <div className="relative rounded-2xl border border-border bg-ink p-5 sm:p-6">
      
      {loading && (
        <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-10">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      )}

      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-bold text-text-main">Săptămâna aceasta</h3>
          </div>
          <p className="text-sm text-muted">Zile în care ai rezolvat probleme.</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 py-4 w-full">
        {activityData.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              day.isToday ? 'text-accent' : (day.isFuture ? 'text-muted/40' : 'text-muted')
            }`}>
              {day.label}
            </span>

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
