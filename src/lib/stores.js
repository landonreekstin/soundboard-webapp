import { writable } from 'svelte/store';
import { getAllSounds, putSound, deleteSound, getTheme, putTheme, getPrefs, putPrefs } from './db.js';
import { evictBuffer } from './audio.js';

export const sounds = writable([]);
export const theme = writable(null);
export const prefs = writable(null);
export const view = writable('grid');
export const editingSound = writable(null);

export const DEFAULT_PREFS = {
  cobaltInstance: '',
  cobaltApiKey: ''
};

export const DEFAULT_THEME = {
  bgColor: '#1e1f22',
  bgImageDataUrl: null,
  accentColor: '#5865f2',
  buttonColor: '#2b2d31',
  buttonHoverColor: '#3a3d43',
  buttonTextColor: '#ffffff',
  buttonRadius: 12,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
};

export const PRESET_THEMES = {
  Dark: DEFAULT_THEME,
  Light: {
    ...DEFAULT_THEME,
    bgColor: '#f2f3f5',
    accentColor: '#5865f2',
    buttonColor: '#ffffff',
    buttonHoverColor: '#ebedef',
    buttonTextColor: '#2e3338'
  },
  Discord: {
    ...DEFAULT_THEME,
    bgColor: '#313338',
    accentColor: '#5865f2',
    buttonColor: '#404249',
    buttonHoverColor: '#4e5058',
    buttonTextColor: '#ffffff'
  },
  Retro: {
    ...DEFAULT_THEME,
    bgColor: '#2a1b3d',
    accentColor: '#ff5e78',
    buttonColor: '#44318d',
    buttonHoverColor: '#5b45b3',
    buttonTextColor: '#ffe5b4',
    buttonRadius: 6
  },
  Ocean: {
    ...DEFAULT_THEME,
    bgColor: '#0b3d5c',
    accentColor: '#5edfff',
    buttonColor: '#155e83',
    buttonHoverColor: '#1e7fae',
    buttonTextColor: '#e8f9ff',
    buttonRadius: 20
  }
};

export async function loadInitial() {
  const [loadedSounds, loadedTheme, loadedPrefs] = await Promise.all([
    getAllSounds(),
    getTheme(),
    getPrefs()
  ]);
  sounds.set(loadedSounds);
  theme.set(loadedTheme || DEFAULT_THEME);
  prefs.set({ ...DEFAULT_PREFS, ...(loadedPrefs || {}) });
}

export async function saveSound(sound) {
  await putSound(sound);
  evictBuffer(sound.id);
  const all = await getAllSounds();
  sounds.set(all);
}

export async function removeSound(id) {
  await deleteSound(id);
  evictBuffer(id);
  const all = await getAllSounds();
  sounds.set(all);
}

export async function saveTheme(next) {
  await putTheme(next);
  theme.set(next);
}

export async function savePrefs(next) {
  await putPrefs(next);
  prefs.set(next);
}
