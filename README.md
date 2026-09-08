# Shadher Ghor - Ordering App (PWA)

Version 2.5 - Production Ready

A mobile-first Progressive Web App for Shadher Ghor, Agartala's authentic street food vendor. Customers browse the menu, pick items with size and quantity, add to cart, add a tip, auto-detect or enter their delivery location, review an order summary and send the order directly to the shop on WhatsApp.

## Features

- Splash screen with brand animation
- Home screen with category browsing, bestsellers, special offers and promos
- Full menu with category filter chips
- Live search across all products
- Inline add / quantity stepper on every product card and row
- Product detail sheet with size selection and quantity stepper
- Cart with quantity editing, order notes and tip for chefs
- Automatic free delivery above ₹499
- Auto-detect delivery location (GPS + reverse geocoding) or manual entry
- Order summary screen with customer details form
- Google Maps link to the store location
- Custom Catering Enquiry form
- Orders sent as a pre-filled WhatsApp message to the shop
- Installable as a real app (Add to Home Screen / Install prompt)
- Works offline for previously visited screens
- Contact sheet with call, WhatsApp, Instagram, Facebook and directions

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
- `icon` - a Font Awesome icon class
- `sizes` - an array of `{ label, price }` options

## Adding Real Photos

Currently each product uses a Font Awesome icon as a placeholder. To add real photos:

1. Add your images to `assets/images/`.
2. In `js/app.js`, replace the icon `<i>` tags with an `<img>` tag.
3. Add a matching `image` field to each product in `js/data.js`.

## Store Info

Store name, address, coordinates, WhatsApp number, Instagram/Facebook links, the Google Maps listing link, home-screen offers, and review highlights are all configured in `js/data.js`. Update these there if any of the shop's real details ever change.

## Notes

- Product data reflects Shadher Ghor's actual menu and prices.
- Geolocation auto-detect uses the free OpenStreetMap Nominatim API.
- The custom enquiry form sends a pre-filled WhatsApp message.