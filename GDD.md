# Build prompt: "AUTHORIZATION REQUIRED"

Paste this into a coding agent (Claude Code, or a chat session with file output). It is written as a brief, not a checklist — the agent should plan before it builds.

---

## The brief

Build a browser game called **AUTHORIZATION REQUIRED**. The player works the telephone authorization desk at the only bank in a small American town, 1971–1979. Local merchants call in to get charges approved. The player listens and decides. Think *Papers, Please* crossed with a Stephen King small town — a routine clerical job in a place that is quietly wrong.

## Setting

A small town on the Atlantic coast of Canada, 1971–1979. **Do not name the town, the province, or the region.** No real place names, no recognizable geography, no dialect written phonetically. An unnamed town cannot be checked against reality, and a player who can't place it can't hold it at arm's length.

**Canada is established entirely through the newspaper.** No flag, no prop, no establishing text. The paper carries it in a hundred small ways that the player absorbs without noticing: the spelling, prices in cents, the masthead and volume number, the weather column, the hockey scores, the Legion notices, the CBC radio listings, the fisheries report, the shipping news. This is more convincing than any prop and it costs nothing extra — the paper is already being written.

Invent the town and commit to it, but keep the invention structural rather than geographic:

- Population under 5,000. One industry — the fishery, or a mill, or a mine on the coast — supporting half of it. Roughly forty businesses, and the player knows all of them. The hardware store owner's voice is the same voice every week. That familiarity is the horror engine: when a regular caller sounds off, the player notices without being told.
- **Isolation by water, not by road.** The town is reached by ferry, or by a road that is really just a long detour around a bay. When the weather closes in, nothing arrives and nothing leaves — no mail, no bulletin, no relief on the next shift.
- **Weather is a mechanic, not a backdrop.** Fog that sits for days. Dark by 4:30 in winter. Storms that cut the town off entirely. The hot card bulletin comes by boat and arrives late, and later still when the crossing is cancelled. The stale-information problem now has weather driving it.
- **Distance makes fraud legible.** A card used here and somewhere it would take two days to reach is not a coincidence.
- **The sea takes people, and it always has.** The town has a long, ordinary, unremarkable history of men not coming back. That is the substrate the horror grows in — nobody in this town finds a disappearance strange.

Tonally, aim for accumulating dread rather than monsters — *Hereditary* and *Bring Her Back* more than *It*. The wrongness is communal and inherited: everyone knows, nobody says, and it is treated as ordinary. Stephen King is the setting reference (an ordinary town with a rotten foundation, ordinary people narrating it flatly), not a license for gore or a creature reveal.

Draw on **settler Atlantic-Canadian folk tradition** — the Old Hag that sits on a sleeper's chest, being taken by the fairies in the woods and needing bread in your pocket to come back, wreck lore, the death omen seen at sea. These are specific, richly documented, almost unused in games, and freely yours to use.

**Do not use Indigenous stories, figures, or spirits.** Not the wendigo, not anything adjacent. AI-generated horror drifts toward that material by default, so the brief has to say so explicitly. If any generated content reaches for it, replace it.

A single small town also fixes a plausibility problem: a regional authorization centre would field calls from hundreds of anonymous merchants, which is dramatically inert. One town, one desk, forty merchants, the same names recurring — that is a cast.

## Historical grounding — this is load-bearing, keep it accurate

This was a real job and the real mechanics are better than invented ones. The Canadian version is also less well known than the American one, which is an asset — almost nobody playing this will have seen it before.

- **The card is Chargex, not Visa.** BankAmericard was licensed to a Canadian bank alliance which issued under the Chargex name from 1968 to 1977. The blue-white-gold band is the same; the name on it is not. Use the real Chargex branding — it is defunct, distinctive, and instantly period-correct. Invent a fictional member bank rather than naming a real one.
- Merchants imprinted the card mechanically. For charges **over the merchant's floor limit**, they had to telephone for authorization.
- Pre-1973 the lookup was manual — paper files, microfilm, and periodically-mailed bulletins listing cancelled and stolen card numbers. The bulletins went stale between issues, and in a town reached by boat they arrived later still.
- In 1973 the authorization system was automated behind the desk. The **phone call did not go away**; the clerk keyed the number into a terminal and read the answer back. Authorization went from roughly five minutes to under a minute.
- Approval was always delivered as a **spoken authorization code** the merchant wrote onto the sales draft. The code was the proof.
- From 1979 merchant terminals began removing the human from the loop entirely.

## Core loop

1. The phone rings. Player picks up.
2. A merchant speaks: store name, city, card number, expiry, cardholder name, amount. **Audio only.** The player can replay the call, but replays cost time.
3. Player cross-references against the materials on the desk.
4. Player responds via buttons: **APPROVE**, **DECLINE**, or **CALL BACK** (verification — costs a lot of time, sometimes reveals the truth).
5. On approve, the player must read back the authorization code — implemented as selecting the correct code from a small grid, or typing it. Getting it wrong is its own failure.
6. Day ends on a clock. Quota, pay, consequences.

## Audio: output only, no microphone

**Do not use the Web Speech API for input.** No mic permission, ever — it gates the entry behind a permission prompt and a quiet room, and Firefox doesn't ship recognition by default.

**Do not use `speechSynthesis` for output either** — it gets throttled in background tabs and silently drops on iOS.

Instead:
- Every spoken line is a **pre-rendered audio file**. Generate a `lines.json` manifest with `{ id, text, speaker, emotion }` for every line the game can say, so the batch can be re-rendered by a TTS tool in one pass.
- Compose calls from **stitched fragments**: a greeting, a merchant identity, a card number read digit-by-digit, an amount, a closer. This gives combinatorial variety from a bounded set of clips. Digits especially should be individual files.
- Run everything through a telephone filter — bandpass roughly 300–3400 Hz, light distortion, room noise floor. Do it in Web Audio at runtime so the source clips stay clean.
- **Subtitles are a toggle, default on.** Accessibility floor, and it makes the game playable by judges with no headphones. The cost of subtitles-off should be difficulty, never comprehension of the UI.
- Until the real voice clips exist, ship a stub audio layer that plays silence and shows subtitles, so the loop is playable from day one.

## The desk (player-facing surfaces)

- **The bulletin** — a printed list of hot card numbers. Searchable by hand, i.e. the player scrolls it. It is **dated**, and a new one arrives by mail every few days — later than it should, and later still when the highway is closed. Numbers cancelled after the last printing are not in it.
- **The floor limit sheet** — per merchant category. A charge under the limit shouldn't be being called in at all; a merchant who calls anyway is telling you something.
- **The account file** — pulled by card number. Credit limit, balance, account status, cardholder name and city.
- **The rulebook** — grows over the game. New rules arrive as memos between days. Old rules are not always revoked cleanly, and two memos should eventually contradict each other.
- **The terminal** — appears in Act II. The only thing on the desk that is not on film. A keying delay, and its own personality.
- **The newspaper** — see below. This is the second pillar of the game.

Everything above except the terminal is a frame on the fiche, reached by moving the carriage. See the visual direction section.

## The newspaper

Between calls the player can read the local paper — a weekly, four pages, arriving on a fixed day. Small-town Canadian weeklies were archived on microfilm, so it belongs on the fiche alongside everything else. It is the game's entire narrative delivery system and it must never editorialize.

Design rules:

- **The paper reports the town, not the plot.** Zoning disputes, a high school football score, a church supper, the mill's shift schedule, obituaries, classifieds, a police blotter. Ninety percent of it is mundane and stays mundane.
- **The horror lives in the negative space.** An obituary for someone whose card was approved yesterday. A missing persons notice for a name the player declined last week. The blotter reporting a break-in at a store that called in a large charge an hour earlier. A recurring classified ad that never changes. The mill announcing a third shift nobody applied for.
- **Never connect the dots for the player.** No article ever mentions the bank, the player, or anything supernatural. The paper's job is to hand the player facts that only become sinister when laid against the call log.
- **Make the connection mechanically real.** The player should be able to keep the paper open beside the call, and cross-referencing a caller against a name in the paper should be a legitimate way to catch things the bulletin and terminal miss. If reading the paper is purely optional flavor, it has failed.
- **Reading costs time.** The clock runs. A player who reads every article misses quota; a player who never reads it will not understand what happened to them.
- Later editions get thinner. Fewer pages, more blank column inches, ads repeating. By Act III the paper is mostly white space and it should be genuinely unsettling to open.

## Structure: three acts, driven by history

**Act I — Manual (days 1–5).** Paper only. The player decides. Teach the cross-reference. Difficulty comes from volume and from the bulletin being one edition out of date.

**Act II — Automation (days 6–11).** The terminal arrives and returns a verdict. Faster, and the quota rises to match. The heart of the game is here: **the machine's answer and the evidence on the desk begin to disagree.** The player is now a relay, and relaying a decision they can tell is wrong should feel bad. Approving a charge that makes no sense, out loud, in your own voice, because the terminal said fine.

**Act III — Visa (days 12–14).** Two things happen at once, and they are the same thing. Merchant terminals begin rolling out, so volume collapses and the calls that still come through are the ones the machine refused to handle. And the card is renamed: from March 1977 Chargex is retired and every card, form, and sign in the town is reissued as Visa — a name chosen at head office precisely because it implied no nationality and was easy to say in any language.

Play that straight, as bureaucracy. Nobody in the memos treats it as anything but a rebrand. But it is the thematic ending the game has been building toward: the local thing is absorbed into a network that has no name and belongs to no place, at the same moment the town stops needing a person to answer the phone. End with the phone not ringing.

## The escalation

The weirdness should be **procedural before it is supernatural**. Ramp it in this order:

1. Ordinary work. Wrong digits, expired cards, honest mistakes.
2. Fraud. Stolen numbers, a merchant splitting a charge to slip under the floor limit, the same voice calling from two different stores.
3. Pattern. A card belonging to someone the paper buried last week. A merchant category code that doesn't match anything the caller describes selling. Purchases that only make sense as preparation for something.
4. Wrongness. A charge from a business on Main Street that has never existed. A regular caller whose voice is subtly not his own, phoning in an order for far too much of one ordinary thing. A merchant reading out the player's own card number. A charge dated tomorrow.
5. Address. Late in Act III, a caller who knows what the player is.

The most effective beats will be the ones the newspaper set up two weeks earlier. Author the paper and the call list together, not separately.

Never explain it. No lore dumps, no memo that says "as you may have noticed, something strange is happening." The player should notice on their own, and the game should never confirm it.

## Systems

- **Deterministic seeded RNG.** Same seed, same day, same calls — essential for debugging and for jam judges comparing notes.
- **Day-as-data.** Each day is a JSON object: call list, active rules, quota, memos, bulletin edition. Content is data, not code, so days can be authored and tuned without touching the engine.
- **Consequences over score.** Wrong approvals cost the bank money and eventually the player's job; wrong declines generate complaints. Add a slow-burn personal thread in the memos — the pay is fixed, rent isn't. Keep it light-touch; the job is the game.
- **State machine** for call flow: `RINGING → LISTENING → DELIBERATING → CODE_READBACK → RESOLVED`. Do not let this leak into the UI code.

## Visual direction: microfiche

**The calls are live. The records are film.** The player is working a shift in real time; the microfiche reader is the tool they consult while a merchant waits on the line. This is exactly how the job worked before the authorization system was computerized — a clerk on a live call, pulling account records off microfilm.

Do not present the game as a retrospective, an archive, or a recovered record. Nothing is being reviewed after the fact. The tension of the game is that a real person is on the phone right now, holding, while the player searches film for something that may not be there.

Layout follows from this. The **reader dominates the screen** — it is where the player's eyes are for most of the shift — and the live desk surrounds it: the phone, the response buttons, the clock, the day's memo. The film treatment below applies in full to the reader. The surrounding desk gets a much lighter grade — lamplit, warm, slightly grainy, but not projected and not degraded. The player should always be able to tell, instantly, which parts of the screen are *now* and which are *record*.

Build the reader in 2D (canvas or WebGL quad) with a shader stack over the top:

- **High-contrast monochrome.** Not black and white — the warm grey-to-bone of a projector lamp through film. Blacks are never true black; the lamp always leaks.
- **Optical falloff.** Brightness and focus drop toward the edges of the screen. A slight barrel distortion. The corners are always a little soft.
- **The physical medium is dirty.** Dust motes on the platen, one hair at the edge of the frame, vertical scratches in the emulsion, an occasional splice mark. Some of this should be **persistent** — the same scratch in the same place all game — and some should shift when the carriage moves.
- **Lamp instability.** A slow, barely-perceptible flicker with an audible transformer hum. Both should be tied to the same value, so the room dims and the hum dips together.
- **Focus is a knob the player can turn.** Some frames are never quite sharp no matter how it's set.

Palette discipline: the reader is monochrome and the desk around it is nearly so — the warm bone of aged film stock, the grey of newsprint, lamplight on wood. **Reserve saturated colour entirely for the terminal.**

### The carriage is the navigation

The player moves a **fiche carriage** on X/Y to bring frames under the lens. Every desk material lives on film: the hot card bulletin, account files, floor limit sheets, memos, and the newspaper. Finding a record means physically sliding to it, and the slide has weight and takes time.

This gives you a diegetic UI with no menus, and it hands you a horror toolkit the third dimension was going to provide:

- Frames adjacent to the one being read are half-visible at the edges. The player catches things in peripheral vision.
- A frame that is **blank when it should not be**. A frame that is the same as the previous frame. A frame that has been cut out of the film.
- The carriage drifting a little when the player isn't touching it.
- Sliding past a frame dated later than today.
- Late in the game: the player's own desk, photographed, on the fiche.

Never acknowledge any of this in text. The medium does the work.

### Text is free — use it

The whole readability problem dissolves: documents are the native content of film, rendered as real typeset text on the frame. The newspaper can be as dense as an actual weekly. Set it properly — a period-plausible newspaper masthead face, a serif body at real column widths, a typewriter face for the memos. Type is most of what's on screen, so it carries the design.

### The terminal is the one living thing

Act II's authorization terminal is a sharp, self-luminous green or amber phosphor panel on the desk, in the only saturated colour the game contains. Scanlines belong to it alone.

It is the second live thing in the room, and that is the point: until it arrives, the only live thing on the desk is the voice on the phone, and everything the player checks that voice against is a static record. The terminal answers back. It is faster than the film and it is not always right, and the player has to choose between the thing that responds and the thing that merely sits there being true.

### Decay as difficulty

Each in-game day, the image is **one more photocopy generation**: contrast climbs, midtones drop out, edges thicken, toner streaks and dust accumulate. By the final days the player is genuinely straining to read. This makes the escalation curve visible in the image itself with zero authored content, and it gives the last act real mechanical difficulty without raising the quota again.

Cap it. There must be a legibility floor the decay never crosses, and it should be verified at the worst-case day before the jam deadline. Also gate it behind an accessibility setting that freezes decay at day one — a player who cannot read the final act cannot finish the game.

Asset generation: almost nothing needs to be drawn. The frames are typeset text and simple line art composited programmatically, then run through the film shader. Any photographic element (a face on an ID, a photo in the paper) can be image-generated, then crushed to monochrome and grained — generated images survive that process far better than they survive pixel-art quantization.

## Quality floor

Keyboard-navigable, visible focus states, `prefers-reduced-motion` respected, subtitles on by default, audio behind a mute toggle, no layout collapse below 900px. All of this without announcing it in the UI.

## Build order — do this in milestones, and stop after each

1. **Playable loop, zero content, no film shader.** Plain text on a plain background: one hardcoded call, subtitles only, silent audio layer, three buttons, a resolution screen. Prove the loop is fun before any of the look exists — the shader stack is the last thing to build, not the first.
2. **The carriage + desk materials + rule engine.** Frame addressing, carriage movement, bulletin, account file, floor limits. A rule is a data-driven predicate over a call, not an `if` statement.
3. **The newspaper.** Typesetting, column layout, one full edition on film. Get this working early — it is half the game's content budget and the thing most likely to be cut under deadline pressure.
4. **Day structure, quota, consequences.** Five days of Act I content, paper and calls authored together.
5. **Audio layer + `lines.json`.** Fragment stitching, telephone filter.
6. **Acts II and III**, the terminal, the escalation curve.
7. **The film shader stack and decay ramp.** Applies to the reader only — leave the live desk out of it. Verify the legibility floor on the worst-case day.
8. **Polish, itch.io packaging.**

Before starting, write a short plan: your design token system, the shape of the call data structure, and the file layout. Flag anything in this brief you think is wrong or too ambitious for a two-week jam — the deadline is real, and cutting Act III to two days is a legitimate call to make.````
