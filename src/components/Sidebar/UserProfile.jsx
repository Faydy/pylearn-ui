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
    <Link to="/profil" className="flex mt-2 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#2c2c2c]">
      <img 
        src={getAvatarUrl(avatarSeed)}
        alt="Avatar" 
        className="w-10 h-10 rounded-full bg-gray-800"
      />
      <div className="flex flex-col">
        <span className="text-sm font-semibold black:text-text-main">{displayName}</span>
        <span className="text-xs text-gray-400">{role?.label || user.email}</span>
      </div>
    </Link>
  );
}
