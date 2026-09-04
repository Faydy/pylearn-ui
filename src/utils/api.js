export function getApiEndpoint(path) {
  const apiBaseUrl = import.meta.env.VITE_API_URL?.trim();

  if (!apiBaseUrl) {
    throw new Error('Lipsește configurarea VITE_API_URL pentru API-ul PyLearn.');
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}
