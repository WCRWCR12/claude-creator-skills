---
name: one-to-one-style
description: Copy a reference reel's animation style at a chosen fidelity (exact re-shoot, style match, or pattern match). Breaks a fast, overstimulated-but-clear motion style into reusable primitives (hard-snap cards, piercing reveals, context boxes, typing, dashboards, number tickers, pop-in characters) with an SFX catalogue, Remotion snippets and a QC checklist. Also covers a photo-driven "historic information" reel style. Use when asked to copy a reel 1:1 or make something in the style of a reference reel.
---

# One-to-one style

Use this when you want to reproduce what makes a reference reel work: animation style, piercing sound effects, what pops on screen, how fast it arrives, how information is delivered in context, and what the hook is. Content is not the point.

Process for any reference: download it with `yt-dlp`, make a contact sheet with ffmpeg, transcribe it, then write the style analysis before building.

---

## The three-tier definition

Decide which tier before you build. It sets how closely you match.

### Tier 1: exact re-shoot
Match the original frame for frame: same script structure, pacing, animation beats, SFX placement and information-delivery moments. Only the talent and branding swap. Use when the request is "copy this 1:1" or "do it exactly". Do a side-by-side diff against the reference before shipping.

### Tier 2: style match
Same animation primitives, SFX catalogue, pop-up types and timings, piercing moments and typing/dashboard animations. Different script and content. The look is indistinguishable from the reference; the message is yours. Use for "do it in this style" or "make something like this".

### Tier 3: pattern match
Same scripting and hook pattern (belief-attack hook, information-sequencing logic, overstimulated-but-clear density). Different animation style and content. The structure is copied; the aesthetics are your own. Use for "use this format" or "do what this creator does".

---

## Style analysis: the fast, overstimulated-but-clear reel

**What it looks like:**
- Full-bleed vertical frame, dark base (deep navy or near-black).
- Text blocks snap onto screen at speed: not fading, not sliding slowly. A hard appear plus a slight scale punch (about 0.85 to 1.0 over about 6 frames, like a card slamming down).
- Primary information is large, bold, isolated text: one idea per card, never a dense paragraph.
- Context boxes: when a concept needs anchoring, a rounded-rectangle box pops in beside or below the main text with a brief label or sub-point, about 0.1-0.2 s after the main text.
- Colour accents: one or two accent colours (vivid green, orange or cyan) used only on key numbers, action words or brand terms. Everything else is white or near-white.

**Hook rhythm:**
- Opens cold: no intro, no name, no title card. The first frame is the hook statement.
- Two or three words on screen, spoken at the same time or with a one-frame delay (text leads audio).
- Belief-attack or dissonant-fact structure: the viewer's assumption named and immediately contradicted.
- First pop-in of a host or character (Tier 2 and up) within two to three seconds, entering from an edge. Never a slow float-in.

**Animation primitives (the repeating units):**
1. **Hard-snap card.** Text or graphic appears with a single punch-scale. Used for every new information beat.
2. **Piercing reveal.** An icon, number or accent word appears about 0.5 s before the supporting text, solo, to draw the eye before context arrives.
3. **Context box.** A small rounded rectangle beside primary text annotates a term or adds sub-data. It appears on its own beat, always after the main card.
4. **Typing animation.** For a tool, dashboard or input field: a text cursor blinks and characters appear at about 8-12 characters per second. For search bars, prompts and form fields, not body copy.
5. **Dashboard scroll / data wipe.** For metrics or lists, rows appear top to bottom at about 4-6 rows per second, as if loading live.
6. **Pop-in character.** The presenter or mascot enters from a screen edge (left, right, up, down) in 0.2-0.3 s with easing, holds for 2-5 s, exits the same edge or dissolves.
7. **Number ticker.** Values count up from 0 (or a lower value) to the final number: about 0.5 s for two digits, about 1.0 s for large numbers, always in the accent colour.
8. **Wipe transition.** Between major sections a coloured bar sweeps across in about 0.15 s, clearing the frame for the next beat.

**SFX catalogue** (levels relative to the voiceover):
- **Impact thud** on every hard-snap card arrival. Low and punchy, a blunted strike rather than a cinematic boom. About -12 dB.
- **UI click / tap** on typing and dashboard row-loads. Rapid-fire when rows load in sequence. About -18 dB.
- **Piercing sting** on the piercing reveal of a key number or accent word: a sharp, brief tone (higher and faster than a notification ping), under 0.1 s. Prominent, about -10 dB.
- **Whoosh sweep** on wipe transitions. About -15 dB.
- **Number tick** under number tickers, like a slot machine, ending with a small chime or click. Subtle, about -20 dB.

**Cut pace:**
- Average shot about 1.5-2.5 s. No beat lingers.
- No gap between audio cuts: sentences back to back, at most 0.1 s between.
- The on-screen animation change is the visual cut. About one animation event per spoken line, sometimes two.

**Information sequencing ("contextually delivered"):**
1. State the claim (hook card, large text, accent word pierces first).
2. Provide the number or proof (ticker plus context box).
3. Connect to the viewer's situation (voiceover bridges to the "so what").
4. Demonstrate the mechanism (typing or dashboard animation shows it happening).
5. Payoff (wipe to the CTA or next section).
Never dump all information at once. Each element arrives one beat after the last.

**Why it is overstimulated but clear:**
- Several layers are always active (voiceover, on-screen text, SFX), but each layer carries one thing at a time.
- The piercing sting, the accent-colour word and the number ticker hit together on the key fact. That overload is intentional; everything else is stripped back while it happens.
- Visuals arrive exactly when the voiceover says the word, never before the concept is introduced.

---

## Building a full one-to-one version

Typical brief:
1. **Pop-in presenter character, not a half-screen split.** It enters from an edge (left, right, up or down), varies direction per beat (never the same edge twice in a row), and is always talking to camera, never idle.
2. **Whole-limb rule (ship-blocker).** If any limb is visible, render the complete limb to its natural end. A pop-in from the right that shows an arm must show it from shoulder to fingertips, never cropped partway. Applies to all four directions. Before rendering, check the pose's bounding box; if a limb crosses the crop boundary, reposition so it fits, or keep the whole character on screen.
3. **Quicker pace.** Target about 1.5 s average shot, pushing toward 1.0 s on information-dense beats. SFX on every animation event.
4. **Louder SFX than a default mix.** Impact thud about -10 dB, piercing sting about -8 dB, everything +2-3 dB over your usual defaults.
5. **Context boxes and typing animations on every data beat.** Any line that references a tool, number or workflow gets a typing or dashboard animation, not static text.

**Pop-in direction guide:**

| Beat type | Preferred entry |
|-----------|-----------------|
| Hook / opening | Right edge (dramatic arrival) |
| Explanation / context | Left edge (feels like talking to the viewer) |
| Proof / number reveal | Bottom edge (rises up, grounded) |
| CTA | Right edge again, or full-screen |

---

## Remotion implementation notes

Hard-snap card:
```
const frame = useCurrentFrame();
const scale = interpolate(frame, [0, 6], [0.85, 1.0], {extrapolateRight: 'clamp'});
```

Piercing reveal sequence: frame 0, accent word appears and the sting fires; frames 8-10, the supporting card snaps in and the thud fires.

Typing animation:
```
const charsVisible = Math.floor(frame / 2); // ~15 chars/sec at 30fps; use frame / 3 for ~10
const displayText = fullText.slice(0, charsVisible);
```

Dashboard row loader:
```
const rowsVisible = Math.floor(frame / 5); // 1 row per 5 frames = 6 rows/sec at 30fps
```

Pop-in from the right:
```
const x = interpolate(frame, [0, 9], [frameWidth + 100, targetX], {easing: Easing.out(Easing.quad)});
```
Use the matching off-screen start for the other directions.

Whole-limb check: when positioning the character, compute `characterX + armExtendRight`. If that is greater than `frameWidth`, shift the character so the full arm fits, or bring the whole character on screen. Never clip.

---

## QC checklist (Tier 1 and Tier 2)

- [ ] Every hard-snap card has an impact thud.
- [ ] Every piercing reveal has a piercing sting.
- [ ] All typing and dashboard animations have UI click SFX.
- [ ] All number tickers have tick SFX and end with a chime.
- [ ] All wipe transitions have a whoosh.
- [ ] Every pop-in checked: no limb cropped, full limbs visible or fully out of frame.
- [ ] Pop-in directions vary (no two consecutive beats from the same edge).
- [ ] Every pop-in shows the character talking to camera, never idle.
- [ ] Information arrives in sequence: claim, proof, so-what, mechanism, payoff.
- [ ] No beat over 2.5 s.
- [ ] No audio gap over 0.1 s between sentences.
- [ ] Contact-sheet diff against the reference (Tier 1) or the style checklist (Tier 2).

---

## Variant: historic-information style (photo-driven)

A sequence of archival or period photos, each popping onto screen with a short animated text label. The reel tells a chronological story: an old problem, how people historically dealt with it, then the payoff (the modern solution). No dashboards or typing bars in the history section; the photos are the visual layer. No pop-in character in this variant.

**Photo reveal system:**
- Each photo hard-snaps in with a slight scale punch (0.85 to 1.0 over about 6 frames). It never fades in; it lands like a physical object placed on a surface.
- Photos have a slight border or drop shadow for a physical-object feel (polaroid-adjacent, but no rotation or peel animation).
- Each lands at a slight random tilt (3-5 degrees), never perfectly upright.
- Each photo holds for one voiceover line (2-3 s), then the next snaps in on top or beside it. Photos layer slightly, so the history accumulates visually.

**Typography:**
- Bold grotesque or condensed sans (Impact or heavy condensed Helvetica feel), large, uppercase or mixed case.
- Label sits below or beside the photo, not on top.
- It snaps in as a full word or short phrase (same hard-snap, no typewriter) and holds as long as the photo.
- Two to five words: an era stamp plus a descriptor, e.g. "The booking desk, 1974".
- White text on a dark pill, or white with a subtle shadow on a light background. One accent colour, used on the year.

**Haptic SFX system (the most important part):**

Every text arrival creates a physical sensation through sound. Do not use one SFX per photo: the label generates its own SFX, so each beat has two distinct sounds (photo lands, then label lands).

| SFX event | Trigger | Character | Level |
|-----------|---------|-----------|-------|
| Photo thud | Each photo snap-in | Low, punchy, blunted impact | about -10 dB |
| Label snap | Label card snaps in after the photo, about 0.1-0.2 s later | Shorter, crisper, slightly higher than the thud | about -12 dB |
| Word tick | Each word, if text reveals word by word (once per snap if full-snap) | Rapid UI tap or typewriter click | about -16 dB |
| Era sting | On the year accent | Short, high, softer piercing sting | about -12 dB |
| Section wipe | Between history and payoff | Short fast whoosh | about -15 dB |

**Pacing:** photo plus label is one beat of about 2.5-3 s (never under 2 s or over 4 s). Four to six history beats between a hook (about 3 s) and a payoff (about 4-5 s). Total 18-22 s tight, up to 30 s.

**Background:** clean, slightly textured paper/cream or a very dark near-black, never pure white or pure black. No gradients or decorative elements.

**Content template:** "Business X has an [old problem]. Here's how they've historically dealt with it [history beats]. Now this problem is solved with [your tool or skill]."
1. Hook (3 s): a big statement card with the old problem in one number or phrase, plus a photo of the oldest version of the problem.
2. History beats 1-4 (2.5 s each): one era per beat, photo plus label, voiceover names the era and its failure mode.
3. Payoff (4-5 s): "Now this problem is solved." A typing animation of the key action words, then a CTA card.

**Build flags to set in the brief:** photo reveal = hard snap with random 3-5 degree tilt and thud; label reveal = full-word snap with its own SFX; two SFX per beat; paper/cream or near-black background with no gradient; no pop-in character; typing animation on the payoff beat only. Use real archival or period photos; if unavailable, use the most historically accurate stock, never AI-generated photos of historical scenes.

**Extra QC for this variant:**
- [ ] Every photo has a thud and every label its own snap SFX, about 0.1-0.2 s after.
- [ ] The year in each label triggers an era sting.
- [ ] Every photo has a slight tilt and a border or shadow.
- [ ] Typing animation on the payoff beat only.
- [ ] Background is paper/cream or near-black with no gradient.
- [ ] Total 18-30 s, each beat 2.5-3 s.
