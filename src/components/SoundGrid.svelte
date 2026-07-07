<script>
  import { sounds, editingSound, view } from '../lib/stores.js';
  import SoundButton from './SoundButton.svelte';

  const MAX_SOUNDS = 50;

  $: count = $sounds.length;
  $: canAdd = count < MAX_SOUNDS;
  $: cols = computeCols(count);

  function computeCols(n) {
    if (n <= 1) return 1;
    if (n <= 4) return 2;
    if (n <= 9) return 3;
    if (n <= 16) return 4;
    if (n <= 25) return 5;
    if (n <= 36) return 6;
    return 7;
  }

  function handleAdd() {
    editingSound.set(null);
    view.set('editor');
  }
</script>

<div class="grid" style="--cols: {cols}">
  {#each $sounds as sound (sound.id)}
    <SoundButton {sound} />
  {/each}

  {#if canAdd}
    <button class="add-tile" on:click={handleAdd} title="Add a sound">
      <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>Add sound</span>
    </button>
  {/if}
</div>

{#if count === 0}
  <p class="empty-hint">Click + to add your first sound.</p>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 12px;
    padding: 16px;
    container-type: inline-size;
  }
  .add-tile {
    aspect-ratio: 1 / 1;
    border: 2px dashed color-mix(in srgb, var(--button-text-color) 40%, transparent);
    background: transparent;
    color: color-mix(in srgb, var(--button-text-color) 70%, transparent);
    border-radius: var(--button-radius, 12px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
    font-size: clamp(0.75rem, 2cqi, 1rem);
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .add-tile:hover {
    background: color-mix(in srgb, var(--accent-color) 15%, transparent);
    border-color: var(--accent-color);
    color: var(--accent-color);
  }
  .empty-hint {
    text-align: center;
    color: color-mix(in srgb, var(--button-text-color) 60%, transparent);
    margin-top: 24px;
  }
</style>
