import { Award, Loader2, Users } from 'lucide-react';
import { getAvatarUrl } from '../../utils/profile';
import { formatClassroomDate } from '../../utils/classrooms';

export default function ClassMembers({ members, loading, error }) {
  if (loading) return <div className="flex justify-center rounded-2xl border border-border bg-ink p-10"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div>;
  if (error) return <p className="rounded-2xl border border-hard/20 bg-hard/10 p-5 text-sm text-hard">{error}</p>;
  if (members.length === 0) return <div className="rounded-2xl border border-dashed border-border bg-ink p-10 text-center"><Users className="mx-auto h-8 w-8 text-muted" /><p className="mt-4 font-bold text-text-main">Nu sunt elevi în această clasă încă.</p><p className="mt-2 text-sm text-muted">Trimite codul clasei pentru a primi primii membri.</p></div>;

  return <div className="overflow-hidden rounded-2xl border border-border bg-ink">{members.map((member, index) => <div key={member.student_id} className={`flex items-center gap-4 p-4 ${index < members.length - 1 ? 'border-b border-border' : ''}`}><img src={getAvatarUrl(member.username)} alt="" className="h-11 w-11 rounded-full bg-sidebar" /><div className="min-w-0 flex-1"><p className="truncate font-bold text-text-main">{member.username || 'Elev PyLearn'}</p><p className="mt-1 text-xs text-muted">A intrat la {formatClassroomDate(member.joined_at)}</p></div><div className="flex items-center gap-1 text-sm font-bold text-accent"><Award className="h-4 w-4" />{member.total_xp || 0} XP</div></div>)}</div>;
}
