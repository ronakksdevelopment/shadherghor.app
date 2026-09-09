# Image Guide - Swader Ghor App

This explains how to fill in `image_links.csv` so real photos replace the current icon placeholders throughout the app.

## How to use the CSV

Open `image_links.csv` in Excel, Google Sheets, or any spreadsheet app. Each row is one category or one product already in the app. Fill in the `image_url` column with a direct link to the image (the URL must end in the actual image, e.g. `.jpg` or `.png`, and must be publicly accessible, not a Google Drive share link or a page that merely contains the image). Leave a row blank to keep that item showing its current icon placeholder instead; adding photos is entirely optional and can be done incrementally, one row at a time.

Do not edit the `type`, `id`, `category`, or `name` columns; those match entries already in the app and are only there so you can tell which row is which.

## Recommended size and aspect ratio, and why

| Item type | Recommended size | Aspect ratio | Where it's used |
|---|---|---|---|
| Category | 400 x 400 px minimum | 1:1 (square) | The round category icon on the home screen and menu filter chips |
| Product | 800 x 640 px minimum | 1.2:1 (landscape) | The product grid card and the product detail sheet's main photo |

**Category images (1:1 square, 400x400px minimum):** these render inside a circular badge on the home screen. A square source image crops cleanly into that circle with no stretching or awkward cropping at the edges. Anything shot as a wide banner or a tall portrait will lose important detail once it's cropped down to a circle, so square is worth sticking to here.

**Product images (1.2:1 landscape, 800x640px minimum):** product photos appear in three places at different sizes: a small square-ish grid card, a small square thumbnail in list/cart rows, and a larger landscape banner at the top of the product detail sheet. All of these use "crop to fill" behavior (the technical term is `object-fit: cover`), meaning the image always fills its box completely and simply gets cropped at the edges rather than squeezed or letterboxed. A 1.2:1 landscape source works well across all three: it crops down cleanly to a near-square for the small tiles, and displays close to its native ratio in the larger landscape sheet banner. Keep the main subject of the dish centered in the frame, since the edges are what gets trimmed differently in each spot.

**Minimum sizes** ensure the image still looks sharp on high-resolution phone screens (which render at roughly double or triple the "visual" pixel size). Providing a larger image than the minimum is always fine, the app will scale it down; providing a smaller one risks a blurry or pixelated result once it's stretched up to fill its box.

## Format and hosting

- Use `.jpg` for photos (smaller file size) or `.png` if the image needs transparency (rare for food photos).
- Keep individual file sizes reasonable (under ~500 KB each) so the app stays fast to load, especially on mobile data.
- The URL needs to be a direct, permanent link that stays valid indefinitely. A link to an image on your own website, a CDN, or an image-hosting service that provides direct links (not a share-to-view link) all work. If unsure whether a link will work, open it in a private/incognito browser tab; if it immediately shows just the image with nothing else on the page, it will work.

## What happens with no image

Any row left blank keeps showing the existing colored icon tile for that item exactly as the app does today, so there's no rush and no risk in leaving items unfilled while photos are gathered over time.
