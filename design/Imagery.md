# Imagery on NumanX websites

Pictures on a NumanX site show the real thing: the tool working, the result, the business. They never decorate.

## The order of choice

1. **The product itself**: a live tool, a result card, a phone showing a site. On a tool site the best picture is the tool in use.
2. **A screenshot in a frame**: a real screenshot inside the browser or phone frame component, never floating loose.
3. **A NumanX illustration**: flat geometric drawings for blog covers, empty states and guides (rules below).
4. **A real photo**: only of real places, products or the person behind the work (Muhammad Numan on the About and website-service pages), taken in daylight, uncluttered.

Never: stock photos of smiling people at laptops, AI-generated faces, photos of public figures, logos of other brands used as decoration, or images taken from Google Maps or other sites without permission.

## Illustration style

- Flat shapes with a 3px `ink` outline and rounded joins, on a single colour field: `accent`, `accent-soft` or `surface-soft`.
- Two to five objects drawn as the recognisable thing (an image frame, a document, a clock, a cricket ball), never abstract blobs.
- Colours only from the system: `ink`, white, `accent`, `accent-soft`, with `whatsapp-strong` for a success mark at most.
- One idea per picture: "big image → small image" for compression, a document with a spark for writing.
- Drawn as inline SVG so they stay sharp and light; no gradients, no shadows inside the drawing.

## Screenshots

- Crop to the part that matters; no browser chrome of your own, use the `Screenshot` frame.
- Use realistic but non-personal data. Blur or replace any real names, numbers or addresses.
- Light theme screenshots only, so they match the page.

## Photos

- Natural light, a calm background, the subject large in the frame.
- Crop to 4:3, 1:1 or 16:9 with `radius-lg` corners; no filters, borders or drop shadows.
- People photos only with the person's permission.

## Blog and guide covers

Every article gets a 16:9 cover built from the illustration style (see `BlogCover`): a colour field, two to four outlined objects, no words on the image. The title sits in HTML under it, never inside the picture.

## Link preview images (Open Graph)

Every page has a 1200×630 preview image (see `LinkPreview`): white or yellow-stage background, the page title in Archivo 900, the NumanX mark and the site address. Text inside the safe area (60px from every edge), at least 56px tall so it reads in WhatsApp.

## Technical rules

- Formats: SVG for illustrations and icons; WebP (or AVIF) for photos and screenshots with a JPG fallback only if needed; PNG only for the 1200×630 link preview.
- Size: hero images at most 200 KB, inline images at most 120 KB. Serve 2× sizes with `srcset`.
- Always set `width` and `height` (no layout shift) and `loading="lazy"` for anything below the first screen; the hero image loads eagerly.
- Alt text says what the image shows in plain words ("Image Compressor reducing a 2.4 MB photo to 580 KB"). Purely decorative drawings get `alt=""`.
- Favicon: `numanx-mark.svg`, plus a 180px PNG for Apple devices.
