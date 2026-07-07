<script>
  import { createEventDispatcher, onMount } from 'svelte';

  export let value = '#ffffff';

  const dispatch = createEventDispatcher();

  let hue = 0;
  let sat = 1;
  let val = 1;
  let hex = value;
  let svCanvas;
  let hueCanvas;
  let svDragging = false;
  let hueDragging = false;

  function hexToRgb(h) {
    const m = h.replace('#', '').match(/^([0-9a-f]{6})$/i);
    if (!m) return { r: 255, g: 255, b: 255 };
    const int = parseInt(m[1], 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }

  function rgbToHex(r, g, b) {
    const to = (n) => Math.round(n).toString(16).padStart(2, '0');
    return '#' + to(r) + to(g) + to(b);
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
    }
    h = (h * 60 + 360) % 360;
    const s = max === 0 ? 0 : d / max;
    return { h, s, v: max };
  }

  function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
  }

  function initFromHex(h) {
    const { r, g, b } = hexToRgb(h);
    const hsv = rgbToHsv(r, g, b);
    hue = hsv.h; sat = hsv.s; val = hsv.v;
    hex = h.toLowerCase();
  }

  function commit() {
    const { r, g, b } = hsvToRgb(hue, sat, val);
    const next = rgbToHex(r, g, b);
    hex = next;
    dispatch('change', next);
  }

  onMount(() => {
    initFromHex(value);
    drawSv();
    drawHue();
  });

  $: if (svCanvas) drawSv();

  function drawSv() {
    if (!svCanvas) return;
    const w = svCanvas.width;
    const h = svCanvas.height;
    const ctx = svCanvas.getContext('2d');
    const { r, g, b } = hsvToRgb(hue, 1, 1);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, w, h);

    const white = ctx.createLinearGradient(0, 0, w, 0);
    white.addColorStop(0, 'rgba(255,255,255,1)');
    white.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = white;
    ctx.fillRect(0, 0, w, h);

    const black = ctx.createLinearGradient(0, 0, 0, h);
    black.addColorStop(0, 'rgba(0,0,0,0)');
    black.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, w, h);
  }

  function drawHue() {
    if (!hueCanvas) return;
    const w = hueCanvas.width;
    const h = hueCanvas.height;
    const ctx = hueCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 6; i++) {
      const { r, g, b } = hsvToRgb((i * 60) % 360, 1, 1);
      grad.addColorStop(i / 6, `rgb(${r}, ${g}, ${b})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function svPointerDown(e) {
    svDragging = true;
    svCanvas.setPointerCapture(e.pointerId);
    svPointerMove(e);
  }
  function svPointerMove(e) {
    if (!svDragging) return;
    const rect = svCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    sat = x / rect.width;
    val = 1 - y / rect.height;
    commit();
  }
  function svPointerUp() { svDragging = false; }

  function huePointerDown(e) {
    hueDragging = true;
    hueCanvas.setPointerCapture(e.pointerId);
    huePointerMove(e);
  }
  function huePointerMove(e) {
    if (!hueDragging) return;
    const rect = hueCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    hue = (x / rect.width) * 360;
    drawSv();
    commit();
  }
  function huePointerUp() { hueDragging = false; }

  function onHexInput(e) {
    let v = e.target.value.trim();
    if (v[0] !== '#') v = '#' + v;
    if (/^#[0-9a-f]{6}$/i.test(v)) {
      initFromHex(v);
      drawSv();
      dispatch('change', v.toLowerCase());
    }
  }

  $: if (value && value.toLowerCase() !== hex.toLowerCase()) {
    initFromHex(value);
    if (svCanvas) drawSv();
  }
</script>

<div class="picker">
  <canvas
    class="sv"
    width="240"
    height="160"
    bind:this={svCanvas}
    on:pointerdown={svPointerDown}
    on:pointermove={svPointerMove}
    on:pointerup={svPointerUp}
    on:pointercancel={svPointerUp}
  ></canvas>
  <div class="sv-cursor" style="left: {sat * 100}%; top: {(1 - val) * 100}%"></div>

  <canvas
    class="hue"
    width="240"
    height="16"
    bind:this={hueCanvas}
    on:pointerdown={huePointerDown}
    on:pointermove={huePointerMove}
    on:pointerup={huePointerUp}
    on:pointercancel={huePointerUp}
  ></canvas>
  <div class="hue-cursor" style="left: {(hue / 360) * 100}%"></div>

  <div class="hex-row">
    <div class="swatch" style="background: {hex}"></div>
    <input type="text" value={hex} on:input={onHexInput} maxlength="7" />
  </div>
</div>

<style>
  .picker {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: color-mix(in srgb, var(--bg-color) 60%, black);
    border-radius: 10px;
    width: fit-content;
  }
  canvas { border-radius: 6px; touch-action: none; cursor: crosshair; display: block; }
  .sv { width: 240px; height: 160px; }
  .hue { width: 240px; height: 16px; }
  .sv-cursor {
    position: absolute;
    left: 12px;
    top: 12px;
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-radius: 50%;
    transform: translate(-6px, -6px);
    pointer-events: none;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.6);
  }
  .hue-cursor {
    position: absolute;
    left: 12px;
    top: 180px;
    width: 4px;
    height: 20px;
    background: transparent;
    border: 2px solid #fff;
    border-radius: 2px;
    transform: translate(-2px, -2px);
    pointer-events: none;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.6);
  }
  .hex-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .swatch {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.2);
  }
  input[type='text'] {
    flex: 1;
    padding: 6px 10px;
    background: var(--button-color);
    color: var(--button-text-color);
    border: 1px solid color-mix(in srgb, var(--button-text-color) 20%, transparent);
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.95rem;
  }
</style>
