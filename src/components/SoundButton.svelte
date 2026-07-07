<script>
  import { playSound } from '../lib/audio.js';
  import { editingSound, view } from '../lib/stores.js';

  export let sound;

  let imageUrl = null;
  $: {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = sound.imageBlob ? URL.createObjectURL(sound.imageBlob) : null;
  }

  let pressed = false;
  async function handleClick() {
    pressed = true;
    setTimeout(() => (pressed = false), 120);
    try {
      await playSound(sound);
    } catch (e) {
      console.error('Playback failed', e);
    }
  }

  function handleEdit(e) {
    e.stopPropagation();
    editingSound.set(sound);
    view.set('editor');
  }
</script>

<button class="sound-btn" class:pressed on:click={handleClick} title={sound.name}>
  {#if imageUrl}
    <img src={imageUrl} alt="" />
    <span class="label label-overlay">{sound.name}</span>
  {:else}
    <span class="label">{sound.name}</span>
  {/if}
  <span class="edit-icon" on:click={handleEdit} on:keydown={handleEdit} role="button" tabindex="0" aria-label="Edit sound">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  </span>
</button>

<style>
  .sound-btn {
    position: relative;
    aspect-ratio: 1 / 1;
    width: 100%;
    border: none;
    border-radius: var(--button-radius, 12px);
    background: var(--button-color, #2b2d31);
    color: var(--button-text-color, #ffffff);
    cursor: pointer;
    overflow: hidden;
    font-family: inherit;
    font-weight: 600;
    transition: transform 0.08s ease, background 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .sound-btn:hover {
    background: var(--button-hover-color, #3a3d43);
  }
  .sound-btn.pressed {
    transform: scale(0.96);
  }
  .sound-btn img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .label {
    position: relative;
    z-index: 1;
    padding: 0 8px;
    text-align: center;
    word-break: break-word;
    font-size: clamp(0.7rem, 2.5cqi, 1.2rem);
  }
  .label-overlay {
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    padding: 4px 8px;
    border-radius: 6px;
    max-width: 90%;
  }
  .edit-icon {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 2;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s ease;
    cursor: pointer;
  }
  .sound-btn:hover .edit-icon,
  .sound-btn:focus-within .edit-icon {
    opacity: 1;
  }
</style>
