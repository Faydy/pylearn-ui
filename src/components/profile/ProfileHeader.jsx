import { Award, CalendarDays, Coins, Flame, ShoppingBag, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarUrl, getProfileAvatarSeed, normalizeProfileRole, PROFILE_ROLES } from '../../utils/profile';
import { formatCoins, getUserLevel } from '../../utils/economy';
import { formatXp } from '../../utils/leaderboard';

export default function ProfileHeader({ profile, ownProfile, coinBalance = 0 }) {
  const role = PROFILE_ROLES.find((option) => option.value === normalizeProfileRole(profile?.role));
  const joinedAt = profile?.created_at ? new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at)) : null;
  const subtitle = [role?.label, profile?.grade_name].filter(Boolean).join(' · ');
  const level = getUserLevel(profile?.total_xp);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/15 via-ink to-ink p-5 sm:p-7">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <img src={getAvatarUrl(getProfileAvatarSeed(profile))} alt="" className="h-20 w-20 shrink-0 rounded-2xl border border-accent/30 bg-sidebar sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-accent"><span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4" />{ownProfile ? 'Profilul meu' : 'Profil PyLearn'}</span><span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px]">Nivel {level}</span></div><h1 className="mt-3 truncate text-3xl font-black tracking-tight text-text-main sm:text-4xl">{profile?.username || 'Utilizator PyLearn'}</h1>{subtitle && <p className="mt-2 text-sm font-medium text-muted">{subtitle}</p>}{joinedAt && <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted"><CalendarDays className="h-3.5 w-3.5" />Membru din {joinedAt}</p>}</div>
        <div className="space-y-3 sm:w-56"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-border bg-background/70 p-3"><Award className="h-4 w-4 text-accent" /><p className="mt-2 text-lg font-black text-text-main">{formatXp(profile?.total_xp)}</p><p className="mt-1 text-xs text-muted">XP total</p></div><div className="rounded-xl border border-border bg-background/70 p-3"><Flame className="h-4 w-4 text-medium" /><p className="mt-2 text-lg font-black text-text-main">{profile?.current_streak || 0}</p><p className="mt-1 text-xs text-muted">zile la rând</p></div></div>{ownProfile && <Link to="/shop" className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-3 py-2.5 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent"><span className="inline-flex items-center gap-2"><Coins className="h-4 w-4 text-medium" />{formatCoins(coinBalance)} monede</span><ShoppingBag className="h-4 w-4" /></Link>}</div>
      </div>
    </section>
  );
}
