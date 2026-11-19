// Service worker Markas (PWA): buka laju & boleh dipasang ke skrin utama.
// - Fail /assets/* (nama ada hash) → cache dahulu (tak pernah berubah)
// - Halaman → rangkaian dahulu, cache sebagai sandaran bila luar talian
// - /api/* TIDAK disentuh (data sentiasa terkini, kod akses tak disimpan)
const CACHE = "markas-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(caches.open(CACHE).then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("/", copy)); return r; })
      .catch(() => caches.match("/")));
  }
});
