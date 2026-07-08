import { openDB } from 'idb';

const DB_NAME = 'soundboard';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sounds')) {
      db.createObjectStore('sounds', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings');
    }
  }
});

export async function getAllSounds() {
  const db = await dbPromise;
  const all = await db.getAll('sounds');
  return all.sort((a, b) => a.order - b.order);
}

export async function putSound(sound) {
  const db = await dbPromise;
  await db.put('sounds', sound);
  return sound;
}

export async function deleteSound(id) {
  const db = await dbPromise;
  await db.delete('sounds', id);
}

export async function countSounds() {
  const db = await dbPromise;
  return db.count('sounds');
}

export async function replaceAllSounds(newSounds) {
  const db = await dbPromise;
  const tx = db.transaction('sounds', 'readwrite');
  await tx.store.clear();
  for (const s of newSounds) {
    await tx.store.put(s);
  }
  await tx.done;
}

export async function getTheme() {
  const db = await dbPromise;
  return db.get('settings', 'theme');
}

export async function putTheme(theme) {
  const db = await dbPromise;
  await db.put('settings', theme, 'theme');
  return theme;
}
