<script>
  import { theme, saveTheme, view, DEFAULT_THEME, PRESET_THEMES, sounds, replaceAllFromBundle, appendSounds } from '../lib/stores.js';
  import { blobToDataUrl } from '../lib/theme.js';
  import { exportBundleBlob, exportFilename, parseBundle, decodeBundleSounds, BundleError } from '../lib/backup.js';
  import ColorPicker from './ColorPicker.svelte';

  let openPicker = null;
  let importFile = null;
  let importMode = 'replace';
  let importMsg = '';
  let importBusy = false;
  let exportBusy = false;

  const swatches = [
    { key: 'bgColor', label: 'Background' },
    { key: 'accentColor', label: 'Accent' },
    { key: 'buttonColor', label: 'Button' },
    { key: 'buttonHoverColor', label: 'Button hover' },
    { key: 'buttonTextColor', label: 'Text' }
  ];

  async function updateColor(key, val) {
    await saveTheme({ ...$theme, [key]: val });
  }

  async function updateRadius(e) {
    await saveTheme({ ...$theme, buttonRadius: Number(e.target.value) });
  }

  async function applyPreset(name) {
    const preset = PRESET_THEMES[name];
    await saveTheme({ ...preset, bgImageDataUrl: $theme.bgImageDataUrl });
  }

  async function handleBgImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await blobToDataUrl(file);
    await saveTheme({ ...$theme, bgImageDataUrl: url });
  }

  async function clearBgImage() {
    await saveTheme({ ...$theme, bgImageDataUrl: null });
  }

  async function reset() {
    await saveTheme({ ...DEFAULT_THEME });
  }

  async function exportSoundboard() {
    exportBusy = true;
    try {
      const blob = await exportBundleBlob($sounds, $theme);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFilename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } finally {
      exportBusy = false;
    }
  }

  function handleImportFile(e) {
    importFile = e.target.files?.[0] || null;
    importMsg = '';
  }

  async function doImport() {
    if (!importFile) return;
    importMsg = '';
    importBusy = true;
    try {
      const bundle = await parseBundle(importFile);
      const decoded = decodeBundleSounds(bundle);
      if (importMode === 'replace') {
        const count = $sounds.length;
        if (count > 0) {
          const ok = confirm(
            `Replace all ${count} existing sound${count === 1 ? '' : 's'} and theme with the imported soundboard? This can't be undone.`
          );
          if (!ok) {
            importBusy = false;
            return;
          }
        }
        await replaceAllFromBundle(decoded, bundle.theme);
        importMsg = `Imported ${decoded.length} sound${decoded.length === 1 ? '' : 's'}.`;
      } else {
        await appendSounds(decoded);
        importMsg = `Added ${decoded.length} sound${decoded.length === 1 ? '' : 's'}.`;
      }
      importFile = null;
      const input = document.getElementById('import-file');
      if (input) input.value = '';
    } catch (err) {
      importMsg = err instanceof BundleError ? err.message : 'Import failed: ' + err.message;
    } finally {
      importBusy = false;
    }
  }

  function close() { view.set('grid'); }
</script>

<div class="settings">
  <header>
    <button class="back" on:click={close}>← Back</button>
    <h1>Settings</h1>
  </header>

  <section>
    <h2>Presets</h2>
    <div class="presets">
      {#each Object.keys(PRESET_THEMES) as p}
        <button class="preset" on:click={() => applyPreset(p)}>{p}</button>
      {/each}
      <button class="preset" on:click={reset}>Reset defaults</button>
    </div>
  </section>

  <section>
    <h2>Colors</h2>
    <div class="colors">
      {#each swatches as s}
        <div class="color-row">
          <button
            class="swatch"
            style="background: {$theme[s.key]}"
            on:click={() => (openPicker = openPicker === s.key ? null : s.key)}
            aria-label={`Change ${s.label}`}
          ></button>
          <span class="color-label">{s.label}</span>
          <span class="hex">{$theme[s.key]}</span>
        </div>
        {#if openPicker === s.key}
          <div class="picker-wrap">
            <ColorPicker value={$theme[s.key]} on:change={(e) => updateColor(s.key, e.detail)} />
          </div>
        {/if}
      {/each}
    </div>
  </section>

  <section>
    <h2>Button shape</h2>
    <label class="slider-row">
      <span>Corner radius: {$theme.buttonRadius}px</span>
      <input type="range" min="0" max="40" value={$theme.buttonRadius} on:input={updateRadius} />
    </label>
  </section>

  <section>
    <h2>Background image</h2>
    <input type="file" accept="image/*" on:change={handleBgImage} />
    {#if $theme.bgImageDataUrl}
      <div class="bg-preview">
        <img src={$theme.bgImageDataUrl} alt="Background preview" />
        <button on:click={clearBgImage}>Remove</button>
      </div>
    {/if}
  </section>

  <section>
    <h2>Backup & sync</h2>
    <p class="section-hint">
      Export a file containing your sounds and theme, then import it on another device
      to sync. Transfer the file however you like — AirDrop, Drive, email.
    </p>
    <div class="backup-row">
      <button class="backup-btn" on:click={exportSoundboard} disabled={exportBusy || $sounds.length === 0}>
        {exportBusy ? 'Exporting…' : `Export soundboard (${$sounds.length})`}
      </button>
    </div>

    <div class="import-block">
      <label for="import-file" class="import-label">Import from file</label>
      <input id="import-file" type="file" accept=".json,application/json" on:change={handleImportFile} />
      <div class="import-modes">
        <label class="mode-option">
          <input type="radio" bind:group={importMode} value="replace" />
          Replace everything
        </label>
        <label class="mode-option">
          <input type="radio" bind:group={importMode} value="append" />
          Add to my sounds
        </label>
      </div>
      <button class="backup-btn" on:click={doImport} disabled={!importFile || importBusy}>
        {importBusy ? 'Importing…' : 'Import'}
      </button>
      {#if importMsg}
        <p class="import-msg">{importMsg}</p>
      {/if}
    </div>
  </section>
</div>

<style>
  .settings {
    max-width: 720px;
    margin: 0 auto;
    padding: 16px;
    color: var(--button-text-color);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  header h1 { margin: 0; font-size: 1.4rem; }
  h2 { font-size: 1rem; margin: 0 0 12px 0; opacity: 0.85; }
  .back {
    padding: 8px 12px;
    background: transparent;
    color: var(--button-text-color);
    border: 1px solid color-mix(in srgb, var(--button-text-color) 25%, transparent);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .preset {
    padding: 8px 14px;
    background: var(--button-color);
    color: var(--button-text-color);
    border: 1px solid color-mix(in srgb, var(--button-text-color) 20%, transparent);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
  }
  .preset:hover { background: var(--button-hover-color); }
  .colors { display: flex; flex-direction: column; gap: 10px; }
  .color-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .swatch {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid rgba(255,255,255,0.15);
    cursor: pointer;
    padding: 0;
  }
  .color-label { font-weight: 600; }
  .hex {
    margin-left: auto;
    font-family: monospace;
    opacity: 0.7;
    font-size: 0.9rem;
  }
  .picker-wrap {
    padding-left: 52px;
    padding-bottom: 8px;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .slider-row input { flex: 1; min-width: 200px; accent-color: var(--accent-color); }
  .bg-preview {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .bg-preview img {
    width: 120px;
    height: 68px;
    object-fit: cover;
    border-radius: 6px;
  }
  .bg-preview button {
    padding: 6px 12px;
    background: transparent;
    color: var(--button-text-color);
    border: 1px solid color-mix(in srgb, var(--button-text-color) 30%, transparent);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
  }
  .section-hint {
    margin: 0 0 12px 0;
    opacity: 0.75;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  .backup-row {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .backup-btn {
    padding: 10px 16px;
    background: var(--accent-color);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .backup-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .import-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid color-mix(in srgb, var(--button-text-color) 15%, transparent);
    border-radius: 8px;
  }
  .import-label {
    font-weight: 600;
    font-size: 0.9rem;
    opacity: 0.85;
  }
  .import-modes {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .mode-option {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.95rem;
  }
  .mode-option input {
    accent-color: var(--accent-color);
  }
  .import-msg {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }
</style>
