<script>
  import { onMount } from 'svelte';
  import { view, theme, loadInitial } from './lib/stores.js';
  import { applyTheme } from './lib/theme.js';
  import SoundGrid from './components/SoundGrid.svelte';
  import SoundEditor from './components/SoundEditor.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';

  let ready = false;
  let idbAvailable = true;

  onMount(async () => {
    try {
      await loadInitial();
      ready = true;
    } catch (e) {
      console.error('Failed to load data', e);
      idbAvailable = false;
    }
  });

  $: applyTheme($theme);

  function openSettings() { view.set('settings'); }
  function goHome() { view.set('grid'); }
</script>

<main>
  <nav class="topbar">
    <button class="title" on:click={goHome}>🎛 Soundboard</button>
    <div class="spacer"></div>
    <button class="icon-btn" on:click={openSettings} aria-label="Settings">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
      </svg>
    </button>
  </nav>

  {#if !idbAvailable}
    <div class="warning">
      Your browser blocks IndexedDB (likely private/incognito mode). Sounds and settings cannot be saved.
    </div>
  {:else if !ready}
    <div class="loading">Loading…</div>
  {:else if $view === 'grid'}
    <SoundGrid />
  {:else if $view === 'editor'}
    <SoundEditor />
  {:else if $view === 'settings'}
    <SettingsPanel />
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    color: var(--button-text-color);
    font-family: var(--font-family);
  }
  .topbar {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: color-mix(in srgb, var(--bg-color) 80%, black 20%);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid color-mix(in srgb, var(--button-text-color) 10%, transparent);
  }
  .title {
    background: transparent;
    border: none;
    color: var(--button-text-color);
    font-family: inherit;
    font-weight: 700;
    font-size: 1.15rem;
    cursor: pointer;
    padding: 4px 8px;
  }
  .spacer { flex: 1; }
  .icon-btn {
    background: transparent;
    border: none;
    color: var(--button-text-color);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon-btn:hover { background: color-mix(in srgb, var(--button-text-color) 10%, transparent); }
  .loading { text-align: center; padding: 40px; opacity: 0.7; }
  .warning {
    margin: 16px;
    padding: 12px 16px;
    background: #ffb020;
    color: #1a1a1a;
    border-radius: 8px;
    font-weight: 600;
  }
</style>
