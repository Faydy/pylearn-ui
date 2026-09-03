import { BellOff } from 'lucide-react';
import NotificationItem from './NotificationItem';

export default function NotificationsList({ notifications, onOpen, compact = false, emptyMessage = 'Nu ai notificări.' }) {
  if (notifications.length === 0) {
    return <div className="p-8 text-center"><BellOff className="mx-auto h-7 w-7 text-muted" /><p className="mt-3 text-sm text-muted">{emptyMessage}</p></div>;
  }

  return <div className="divide-y divide-border">{notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onOpen={onOpen} compact={compact} />)}</div>;
}
