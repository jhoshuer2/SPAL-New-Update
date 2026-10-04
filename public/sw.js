/**
 * SPAL Service Worker
 *
 * Deliberately minimal to avoid serving stale Next.js build output.
 * Next.js chunk filenames change on every deploy; caching HTML or chunks
 * risks pointing the browser at purged files (404 → blank page).
 *
 * Strategy:
 *  - HTML navigations → network-only, fall back to /offline ONLY when offline
 *  - /_next/ build output & /api/ → passthrough (never intercepted/cached)
 *  - icons / manifest → cached for offline shell
 *  - Push notifications handled here
 *
 * Bump CACHE_VERSION to force all clients to drop old caches.
 */

const CACHE_VERSION = "spal-v4";
const OFFLINE_URL   = "/offline";
const OFFLINE_IMG   = "/spal-internet-outage.webp";

const PRECACHE = [
  OFFLINE_URL,
  OFFLINE_IMG,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: drop ALL old caches, take control immediately ─────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ───────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;

  // NEVER intercept Next.js build output or API — always hit the network fresh.
  // (Chunks are content-hashed; the CDN handles their caching correctly.)
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) {
    return;
  }

  // Icons / manifest / offline image → cache-first (safe; rarely change, not build-hashed)
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json" || url.pathname === OFFLINE_IMG) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ??
        fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
          return response;
        }),
      ),
    );
    return;
  }

  // HTML navigations → network-only, offline page only on genuine network failure.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((f) => f ?? Response.error()),
      ),
    );
  }
});

// ── Push notification display ─────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body, url, tag } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data:  { url: url ?? "/home" },
      tag,            // same-type notifications replace instead of stacking
      renotify: !!tag,
      vibrate: [100, 50, 100],
    }),
  );
});

// ── Notification click ──────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/home";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
