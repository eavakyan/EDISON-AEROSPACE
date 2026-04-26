# Handoff: Edison Aerospace — Investor Deck

## Overview

A 16-slide Series A investor presentation for **Edison Aerospace**, makers of *Heavy1* — a full-size, electric, remotely-piloted agricultural aircraft. The deck pitches the company against the incumbent turbine ag-aircraft market: safer, cheaper to operate, electric-powered, with a hardware-plus-leasing dual revenue model.

The deck is a self-contained slide presentation rendered in HTML using a custom `<deck-stage>` web component for navigation, scaling, and print-to-PDF. It runs in any modern browser by opening `Edison Aerospace Investor Deck.html` directly — no build step, no server.

## About the Design Files

The files in this bundle are **design references created in HTML** — a working prototype showing the intended look, copy, layout, and behavior of the investor deck. They are **not production code to drop into a website**.

The likely task here is one of:

1. **Embed/host the deck on edison.aero** — in which case treat the HTML as a source of truth for content + styling and recreate it inside the site's existing framework (Next.js / React / Astro / whatever the marketing site uses). Reuse the site's layout primitives, font loading, and asset pipeline.
2. **Maintain the deck as a standalone artifact** — in which case you can keep the HTML/CSS/JS structure as-is and just iterate on copy/imagery. The bundle works offline; double-clicking the HTML opens the full deck.

If the target codebase has no existing framework, recreating in plain HTML/CSS (matching what's here) or a minimal React + Vite setup is appropriate. **Do not introduce a heavy framework just for a 16-slide deck.**

## Fidelity

**High-fidelity (hifi).** Every slide has final copy, imagery, typography, color, spacing, and motion. Treat measurements (px values, font sizes, gaps, positions) as authored intent. The design canvas is a fixed `1920 × 1080` per slide — the `<deck-stage>` element scales it to fit any viewport with letterboxing.

## File Structure

```
design_handoff_edison_investor_deck/
├── README.md                              ← this file
├── Edison Aerospace Investor Deck.html    ← the deck (entry point)
├── edison-deck.css                        ← all slide styling, type, motion
├── deck-stage.js                          ← <deck-stage> web component
├── edison-logo.png                        ← brand mark
├── heavy1-render.jpg                      ← hero render of Heavy1 aircraft
├── heavy1-tradeshow.jpg                   ← Heavy1 prototype at tradeshow
├── gcs-truck.jpg                          ← ground control station trailer
├── spray-aircraft.jpg                     ← turbine ag aircraft (slide 02)
├── gene-avakyan.png                       ← founder portrait
└── victoria-unikel.png                    ← founder portrait
```

The deck loads **Google Fonts** at runtime: Fraunces (serif display), Inter (sans body), JetBrains Mono (mono labels). If hosting offline / behind a firewall, self-host these.

## Slide Inventory

| # | Label                | Purpose                                                                 |
|---|----------------------|-------------------------------------------------------------------------|
| 01 | Cover                | Title, tagline ("Safer. Cheaper. Greener. Better."), Series A confidential mark |
| 02 | Problem (narrative)  | The 5:42 AM pilot — humanizes the problem with a scene + crop-duster photo |
| 03 | Problem (data)       | "A vital industry, propped up by expensive, dangerous, dirty aircraft" — 3-stat breakdown |
| 04 | Solution             | Heavy1 introduction with hero render and three-line value prop (HEAVY · ELECTRIC · REMOTE) |
| 05 | Cost comparison      | Bar chart: Turbine vs. Heavy1 on fuel ($300/hr vs $18/hr) and overhaul ($400K/3,500hr vs $20K/2,000hr) |
| 06 | Market (TAM/SAM/SOM) | $17.9B global ag aviation market, ring diagram |
| 07 | Business Model       | Five revenue streams: Sales, Subscription/Lease, Service, Service Plan, Training. Year-3 target: $105.6M |
| 08 | Projection           | 10-year gross profit projection chart (profitability by Year 4) |
| 09 | Competition          | "Incumbents make planes for pilots. We make planes for fleet operators." |
| 10 | Traction             | LOIs, partnerships, press mentions |
| 11 | Ground Control Station | "Pilots fly from an air-conditioned trailer" — solar/generator/Starlink stack |
| 12 | Defense play         | "The same airframe DNA, re-tasked for the warfighter" — Edison Defense vertical |
| 13 | Team                 | Founders (Gene Avakyan CEO, Victoria Unikel VP) + 4 advisors |
| 14 | Roadmap              | Milestone timeline from prototype to production line |
| 15 | The Ask              | Raising $10M on $50M pre-money. Use of funds. |
| 16 | Closing              | "Safer. Cheaper. Greener. Better." — contact CTA |

## Architecture

### Slide framing — `<deck-stage>` web component

Every slide is a direct-child `<section>` of the `<deck-stage>` element. The component (defined in `deck-stage.js`):

- Sizes each slide to **1920 × 1080** (the design canvas).
- Scales the entire stage with `transform: scale()` to fit the current viewport, letterboxing on black.
- Wires keyboard navigation (←/→, Space, Home/End), tap zones, and a slide counter overlay.
- Sets `data-deck-active` on the currently-visible slide and `data-screen-label` (e.g. `"07 Business Model"`) on every slide automatically.
- Posts `{slideIndexChanged: N}` to `window.parent` for embedding contexts.
- Implements print-to-PDF (one page per slide) via `@page` CSS.

If recreating in a framework: keep the canvas-scaling pattern. The deck **must** stay a fixed-pixel layout — relative units would defeat the whole point of an authored print-quality presentation. Use a single transform-scaled wrapper, not responsive layout.

### Slide tonal classes

Each slide opens with one of these classes on its `<section>`:

| Class    | Background        | Used on                          |
|----------|-------------------|----------------------------------|
| `.night` | Deep navy `#0A1628` | Cover, market, GCS, defense, closing |
| `.dusk`  | Mid-night `#15263F` | Solution intro                   |
| `.paper` | Warm paper `#F4F1EA` | Problem narrative, business model, roadmap |
| `.cream` | Slightly cooler paper `#E9E3D6` | Projection chart |
| `.white` | Pure white `#FFFFFF` | Team                            |

These flip text colors on `.eyebrow`, `.body`, `.lede`, `.spec-label`, `.footer`, and the chrome via `.night .x { ... }` selectors.

### Typography utility classes

Defined in `edison-deck.css`:

- `h1.display` — 168px Fraunces, hero titles (cover, closing)
- `h1.title` — 104px Fraunces, primary slide titles
- `h2.title` — 72px Fraunces, secondary slide titles
- `.lede` — 32px italic Fraunces, lead paragraphs under titles
- `.body` — 24px Inter, body copy
- `.eyebrow` — 14px JetBrains Mono uppercase tracking 0.32em with a 36px red rule prefix
- `.spec-label` — 11px JetBrains Mono uppercase tracking 0.2em (data labels)
- `.numeral` — Fraunces, used for big numbers (`$1.27M`, `100`, `$105.6M`)
- `.italic`, `.amber`, `.crop`, `.signal` — color modifiers (amber == brand red)

### Motion system

Slides only animate when `[data-deck-active]` is on the section. Animation utility classes:

- `.anim` → `fadeUp` (28px translateY, opacity 0→1, 0.9s)
- `.anim-fade`, `.anim-scale`, `.anim-bar`, `.anim-ring`, `.anim-fly`, `.anim-climb`, `.anim-draw` — variants
- `.d1` … `.d10` → staggered delays (0.10s through 1.45s, 0.15s steps)

There's a JS safety net at the bottom of the HTML that force-completes any animation stuck at currentTime=0 after 1.8s and 3.5s — this works around a `visibility:hidden` quirk that can stall animations when slides are flipped via attribute toggle. **If reimplementing in React, replicate this safety net.** Without it, slides occasionally render with invisible (opacity:0) titles on revisit.

## Design Tokens

All defined as CSS custom properties at the top of `edison-deck.css`:

### Colors

```
--sky-deep:      #0A1628   /* night sky / deep ink — primary dark BG */
--sky-mid:       #15263F   /* dusk BG */
--sky-blue:      #2E6FB7
--sky-pale:      #C9DCEE

--soil:          #2A1F14   /* dark earth */
--crop:          #C8A95E   /* wheat / amber */
--crop-bright:   #E6C874
--field:         #4F6B3A   /* field green */

--spark:         #E31E24   /* PRIMARY BRAND RED — from Edison logo */
--spark-bright:  #FF4248   /* hot red highlight */
--signal:        #5BE0B3   /* electric / sustainability accent */
--amber:         #F5A623   /* secondary warm — used sparingly */

--paper:         #F4F1EA   /* warm paper — primary light BG */
--paper-2:       #E9E3D6
--ink:           #0D1421   /* near-black body text */
--graphite:      #2A3343
--slate:         #4B5566   /* secondary text */
--rule:          rgba(13,20,33,0.10)        /* hairline on light */
--rule-light:    rgba(255,255,255,0.12)     /* hairline on dark */
```

### Type stack

```
--serif:  'Fraunces', 'Source Serif Pro', Georgia, serif
--sans:   'Inter', system-ui, -apple-system, sans-serif
--mono:   'JetBrains Mono', ui-monospace, monospace
```

Fraunces uses `font-variation-settings: "opsz" 144` for optical-size 144 (display cut) on titles and numerals.

### Spacing & layout conventions

- Slide canvas: **1920 × 1080**
- Standard margins: **120px** left/right inside the slide body, **80px** for chrome/footer
- Chrome bar: top-aligned at **56px** from top edge
- Footer: bottom-aligned at **40px** from bottom edge
- Standard title block top: **220px** from top
- Most content blocks start at **520–560px** from top (below title)
- Card grids use **20–48px gaps**
- Border radius: **0** everywhere — this design is intentionally angular/print-y. Do not introduce rounded corners.

## Brand notes

- **Edison logo** is the red lightning-bolt-in-square mark. It appears in chrome on every slide and as a watermark/glow element on hero slides. Always pair with the wordmark "EDISON AEROSPACE" in JetBrains Mono uppercase, 0.22em tracking.
- The italic-amber treatment (`<span class="italic amber">`) is the deck's signature accent — used to hit one or two phrases per slide in red Fraunces italic. Don't overuse.
- Tone: technical, confident, slightly aerospace-industrial. Mono labels for data, serif for emotion, sans for body. No emoji.

## Interactions

- **Keyboard:** ← / → / Space / Home / End for slide nav (handled by `<deck-stage>`)
- **Mouse:** Click left/right edges to navigate
- **Print:** `Cmd/Ctrl + P` produces a PDF with one slide per page (handled by `<deck-stage>` print CSS)
- **Embed:** Posts `{slideIndexChanged: N}` to parent window — host can sync speaker notes or analytics

## Known caveats

- Some slide validators flag chrome text (e.g. footer "01 / 16", brand wordmark) as below the 24px deck-text minimum. These are intentional micro-type — leave them.
- Slide 02's caption strip ("FIG. 02-A · TURBINE AG AIRCRAFT · LOW PASS · 140 KTS · 6 FT AGL") is decorative; safe to localize or remove.
- The hero photo on slide 02 (`spray-aircraft.jpg`) is sourced from Shutterstock — **license before publishing the deck publicly.**
- Founder portraits (`gene-avakyan.png`, `victoria-unikel.png`) were captured from public profile photos — confirm usage rights before publishing.

## Files referenced from the HTML

```
edison-deck.css           — stylesheet (relative)
deck-stage.js             — web component (relative)
edison-logo.png           — chrome brand mark, watermarks
heavy1-render.jpg         — slide 04 hero
heavy1-tradeshow.jpg      — slide 04 / slide 10 (verify)
gcs-truck.jpg             — slide 11
spray-aircraft.jpg        — slide 02
gene-avakyan.png          — slide 13
victoria-unikel.png       — slide 13
```

Open `Edison Aerospace Investor Deck.html` in a browser to preview. All paths are relative — the bundle is portable.
