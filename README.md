# Soundboard

An offline, installable soundboard PWA. Upload audio, trim clips, label with a name and image, click buttons to play. Themeable UI with a live color picker and background image. Up to 50 sounds. Works in Chrome, Safari, and Firefox.

Everything is stored locally in the browser (IndexedDB). No server, no accounts.

## For end users (non-technical)

Once the app is deployed at a URL (see "Deploying" below), share the URL with users. They:

1. Open the URL in Chrome, Safari, or Firefox.
2. **Install as an app** (recommended):
   - **Chrome**: click the install icon in the address bar, or menu → "Install Soundboard".
   - **Safari (macOS)**: File → "Add to Dock".
   - **Safari (iOS)**: Share → "Add to Home Screen".
   - **Firefox**: no in-browser install; just bookmark the page.
3. After the first visit, the app works fully offline. Close the browser, disconnect the internet — it still works.

## Local development (NixOS)

```bash
nix-shell -p nodejs_20 --run 'npm install'
nix-shell -p nodejs_20 --run 'npm run dev'
```

A `shell.nix` is also included:

```bash
nix-shell
npm install
npm run dev
```

Open http://localhost:5173.

## Local development (other systems)

Any Node 18+ works.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`. Serve any static host.

## Deploying (pick one)

The `dist/` folder is a static site. Free options:

### Netlify Drop (easiest, no account required to try)
1. `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag the `dist/` folder into the browser window.
4. You get a URL. Share it.

### GitHub Pages
1. Push this repo to GitHub.
2. Run `npm run build`.
3. Push the `dist/` folder to the `gh-pages` branch (or use an action).
4. Enable Pages in repo settings.

### Vercel
1. Import the repo at https://vercel.com/new.
2. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
3. Deploy.

## Verification checklist

Basic:
- [ ] Upload MP3, WAV, and M4A → each plays.
- [ ] Trim a clip → playback stops at the trim end.
- [ ] Create 50 sounds → grid fits, "Add" tile disappears.
- [ ] Reload → sounds and theme persist.

Theming:
- [ ] Change accent, button, background colors via color picker → live update.
- [ ] Upload a background image → applied, persists on reload.
- [ ] Apply a preset (Dark / Light / Discord / Retro / Ocean) → switches instantly.

PWA / offline:
- [ ] `npm run build && npm run preview`.
- [ ] Open in Chrome → DevTools → Application → Service Workers → registered.
- [ ] DevTools → Network → Offline → reload → still works.
- [ ] Install via URL-bar icon → standalone window opens.

Cross-browser:
- [ ] Firefox: upload/play works. IndexedDB persists across restart.
- [ ] Safari: first tap of a sound button initializes AudioContext without errors.

## Notes on audio format support

The app uses each browser's built-in decoder (Web Audio API's `decodeAudioData`) — no transcoding on the client. Coverage:

| Format | Chrome | Firefox | Safari |
|---|---|---|---|
| MP3 | ✅ | ✅ | ✅ |
| WAV | ✅ | ✅ | ✅ |
| M4A / AAC | ✅ | ✅ (partial) | ✅ |
| OGG Vorbis / Opus | ✅ | ✅ | ❌ |
| FLAC | ✅ | ✅ | ✅ (14.1+) |
| WebM | ✅ | ✅ | ❌ |

If a file won't decode in the current browser, the editor shows a friendly error naming safe formats.
