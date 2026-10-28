// 오프라인 실행용 캐시. 코드가 바뀌면 VERSION을 올린다. 그림(art/)은 처음 볼 때 캐시한다.
const VERSION = "fief-v34";
const FILES = [
  "./", "index.html", "style.css", "manifest.webmanifest",
  "js/art.js", "js/data.js", "js/units.js", "js/battle.js", "js/game.js", "js/story.js", "js/battleview.js", "js/chapters.js", "js/ui.js", "js/romance.js", "js/main.js",
  "fonts/Galmuri11.woff2", "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// 코드: 네트워크 우선(새 버전 바로 반영), 실패하면 캐시. 그림: 캐시 우선
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/art/")) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    })));
    return;
  }
  // GitHub Pages는 브라우저 캐시를 10분 유지하므로, 코드는 캐시를 건너뛰고 서버에 확인한다
  e.respondWith(fetch(e.request.url, { cache: "no-cache" }).then((res) => {
    const copy = res.clone();
    caches.open(VERSION).then((c) => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request)));
});
