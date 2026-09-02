import { AlertTriangle, Calendar, Megaphone, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TopHeader from '../components/MainArea/TopHeader';
import { supabase } from '../supabaseClient';
import { markAnnouncementsSeen } from '../utils/notifications';

function getBadgeStyle(tag) {
  switch (tag) {
    case 'important': return 'bg-accent text-ink';
    case 'nou': return 'bg-easy text-ink';
    default: return 'bg-border text-text-main';
  }
}

function getBorderStyle(tag) {
  switch (tag) {
    case 'important': return 'border-accent';
    case 'nou': return 'border-easy';
    default: return 'border-border';
  }
}

function getTagLabel(tag) {
  switch (tag) {
    case 'important': return 'IMPORTANT';
    case 'nou': return 'NOU';
    default: return 'INFO';
  }
}

function formatAnnouncementDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă';

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function LoadingAnnouncements() {
  return (
    <div className="space-y-4" aria-label="Se încarcă anunțurile">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="animate-pulse rounded-2xl border border-border bg-ink p-5 sm:p-6">
          <div className="h-5 w-2/5 rounded bg-border" />
          <div className="mt-4 h-4 w-full rounded bg-border/70" />
          <div className="mt-2 h-4 w-4/5 rounded bg-border/70" />
        </div>
      ))}
    </div>
  );
}

export default function Anunturi() {
  const { user } = useAuth();
  const location = useLocation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAnnouncements = async () => {
      setLoading(true);
      setError('');

      const { data, error: announcementsError } = await supabase
        .from('announcements')
        .select('id, title, body, tag, published_at')
        .order('published_at', { ascending: false });

      if (cancelled) return;

      if (announcementsError) {
        setAnnouncements([]);
        setError('Anunțurile nu au putut fi încărcate. Încearcă din nou.');
      } else {
        const nextAnnouncements = data || [];
        setAnnouncements(nextAnnouncements);
        if (user?.id) markAnnouncementsSeen(user.id, nextAnnouncements);
      }
      setLoading(false);
    };

    loadAnnouncements();
    return () => { cancelled = true; };
  }, [reloadKey, user?.id]);

  useEffect(() => {
    if (loading || !location.hash) return undefined;

    const announcementId = location.hash.slice(1);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(announcementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [announcements, loading, location.hash]);

  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Anunțuri" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl pb-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-accent"><Megaphone className="h-4 w-4" />Noutăți PyLearn</div>
              <h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">Toate anunțurile</h1>
              <p className="mt-2 max-w-2xl text-muted">Rămâi la curent cu noutățile, mentenanțele programate și actualizările platformei.</p>
            </div>
            {!loading && !error && <span className="w-fit rounded-lg border border-border bg-ink px-3 py-2 text-sm font-bold text-muted">{announcements.length} {announcements.length === 1 ? 'anunț' : 'anunțuri'}</span>}
          </div>

          {loading ? <LoadingAnnouncements /> : error ? (
            <section className="rounded-2xl border border-hard/20 bg-hard/10 p-5 text-center sm:p-8">
              <AlertTriangle className="mx-auto h-8 w-8 text-hard" />
              <h2 className="mt-4 text-xl font-bold text-text-main">Anunțurile nu sunt disponibile</h2>
              <p className="mt-2 text-sm text-muted">{error}</p>
              <button type="button" onClick={() => setReloadKey((currentKey) => currentKey + 1)} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover"><RefreshCw className="h-4 w-4" />Reîncearcă</button>
            </section>
          ) : announcements.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-border bg-ink p-8 text-center sm:p-12">
              <Megaphone className="mx-auto h-9 w-9 text-muted" />
              <h2 className="mt-4 text-xl font-bold text-text-main">Nu există anunțuri momentan.</h2>
              <p className="mt-2 text-sm text-muted">Când apare o noutate, o vei găsi aici.</p>
            </section>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <article key={announcement.id} id={`announcement-${announcement.id}`} className={`scroll-mt-24 rounded-2xl border border-border border-l-4 ${getBorderStyle(announcement.tag)} bg-ink p-5 sm:p-6`}>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0"><span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getBadgeStyle(announcement.tag)}`}>{getTagLabel(announcement.tag)}</span><h2 className="mt-3 text-lg font-bold text-text-main sm:text-xl">{announcement.title}</h2></div>
                    <time className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted"><Calendar className="h-3.5 w-3.5" />{formatAnnouncementDate(announcement.published_at)}</time>
                  </div>
                  {announcement.body && <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted">{announcement.body}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
