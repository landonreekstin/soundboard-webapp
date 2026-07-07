export class UrlImportError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.name = 'UrlImportError';
    this.code = code;
  }
}

function normalizeInstance(raw) {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new UrlImportError('Instance URL must start with https:// or http://');
  }
  return trimmed;
}

export async function fetchAudioFromUrl(sourceUrl, prefs) {
  const url = sourceUrl.trim();
  if (!url) throw new UrlImportError('Paste a URL first.');
  if (!prefs?.cobaltInstance) {
    throw new UrlImportError('Set a Cobalt instance URL in Settings to import from URL.');
  }

  const instance = normalizeInstance(prefs.cobaltInstance);
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  if (prefs.cobaltApiKey?.trim()) {
    headers['Authorization'] = `Api-Key ${prefs.cobaltApiKey.trim()}`;
  }

  let res;
  try {
    res = await fetch(instance, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        downloadMode: 'audio',
        audioFormat: 'mp3'
      })
    });
  } catch (e) {
    throw new UrlImportError("Couldn't reach the Cobalt instance. Check the URL in Settings.");
  }

  if (res.status === 401 || res.status === 403) {
    throw new UrlImportError('The Cobalt instance requires an API key, or the key is invalid.');
  }
  if (res.status === 429) {
    throw new UrlImportError('Rate limited by the Cobalt instance. Wait a moment and try again.');
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new UrlImportError(`Cobalt instance returned a non-JSON response (HTTP ${res.status}).`);
  }

  if (payload.status === 'error') {
    const code = payload.error?.code || 'unknown';
    throw new UrlImportError(`Cobalt error: ${code}`, { code });
  }
  if (payload.status === 'picker') {
    throw new UrlImportError('This URL has multiple audio tracks; pick one on the source site first.');
  }
  if (payload.status !== 'tunnel' && payload.status !== 'redirect') {
    throw new UrlImportError(`Unexpected Cobalt response status: ${payload.status}`);
  }
  if (!payload.url) {
    throw new UrlImportError('Cobalt response was missing a download URL.');
  }

  let audioRes;
  try {
    audioRes = await fetch(payload.url);
  } catch {
    throw new UrlImportError("Couldn't download the audio from the Cobalt tunnel URL.");
  }
  if (!audioRes.ok) {
    throw new UrlImportError(`Audio download failed (HTTP ${audioRes.status}).`);
  }

  const blob = await audioRes.blob();
  const filename = payload.filename || 'sound.mp3';
  return { blob, filename };
}
