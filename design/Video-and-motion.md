# Video and motion on NumanX websites

Video on a NumanX page shows how a tool or service works in a few seconds. Motion only explains or responds; it never decorates.

## Where video belongs

- **Tool demo clips**: 6–15 seconds showing the tool from upload to result, on a tool page under the tool or in a guide. Silent, looping, inside the `Screenshot` (browser) frame or the `Video` component.
- **Tutorials and walkthroughs**: a YouTube video in a guide or blog post, embedded with the `Video` component.
- **The website service**: a short screen recording of a sample site on a phone, on the sales page.

No background videos behind text, no autoplaying video with sound, no video in the first screen of a tool page (the tool itself goes there).

## How to embed

- **Short demo clips**: `<video muted playsinline loop autoplay preload="none" poster="...">` with WebM (VP9) and MP4 (H.264) sources, at most 1.5 MB, 1280px wide, no audio track. Pause when out of view; respect `prefers-reduced-motion` by showing the poster with a play button instead of autoplaying.
- **YouTube**: use a click-to-load facade (the `Video` component: poster, yellow play button, title and duration). Load the real player only after the click, from `youtube-nocookie.com`. This keeps pages fast and private.
- Always give a poster image (the clearest frame), a title, and the duration. Long videos get captions; the transcript or a step list goes under the video for people who can't watch.

## Clip style

- Record at 1280×720 or 1920×1080, light theme, browser zoom 100–125%, with a clean demo account and sample files.
- Show one task per clip, start on the empty tool, end on the result held for 2 seconds.
- Cursor visible, movements slow and direct. Zoom in (scale 1.0 → 1.3) only to show a small detail.
- No music, no stock transitions, no watermarks. A small NumanX mark in a corner is optional.
- Text on video uses Archivo 800, white with a black outline or on an `ink` pill, at least 28px at 1280px.

## Motion

| Use | Duration | Easing |
| --- | --- | --- |
| Hover, focus, pressed | 150 ms | ease-out |
| Menus, dropdowns, toasts in | 200 ms | cubic-bezier(.2,.8,.2,1) |
| Modals and panels in | 240 ms | cubic-bezier(.2,.8,.2,1) |
| Anything leaving | 160 ms | ease-in |
| Hero float (one element) | 6 s loop, 8px | ease-in-out |

- Move things in from where they come from (a dropdown from its button, a toast from the bottom), by 8–16px, fading at the same time.
- Results appear immediately; a short count-up on a single big number is the only "celebration" allowed.
- Loading: a skeleton for content that takes longer than 300 ms, a spinner only inside buttons, a progress bar for file processing with a real percentage.
- Never animate blur filters, large shadows or gradients; they stutter on phones.
- `prefers-reduced-motion: reduce` turns off the hero float, skeleton shimmer and autoplaying clips; state changes stay instant.
