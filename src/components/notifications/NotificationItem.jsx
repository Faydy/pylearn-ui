import { BellRing, Check, ClipboardList } from 'lucide-react';
import { formatNotificationDate } from '../../utils/notifications';

function NotificationIcon({ type }) {
  if (type === 'new_assignment') return <ClipboardList className="h-4 w-4" />;
  return <BellRing className="h-4 w-4" />;
}

export default function NotificationItem({ notification, onOpen, compact = false }) {
  const unread = !notification.is_read;

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-sidebar-hover ${unread ? 'bg-accent/[0.06]' : ''}`}
    >
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${unread ? 'bg-accent/15 text-accent' : 'bg-background text-muted'}`}>
        <NotificationIcon type={notification.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={`text-sm ${unread ? 'font-bold text-text-main' : 'font-medium text-text-main'}`}>{notification.title}</span>
          {unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Necitită" /> : <Check className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Citită" />}
        </span>
        {notification.message && <span className={`mt-1 block leading-relaxed text-muted ${compact ? 'line-clamp-2 text-xs' : 'text-sm'}`}>{notification.message}</span>}
        <time className="mt-2 block text-xs font-medium text-muted">{formatNotificationDate(notification.created_at)}</time>
      </span>
    </button>
  );
}
