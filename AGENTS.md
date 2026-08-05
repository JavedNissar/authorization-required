# AGENTS.md — AUTHORIZATION REQUIRED

This document is the implementation handoff for coding agents working on this project. Read `GDD.md` for the creative brief, then use this file for the current architecture and operational details.

## Project status

The game is complete and playable as a static browser release.

- **Campaign:** 14 days, spanning 1971–1979
- **Calls:** 116 deterministic merchant calls
- **Acts:** manual authorization, desk automation, VISA/merchant-terminal transition
- **Runtime:** vanilla HTML, CSS, Canvas, Web Audio, ES modules, and JSON
- **Build step:** none
- **Runtime dependencies:** none
- **Release:** `dist/authorization-required.zip`

The release has been tested in headless Chromium. Content validation currently reports:

```text
content valid: 14 days, 116 calls, 708 audio lines
```

## Start here

Run through an HTTP server because browsers do not permit the required module and JSON fetch behavior reliably from `file://` URLs:

```bash
python3 -m http.server 8642
```

Open:

```text
http://localhost:8642
```

Useful development parameters:

```text
?seed=1971   deterministic campaign seed
?day=6       start on a specific day, 1–14
?speed=3     game minutes per real second
```

Examples:

```text
http://localhost:8642/?day=6&seed=1971
http://localhost:8642/?day=14&speed=1
```

## Important creative invariants

Preserve these when changing content or UI:

1. **Never name the town, province, or region.**
2. **Canada is conveyed through the newspaper**, not flags, establishing copy, or real geography.
3. **Do not use Indigenous stories, figures, or spirits.**
4. Horror should accumulate through records, recurring names, contradictions, and negative space. Do not explain it.
5. Newspaper articles must not directly mention the player or authorization desk. The validator also rejects the word “bank” in newspaper content.
6. Calls are happening live. The fiche contains static records; it is not a retrospective archive interface.
7. The terminal is the only saturated color in the visual design.
8. Newspaper and voice evidence must sometimes be mechanically useful, not merely flavor.
9. Preserve historical beats:
   - Chargex before 1977
   - desk automation beginning in 1973
   - VISA from 1977
   - merchant terminals and collapsing call volume in 1979
10. Keep subtitles on by default, never request microphone permission, and do not introduce Web Speech APIs.

## Repository layout

```text
index.html                    application shell and accessible controls
css/main.css                  desk, terminal, modal, and responsive styling
js/main.js                    application boot and engine/UI wiring

js/engine/rng.js              seeded Mulberry32 RNG helpers
js/engine/rules.js            data-driven predicate evaluator
js/engine/game.js             call state machine and consequences
js/engine/day.js              shift clock, scheduling, quota pacing
js/engine/audio.js            Web Audio ring, murmur, hum, filters, clips

js/data/merchants.js          recurring merchant cast and floor limits
js/data/lines.js              spoken fragment and callback composition
js/data/days.js               JSON loader and deterministic account context

js/ui/desk.js                 live desk DOM and authorization-code grid
js/ui/fiche.js                carriage, Canvas film treatment, navigation
js/ui/frames.js               bulletin/account/memo/rule renderers
js/ui/newspaper.js            multi-column newspaper renderer
js/ui/terminal.js             Act II/III phosphor terminal

content/days/day01.json       hand-authored teaching day
content/days/day02.json       generated campaign content
...
content/days/day14.json
content/audio/lines.json      batch-TTS manifest; clips are optional

tools/gen-days.mjs            deterministic day 2–14 content generator
tools/gen-lines.mjs           rebuilds the spoken-line manifest
tools/validate-content.mjs    campaign integrity checks
tools/smoke.mjs               optional Playwright browser smoke test
tools/package.sh              creates the itch.io ZIP

PLAN.md                       original implementation plan and tradeoffs
README.md                     player/developer run instructions
GDD.md                        source creative brief
```

## Runtime flow

`js/main.js` owns orchestration but does not contain scoring rules.

1. `loadDay()` fetches `content/days/dayNN.json`.
2. `makeCtx()` deterministically creates accounts, bulletin filler, and merchant floor mappings.
3. `Day` schedules fixed and shuffled calls from the seed.
4. `Game` owns call state and emits state events.
5. `main.js` translates state events into desk, audio, fiche, and terminal behavior.
6. Day-end results preserve career totals while resetting daily totals.

The core call states are:

```text
IDLE
  → RINGING
  → LISTENING
  → DELIBERATING
      ↘ CALLBACK → DELIBERATING
      ↘ LISTENING (replay) → DELIBERATING
  → CODE_READBACK or direct decline
  → RESOLVED
```

Do not move state checks into button/UI code. UI handlers call methods such as `game.pickup()`, `game.approve()`, or `game.callback()`; `Game` rejects invalid transitions.

## Clock behavior

The default rate is three game minutes per real second.

The clock runs while the player is:

- waiting for calls
- allowing a phone to ring
- researching during deliberation
- choosing an authorization code

Audio playback itself is paused from the real-time scaler and receives fixed historical/gameplay costs instead:

- manual-era initial call: 5 game minutes
- automated-era initial call: 2 game minutes
- replay: 8 game minutes
- callback: 20 game minutes

This avoids making subtitle/audio duration determine whether quotas are mathematically possible while retaining meaningful time costs.

`tools/validate-content.mjs` simulates scheduling with an ordinary deliberation allowance and fails if a quota cannot be met.

## Call data

Representative call object:

```json
{
  "id": "d8beat1",
  "merchant": "marquee",
  "fixedTime": null,
  "brand": "CHARGEX",
  "card": {
    "pan": "4111-2039-8871",
    "exp": "03/75",
    "name": "E. MARCHE"
  },
  "amount": 96,
  "correct": "decline",
  "voice": "off",
  "terminalVerdict": "approve",
  "truth": {
    "bulletinHit": false,
    "accountOK": true,
    "expired": false,
    "impersonating": true
  },
  "note": "Voice and newspaper evidence contradict the terminal."
}
```

### Routine versus authored verdicts

Routine calls are scored consistently with `js/engine/rules.js` and the generated desk context.

Six authored anomalies intentionally use evidence outside routine bank predicates. Their canonical `correct` value is authoritative:

```text
d5beat1    dead cardholder / newspaper evidence
d8beat1    wrong recurring voice / funeral notice
d10beat1   business that does not exist
d11beat1   player’s own card number
d12beat2   sales draft dated tomorrow
d13beat2   caller addressing the player’s function
```

The validator whitelists exactly those IDs. If adding another narrative anomaly whose correct verdict depends on paper or voice evidence, update both the content and `authoredAnomalies` in `tools/validate-content.mjs` deliberately.

Do not casually use `correct` to hide a routine rules-engine mismatch. The validator is designed to catch that.

## Rule engine

Rules are ordered, first-match-wins predicates over `(call, ctx)`:

```json
{
  "id": "bulletin",
  "when": [{ "k": "bulletin" }],
  "then": "decline"
}
```

Supported conditions currently include:

```text
truth
amountGt / amountLt
floorExceed / floorUnder
bulletin
acctStatus / acctOver
expired
merchantIs
terminalSays
revealed
dateAfter / dateBefore
```

Floor mappings in the runtime context are keyed by **merchant ID**, not category name. Category limits originate in `FLOOR_LIMITS` and are expanded in `makeCtx()`.

## Determinism

Campaign calls, order, generated accounts, bulletin filler, authorization codes, and readback choices are deterministic for a seed.

Do not use `Math.random()` for gameplay outcomes. Presentation-only noise and procedural audio may use it.

Authorization codes are derived from the campaign seed and call ID, so a call receives the same code even when reached through `?day=` debugging.

To verify generated content remains deterministic:

```bash
sha256sum content/days/*.json content/audio/lines.json > /tmp/before
node tools/gen-days.mjs
node tools/gen-lines.mjs
sha256sum content/days/*.json content/audio/lines.json > /tmp/after
diff /tmp/before /tmp/after
```

## Campaign generation

`day01.json` is hand-authored and is **not** overwritten by `gen-days.mjs`.

Days 2–14 are generated deterministically from:

- mundane merchant-call templates
- the hand-authored `BEATS` table
- planted newspaper items
- dated memos and rulebook additions
- era-specific quotas, bulletins, terminal verdicts, and card branding

After changing `tools/gen-days.mjs`, always run:

```bash
node tools/gen-days.mjs
node tools/gen-lines.mjs
node tools/validate-content.mjs
```

The split-draft calls on day 4 are linked after materialization so both share the exact PAN. Do not remove that post-processing step.

## Accounts and bulletin context

Accounts are generated at runtime rather than stored verbatim in each day file.

`makeCtx()` guarantees:

- clean approvals cannot accidentally exceed their account limit
- `acctOver` calls really exceed the generated limit
- stale-stolen/account-invalid calls have closed accounts
- ghost businesses have no account record
- bulletin-hit calls appear in that day’s bulletin
- account issue dates do not occur after the current campaign date

If changing account construction, rerun content validation; it evaluates every call against its generated context.

## Microfiche reader

The reader uses one Canvas and a grid of document frames.

Current frame positions:

```text
row 0: bulletin | floor limits | account index | rules
row 1: pulled account | memo 1 | memo 2 | memo 3
row 2: newspaper pages
row 3: optional late-game peripheral material
```

Navigation:

```text
Arrow keys      move by frame
Pointer drag    move carriage
Page Up/Down    zoom
Mouse wheel     zoom
F / G           adjust focus
1               bulletin
2               floor limits
3               pulled account
4               rules
5               first memo
6–9             newspaper pages
```

The renderer includes:

- warm high-contrast film stock
- optical falloff
- persistent scratches and hair
- drifting dust and grain
- lamp flicker tied to audio hum
- per-day contrast decay
- late-game carriage drift
- blank/cut frames
- an unlabeled overhead image of the current desk

`FILM DECAY OFF` freezes the image at day-one legibility. Do not change it to remove all styling or accidentally select maximum decay.

Reduced-motion preferences disable or minimize flicker, easing, drift, moving dust, animated phone indicators, and terminal typing delay.

## Newspaper

The newspaper is rendered from structured page objects with balanced columns.

Early editions have four pages. Act III drops to three and finally two, with deliberate blank column inches.

Content rules:

- keep roughly 90% mundane
- report facts flatly
- use Canadian spelling and civic details
- do not state that an event is supernatural
- do not connect a planted article to a call for the player
- never mention the player, authorization desk, or bank
- keep planted names mechanically consistent with calls

Current folk material is settler Atlantic-Canadian tradition only: bread carried when going beyond the houses, the Old Hag as a sleep complaint, and a funeral light at sea.

## Terminal

The terminal appears from day 6 onward and remains visible through Act III.

Every day 6–14 call has a terminal verdict. Most agree with the canonical result; specific story beats deliberately disagree or return `refer`.

The terminal displays the real deterministic authorization code for approvals. Do not restore the old placeholder-code behavior, because the readback grid must match the terminal.

The green phosphor terminal is the only saturated visual surface.

## Authorization code readback

On approval:

1. `Game` already has a deterministic code for the current call.
2. `Desk.buildCodeGrid()` displays the issued code.
3. Six deterministic choices are generated.
4. The player must select the matching code.
5. A wrong choice resolves as a `misread` complaint.

The issued code must remain visible and accessible; an earlier implementation provided no way to know the correct choice.

## Audio and subtitles

No microphone or speech APIs are used.

The shipped audio layer provides:

- telephone ring
- pickup/key sounds
- filtered procedural voice cadence
- reader transformer hum
- terminal beeps
- 300–3400 Hz telephone filtering

All semantic speech is carried by subtitles and `content/audio/lines.json`.

The manifest contains entries shaped as:

```json
{
  "id": "d1c1.pan",
  "text": "Card number 4 4 1 2 ...",
  "speaker": "harbor",
  "emotion": "businesslike"
}
```

To add a rendered clip:

1. Place it under `content/audio/`.
2. Add a relative `file` property to its manifest entry.
3. Rebuild/package without changing call code.

If an optional clip fails to load, audio falls back to the procedural stub rather than trapping the call in `LISTENING`.

## Accessibility requirements

Do not regress these features:

- subtitles default on
- sound toggle
- film-decay accessibility toggle
- visible keyboard focus
- keyboard access to every live-desk action
- Canvas keyboard navigation
- pointer carriage navigation
- reduced-motion handling in both CSS and JavaScript
- issued authorization code exposed as text
- modal focus on intro/day-end actions
- no layout collapse below 900 px; horizontal overflow is preferable

When deliberation or resolution begins, focus returns to the fiche. From there, `Tab` reaches the currently enabled action buttons.

## Validation and testing

### Content integrity

```bash
node tools/validate-content.mjs
```

It checks, among other things:

- all 14 day files
- chronology through 1979
- quotas and schedulability
- call/PAN/expiry validity
- terminal coverage by era
- Chargex/VISA branding
- rule verdict consistency
- authored-anomaly whitelist
- account/bulletin guarantees
- ghost-account absence
- split-draft PAN linkage
- newspaper page counts and forbidden references
- audio-manifest coverage
- excluded real geography/lore strings

### JavaScript syntax

```bash
for f in $(find js tools -type f \( -name '*.js' -o -name '*.mjs' \)); do
  node --check "$f" || exit 1
done
bash -n tools/package.sh
```

### Browser smoke test

The game has no dependency on Playwright, but the optional test harness does:

```bash
npm install --no-save playwright-core
node tools/smoke.mjs
rm -rf node_modules
```

The smoke test expects system Chromium at `/usr/bin/chromium` and a local server on port 8642. It exercises:

- intro/audio unlock
- first ring and pickup
- call playback
- deliberation
- deterministic code readback
- fiche keyboard navigation
- Act II terminal output
- final-day decay
- HTTP and browser console errors

## Packaging

Create the itch.io archive with:

```bash
tools/package.sh
```

Output:

```text
dist/authorization-required.zip
```

The script removes the previous archive first. This is important because updating an existing ZIP can leave deleted/stale files in the release.

The release contains only:

```text
index.html
css/
js/
content/
```

`index.html` remains at the ZIP root. After any game-source or content change, rerun packaging; the archive is not updated automatically.

Verify it with:

```bash
unzip -t dist/authorization-required.zip
unzip -l dist/authorization-required.zip
```

## Known limitation

No rendered voice-acting files are included. The game ships a procedural telephone murmur, complete default-on subtitles, and a 708-entry TTS manifest. This was an explicit jam-scope decision; the runtime already supports drop-in rendered clips.

## Safe extension checklist

When adding a call or narrative beat:

1. Use an existing merchant when possible to preserve recurring familiarity.
2. Add its evidence to the newspaper/memo and call data together.
3. Decide whether routine predicates or authored external evidence determines the verdict.
4. Give every day 6+ call a terminal result.
5. Use `CHARGEX` before day 12 and `VISA` from day 12 onward.
6. Keep dates and expiry values historically coherent.
7. Regenerate the line manifest.
8. Run content validation.
9. Run the browser smoke test for engine/UI changes.
10. Rebuild the release ZIP.
