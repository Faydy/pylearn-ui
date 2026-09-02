import { Bell, ChevronRight, Loader2, Megaphone } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabaseClient';
import { getLastSeenAnnouncementAt, hasUnreadAnnouncements, markAnnouncementsSeen } from '../../utils/notifications';

const NOTIFICATION_LIMIT = 5;

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function NotificationsBell() {
  const { user, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const requestIdRef = useRef(0);
  const userId = user?.id;

  const loadAnnouncements = useCallback(async ({ markAsSeen = false } = {}) => {
    if (!userId) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError('');

    const { data, error: announcementsError } = await supabase
      .from('announcements')
      .select('id, title, body, tag, published_at')
      .order('published_at', { ascending: false })
      .limit(NOTIFICATION_LIMIT);

    if (requestId !== requestIdRef.current) return;

    if (announcementsError) {
      setError('Anunțurile nu au putut fi încărcate.');
      setLoading(false);
      return;
    }

    const nextAnnouncements = data || [];
    setAnnouncements(nextAnnouncements);
    if (markAsSeen) {
      setLastSeenAt(markAnnouncementsSeen(userId, nextAnnouncements));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      requestIdRef.current += 1;
      setAnnouncements([]);
      setLastSeenAt(null);
      setOpen(false);
      setError('');
      setLoading(false);
      return undefined;
    }

    setLastSeenAt(getLastSeenAnnouncementAt(userId));
    loadAnnouncements();

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') loadAnnouncements();
    };
    const refreshInterval = window.setInterval(() => loadAnnouncements(), 60_000);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      requestIdRef.current += 1;
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [userId, loadAnnouncements]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggle = () => {
    if (authLoading) return;

    if (!userId) {
      setOpen((currentOpen) => !currentOpen);
      return;
    }

    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    setLastSeenAt(markAnnouncementsSeen(userId, announcements));
    loadAnnouncements({ markAsSeen: true });
  };

  const hasUnread = Boolean(userId) && hasUnreadAnnouncements(announcements, lastSeenAt);

  return (
    <div ref={containerRef} className="relative flex shrink-0 items-center justify-center leading-none">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Anunțuri"
        aria-expanded={open}
        aria-controls="notifications-menu"
        className="relative flex h-5 w-5 items-center justify-center text-muted transition-colors hover:text-text-main disabled:cursor-wait"
        disabled={authLoading}
      >
        <Bell className="h-5 w-5" />
        {hasUnread && <span className="absolute right-0 top-0 h-2 w-2 rounded-full border border-background bg-hard" aria-label="Ai anunțuri necitite" />}
      </button>

      {open && (
        <section id="notifications-menu" aria-label="Anunțuri" className="absolute right-[-3rem] top-full z-40 mt-3 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          {!user ? (
            <div className="p-5 text-center">
              <Bell className="mx-auto h-6 w-6 text-accent" />
              <p className="mt-3 font-bold text-text-main">Intră în cont pentru anunțuri</p>
              <p className="mt-1 text-sm text-muted">Vezi mesajele noi după autentificare.</p>
              <div className="mt-4 flex flex-col items-center gap-3"><Link to="/anunturi" onClick={() => setOpen(false)} className="text-sm font-bold text-accent transition-colors hover:text-text-main">Vezi toate anunțurile</Link><Link to="/login" onClick={() => setOpen(false)} className="inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-accent/90">Intră în cont</Link></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-accent" /><h3 className="font-bold text-text-main">Anunțuri</h3></div>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
              </div>
              {error ? (
                <p className="p-4 text-sm text-hard">{error}</p>
              ) : !loading && announcements.length === 0 ? (
                <p className="p-5 text-center text-sm text-muted">Nu ai anunțuri momentan.</p>
              ) : (
                <div className="max-h-80 divide-y divide-border overflow-y-auto">
                  {announcements.map((announcement) => (
                    <Link key={announcement.id} to={`/anunturi#announcement-${announcement.id}`} onClick={() => setOpen(false)} className="block p-4 transition-colors hover:bg-sidebar-hover">
                      <div className="flex items-start justify-between gap-3"><h4 className="text-sm font-bold text-text-main">{announcement.title}</h4><time className="shrink-0 text-[11px] font-medium text-muted">{formatDate(announcement.published_at)}</time></div>
                      {announcement.body && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{announcement.body}</p>}
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/anunturi" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-sidebar-hover hover:text-text-main">Vezi toate anunțurile <ChevronRight className="h-4 w-4" /></Link>
            </>
          )}
        </section>
      )}
    </div>
  );
}
