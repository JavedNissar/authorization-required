# AUTHORIZATION REQUIRED — build plan

Microfiche-desk authorization clerk game. Single-page app, no build step, no dependencies: one HTML file, a handful of ES modules, JSON day data, procedural WebAudio. Static-serveable on itch.io.

## Design tokens (css/custom-properties)

```
--bone #d8d0b8 (film light)   --ink #221e16 (film dark)   --lamp #c9a86a
--desk #17130e                --desk-edge #2a2218         --paper #efe6cf
--terminal #6fe07a (phosphor, only saturated hue in game)
--f-type "Courier New", monospace       --f-news Georgia, serif
```
Desk is warm/dark/lamplit; reader is monochrome bone. Terminal owns colour.

## Call data shape

```json
{
  "id": "d8beat1",
  "merchant": "marquee",
  "fixedTime": null,
  "brand": "CHARGEX",
  "card": {"pan": "4111-2039-8871", "exp": "03/75", "name": "E. MARCHE"},
  "amount": 96.00,
  "truth": {"bulletinHit": false, "accountOK": true, "impersonating": true},
  "terminalVerdict": "approve",
  "correct": "decline",
  "voice": "off",
  "note": "Newspaper/voice evidence contradicts the terminal."
}
```
`correct` normally matches the rule engine's verdict from `truth` + desk records. Six authored anomalies deliberately carry a canonical verdict based on newspaper or voice evidence outside the routine predicates; the content validator enforces that whitelist.

## File layout

```
index.html
css/main.css
js/main.js            boot, wiring
js/engine/rng.js      mulberry32 seeded RNG
js/engine/audio.js    procedural phone ring, digits, murmur, hum, filter, mute
js/engine/game.js     state machine RINGING→LISTENING→DELIBERATING→CODE_READBACK→RESOLVED
js/engine/rules.js    data-driven predicates over calls → verdict
js/engine/day.js      day runner, quota, pay, clock
js/ui/fiche.js        carriage, frames, film decay shader (2D canvas composite)
js/ui/desk.js         phone, buttons, clock, memo tray, code readback grid
js/ui/newspaper.js    typeset weekly renderer
js/ui/terminal.js     Act II phosphor panel
js/data/merchants.js  40-name cast
js/data/lines.js      line fragments + stitcher
js/data/days.js       loader
content/days/dayNN.json
content/audio/lines.json
README.md
```

## Judgment calls / flags on the brief

- **Act III is 3 days (12–14) as written.** I'm keeping it but scoping Act III content to ~4 calls/day; volume collapse is the point, so it's cheap to author.
- **Pre-rendered TTS clips**: no TTS tool in this environment, so the audio layer is fully procedural WebAudio (ring, filtered murmur for voice cadence, hum, terminal beep) with a `lines.json` manifest + `content/audio/` drop-in point so real clips can replace the stub without code changes. Subtitles carry the content.
- **Film shader**: implemented as a 2D-canvas composite stack (vignette, grain, scratches, flicker, per-day decay ramp) rather than WebGL — same look, no GL context risk under jam conditions. Reader only.
- **Scope risk**: 14 days × newspaper edition is the content budget. Paper is generated from a template pool + per-day planted items, so editions don't all need hand-authoring; planted negative-space items are hand-authored per day.

Milestones in the GDD's build order.
