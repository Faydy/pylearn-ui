import { useAuth } from "../../AuthContext";
import { Link } from 'react-router-dom';
import { getAvatarUrl, getProfileAvatarSeed, normalizeProfileRole, PROFILE_ROLES } from '../../utils/profile';

export default function UserProfile() {
  const { profile, user, loading } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = profile?.username || (loading ? 'Se încarcă...' : 'Utilizator');
  const avatarSeed = getProfileAvatarSeed(profile, user);
  const role = PROFILE_ROLES.find((item) => item.value === normalizeProfileRole(profile?.role || user.user_metadata?.role));

  return (
    <Link to="/profil" className="mt-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-hover">
      <img 
        src={getAvatarUrl(avatarSeed)}
        alt="Avatar" 
        className="h-10 w-10 rounded-full bg-sidebar"
      />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-text-main">{displayName}</span>
        <span className="text-xs text-muted">{role?.label || user.email}</span>
      </div>
    </Link>
  );
}
