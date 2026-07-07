<script>
  import { onMount, createEventDispatcher } from 'svelte';

  export let audioBuffer;
  export let trimStart;
  export let trimEnd;

  const dispatch = createEventDispatcher();

  let canvas;
  let container;
  let width = 800;
  let height = 140;

  $: duration = audioBuffer ? audioBuffer.duration : 0;
  $: startPct = duration ? (trimStart / duration) * 100 : 0;
  $: endPct = duration ? (trimEnd / duration) * 100 : 100;

  onMount(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = Math.floor(entry.contentRect.width);
        drawWaveform();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  });

  $: if (audioBuffer && canvas) drawWaveform();

  function drawWaveform() {
    if (!canvas || !audioBuffer) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const channelData = audioBuffer.getChannelData(0);
    const samples = 1000;
    const blockSize = Math.floor(channelData.length / samples);
    const points = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      let max = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        const v = Math.abs(channelData[start + j] || 0);
        if (v > max) max = v;
      }
      points[i] = max;
    }

    const styles = getComputedStyle(document.documentElement);
    const accent = styles.getPropertyValue('--accent-color').trim() || '#5865f2';
    ctx.fillStyle = accent;

    const barWidth = width / samples;
    const mid = height / 2;
    for (let i = 0; i < samples; i++) {
      const barHeight = points[i] * (height * 0.9);
      ctx.fillRect(i * barWidth, mid - barHeight / 2, Math.max(1, barWidth - 0.5), barHeight);
    }
  }

  let dragging = null;

  function onPointerDown(handle, e) {
    e.preventDefault();
    dragging = handle;
    e.target.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const t = (x / rect.width) * duration;
    if (dragging === 'start') {
      const newStart = Math.min(t, trimEnd - 0.05);
      dispatch('change', { trimStart: Math.max(0, newStart), trimEnd });
    } else if (dragging === 'end') {
      const newEnd = Math.max(t, trimStart + 0.05);
      dispatch('change', { trimStart, trimEnd: Math.min(duration, newEnd) });
    }
  }

  function onPointerUp() {
    dragging = null;
  }
</script>

<div
  class="trimmer"
  role="group"
  aria-label="Audio trim controls"
  bind:this={container}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:pointercancel={onPointerUp}
>
  <canvas bind:this={canvas}></canvas>
  <div class="mask left" style="width: {startPct}%"></div>
  <div class="mask right" style="width: {100 - endPct}%"></div>
  <div
    class="handle start"
    style="left: {startPct}%"
    on:pointerdown={(e) => onPointerDown('start', e)}
    role="slider"
    tabindex="0"
    aria-label="Trim start"
    aria-valuemin="0"
    aria-valuemax={duration}
    aria-valuenow={trimStart}
  ></div>
  <div
    class="handle end"
    style="left: {endPct}%"
    on:pointerdown={(e) => onPointerDown('end', e)}
    role="slider"
    tabindex="0"
    aria-label="Trim end"
    aria-valuemin="0"
    aria-valuemax={duration}
    aria-valuenow={trimEnd}
  ></div>
</div>

<div class="times">
  <span>{trimStart.toFixed(2)}s</span>
  <span>Clip: {(trimEnd - trimStart).toFixed(2)}s</span>
  <span>{trimEnd.toFixed(2)}s</span>
</div>

<style>
  .trimmer {
    position: relative;
    width: 100%;
    height: 140px;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    overflow: hidden;
    touch-action: none;
    user-select: none;
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .mask {
    position: absolute;
    top: 0;
    height: 100%;
    background: rgba(0, 0, 0, 0.55);
    pointer-events: none;
  }
  .mask.left { left: 0; }
  .mask.right { right: 0; }
  .handle {
    position: absolute;
    top: 0;
    height: 100%;
    width: 4px;
    background: var(--accent-color, #5865f2);
    transform: translateX(-2px);
    cursor: ew-resize;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  }
  .handle::before {
    content: '';
    position: absolute;
    inset: 0 -10px;
  }
  .handle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 24px;
    background: var(--accent-color, #5865f2);
    border-radius: 4px;
  }
  .times {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: color-mix(in srgb, var(--button-text-color) 70%, transparent);
    margin-top: 6px;
    font-variant-numeric: tabular-nums;
  }
</style>
