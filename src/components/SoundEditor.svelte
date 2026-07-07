<script>
  import { view, editingSound, saveSound, removeSound, sounds, prefs } from '../lib/stores.js';
  import { decodeBlob, playSound } from '../lib/audio.js';
  import { fetchAudioFromUrl, UrlImportError } from '../lib/urlImport.js';
  import WaveformTrimmer from './WaveformTrimmer.svelte';

  let name = '';
  let audioBlob = null;
  let audioMimeType = '';
  let audioBuffer = null;
  let imageBlob = null;
  let trimStart = 0;
  let trimEnd = 0;
  let duration = 0;
  let errorMsg = '';
  let loading = false;
  let previewSource = null;
  let sourceUrl = '';
  let fetching = false;

  const isNew = !$editingSound;

  if ($editingSound) {
    const s = $editingSound;
    name = s.name;
    audioBlob = s.audioBlob;
    audioMimeType = s.audioMimeType;
    imageBlob = s.imageBlob;
    trimStart = s.trimStart;
    trimEnd = s.trimEnd;
    duration = s.duration;
    decodeBlob(audioBlob)
      .then((buf) => {
        audioBuffer = buf;
      })
      .catch((e) => (errorMsg = 'Could not decode saved audio: ' + e.message));
  }

  async function loadAudioBlob(blob, displayName) {
    const buf = await decodeBlob(blob);
    audioBlob = blob;
    audioMimeType = blob.type || 'audio/unknown';
    audioBuffer = buf;
    duration = buf.duration;
    trimStart = 0;
    trimEnd = buf.duration;
    if (!name && displayName) name = displayName.replace(/\.[^.]+$/, '');
  }

  async function handleAudioFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    errorMsg = '';
    loading = true;
    try {
      await loadAudioBlob(file, file.name);
    } catch (err) {
      errorMsg = `This browser can't decode "${file.name}". Try MP3, WAV, or M4A.`;
      audioBlob = null;
      audioBuffer = null;
    }
    loading = false;
  }

  async function handleFetchUrl() {
    if (!sourceUrl.trim()) return;
    errorMsg = '';
    fetching = true;
    try {
      const { blob, filename } = await fetchAudioFromUrl(sourceUrl, $prefs);
      await loadAudioBlob(blob, filename);
    } catch (err) {
      if (err instanceof UrlImportError) {
        errorMsg = err.message;
      } else {
        errorMsg = 'Import failed: ' + err.message;
      }
      audioBlob = null;
      audioBuffer = null;
    }
    fetching = false;
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    imageBlob = file;
  }

  function clearImage() {
    imageBlob = null;
  }

  function handleTrim(e) {
    trimStart = e.detail.trimStart;
    trimEnd = e.detail.trimEnd;
  }

  async function preview() {
    if (previewSource) {
      try { previewSource.stop(); } catch {}
      previewSource = null;
    }
    previewSource = await playSound({
      id: 'preview',
      audioBlob,
      trimStart,
      trimEnd
    });
  }

  async function save() {
    if (!audioBlob || !name.trim()) {
      errorMsg = 'A name and an audio file are required.';
      return;
    }
    const existing = $editingSound;
    const id = existing?.id || crypto.randomUUID();
    const order = existing?.order ?? $sounds.length;
    await saveSound({
      id,
      name: name.trim(),
      imageBlob,
      audioBlob,
      audioMimeType,
      duration,
      trimStart,
      trimEnd,
      createdAt: existing?.createdAt || Date.now(),
      order
    });
    close();
  }

  async function del() {
    if (!$editingSound) return;
    if (!confirm(`Delete "${$editingSound.name}"?`)) return;
    await removeSound($editingSound.id);
    close();
  }

  function close() {
    editingSound.set(null);
    view.set('grid');
  }
</script>

<div class="editor">
  <header>
    <button class="back" on:click={close}>← Back</button>
    <h1>{isNew ? 'New sound' : 'Edit sound'}</h1>
    {#if !isNew}
      <button class="danger" on:click={del}>Delete</button>
    {/if}
  </header>

  <section class="field">
    <label for="sound-name">Name</label>
    <input id="sound-name" type="text" bind:value={name} placeholder="My sound" maxlength="60" />
  </section>

  <section class="field">
    <label for="sound-url">Import from URL (YouTube, TikTok, …)</label>
    <div class="url-row">
      <input
        id="sound-url"
        type="url"
        bind:value={sourceUrl}
        placeholder="https://youtube.com/watch?v=…"
        disabled={fetching}
      />
      <button
        class="fetch"
        on:click={handleFetchUrl}
        disabled={fetching || !sourceUrl.trim()}
      >
        {fetching ? 'Fetching…' : 'Fetch audio'}
      </button>
    </div>
    {#if !$prefs?.cobaltInstance}
      <p class="hint">Set a Cobalt instance URL in Settings first.</p>
    {/if}
  </section>

  <section class="field">
    <label for="sound-audio">Or upload an audio file</label>
    <input id="sound-audio" type="file" accept="audio/*" on:change={handleAudioFile} />
    {#if loading}
      <p class="hint">Decoding…</p>
    {/if}
    {#if errorMsg}
      <p class="error">{errorMsg}</p>
    {/if}
  </section>

  {#if audioBuffer}
    <section class="field">
      <span class="label-text">Trim ({duration.toFixed(2)}s)</span>
      <WaveformTrimmer {audioBuffer} {trimStart} {trimEnd} on:change={handleTrim} />
      <button class="preview" on:click={preview}>▶ Preview clip</button>
    </section>
  {/if}

  <section class="field">
    <label for="sound-image">Image (optional)</label>
    <input id="sound-image" type="file" accept="image/*" on:change={handleImageFile} />
    {#if imageBlob}
      <div class="image-preview">
        <img src={URL.createObjectURL(imageBlob)} alt="" />
        <button on:click={clearImage}>Remove image</button>
      </div>
    {/if}
  </section>

  <footer>
    <button class="primary" on:click={save} disabled={!audioBlob || !name.trim()}>
      {isNew ? 'Add sound' : 'Save'}
    </button>
  </footer>
</div>

<style>
  .editor {
    max-width: 720px;
    margin: 0 auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: var(--button-text-color);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  header h1 {
    margin: 0;
    font-size: 1.4rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .field label,
  .field .label-text {
    font-weight: 600;
    font-size: 0.9rem;
    opacity: 0.85;
  }
  input[type='text'],
  input[type='url'] {
    padding: 10px 12px;
    background: var(--button-color);
    color: var(--button-text-color);
    border: 1px solid color-mix(in srgb, var(--button-text-color) 20%, transparent);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
  }
  .url-row {
    display: flex;
    gap: 8px;
  }
  .url-row input {
    flex: 1;
    min-width: 0;
  }
  .fetch {
    padding: 10px 16px;
    background: var(--accent-color);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .fetch:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  input[type='file'] {
    color: var(--button-text-color);
  }
  .hint { opacity: 0.7; }
  .error { color: #ff6b6b; }
  .preview {
    align-self: flex-start;
    padding: 8px 14px;
    border: none;
    background: var(--accent-color);
    color: #fff;
    border-radius: 6px;
    font-family: inherit;
    cursor: pointer;
    margin-top: 8px;
  }
  .image-preview {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .image-preview img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
  }
  .image-preview button {
    padding: 6px 10px;
    background: transparent;
    color: var(--button-text-color);
    border: 1px solid color-mix(in srgb, var(--button-text-color) 30%, transparent);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
  }
  .back, .danger {
    padding: 8px 12px;
    background: transparent;
    color: var(--button-text-color);
    border: 1px solid color-mix(in srgb, var(--button-text-color) 25%, transparent);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
  }
  .danger { color: #ff6b6b; border-color: #ff6b6b; }
  .primary {
    padding: 12px 24px;
    background: var(--accent-color);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
  .primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
