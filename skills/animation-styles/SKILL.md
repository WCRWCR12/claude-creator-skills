---
name: animation-styles
description: A library of 123 named, coded animation and motion-graphic styles (paper cut-out, brick toy, pixel art, chalkboard, neon, watercolour, woodcut, Swiss grid, newsreel and more). Use when the user asks to "make an animation / motion graphic / cartoon / reel in a named style", "show me styles", "what animation styles do you have", "animate this in the paper cut-out / clay / pixel / chalk / neon style", or names a style like "Fox 1" or "Seal 3". Builds the result in code with Remotion or HTML + ffmpeg, with no AI video or image generation.
---

# Animation styles

A library of **123 animation and motion-graphic styles in 23 families**. Every style is built in code (Remotion, or HTML plus ffmpeg), so there is **no AI video or image generation and it costs 0 credits** to reuse. Each style is a spec: palette, type, layout, texture and motion, written in plain English first.

Details for each style live in `references/<family>.md`. Quality rules that apply to all styles are in `references/house-rules.md`. Read the family file for the chosen style before building.

## How to pick a style

If the user names a style ("Fox 1", "Koi 2"), open that family file and use it. If they describe a vibe, match it to a family below, then show 2 or 3 candidate styles from that file (name plus the one-line look) and let them choose. If they say "show me styles", list the families with this table and offer to drill into any of them.

| Family | What it looks like | Best for |
|---|---|---|
| Seal | Paper, collage and craft: cardboard dioramas, parchment, newspaper, scrapbook | Brand stories, big-idea lines, a warm tactile feel |
| Zebra | Bold kinetic type: one or two huge words, ticker bands, highlight chips | Hooks, punch words, comment-to-get calls to action |
| Dolphin | Clean light product keynote: white and blue cards, italic serif accents | Product demos, naming an offer, numbered tool reveals |
| Panther | Dark keynote: black stages, glowing data, glass rows, isometric blocks | Stats, counters, method lists, tech topics |
| Fox | Pixel and 16-bit game scenes, game-show looks, pixel presenters | Playful explainers, skills, simulations |
| Owl | Explainer diagrams: wireframes, charts, drawn metaphors, countdown lists | Top-10 lists, how-it-works, data stories |
| Heron | Real screens and documents with the key thing highlighted | Walkthroughs, "this is the page" moments |
| Crane | Hand-drawn and painted: watercolour, ink wash, oil, crayon, one-line, chalk | Stories, lessons, anything gentle or human |
| Koi | East Asian traditions: shadow puppets, woodblock, paper-cut, lightbox | Heritage, craft, myth, calm documentary |
| Raven | Printmaking: woodcut, engraving, silkscreen, risograph | Premium editorial, travel, nature |
| Lynx | Graphic and type: Swiss grid, spy titles, Art Deco, blueprint, stained glass, terminal | Launches, posters, retro-tech, invitations |
| Rabbit | Cartoon and anime: rubber hose, 80s cel anime, sitcom toon, mid-century | Character stories, humour, tutorials with personality |
| Bat | Cinema eras: silent film, liminal found footage | Atmosphere, nostalgia |
| Beaver | Materials and 3D: brick toy, pop-up book, tilt-shift, low-poly, glass, diorama | Product shots, playful worlds, journeys |
| Otter | Information films: screencasts, HUDs, transit maps, circuit boards, isometric, hologram | Explaining systems, tech, growth over time |
| Hawk | Evidence films: satellite, LiDAR, teardown, microscope, archive light table | Research, science, "here is the proof" stories |
| Wolf | Edit and documentary: caption news, newsreel, montage, telestrator, news package | News-style recaps, fast fact stories |
| Skill Reel | Black stage, isometric blue blocks, small pixel presenter in the corner | Showing what a skill or tool does, item by item |
| Reel Kit | Locked talking head, every line cuts to a new full-frame effect | "What my AI can do" showcases |
| Mockup Showcase | One tactile 3D prop world per sentence | Personal story and journey videos |
| Object Toss | One object carries the viewer through scenes, whip transitions | Product tours, how-I-made-this |
| Emotion | White editorial stage, mustard accent, ring and whip transitions | Punchy lessons, tension then release |
| Storytelling | Periwinkle stage, B/W cut-outs, type typing on letter by letter | Story-led narration, thesis lines |

## How to use it

- **One style:** "Animate my script in Fox 1." Read `references/fox.md`, find the Fox 1 section, and build the whole piece in that look.
- **Mix per beat:** "Hook in Zebra 1, the stat in Panther 1, the call to action in Zebra 4." Keep one style per beat and change only at beat boundaries.
- **Not sure:** show 3 candidates from the best-fitting families and let the user pick before building anything.
- **No script yet:** ask for the script or the single idea first. Use neutral sample copy ("3 hours saved a week", "Meet [Product]") for any placeholder.

## Build method

1. **Plan the beats wordless.** Split the script into beats. For each, write one sentence describing the picture so that it explains the line with the sound off. Get this plan approved if the user is present.
2. **Build the scene in code.** Remotion or HTML plus ffmpeg, following the style's palette, type, layout, texture and motion.
3. **Full frame rate.** Smooth 30 or 60 fps. Never stepped or choppy motion.
4. **Flat solid colours.** No gradients unless the style spec lists them.
5. **No decorative micro-text.** Only real content text.
6. **Render.**
7. **Contact sheet check.** Extract one frame per beat plus the first and last, tile them, and compare against the style spec. Fix and re-render until it matches. Only then call it done.

Full list with reasons: `references/house-rules.md`.

## Start here: the strongest styles

If the user has no preference, offer these first.

1. **Zebra 1** - one blood-red serif word over a dark portrait; reads instantly on mute.
2. **Panther 1** - black keynote counter that makes a number physical.
3. **Crane 2** - watercolour brush; a story painted in one unbroken walk.
4. **Seal 3** - newspaper editorial collage with a giant serif masthead.
5. **Fox 7** - pixel-art presenter popping in over any graphic.
6. **Koi 3** - red paper-cut storytelling.
7. **Lynx 1** - Swiss motion graphics, a poster laid out by rules.
8. **Otter 3** - a transit map that grows with your data.
9. **Beaver 1** - brick toy world for playful explainers.
10. **Storytelling** - periwinkle documentary story with typed keywords.
