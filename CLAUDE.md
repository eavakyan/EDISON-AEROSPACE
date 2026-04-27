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
- **PHP 8.3** — Backend logic for the investor gate (`/investors/api/*.php`). Runs natively on the host.
- **LiteSpeed Web Server** (Apache-compatible, honors `.htaccess`) — managed by Hostinger
- **Cloudflare** — DNS + reverse proxy (orange cloud) in front of the apex domain

**Explicitly NO:** Astro, React, TypeScript, pnpm, npm, node_modules, build steps, Docker, Node.js services, systemd. The generated architecture docs reference Astro — ignore them.

## Hosting & Deploy

- **Platform:** Hostinger **shared PHP hosting** (NOT a VPS). FTP-only access; no SSH, no systemd, no custom nginx.
- **FTP:** `ftp://147.93.42.51`, user `u661589486.edison.aero` (password kept off-repo)
- **FTP login lands in the user's home dir** (one level above the document root). The document root is `/public_html/`. **Always deploy to `/public_html/`, never to `/`.** The bare `/` is the chroot home and not web-served.
- **DNS:** Cloudflare-proxied. Apex resolves to a Cloudflare IP; origin is `147.93.42.51`.
- **SSL:** Managed by the host / Cloudflare; nothing for us to configure.
- **Deploy:** `lftp mirror -R` from the local repo to the FTP server. See `docs/INVESTORS_DEPLOY.md` for the runbook. The previous GitHub Actions rsync workflow has been removed — it required SSH which this host doesn't provide.

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

See `docs/INVESTORS_DEPLOY.md` for the full FTP runbook. Short version:

```bash
# One-time: install lftp (brew install lftp)
# Each deploy — note the target is /public_html, NOT /
MIRROR='mirror -R --delete --verbose --no-perms --exclude-glob .git/ --exclude-glob .gitignore --exclude-glob claude_docs/ --exclude-glob docs/ --exclude-glob CLAUDE.md --exclude-glob .DS_Store --exclude-glob "investors/_data/*.jsonl" --exclude-glob "investors/_config/secrets.php" --exclude "^\.private/" . /public_html'

lftp -u "u661589486.edison.aero,$FTP_PASSWORD" ftp://147.93.42.51 \
  -e "set ftp:ssl-allow yes; set ssl:verify-certificate no; set net:max-retries 5; set net:timeout 60; set ftp:passive-mode true; $MIRROR; bye"
```

`investors/_config/secrets.php` is uploaded **separately** (one time) and stays on the server at `/public_html/investors/_config/secrets.php`. `investors/_data/` is runtime data and is never deployed from local.

**lftp gotcha:** put the entire `mirror` command on a single line (no `\\` line continuations). Bash `\\<newline>` collapses to `\<newline>` which lftp parses as separate commands, breaking the flag list.

## Content Source

All content should be scraped/replicated from https://edison.aero. The goal is a pixel-perfect mirror with enhanced SEO. Media assets (images, videos) should be downloaded from the original site or recreated.

## Issue Resolution Log

- **2026-03-08:** Project initialized. Completed AI Harness Creator interview (9 stages). Generated 6 project docs (PRD, Architecture, Data Model, Implementation Plan, Deployment Spec, UI Spec). Note: generated docs reference Astro framework — override with pure HTML/CSS/JS approach. GitHub repo created at eavakyan/EDISON-AEROSPACE.
- **2026-03-10:** Updated content on defense.html (UNCV) and seawatch.html (SeaWatch) to clarify platform distinctions. UNCV: dual-mode vessel (fast surface + slow underwater submersible), does not fly. SeaWatch: ground-effect aircraft that flies above water, can climb to 500 ft as designed operational capability (not emergency-only). Updated overview text, capabilities sections, specs tables, integration sections, meta/SEO tags, and JSON-LD schema on both pages.
- **2026-04-26:** Built Investor area: `/investors/access.html` (gate form, public) and `/investors/` (gated deck). Soft-wall flow: name+email → magic-link verification → HttpOnly session cookie (30-day) → deck. **First built as a Node/Fastify service** (`api/` folder, commit `a6a6581`) before discovering this is Hostinger shared PHP hosting, not a VPS — Node was unrunnable here. **Pivoted to PHP 8.3** (`investors/api/*.php`, `investors/_protected/`, `investors/_config/`, `investors/_data/`). Same UX, same Resend email integration, same JSONL lead capture. Removed the SSH rsync GitHub Actions workflow; replaced with `lftp` deploy.
