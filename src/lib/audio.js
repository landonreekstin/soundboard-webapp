let ctx = null;
const bufferCache = new Map();
const CACHE_LIMIT = 20;

export function getAudioContext() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export async function decodeBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const context = getAudioContext();
  return new Promise((resolve, reject) => {
    context.decodeAudioData(
      arrayBuffer.slice(0),
      (buf) => resolve(buf),
      (err) => reject(err || new Error('Could not decode audio'))
    );
  });
}

async function getBuffer(sound) {
  if (bufferCache.has(sound.id)) {
    const cached = bufferCache.get(sound.id);
    bufferCache.delete(sound.id);
    bufferCache.set(sound.id, cached);
    return cached;
  }
  const buffer = await decodeBlob(sound.audioBlob);
  bufferCache.set(sound.id, buffer);
  while (bufferCache.size > CACHE_LIMIT) {
    const firstKey = bufferCache.keys().next().value;
    bufferCache.delete(firstKey);
  }
  return buffer;
}

export function evictBuffer(id) {
  bufferCache.delete(id);
}

export async function playSound(sound) {
  const context = getAudioContext();
  const buffer = await getBuffer(sound);
  const src = context.createBufferSource();
  src.buffer = buffer;
  src.connect(context.destination);
  const start = Math.max(0, sound.trimStart || 0);
  const end = Math.min(buffer.duration, sound.trimEnd || buffer.duration);
  const dur = Math.max(0, end - start);
  src.start(0, start, dur);
  return src;
}
