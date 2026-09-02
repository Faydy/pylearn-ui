export const PROFILE_ROLES = [
  {
    value: 'student',
    label: 'Student',
    description: 'Pentru studenți la facultate.',
  },
  {
    value: 'elev',
    label: 'Elev',
    description: 'Pentru elevi de gimnaziu sau liceu.',
  },
  {
    value: 'profesor',
    label: 'Profesor',
    description: 'Pentru cadre didactice.',
  },
];

export const AVATAR_OPTIONS = [
  'Ada',
  'Felix',
  'Nova',
  'Milo',
  'Sofia',
  'Theo',
];

export function normalizeProfileRole(role) {
  return role === 'teacher' ? 'profesor' : role;
}

export function getAvatarUrl(seed) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'pyLearn')}`;
}

export function getProfileAvatarSeed(profile, user) {
  const avatar = profile?.avatar || user?.user_metadata?.avatar;

  if (AVATAR_OPTIONS.includes(avatar)) {
    return avatar;
  }

  return profile?.username || user?.email || 'pyLearn';
}

export function isEmailVerified(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

export function isProfileComplete(profile, user) {
  const metadata = user?.user_metadata || {};
  const hasSupportedAvatar = AVATAR_OPTIONS.includes(metadata.avatar);
  const storedRole = normalizeProfileRole(profile?.role || metadata.role);
  const hasSupportedRole = PROFILE_ROLES.some((role) => role.value === storedRole);

  return Boolean(
    profile?.username
    && hasSupportedAvatar
    && hasSupportedRole
    && isEmailVerified(user),
  );
}
