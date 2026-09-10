import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { addCalendarDays, changeCalendarMonth, formatCalendarDate, getCalendarMonth, getCalendarWeekday, getDaysInCalendarMonth } from '../../utils/activity';
import { useBucharestToday } from '../../hooks/useBucharestToday';

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

function formatMonth(date) {
  const label = formatCalendarDate(date, { month: 'long', year: 'numeric' });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function formatDay(date, count) {
  const label = formatCalendarDate(date, { day: 'numeric', month: 'long', year: 'numeric' });
  if (count === 0) return `Nicio problemă rezolvată pe ${label}`;
  return `${count} ${count === 1 ? 'problemă rezolvată' : 'probleme rezolvate'} pe ${label}`;
}

export default function ProfileActivityCalendar({ userId }) {
  const todayKey = useBucharestToday();
  const [selectedMonth, setSelectedMonth] = useState(() => getCalendarMonth(todayKey));
  const [activityByDate, setActivityByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentMonth = getCalendarMonth(todayKey);
  const isCurrentMonth = selectedMonth >= currentMonth;

  useEffect(() => {
    let cancelled = false;

    const loadActivity = async () => {
      if (!userId) return;

      setLoading(true);
      setError('');
      const { data, error: activityError } = await supabase.rpc('get_public_user_activity_month', {
        p_profile_user_id: userId,
        p_year: Number(selectedMonth.slice(0, 4)),
        p_month: Number(selectedMonth.slice(5, 7)),
      });

      if (cancelled) return;

      if (activityError) {
        console.error('Eroare la încărcarea activității profilului:', activityError.message);
        setActivityByDate({});
        setError('Nu am putut încărca activitatea.');
      } else {
        const nextActivity = (data || []).reduce((result, row) => {
          const count = Number(row.problems_solved_count) || 0;
          if (row.activity_date && count > 0) {
            result[row.activity_date] = (result[row.activity_date] || 0) + count;
          }
          return result;
        }, {});
        setActivityByDate(nextActivity);
      }
      setLoading(false);
    };

    loadActivity();
    return () => { cancelled = true; };
  }, [selectedMonth, todayKey, userId]);

  const calendarDays = useMemo(() => {
    const firstWeekday = getCalendarWeekday(selectedMonth);
    const daysInMonth = getDaysInCalendarMonth(selectedMonth);
    const emptyDays = Array.from({ length: firstWeekday }, (_, index) => ({ id: `empty-${index}` }));
    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const dateKey = addCalendarDays(selectedMonth, index);
      const date = dateKey;
      const count = activityByDate[dateKey] || 0;
      return { id: dateKey, date, dateKey, count, isToday: dateKey === todayKey, isFuture: dateKey > todayKey };
    });
    return [...emptyDays, ...days];
  }, [activityByDate, selectedMonth, todayKey]);

  const activeDays = Object.values(activityByDate).filter((count) => count > 0).length;
  const solvedProblems = Object.values(activityByDate).reduce((total, count) => total + count, 0);

  return (
    <section className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-ink p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-accent" /><h2 className="text-xl font-bold text-text-main">Activitate</h2></div></div>
        <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background p-1"><button type="button" onClick={() => setSelectedMonth((month) => changeCalendarMonth(month, -1))} aria-label="Luna precedentă" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sidebar-hover hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent"><ChevronLeft className="h-4 w-4" /></button><p className="min-w-0 flex-1 text-center text-sm font-bold text-text-main">{formatMonth(selectedMonth)}</p><button type="button" onClick={() => setSelectedMonth((month) => changeCalendarMonth(month, 1))} disabled={isCurrentMonth} aria-label="Luna următoare" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sidebar-hover hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button></div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-1.5" aria-label={`Calendar activitate ${formatMonth(selectedMonth)}`}>
        {WEEKDAYS.map((weekday) => <span key={weekday} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted">{weekday}</span>)}
        {calendarDays.map((day) => {
          if (!day.date) return <span key={day.id} aria-hidden="true" />;

          const active = !day.isFuture && day.count > 0;
          return <div key={day.id} role="img" tabIndex={0} title={formatDay(day.date, day.count)} aria-label={formatDay(day.date, day.count)} className={`flex aspect-square min-w-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${day.isFuture ? 'border-border/50 bg-transparent text-muted/40' : active ? 'border-accent bg-accent text-ink' : 'border-border bg-background text-muted'} ${day.isToday ? 'ring-2 ring-accent/60 ring-offset-2 ring-offset-ink' : ''}`}>{Number(day.date.slice(-2))}</div>;
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm text-muted"><span><strong className="text-text-main">{activeDays}</strong> {activeDays === 1 ? 'zi activă' : 'zile active'}</span><span><strong className="text-text-main">{solvedProblems}</strong> {solvedProblems === 1 ? 'problemă rezolvată' : 'probleme rezolvate'}</span>{activeDays === 0 && !loading && <span>Nicio activitate în această lună.</span>}</div>

      {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/70 backdrop-blur-[1px]"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>}
      {error && <p className="mt-4 rounded-xl border border-hard/20 bg-hard/10 p-3 text-sm text-hard">{error}</p>}
    </section>
  );
}
