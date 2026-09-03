import { AlertTriangle, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TopHeader from '../components/MainArea/TopHeader';
import NotificationsList from '../components/notifications/NotificationsList';
import { supabase } from '../supabaseClient';
import { mergeNotifications } from '../utils/notifications';

const PAGE_SIZE = 40;

export default function Notificari() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const userId = user?.id;

  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError('');
    let query = supabase
      .from('notifications')
      .select('id, type, title, message, link, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (filter === 'unread') query = query.eq('is_read', false);

    const { data, error: notificationsError } = await query;
    if (notificationsError) {
      setError('Nu am putut încărca notificările.');
      setNotifications([]);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  }, [filter, userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`notifications-page:${userId}:${filter}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (filter === 'unread' && payload.new.is_read) return;
          setNotifications((current) => mergeNotifications(current, payload.new, PAGE_SIZE));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, userId]);

  const markRead = async (notification) => {
    if (notification.is_read) return true;

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
    if (updateError) {
      setError('Notificarea nu a putut fi marcată ca citită.');
      return false;
    }

    setNotifications((current) => (
      filter === 'unread'
        ? current.filter((item) => item.id !== notification.id)
        : current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
    ));
    return true;
  };

  const handleOpen = async (notification) => {
    const marked = await markRead(notification);
    if (marked && notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;

    setUpdating(true);
    setError('');
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    if (updateError) {
      setError('Notificările nu au putut fi actualizate.');
    } else if (filter === 'unread') {
      setNotifications([]);
    } else {
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    }
    setUpdating(false);
  };

  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Notificări" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-4xl pb-10">
          <section className="rounded-2xl border border-border bg-ink p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div><div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-accent"><Bell className="h-4 w-4" />PyLearn</div><h1 className="mt-3 text-2xl font-bold text-text-main sm:text-3xl">Notificări</h1><p className="mt-2 text-muted">Vezi temele noi și actualizările relevante pentru tine.</p></div>
              <button type="button" onClick={handleMarkAllRead} disabled={updating || loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-50">{updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4 text-accent" />}Marchează toate ca citite</button>
            </div>
            <div className="mt-6 flex gap-2 border-t border-border pt-5"><button type="button" onClick={() => setFilter('all')} className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${filter === 'all' ? 'bg-accent text-ink' : 'border border-border bg-background text-muted hover:text-text-main'}`}>Toate</button><button type="button" onClick={() => setFilter('unread')} className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${filter === 'unread' ? 'bg-accent text-ink' : 'border border-border bg-background text-muted hover:text-text-main'}`}>Necitite</button></div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-ink">
            {loading ? <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div> : error ? <div className="p-6 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-hard" /><p className="mt-3 font-bold text-text-main">Nu am putut încărca notificările.</p><p className="mt-2 text-sm text-muted">{error}</p><button type="button" onClick={loadNotifications} className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover">Încearcă din nou</button></div> : <NotificationsList notifications={notifications} onOpen={handleOpen} emptyMessage={filter === 'unread' ? 'Nu ai notificări necitite.' : 'Nu ai notificări.'} />}
          </section>
        </div>
      </main>
    </div>
  );
}
