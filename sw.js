/* Sacred Temple — Service Worker (offline + notifications) v13.16.8 */
const CACHE = "sacred-temple-v13.16.8";
const IMPORT_CACHE = "sacred-temple-import-active";
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
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== IMPORT_CACHE && !k.startsWith("sacred-temple-v-import-"))
          .map((k) => caches.delete(k))
      )
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

/** Busca primeiro no cache de importação, depois no cache principal */
async function matchLocal(req) {
  const fromImport = await caches.match(req, { cacheName: IMPORT_CACHE });
  if (fromImport) return fromImport;
  const fromMain = await caches.match(req, { cacheName: CACHE });
  if (fromMain) return fromMain;
  return caches.match(req);
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isRemoteApi(url) {
  // Só força rede para APIs/mídia em OUTRO host (não o próprio app em workers.dev)
  if (!isSameOrigin(url) && (url.hostname.includes("workers.dev") || url.pathname.includes("/api/"))) {
    return true;
  }
  if (isSameOrigin(url) && url.pathname.startsWith("/api/")) return true;
  if (url.pathname.includes("/api/media/")) return true;
  return false;
}

function isCoreAsset(url) {
  const p = url.pathname;
  return (
    /\/js\/(api|app)\.js$/.test(p) ||
    /\/css\/styles\.css$/.test(p) ||
    /\/index\.html$/.test(p) ||
    p.endsWith("/") ||
    /\/sw\.js$/.test(p) ||
    /\/manifest\.json$/.test(p)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // API / mídia remota (outro host ou /api no mesmo host): sempre rede
  if (isRemoteApi(url)) {
    event.respondWith(fetch(req).catch(() => matchLocal(req)));
    return;
  }

  // Assets do app (incluindo quando hospedado em *.workers.dev):
  // 1) cache de importação  2) cache principal  3) rede
  // Assim a "Importar atualização" funciona de verdade.
  if (isSameOrigin(url) && (isCoreAsset(url) || req.mode === "navigate")) {
    event.respondWith(
      (async () => {
        const cached = await matchLocal(req);
        if (cached) {
          // Atualiza em segundo plano se houver rede (stale-while-revalidate)
          // MAS não sobrescreve se a resposta em cache veio de importação
          const wasImport = cached.headers && cached.headers.get("X-Sacred-Import") === "1";
          if (!wasImport) {
            fetch(req)
              .then((res) => {
                if (res && res.ok) {
                  const copy = res.clone();
                  caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
                }
              })
              .catch(() => {});
          }
          return cached;
        }
        try {
          const res = await fetch(req);
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        } catch (_) {
          if (req.mode === "navigate") {
            return new Response(OFFLINE_HTML, {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            });
          }
          throw _;
        }
      })()
    );
    return;
  }

  // Demais assets same-origin: cache first
  event.respondWith(
    matchLocal(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && isSameOrigin(url)) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, clone));
        }
        return res;
      });
    })
  );
});
        
