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
