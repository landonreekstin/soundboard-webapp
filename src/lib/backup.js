import { DEFAULT_THEME } from './stores.js';

export const BUNDLE_VERSION = 1;

export class BundleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BundleError';
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result;
      const comma = s.indexOf(',');
      resolve(comma === -1 ? s : s.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(b64, mimeType) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
}

export async function buildBundle(sounds, theme) {
  const encodedSounds = await Promise.all(
    sounds.map(async (s) => ({
      id: s.id,
      name: s.name,
      audioMimeType: s.audioMimeType,
      audioBase64: await blobToBase64(s.audioBlob),
      imageMimeType: s.imageBlob ? (s.imageBlob.type || 'image/png') : null,
      imageBase64: s.imageBlob ? await blobToBase64(s.imageBlob) : null,
      duration: s.duration,
      trimStart: s.trimStart,
      trimEnd: s.trimEnd,
      createdAt: s.createdAt,
      order: s.order
    }))
  );
  return {
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    theme: theme || DEFAULT_THEME,
    sounds: encodedSounds
  };
}

export async function exportBundleBlob(sounds, theme) {
  const bundle = await buildBundle(sounds, theme);
  const text = JSON.stringify(bundle);
  return new Blob([text], { type: 'application/json' });
}

export function exportFilename() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `soundboard-${yyyy}-${mm}-${dd}.json`;
}

export async function parseBundle(file) {
  let text;
  try {
    text = await file.text();
  } catch {
    throw new BundleError("Couldn't read that file.");
  }
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new BundleError("That file doesn't look like a soundboard export.");
  }
  if (!obj || typeof obj !== 'object') {
    throw new BundleError("That file doesn't look like a soundboard export.");
  }
  if (typeof obj.version !== 'number') {
    throw new BundleError("That file doesn't look like a soundboard export.");
  }
  if (obj.version > BUNDLE_VERSION) {
    throw new BundleError('This file was made by a newer version of the app.');
  }
  if (!Array.isArray(obj.sounds)) {
    throw new BundleError("The file is missing some data and can't be imported.");
  }
  return obj;
}

export function decodeBundleSounds(bundle) {
  return bundle.sounds.map((s) => {
    if (typeof s.audioBase64 !== 'string' || typeof s.name !== 'string' || typeof s.id !== 'string') {
      throw new BundleError("The file is missing some data and can't be imported.");
    }
    let audioBlob;
    let imageBlob = null;
    try {
      audioBlob = base64ToBlob(s.audioBase64, s.audioMimeType);
      if (s.imageBase64) imageBlob = base64ToBlob(s.imageBase64, s.imageMimeType);
    } catch {
      throw new BundleError('One of the audio files inside is corrupted.');
    }
    return {
      id: s.id,
      name: s.name,
      audioBlob,
      audioMimeType: s.audioMimeType || audioBlob.type || 'audio/unknown',
      imageBlob,
      duration: Number(s.duration) || 0,
      trimStart: Number(s.trimStart) || 0,
      trimEnd: Number(s.trimEnd) || Number(s.duration) || 0,
      createdAt: Number(s.createdAt) || Date.now(),
      order: Number(s.order) || 0
    };
  });
}
