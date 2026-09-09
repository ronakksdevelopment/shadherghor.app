// Bump this on every deploy
const CACHE_NAME = "swader-ghor-v2.1.0";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/app.js",
  "./manifest.json",
  "./assets/icons/icon-72.png",
  "./assets/icons/icon-96.png",
  "./assets/icons/icon-128.png",
  "./assets/icons/icon-144.png",
  "./assets/icons/icon-152.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-192-maskable.png",
  "./assets/icons/icon-384.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png",
  "./assets/icons/favicon.png",
  "./assets/fontawesome/css/all.min.css",
  "./assets/fontawesome/webfonts/fa-solid-900.woff2",
  "./assets/fontawesome/webfonts/fa-brands-400.woff2",
  "./assets/fontawesome/webfonts/fa-regular-400.woff2",
  "./assets/fonts/fonts.css",
  "./assets/fonts/baloo-2-latin-500-normal.woff2",
  "./assets/fonts/baloo-2-latin-600-normal.woff2",
  "./assets/fonts/baloo-2-latin-700-normal.woff2",
  "./assets/fonts/baloo-2-latin-800-normal.woff2",
  "./assets/fonts/poppins-latin-400-normal.woff2",
  "./assets/fonts/poppins-latin-500-normal.woff2",
  "./assets/fonts/poppins-latin-600-normal.woff2",
  "./assets/fonts/poppins-latin-700-normal.woff2",
  "./assets/fonts/poppins-latin-800-normal.woff2",
];

const REVALIDATE_EXTENSIONS = [".html", ".css", ".js", ".json"];

function shouldRevalidate(pathname) {
  return REVALIDATE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  // Do NOT skipWaiting automatically here: the new SW stays "waiting" until
  // the page explicitly asks it to activate (see the SKIP_WAITING message
  // below), so an open tab doesn't have its cache swapped without notice.
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  const url = new URL(req.url);

  if (url.hostname === "nominatim.openstreetmap.org") {
    event.respondWith(fetch(req).catch(() => new Response(null, { status: 504 })));
    return;
  }

  if (url.origin === self.location.origin && shouldRevalidate(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cached) => {
          const networkFetch = fetch(req)
            .then((res) => {
              if (res && res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => null);
          return cached || networkFetch || fetch(req);
        })
      )
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});