import { Flame, Loader2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { supabase } from '../../../supabaseClient';
import { useBucharestToday } from '../../../hooks/useBucharestToday';

export default function ActivitateComponent() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const todayKey = useBucharestToday();
  const [activityData, setActivityData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const fetchActivity = async () => {
      if (!userId) {
        setActivityData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase.rpc('get_own_activity_summary');

        if (error) throw error;
        if (isCurrent) setActivityData(data?.[0] || null);
      } catch (error) {
        console.error('Eroare la încărcarea activității:', error.message);
        if (isCurrent) setActivityData(null);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    fetchActivity();

    return () => {
      isCurrent = false;
    };
  }, [todayKey, userId]);

  if (authLoading || (user && isLoading)) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-ink p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[200px] flex-col justify-between rounded-2xl border border-border bg-ink p-6 transition-all hover:border-muted">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="mb-1 text-xl font-bold text-text-main">Activitate</h3>
            <p className="text-sm text-muted">Loghează-te pentru a-ți începe călătoria.</p>
          </div>
          <div className="rounded-full border border-border bg-background p-3">
            <Flame className="h-6 w-6 text-[#ff8a00]" />
          </div>
        </div>

        <Link
          to="/login"
          className="mt-6 flex w-fit items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-ink"
        >
          <LogIn className="h-4 w-4" />
          Intră în cont
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-ink p-6 transition-all hover:border-muted">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-xl font-bold text-text-main">Activitate</h3>
          <p className="text-sm text-muted">Ține-o tot așa, ești pe drumul cel bun!</p>
        </div>
        <div className="rounded-full border border-border bg-background p-3">
          <Flame className="h-6 w-6 text-[#ff8a00]" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-background p-4 text-center">
          <span className="block text-3xl font-bold text-text-main">{activityData?.current_streak || 0}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Zile Streak</span>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 text-center">
          <span className="block text-3xl font-bold text-accent">{activityData?.total_xp || 0}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Puncte Total</span>
        </div>
      </div>
    </div>
  );
}
