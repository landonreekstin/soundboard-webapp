<script>
  import { sounds, editingSound, view } from '../lib/stores.js';
  import SoundButton from './SoundButton.svelte';

  const MAX_SOUNDS = 50;
  const MAX_TILE = 260;
  const MIN_TILE = 80;
  const TOPBAR_H = 60;
  const GRID_PAD = 32;

  let vw = 1000;
  let vh = 700;

  $: canAdd = $sounds.length < MAX_SOUNDS;
  $: total = $sounds.length + (canAdd ? 1 : 0);
  $: layout = computeLayout(total, vw, vh);

  function computeLayout(n, w, h) {
    if (n <= 0) return { cols: 1, size: MAX_TILE };
    const availW = Math.max(200, w - GRID_PAD);
    const availH = Math.max(200, h - TOPBAR_H - GRID_PAD);
    const aspect = availW / availH;
    let best = null;
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      const rawSize = Math.min(availW / c, availH / r);
      const size = Math.min(rawSize, MAX_TILE);
      const emptyCells = c * r - n;
      const score = size - emptyCells * 24;
      const aspectDiff = Math.abs(c / r - aspect);
      if (
        !best ||
        score > best.score ||
        (score === best.score && aspectDiff < best.aspectDiff)
      ) {
        best = { cols: c, size, score, aspectDiff };
      }
    }
    return { cols: best.cols, size: Math.max(MIN_TILE, best.size) };
  }

  function handleAdd() {
    editingSound.set(null);
    view.set('editor');
  }
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />

<div class="grid" style="--cols: {layout.cols}; --tile-size: {layout.size}px">
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

{#if $sounds.length === 0}
  <p class="empty-hint">Click + to add your first sound.</p>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, var(--tile-size)));
    gap: 12px;
    padding: 16px;
    justify-content: center;
    align-content: start;
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
    font-size: clamp(0.75rem, 6cqi, 1rem);
    container-type: inline-size;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .add-tile svg {
    width: min(42px, 30cqi);
    height: min(42px, 30cqi);
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
