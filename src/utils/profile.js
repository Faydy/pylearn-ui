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

export const ONBOARDING_AVATAR_SEEDS = [
  'Ada',
  'Felix',
  'Nova',
  'Milo',
  'Sofia',
  'Theo',
];

export const AVATAR_OPTIONS = ONBOARDING_AVATAR_SEEDS;

const FEMININE_AVATAR_SEEDS = new Set([
  'Ada', 'Nova', 'Sofia', 'Luna', 'Maya', 'Iris',
  'Zara', 'Freya', 'Lyra', 'Vega', 'Astra',
]);

const MASCULINE_AVATAR_SEEDS = new Set([
  'Felix', 'Milo', 'Theo', 'Leo', 'Noah', 'Alex',
  'Atlas', 'Orion', 'Kai', 'Jasper', 'Dorian',
]);

export function normalizeProfileRole(role) {
  return role === 'teacher' ? 'profesor' : role;
}

export function getAvatarUrl(seed) {
  const normalizedSeed = seed || 'pyLearn';
  const appearance = FEMININE_AVATAR_SEEDS.has(normalizedSeed)
    ? '&topVariant=straight01,straight02,bun,curly,curvy,longButNotTooLong&facialHairProbability=0'
    : MASCULINE_AVATAR_SEEDS.has(normalizedSeed)
      ? '&topVariant=shortFlat,shortRound,shortWaved,theCaesar,theCaesarAndSidePart,shavedSides&facialHairVariant=beardLight,beardMedium,moustacheFancy&facialHairProbability=100'
      : '';

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedSeed)}${appearance}`;
}

export function isOnboardingAvatarSeed(seed) {
  return ONBOARDING_AVATAR_SEEDS.includes(seed);
}

export function getProfileAvatarSeed(profile, user) {
  const storedAvatar = profile?.avatar;
  const metadataAvatar = user?.user_metadata?.avatar;

  if (typeof storedAvatar === 'string' && storedAvatar.trim()) {
    return storedAvatar;
  }

  if (AVATAR_OPTIONS.includes(metadataAvatar)) {
    return metadataAvatar;
  }

  return profile?.username || user?.email || 'pyLearn';
}

export function isEmailVerified(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

export function isProfileComplete(profile, user) {
  const metadata = user?.user_metadata || {};
  const storedRole = normalizeProfileRole(profile?.role || metadata.role);
  const hasSupportedRole = PROFILE_ROLES.some((role) => role.value === storedRole);

  return Boolean(
    profile?.username
    && typeof profile?.avatar === 'string'
    && profile.avatar.trim()
    && hasSupportedRole
    && isEmailVerified(user),
  );
}
