// The offline page for a navigation the network cannot answer; nothing else is cached or answered.
// Bump VERSION to re-cache offline.html. The kill switch is in PLATFORM_NOTES ("The offline worker").

const VERSION = 1;
const CACHE = `offline-${VERSION}`;
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_PAGE, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      // The browser's own request goes out as the worker starts, headers and all: the cold-open landing reads them.
      .then(() => self.registration.navigationPreload?.enable())
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  event.respondWith(
    Promise.resolve(event.preloadResponse)
      .then((preloaded) => preloaded ?? fetch(request))
      .catch(() => caches.match(OFFLINE_PAGE).then((page) => page ?? Response.error())),
  );
});
