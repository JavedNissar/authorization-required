# AUTHORIZATION REQUIRED

A static browser game about working a telephone credit-card authorization desk from 1971–1979. Built with vanilla HTML, CSS, Canvas, Web Audio, ES modules, and JSON—no runtime dependencies or build step.

## Run locally

Browsers require an HTTP server for ES modules and day-data fetches:

```sh
tools/serve.sh
# open http://localhost:8642
```

Pass a port as the first argument to use a different one:

```sh
tools/serve.sh 9000
```

The dev server sends `no-cache` headers and live-reloads the open tab when a source file changes. The reload snippet is injected into served HTML only—files on disk (and the release ZIP) are never modified.

Query parameters used for testing:

- `?seed=1971` — deterministic campaign seed
- `?day=6` — start on a day (1–14)
- `?speed=3` — game minutes per real second

## Controls

- **Arrow keys / pointer drag:** move the fiche carriage
- **Page Up / Page Down:** magnification
- **F / G:** focus
- **1–9:** jump to bulletin, floor limits, pulled account, rules, memo, and paper pages
- **Tab / Enter:** live-desk controls

Subtitles remain visible, and a written transcript of each call stays on the desk until the next one rings. Sound can be disabled from the top bar. The fiche keeps a consistent, legible film treatment throughout the campaign. Reduced-motion preferences disable carriage easing, drift, moving dust, lamp flicker, and terminal typing delay.

## Content tools

```sh
node tools/gen-days.mjs
node tools/gen-lines.mjs
node tools/validate-content.mjs
```

`content/audio/lines.json` is a batch-TTS manifest. Add a `file` property to any line after rendering its clip and place that file under `content/audio/`; the game loads it through the telephone filter automatically. Without clips, the shipped procedural murmur and complete subtitles are used.

The optional browser smoke test uses locally installed `playwright-core` and system Chromium:

```sh
npm install --no-save playwright-core
node tools/smoke.mjs
```

## itch.io

Build the upload archive with:

```sh
tools/package.sh
```

Upload `dist/authorization-required.zip` as an HTML game. `index.html` is at the archive root. No server logic, cookies, microphone, or external network requests are used.
