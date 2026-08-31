import { Bell, Loader2 } from 'lucide-react';

export default function ClassAnnouncements({ announcements, loading, error }) {
  if (loading) return <div className="flex justify-center rounded-2xl border border-border bg-ink p-10"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div>;
  if (error) return <p className="rounded-2xl border border-hard/20 bg-hard/10 p-5 text-sm text-hard">{error}</p>;
  if (announcements.length === 0) return <div className="rounded-2xl border border-dashed border-border bg-ink p-10 text-center"><Bell className="mx-auto h-8 w-8 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">Nu există anunțuri momentan.</h2><p className="mt-2 text-sm text-muted">Anunțurile profesorului vor apărea aici.</p></div>;

  return <div className="overflow-hidden rounded-2xl border border-border bg-ink">{announcements.map((announcement, index) => <article key={announcement.id} className={`flex items-center gap-4 p-5 ${index < announcements.length - 1 ? 'border-b border-border' : ''}`}><div className="rounded-xl bg-accent/10 p-3 text-accent"><Bell className="h-5 w-5" /></div><h2 className="font-bold text-text-main">{announcement.title}</h2></article>)}</div>;
}
