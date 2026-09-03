const ANNOUNCEMENTS_SEEN_STORAGE_KEY = 'pylearn-announcements-seen-at';

function getStorageKey(userId) {
  return `${ANNOUNCEMENTS_SEEN_STORAGE_KEY}:${userId}`;
}

function toTimestamp(value) {
  const timestamp = new Date(value || '').getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getLastSeenAnnouncementAt(userId) {
  if (!userId) return null;

  try {
    return window.localStorage.getItem(getStorageKey(userId));
  } catch {
    return null;
  }
}

export function markAnnouncementsSeen(userId, announcements) {
  if (!userId) return null;

  const latestTimestamp = announcements.reduce((latest, announcement) => {
    const timestamp = toTimestamp(announcement.published_at);
    return timestamp && (!latest || timestamp > latest) ? timestamp : latest;
  }, null);

  if (!latestTimestamp) return null;

  const seenAt = new Date(latestTimestamp).toISOString();
  try {
    window.localStorage.setItem(getStorageKey(userId), seenAt);
  } catch {
    // Notifications remain usable if browser storage is unavailable.
  }

  return seenAt;
}

export function hasUnreadAnnouncements(announcements, lastSeenAt) {
  const lastSeenTimestamp = toTimestamp(lastSeenAt);
  if (!lastSeenTimestamp) return announcements.some((announcement) => toTimestamp(announcement.published_at));

  return announcements.some((announcement) => {
    const publishedTimestamp = toTimestamp(announcement.published_at);
    return publishedTimestamp && publishedTimestamp > lastSeenTimestamp;
  });
}

export function formatNotificationDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă';

  const elapsedMs = Date.now() - date.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 1) return 'acum';
  if (elapsedMinutes < 60) return `acum ${elapsedMinutes} min`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `acum ${elapsedHours} ${elapsedHours === 1 ? 'oră' : 'ore'}`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays === 1) return 'ieri';
  if (elapsedDays < 7) return `acum ${elapsedDays} zile`;

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date);
}

export function mergeNotifications(currentNotifications, notification, limit) {
  const withoutDuplicate = currentNotifications.filter((current) => current.id !== notification.id);
  return [notification, ...withoutDuplicate]
    .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
    .slice(0, limit);
}
