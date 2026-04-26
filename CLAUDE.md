# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Edison Aerospace corporate website — a fully static, pixel-perfect replica of https://edison.aero. Built with pure HTML5, CSS3, and vanilla JavaScript (ES6+). No frameworks, no build tools, no dependencies.

**Blueprint ID:** `69ae2c48b7710ce5ed97ffb6` (AI Harness Creator API)
**GitHub:** https://github.com/eavakyan/EDISON-AEROSPACE

## Tech Stack

- **HTML5** — Semantic markup, Schema.org JSON-LD structured data
- **CSS3** — Custom properties for theming, no preprocessor, no framework
- **Vanilla JavaScript (ES6+)** — No transpilation, no bundling
- **Nginx** — Static file serving on Linux VPS
- **Let's Encrypt** — SSL via Certbot

**Explicitly NO:** Astro, React, TypeScript, pnpm, npm, node_modules, build steps, Docker (optional). The generated architecture docs reference Astro — ignore those references and use plain HTML/CSS/JS instead.

## File Structure

```
edison-aerospace/
├── index.html                    # Home page
├── agriculture/
│   ├── heavy-1.html
│   ├── ground-control-station.html
│   ├── cost-of-ownership.html
│   ├── safety.html
│   └── pilot-training.html
├── defense.html
├── press.html
├── news.html
├── podcast.html
├── contact.html
├── thank-you.html
├── 404.html
├── css/
│   ├── global.css                # CSS custom properties, resets, base styles
│   ├── typography.css            # Font imports, heading/body styles
│   ├── layout.css                # Grid systems, containers, breakpoints
│   ├── header.css                # Sticky header, nav, mobile menu
│   ├── footer.css                # Footer layout and styles
│   ├── heroes.css                # Video, parallax, image hero styles
│   ├── cards.css                 # Card components + hover animations
│   ├── forms.css                 # Contact form, newsletter styles
│   ├── tables.css                # Specs tables, cost comparison
│   ├── lightbox.css              # Lightbox overlay styles
│   ├── animations.css            # Keyframes, transitions, hover effects
│   ├── cookie-consent.css        # Cookie banner styles
│   └── utilities.css             # Helper classes (sr-only, etc.)
├── js/
│   ├── main.js                   # Shared init: mobile menu, parallax, scroll
│   ├── lightbox.js               # Image lightbox logic
│   ├── cost-calculator.js        # Scenario toggle + chart render
│   ├── cookie-consent.js         # Consent logic + GA4 gating
│   ├── form-validation.js        # Client-side form validation
│   └── analytics.js              # GA4 init (conditional on consent)
├── assets/
│   ├── images/
│   │   ├── logo/                 # Edison logo SVG/PNG
│   │   ├── heroes/               # Hero background images per page
│   │   ├── products/             # Heavy 1, GCS, defense vehicle images
│   │   ├── press/                # Press article thumbnails
│   │   ├── news/                 # News post images
│   │   └── icons/                # Value prop icons, social icons
│   ├── videos/
│   │   └── hero-bg.mp4          # Homepage hero video
│   └── fonts/                    # Self-hosted fallback fonts (optional)
├── sitemap.xml
├── robots.txt
├── claude_docs/                  # Generated project specs (reference only)
│   ├── prd.md
│   ├── architecture.md
│   ├── data_model.md
│   ├── implementation_plan.md
│   ├── deployment_spec.md
│   └── ui_spec.md
└── .github/
    └── workflows/
        └── deploy.yml            # GitHub Actions: rsync to VPS
```

## Design System

### Colors
- Primary dark blue: `#052c54`
- Accent magenta: `#f83aff`
- Secondary purple: `#5325ea`
- Slate gray: `#7c89a0`
- Red accent: `#ea2e2e`
- Orange accent: `#e28534`

### Typography (Google Fonts)
- Headings: Montserrat, Josefin Sans (uppercase)
- Body: Open Sans
- Supplementary: Roboto Condensed, Karla, Oswald

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px – 1139px
- Desktop: ≥ 1140px

## Key Patterns

### Shared Header/Footer
Every HTML page includes the same header (sticky nav with Agriculture dropdown, hamburger mobile menu) and footer (social links, newsletter signup, secondary nav). Use HTML includes or copy the shared markup into each page.

### SEO Per Page
Every page must have:
- Unique `<title>` and `<meta name="description">`
- Canonical `<link rel="canonical">`
- Open Graph tags (og:title, og:description, og:image, og:url)
- Twitter Card tags
- Schema.org JSON-LD (Organization on home, Product on Heavy 1/GCS, WebPage on others, BreadcrumbList on inner pages)

### Third-Party Integrations (all client-side)
- **Formspree** — Contact form POST to `https://formspree.io/f/FORM_ID` (placeholder)
- **Google Analytics GA4** — Tag `GT-WVCKHNB`, gated by cookie consent
- **Mailchimp** — Newsletter form in footer (placeholder action URL)
- **YouTube** — Privacy-enhanced embeds (`youtube-nocookie.com`), lazy-loaded
- **Google Fonts** — CDN link tags in `<head>`

### Cookie Consent
Bottom bar with Accept/Decline. GA4 only loads after Accept. Preference stored in `localStorage`.

## Build Phases (from Implementation Plan)

| Phase | Description |
|-------|-------------|
| 0 | Project scaffold, CSS design system, shared layout |
| 1 | Header, footer, navigation, cookie consent |
| 2 | Home page (video hero, value cards, product showcase) |
| 3 | Agriculture section (5 sub-pages + cost calculator) |
| 4 | Defense, Press, News, Podcast pages |
| 5 | Contact form, Thank You page, integration wiring |
| 6 | Lightbox, animations, accessibility (WCAG 2.1 AA) |
| 7 | SEO finalization, performance, deployment |

## Deployment

- **Server:** Linux VPS, Nginx serving static files from `/var/www/edison-aerospace/`
- **SSL:** Let's Encrypt + Certbot auto-renewal
- **CI/CD:** GitHub Actions → rsync to VPS on push to `main`
- **Manual fallback:** `rsync -avz --delete ./ user@vps:/var/www/edison-aerospace/`

## Content Source

All content should be scraped/replicated from https://edison.aero. The goal is a pixel-perfect mirror with enhanced SEO. Media assets (images, videos) should be downloaded from the original site or recreated.

## Issue Resolution Log

- **2026-03-08:** Project initialized. Completed AI Harness Creator interview (9 stages). Generated 6 project docs (PRD, Architecture, Data Model, Implementation Plan, Deployment Spec, UI Spec). Note: generated docs reference Astro framework — override with pure HTML/CSS/JS approach. GitHub repo created at eavakyan/EDISON-AEROSPACE.
- **2026-03-10:** Updated content on defense.html (UNCV) and seawatch.html (SeaWatch) to clarify platform distinctions. UNCV: dual-mode vessel (fast surface + slow underwater submersible), does not fly. SeaWatch: ground-effect aircraft that flies above water, can climb to 500 ft as designed operational capability (not emergency-only). Updated overview text, capabilities sections, specs tables, integration sections, meta/SEO tags, and JSON-LD schema on both pages.
