# Swader Ghor - Ordering App (PWA)

Version 2.1.0 - Production Ready

A mobile-first Progressive Web App for Swader Ghor, Agartala's authentic street food vendor. Customers browse the menu, pick items with size and quantity, add to cart, add a tip, pin their delivery location, review an order summary and send the order directly to the shop on WhatsApp. The app also supports catering enquiries with a custom event-details form.

## Features

- Splash screen with brand animation
- Home screen with category browsing, bestsellers, special offers and promos
- Full menu with category filter chips and live search across all products
- Optional image URL per category and per product, with an icon fallback when no image is set
- Inline add / quantity stepper on every product card and row
- Product detail sheet with size selection and quantity stepper
- Cart with quantity editing, order notes and tip for chefs
- Automatic free delivery above ₹499
- Delivery pricing calculated purely from GPS distance to the store (never from area or place names): a flat base fee covers the first 3 km, then a per-km rate applies beyond that
- Editable delivery coordinates field in checkout, auto-filled from GPS with a "detect my coordinates" button, or typed in manually
- Order summary screen with customer details form
- Google Maps link to the store location
- Custom Catering Enquiry form with a themed calendar date picker, a themed scrolling time-wheel picker, and a themed event-type grid, all built to match the rest of the app rather than relying on native browser pickers
- Orders and enquiries sent as a pre-filled WhatsApp message to the shop, with clear sectioned formatting (order details, bill summary, customer details, delivery location with coordinates and a Maps link)
- Full interface available in English, Bengali and Hindi, switchable from Settings, with every visible screen re-rendering instantly on change
- Every interactive control (buttons, dropdowns, date/time pickers, confirmation dialogs, sheets, text fields) is a custom themed component; the app does not rely on native browser or OS UI chrome
- Installable as a real app (Add to Home Screen / Install prompt)
- Works offline for previously visited screens
- Contact sheet with call, WhatsApp, Instagram, Facebook and directions
- "Our Location" and "Rate Us on Google" actions in the More menu, opening a Maps view and the Google review-write flow respectively

## How to Host on GitHub Pages

1. Create a new GitHub repository, for example `shadher-ghor-app`.
2. Upload all the files in this folder to the root of that repository.
3. Go to the repository **Settings > Pages**.
4. Under **Source**, choose the `main` branch and `/ (root)` folder, then save.
5. GitHub will give you a live URL.
6. Open that URL on a phone. You should see an **Install** banner appear.

The app works fully as a static site, no backend or build step is required.

## Updating Products

Open `js/data.js` and edit the `PRODUCTS` and `CATEGORIES` arrays. Each product supports:

- `name`, `desc`, `category`, `rating`, `badge` (optional)
- `icon`: a Font Awesome icon class, used as a fallback whenever `image` is empty
- `image`: an optional image URL shown instead of the icon, everywhere the product appears
- `sizes`: an array of `{ label, price }` options (Half before Full, where applicable)

Categories support the same `icon` and `image` pattern.

## Language and Translations

All UI text lives in `TRANSLATIONS` in `js/data.js`, keyed by language code (`en`, `bn`, `hi`). Every language must define the exact same set of keys; a missing key in one language silently falls back to English rather than breaking the app, but it is worth checking key parity after any edit. Customers switch languages from More > Settings; there is no language control anywhere else in the app.

## Delivery Pricing

Delivery fee is calculated in `js/app.js` from the straight-line (Haversine) distance between the store's coordinates and the customer's pinned delivery coordinates, using `BASE_DELIVERY_KM` and `PER_KM_DELIVERY_RATE` in `js/data.js`. It never falls back to guessing from an area or place name; if no coordinates are pinned yet, the app prompts the customer to pin their location for accurate pricing.

## Store Info

Store name, address, coordinates, WhatsApp number, Instagram/Facebook links, the Google Maps listing link, the Google review link, home-screen offers, and review highlights are all configured in `js/data.js`. Update these there if any of the shop's real details ever change.

## App Icon

All app icons live in `assets/icons/`. The "any"-purpose icons (`favicon.png`, `icon-72.png` through `icon-512.png`) are transparent PNGs of the brand mark with no background square. The two maskable icons (`icon-192-maskable.png`, `icon-512-maskable.png`) are intentionally opaque, filled edge-to-edge per the PWA maskable-icon spec, so that Android's own mask shape can safely crop them without clipping the logo. `manifest.json` and `service-worker.js` both reference the full icon set; if the brand mark ever changes, regenerate every size listed there rather than only the largest one.

## Notes

- Product data reflects Swader Ghor's actual menu and prices.
- Geolocation auto-detect uses the free OpenStreetMap Nominatim API.
- The app self-hosts its fonts and icon font (no external CDN calls at runtime), so it works fully offline once installed.
