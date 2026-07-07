<script>
  import { theme, saveTheme, view, DEFAULT_THEME, PRESET_THEMES } from '../lib/stores.js';
  import { blobToDataUrl } from '../lib/theme.js';
  import ColorPicker from './ColorPicker.svelte';

  let openPicker = null;

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
</style>
