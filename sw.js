/* Sacred Temple — Service Worker (offline + notifications) v13.16.1 */
const CACHE = "sacred-temple-v13.16.1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/api.js",
  "./manifest.json",
  "./icons/spirit.svg",
  "./icons/spirit-192.png",
  "./icons/spirit-512.png",
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Sacred Temple — Offline</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:system-ui,sans-serif;background:#1a0f2e;color:#e8e0ff;text-align:center;padding:1.5rem}
  h1{font-weight:600;font-size:1.25rem;margin:0 0 .5rem}
  p{opacity:.75;font-size:.9rem;line-height:1.45;max-width:22rem;margin:0 auto .75rem}
  button{background:#C9A84C;color:#1a0f2e;border:0;border-radius:999px;padding:.55rem 1.2rem;
    font-weight:600;cursor:pointer;font-size:.9rem}
</style>
</head>
<body>
  <div>
    <div style="font-size:2.5rem;margin-bottom:.5rem">👻</div>
    <h1>Templo em silêncio</h1>
    <p>Sem conexão neste momento. Seus dados locais continuam no aparelho — volte quando a rede retornar.</p>
    <button type="button" onclick="location.reload()">Tentar de novo</button>
  </div>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (data.type === "SHOW_NOTIFICATION") {
    const title = data.title || "Sacred Temple";
    const options = {
      body: data.body || "",
      icon: data.icon || "./icons/spirit-192.png",
      badge: "./icons/spirit-192.png",
      tag: data.tag || "sacred-temple",
      renotify: true,
      data: { url: data.url || "./" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("push", (event) => {
  let title = "Sacred Temple";
  let body = "Nova atividade no templo";
  let url = "./";
  try {
    if (event.data) {
      const j = event.data.json();
      if (j.title) title = j.title;
      if (j.body) body = j.body;
      if (j.url) url = j.url;
    }
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "./icons/spirit-192.png",
      badge: "./icons/spirit-192.png",
      tag: "sacred-push",
      renotify: true,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          try { client.navigate(target); } catch (_) {}
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // API e mídia remota: sempre rede (não cachear áudio/vídeo grande)
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("workers.dev") ||
    url.pathname.includes("/api/media/")
  ) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Scripts do app: rede primeiro — atualiza sem clicar em Atualizar
  if (/\/js\/(api|app)\.js$/.test(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = (await caches.match("./index.html")) || (await caches.match(req));
          if (cached) return cached;
          return new Response(OFFLINE_HTML, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
  
