import { Bell, CheckCheck, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import NotificationList from '../notifications/NotificationsList';
import { supabase } from '../../supabaseClient';
import { mergeNotifications } from '../../utils/notifications';

const NOTIFICATION_LIMIT = 6;

export default function NotificationsBell() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const notificationsRef = useRef([]);
  const userId = user?.id;

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError('');
    const [notificationsResponse, unreadResponse] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, type, title, message, link, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(NOTIFICATION_LIMIT),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false),
    ]);

    if (notificationsResponse.error || unreadResponse.error) {
      setError('Notificările nu au putut fi încărcate.');
      setLoading(false);
      return;
    }

    setNotifications(notificationsResponse.data || []);
    setUnreadCount(unreadResponse.count || 0);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setOpen(false);
      setError('');
      return undefined;
    }

    loadNotifications();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const notification = payload.new;
          const alreadyLoaded = notificationsRef.current.some((current) => current.id === notification.id);
          setNotifications((current) => mergeNotifications(current, notification, NOTIFICATION_LIMIT));
          if (!alreadyLoaded && !notification.is_read) setUnreadCount((current) => current + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadNotifications]);

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

  const markNotificationRead = async (notification) => {
    if (notification.is_read) return true;

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
    if (updateError) {
      setError('Notificarea nu a putut fi marcată ca citită.');
      return false;
    }

    setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
    setUnreadCount((current) => Math.max(0, current - 1));
    return true;
  };

  const handleOpenNotification = async (notification) => {
    const marked = await markNotificationRead(notification);
    if (!marked) return;

    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    if (!userId || unreadCount === 0) return;

    setUpdating(true);
    setError('');
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    if (updateError) {
      setError('Notificările nu au putut fi actualizate.');
    } else {
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    }
    setUpdating(false);
  };

  const handleToggle = () => {
    if (authLoading) return;
    setOpen((current) => !current);
    if (!open && userId) loadNotifications();
  };

  return (
    <div ref={containerRef} className="relative flex shrink-0 items-center justify-center leading-none">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notificări"
        aria-expanded={open}
        aria-controls="notifications-menu"
        className="relative flex h-5 w-5 items-center justify-center text-muted transition-colors hover:text-text-main disabled:cursor-wait"
        disabled={authLoading}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-hard px-1 text-[9px] font-black leading-none text-white" aria-label={`${unreadCount} notificări necitite`}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <section id="notifications-menu" aria-label="Notificări" className="absolute right-[-3rem] top-full z-40 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          {!user ? (
            <div className="p-5 text-center"><Bell className="mx-auto h-6 w-6 text-accent" /><p className="mt-3 font-bold text-text-main">Intră în cont pentru notificări</p><p className="mt-1 text-sm text-muted">Primești aici temele noi ale claselor tale.</p><Link to="/login" onClick={() => setOpen(false)} className="mt-4 inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-accent/90">Intră în cont</Link></div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-3"><h3 className="font-bold text-text-main">Notificări</h3><div className="flex items-center gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}{unreadCount > 0 && <button type="button" onClick={handleMarkAllRead} disabled={updating} className="inline-flex items-center gap-1 text-xs font-bold text-accent transition-colors hover:text-text-main disabled:opacity-50">{updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}Marchează toate</button>}</div></div>
              {error ? <p className="p-4 text-sm text-hard">{error}</p> : loading && notifications.length === 0 ? <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div> : <div className="max-h-80 overflow-y-auto"><NotificationList notifications={notifications} onOpen={handleOpenNotification} compact /></div>}
              <Link to="/notificari" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-sidebar-hover hover:text-text-main">Vezi toate notificările <ChevronRight className="h-4 w-4" /></Link>
            </>
          )}
        </section>
      )}
    </div>
  );
}
