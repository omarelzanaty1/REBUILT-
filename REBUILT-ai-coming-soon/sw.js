const CACHE_NAME = "rebuilt-web-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/icons.js",
  "./js/helpers.js",
  "./js/storage.js",
  "./js/xp.js",
  "./js/streak.js",
  "./js/achievements.js",
  "./js/messages.js",
  "./js/charts.js",
  "./js/components.js",
  "./js/modal.js",
  "./js/toast.js",
  "./js/auth.js",
  "./js/ai.js",
  "./js/router.js",
  "./js/gate.js",
  "./js/pages/dashboard.js",
  "./js/pages/habits.js",
  "./js/pages/tasks.js",
  "./js/pages/planner.js",
  "./js/pages/analytics.js",
  "./js/pages/achievementsPage.js",
  "./js/pages/ai.js",
  "./js/pages/profile.js",
  "./js/pages/settings.js",
  "./js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
