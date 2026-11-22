# NumanX design system (DESIGN.md)

NumanX Studio makes free web tools, a unit converter, apps, games and websites for local businesses, from Quetta. Every NumanX site (Tools Hub, Converter, Websites, the studio homepage and whatever comes next) uses this one system so they read as one company: white, calm, black type, one yellow.

Sites using it: `toolshub.numanxstudio.com`, `converter.numanxstudio.com`, `web.numanxstudio.com`, `numanxstudio.com`.

## Voice

- Plain, specific, short. Say what the thing does: "Compress images, merge PDFs, generate QR codes."
- Sentence case for every heading, button and label: "Get a free sample", not "Get A Free Sample".
- Buttons start with a verb: "Search", "Download PNG", "Book on WhatsApp".
- No hype or filler: no "ultimate", "revolutionary", "AI-powered" unless it truly is, no exclamation marks, no emoji.
- Say each message once per page. The privacy line ("Runs in your browser. Files are not uploaded.") appears in the hero and on each tool that is truly local, nowhere else.
- Never invent numbers, testimonials, clients or results. Example data is marked once: "Example results shown."
- Urdu is welcome as a second line (Noto Nastaliq Urdu, line-height 2.1, right-to-left), never mixed into the same line as English.

## Visual foundations

**Colour.** Light theme first. `surface` (white) is the page; `surface-soft` makes alternate bands and icon tiles. All text is `ink` or `ink-muted`, nothing else. `accent` (NumanX yellow #ffc414) is the only brand colour: use it in large confident fields (the hero stage, the closing panel) or tiny precise marks (the logo letter, step numbers on ink, a featured card's offset shadow), never as text on white. `line` draws hairlines; `line-strong` draws control borders. `whatsapp-strong` is the button colour for WhatsApp and success; `danger` is for errors. Do not add other hues: no blue links, no purple, no gradients except the stage below.

**The yellow stage.** The signature NumanX picture: a `radius-xl` panel filled with a soft two-stop yellow (`#ffd447` to `#ffbf00`, 150°) and a dot grid (1.3px ink dots at 13% on an 18px pitch). Real product content floats on it: phones, tool result cards, notifications, each white with `shadow-float`. One stage per page, in the hero.

**Type.** Archivo (700–900) for display: hero, headings, prices, buttons. Inter (400–600) for everything you read. Headings sit tight (line-height 1.05–1.2, letter-spacing -0.02em) and wrap balanced. Body is 16px, articles 17px at line-height 1.7 in a 720px column. Nothing below 13px. Both fonts load from Google Fonts with `display=swap` and system fallbacks.

**Space and shape.** Content max-width 1180px, gutters at least `space-4` (16px). Sections breathe: `space-12` padding on phones, up to `space-18` on laptops. Cards use `radius-lg`, controls `radius-md`, chips `radius-pill`, the stage `radius-xl`.

**Depth.** Flat by default: cards are white with a 1px `line` border and no shadow; on hover the border turns `ink`. Only floating things (stage cards, dropdowns, the search box) get `shadow-float`. The single featured card per page gets `shadow-offset`, the yellow offset block.

**Motion.** Hover and focus transitions only, 150ms. At most one gentle float in the hero, switched off under `prefers-reduced-motion`. No animated gradients, particles or blobs.

**Accessibility.** Every page works at 390px and 1280px without sideways scroll. Touch targets at least 44px. Focus is always visible: 2px `focus` ring with 2px offset. Inputs are 16px text so phones don't zoom.

## Components (rules every site follows)

Every component below has a live preview and its own guidelines in this system, built with the shared classes in `components/bundle.css` (`.nx-btn`, `.nx-card`, `.nx-stage` and so on). Copy those classes, or recreate them exactly, on every site.


- **Nav.** 64px tall, white at 90% with a 12px backdrop blur, 1px `line` bottom border. Left: logo. Middle: 4–6 text links (Inter 600, 15px). Right: search button showing "Ctrl K" and one primary action.
- **Logo.** The NumanX mark (`assets/Logos/numanx-mark.svg`): an ink tile with a geometric yellow N, at 32px in the nav, followed by the product name in Archivo 800: "NumanX Tools Hub", "NumanX Converter", "NumanX Studio". The yellow version is for dark backgrounds only.
- **Buttons.** Primary: `ink` fill, white Archivo 700 label, 52px tall (42px in the nav), `radius-md`. Secondary: white with a 1.5px `ink` border. WhatsApp: `whatsapp-strong` fill with white label. One primary action per view.
- **Chips.** 36px pill, 1px `line` border, white, Inter 500 14px; hover border `ink`.
- **Inputs and search.** White, 1.5px `line-strong` border, `radius-md` (the hero search: 60px tall, `radius-lg`, `shadow-float`). Focus: `focus` ring plus a 3px accent halo.
- **Cards.** White, 1px `line`, `radius-lg`, `space-6` padding. Tool cards: a 40px `surface-soft` icon tile, name in Archivo 700 17px, one muted line.
- **Steps.** Numbered 44–52px circles: `ink` fill with an `accent` numeral.
- **Price cards.** Three across; the middle one is featured with an `ink` 2px border, `shadow-offset` and a yellow "Most chosen" tag.
- **Comparison (before/after).** Two cards: "before" on `surface-soft` with grey crosses; "after" with an `ink` border, `shadow-offset` and `whatsapp-strong` ticks.
- **Footer.** Link columns in `ink-muted`, a "More from NumanX Studio" row linking the sister sites, "© NumanX Studio" at the end.
- **Overlays.** Cookie banner: a small bottom bar with Accept and Reject. Search modal: white panel, large input, rows with icon, name and category.

## Iconography

Lucide icons only, 18–20px, stroke 2, round caps, coloured like the text beside them. No emoji anywhere in the interface, titles or meta descriptions. Icon tiles are 40px `surface-soft` squares with a 1px `line` border.

## Don't

Dark or brown default themes, emoji labels, blue-purple gradients, glow or neon effects, cards with a coloured left border, stat strips of filler numbers ("Files uploaded 0"), more than one donation or promo block, placeholder text or payment details left on a live page.

## More in this system

- **Imagery** (`design/Imagery.md`): product shots, screenshots, the illustration style, photos, blog covers, link-preview images and image file rules.
- **Video and motion** (`design/Video-and-motion.md`): demo clips, YouTube embeds, clip style, motion timings and reduced motion.
- **Page templates** (`design/Page-templates.md`): the skeleton of every page type, built from the components.

## Using this system on a site

Import `design/numanx-tokens.css` (variables) and `design/numanx-components.css` (the `.nx-*` classes) into the site's global stylesheet, load Archivo and Inter, and build components from the rules above. Code editors should read this README before changing any NumanX site's design.

## For code editors (Claude Code, OpenCode, Gemini CLI, Cursor)

Before changing the design of any NumanX site:
1. Read this file.
2. Use only the variables in `numanx-tokens.css` for colours, fonts, spacing, radius and shadows. Never hard-code another colour.
3. Reuse the classes in `numanx-components.css`, or recreate them exactly in the site's framework (Astro + Tailwind: map the variables into the Tailwind theme).
4. Use `numanx-mark.svg` as the logo and favicon.
5. If a rule here conflicts with an older style in the repo, this file wins.

## This repo (NumanX Experiments)

This site is plain HTML and CSS with a strict Content-Security-Policy (`_headers`) that blocks outside fonts and scripts. So here:
- The tokens live in `assets/site.css` (old variable names such as `--bg`, `--accent`, `--muted` are kept and mapped to NumanX values).
- Archivo and Inter are self-hosted in `assets/fonts/` (SIL Open Font License, see `assets/fonts/LICENSE.txt`). Do not add Google Fonts links.
- The logo is `assets/numanx-mark.svg`, also used as the favicon.
