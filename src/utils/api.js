export function getApiEndpoint(path) {
  const apiBaseUrl = import.meta.env.VITE_API_URL?.trim();

  if (!apiBaseUrl) {
    throw new Error('Lipsește configurarea VITE_API_URL pentru API-ul PyLearn.');
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

export async function parseApiJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function getApiErrorMessage(response, data, fallback) {
  const serverMessage = data?.error || data?.output;
  if (serverMessage) return serverMessage;
  if (!response.ok) return `${fallback} HTTP ${response.status}.`;
  return fallback;
}

export async function runCode(code, input = '') {
  try {
    const response = await fetch(getApiEndpoint('/run'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, input }),
    });
    const data = await parseApiJson(response);
    if (response.ok && data?.success) {
      return { success: true, output: data.output || '' };
    }
    return {
      success: false,
      output: getApiErrorMessage(response, data, 'Eroare necunoscută la execuție.'),
    };
  } catch (error) {
    return { success: false, output: `Eroare de conexiune la server: ${error.message}` };
  }
}
