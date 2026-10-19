/**
 * Sacred Temple API — Cloudflare Worker (gratuito)
 * Endpoints REST + D1 (SQLite)
 */

const ALLOWED_ORIGINS = ["*"]; // em produção pode listar seu domínio Pages

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  const allow = ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin) ? (ALLOWED_ORIGINS.includes("*") ? "*" : origin) : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Profile-Id, X-Device-Id, X-Media-Id, X-Media-Name, X-Media-Kind, X-Duration, Range",
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request) },
  });
}

function err(message, status, request) {
  return json({ ok: false, error: message }, status, request);
}

function slugify(name) {
  return String(name || "user")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "user";
}

function now() {
  return new Date().toISOString();
}

function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/* ---------- Web Push (VAPID, sem payload criptografado — “tick” + título no SW) ---------- */
function b64urlToBytes(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function textToB64url(text) {
  return bytesToB64url(new TextEncoder().encode(text));
}

async function importVapidKeyPair(publicB64, privateB64) {
  const pub = b64urlToBytes(publicB64);
  // uncompressed 0x04 || x(32) || y(32)
  if (pub.length !== 65 || pub[0] !== 4) throw new Error("VAPID public key inválida");
  const x = bytesToB64url(pub.slice(1, 33));
  const y = bytesToB64url(pub.slice(33, 65));
  const d = privateB64;
  const priv = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d, ext: true, key_ops: ["sign"] },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  return { priv, publicB64 };
}

async function createVapidAuthHeader(endpoint, publicB64, privateB64, subject) {
  const { priv } = await importVapidKeyPair(publicB64, privateB64);
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const header = textToB64url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = textToB64url(JSON.stringify({ aud, exp, sub: subject || "mailto:sacred-temple@workers.dev" }));
  const data = new TextEncoder().encode(header + "." + payload);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, priv, data);
  // Convert DER-ish raw r||s (64 bytes from WebCrypto) to b64url
  const sigB64 = bytesToB64url(new Uint8Array(sig));
  const jwt = header + "." + payload + "." + sigB64;
  return "vapid t=" + jwt + ", k=" + publicB64;
}

async function sendPushToEndpoint(env, endpoint, payloadObj) {
  const pub = env.VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return { ok: false, error: "VAPID não configurado" };
  const auth = await createVapidAuthHeader(endpoint, pub, priv, env.VAPID_SUBJECT);
  // Envia corpo JSON em texto: alguns serviços exigem cifrar; para FCM/Mozilla
  // usamos push sem body (tick) — o SW mostra título padrão ou busca na rede.
  // Com body não cifrado muitos endpoints rejeitam; por isso body vazio + headers.
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      TTL: "86400",
      Urgency: "normal",
      Authorization: auth,
      "Content-Length": "0",
    },
  });
  return { ok: res.ok || res.status === 201, status: res.status };
}

async function notifyFollowersOfPost(env, authorId, postText) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  try {
    // Seguidores (apoio.from_id → author) + outros aparelhos do autor
    const { results: subs } = await env.DB.prepare(
      `SELECT DISTINCT endpoint FROM push_subscriptions
       WHERE profile_id = ?
          OR profile_id IN (SELECT from_id FROM apoio WHERE to_id = ?)`
    )
      .bind(authorId, authorId)
      .all();
    const list = subs || [];
    for (const row of list) {
      try {
        const r = await sendPushToEndpoint(env, row.endpoint, {
          title: "Sacred Temple",
          body: (postText || "Novo post no templo").slice(0, 120),
        });
        // 404/410 → inscrição morta
        if (r.status === 404 || r.status === 410) {
          await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(row.endpoint).run();
        }
      } catch (e) {
        console.warn("push send", e);
      }
    }
  } catch (e) {
    console.warn("notifyFollowers", e);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;

    if (!env.DB) {
      return err(
        "D1 não configurado. Rode: npm run db:create, cole database_id no wrangler.toml, npm run db:migrate",
        503,
        request
      );
    }

    try {
      // Health
      if (path === "/" || path === "/api" || path === "/api/health") {
        return json({
          ok: true,
          app: env.APP_NAME || "Sacred Temple",
          version: "1.2.0",
          time: now(),
          d1: !!env.DB,
          r2: !!env.MEDIA,
        }, 200, request);
      }

      // POST /api/profiles — criar ou atualizar perfil
      if (path === "/api/profiles" && method === "POST") {
        const body = await readJson(request);
        if (!body || !body.name) return err("name obrigatório", 400, request);
        let handle = (body.handle || slugify(body.name)).toLowerCase().replace(/^@/, "");
        const id = body.id || uid("u");
        const ts = now();

        // garantir handle único
        const existing = await env.DB.prepare("SELECT id FROM profiles WHERE handle = ? AND id != ?")
          .bind(handle, id)
          .first();
        if (existing) handle = handle + "-" + Math.random().toString(36).slice(2, 5);

        await env.DB.prepare(
          `INSERT INTO profiles (id, handle, name, bio, avatar_color, photo_url, google_sub, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             handle=excluded.handle, name=excluded.name, bio=excluded.bio,
             avatar_color=excluded.avatar_color, photo_url=excluded.photo_url,
             google_sub=excluded.google_sub, updated_at=excluded.updated_at`
        )
          .bind(
            id,
            handle,
            String(body.name).slice(0, 80),
            String(body.bio || "").slice(0, 300),
            body.avatar_color || "#e8e0ff",
            String(body.photo_url || "").slice(0, 2000),
            body.google_sub || "",
            body.created_at || ts,
            ts
          )
          .run();

        const row = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first();
        return json({ ok: true, profile: row }, 200, request);
      }

      // GET /api/profiles/search?q=
      if (path === "/api/profiles/search" && method === "GET") {
        const q = (url.searchParams.get("q") || "").trim().toLowerCase();
        let rows;
        if (!q) {
          rows = await env.DB.prepare(
            "SELECT id, handle, name, bio, avatar_color, photo_url, updated_at FROM profiles ORDER BY updated_at DESC LIMIT 40"
          ).all();
        } else {
          const like = "%" + q + "%";
          rows = await env.DB.prepare(
            `SELECT id, handle, name, bio, avatar_color, photo_url, updated_at FROM profiles
             WHERE lower(name) LIKE ? OR lower(handle) LIKE ? OR lower(bio) LIKE ?
             ORDER BY updated_at DESC LIMIT 40`
          )
            .bind(like, like, like)
            .all();
        }
        return json({ ok: true, profiles: rows.results || [] }, 200, request);
      }

      // GET /api/profiles/:handleOrId
      if (path.startsWith("/api/profiles/") && method === "GET") {
        const key = decodeURIComponent(path.slice("/api/profiles/".length));
        if (key === "search") return err("use /api/profiles/search", 400, request);
        const row =
          (await env.DB.prepare("SELECT * FROM profiles WHERE handle = ?").bind(key.toLowerCase()).first()) ||
          (await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(key).first());
        if (!row) return err("perfil não encontrado", 404, request);

        const apoiadores = await env.DB.prepare(
          `SELECT p.id, p.handle, p.name, p.avatar_color, p.photo_url FROM apoio a
           JOIN profiles p ON p.id = a.from_id WHERE a.to_id = ? LIMIT 100`
        )
          .bind(row.id)
          .all();
        const apoiando = await env.DB.prepare(
          `SELECT p.id, p.handle, p.name, p.avatar_color, p.photo_url FROM apoio a
           JOIN profiles p ON p.id = a.to_id WHERE a.from_id = ? LIMIT 100`
        )
          .bind(row.id)
          .all();

        const posts = await env.DB.prepare(
          "SELECT * FROM posts WHERE author_id = ? ORDER BY pinned DESC, created_at DESC LIMIT 100"
        )
          .bind(row.id)
          .all();

        return json(
          {
            ok: true,
            profile: row,
            apoiadores: apoiadores.results || [],
            apoiando: apoiando.results || [],
            posts: posts.results || [],
            counts: {
              apoiadores: (apoiadores.results || []).length,
              apoiando: (apoiando.results || []).length,
            },
          },
          200,
          request
        );
      }

      // POST /api/posts
      if (path === "/api/posts" && method === "POST") {
        const body = await readJson(request);
        if (!body || !body.author_id) return err("author_id obrigatório", 400, request);
        const author = await env.DB.prepare("SELECT id FROM profiles WHERE id = ?").bind(body.author_id).first();
        if (!author) return err("autor não encontrado — registre o perfil antes", 400, request);
        const id = body.id || uid("p");
        const ts = now();
        await env.DB.prepare(
          `INSERT INTO posts (id, author_id, text, external_link, media_kind, media_url, pinned, views, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             author_id = excluded.author_id,
             text = excluded.text,
             external_link = excluded.external_link,
             media_kind = excluded.media_kind,
             media_url = excluded.media_url,
             pinned = excluded.pinned,
             views = MAX(posts.views, excluded.views)`
        )
          .bind(
            id,
            body.author_id,
            String(body.text || "").slice(0, 4000),
            String(body.external_link || "").slice(0, 500),
            body.media_kind || "",
            String(body.media_url || "").slice(0, 2000),
            body.pinned ? 1 : 0,
            body.views || 0,
            body.created_at || ts
          )
          .run();
        const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();
        // Web Push para seguidores e outros aparelhos do autor (não bloqueia a resposta)
        try {
          const preview = String(body.text || "Novo post").slice(0, 120);
          notifyFollowersOfPost(env, body.author_id, preview);
        } catch (_) {}
        return json({ ok: true, post: row }, 201, request);
      }

      // GET /api/posts?author= / feed
      if (path === "/api/posts" && method === "GET") {
        const author = url.searchParams.get("author");
        const q = (url.searchParams.get("q") || "").trim();
        let rows;
        if (author) {
          rows = await env.DB.prepare(
            "SELECT posts.*, profiles.handle, profiles.name as author_name FROM posts JOIN profiles ON profiles.id = posts.author_id WHERE posts.author_id = ? OR profiles.handle = ? ORDER BY pinned DESC, created_at DESC LIMIT 100"
          )
            .bind(author, author.toLowerCase())
            .all();
        } else if (q) {
          const like = "%" + q.toLowerCase() + "%";
          rows = await env.DB.prepare(
            `SELECT posts.*, profiles.handle, profiles.name as author_name FROM posts
             JOIN profiles ON profiles.id = posts.author_id
             WHERE lower(posts.text) LIKE ? ORDER BY created_at DESC LIMIT 100`
          )
            .bind(like)
            .all();
        } else {
          rows = await env.DB.prepare(
            `SELECT posts.*, profiles.handle, profiles.name as author_name FROM posts
             JOIN profiles ON profiles.id = posts.author_id
             ORDER BY created_at DESC LIMIT 100`
          ).all();
        }
        return json({ ok: true, posts: rows.results || [] }, 200, request);
      }

      // POST /api/posts/:id/view  — incrementa e devolve o total atualizado
      if (path.match(/^\/api\/posts\/[^/]+\/view$/) && method === "POST") {
        const id = path.split("/")[3];
        await env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").bind(id).run();
        const row = await env.DB.prepare("SELECT id, views FROM posts WHERE id = ?").bind(id).first();
        return json({ ok: true, id, views: row ? row.views : 0 }, 200, request);
      }

      // GET /api/posts/:id/views  — consulta visualizações em tempo real
      if (path.match(/^\/api\/posts\/[^/]+\/views$/) && method === "GET") {
        const id = path.split("/")[3];
        const row = await env.DB.prepare("SELECT id, views FROM posts WHERE id = ?").bind(id).first();
        if (!row) return err("post não encontrado", 404, request);
        return json({ ok: true, id: row.id, views: row.views || 0 }, 200, request);
      }

      // POST /api/profiles/recover  — entrar no próprio perfil sem Google (handle + pin opcional)
      if (path === "/api/profiles/recover" && method === "POST") {
        const body = await readJson(request);
        const handle = String(body?.handle || "").toLowerCase().replace(/^@/, "").trim();
        if (!handle) return err("handle obrigatório", 400, request);
        const row = await env.DB.prepare("SELECT * FROM profiles WHERE handle = ?").bind(handle).first();
        if (!row) return err("perfil não encontrado", 404, request);
        // PIN opcional: se o perfil tiver recovery_pin, exige coincidir
        if (row.recovery_pin) {
          const pin = String(body?.pin || "").trim();
          if (pin !== String(row.recovery_pin)) return err("PIN incorreto", 403, request);
        }
        const posts = await env.DB.prepare(
          "SELECT * FROM posts WHERE author_id = ? ORDER BY pinned DESC, created_at DESC LIMIT 100"
        ).bind(row.id).all();
        return json({
          ok: true,
          profile: row,
          posts: posts.results || [],
        }, 200, request);
      }

      // POST /api/profiles/:id/pin  — definir PIN de recuperação (gratuito, local no D1)
      if (path.match(/^\/api\/profiles\/[^/]+\/pin$/) && method === "POST") {
        const id = path.split("/")[3];
        const body = await readJson(request);
        const pin = String(body?.pin || "").trim();
        if (pin && !/^\d{4,8}$/.test(pin)) return err("PIN deve ter 4 a 8 dígitos", 400, request);
        await env.DB.prepare("UPDATE profiles SET recovery_pin = ?, updated_at = ? WHERE id = ?")
          .bind(pin || null, now(), id)
          .run();
        return json({ ok: true, has_pin: !!pin }, 200, request);
      }

      // POST /api/apoio  { from_id, to_id }
      if (path === "/api/apoio" && method === "POST") {
        const body = await readJson(request);
        if (!body?.from_id || !body?.to_id) return err("from_id e to_id obrigatórios", 400, request);
        if (body.from_id === body.to_id) return err("não pode apoiar a si mesmo", 400, request);
        await env.DB.prepare(
          "INSERT OR IGNORE INTO apoio (from_id, to_id, created_at) VALUES (?, ?, ?)"
        )
          .bind(body.from_id, body.to_id, now())
          .run();
        return json({ ok: true, apoiando: true }, 200, request);
      }

      // DELETE /api/apoio  { from_id, to_id }
      if (path === "/api/apoio" && method === "DELETE") {
        const body = await readJson(request);
        if (!body?.from_id || !body?.to_id) return err("from_id e to_id obrigatórios", 400, request);
        await env.DB.prepare("DELETE FROM apoio WHERE from_id = ? AND to_id = ?")
          .bind(body.from_id, body.to_id)
          .run();
        return json({ ok: true, apoiando: false }, 200, request);
      }


      // ---------- Media (R2) ----------
      // POST /api/media  — body: raw bytes; headers: Content-Type, X-Media-Id, X-Profile-Id, X-Media-Name, X-Media-Kind, X-Duration
      if (path === "/api/media" && method === "POST") {
        if (!env.MEDIA) {
          return err(
            "R2 não configurado. Rode: npx wrangler r2 bucket create sacred-temple-media e descomente [[r2_buckets]] no wrangler.toml",
            503,
            request
          );
        }
        const profileId = request.headers.get("X-Profile-Id") || "";
        if (!profileId) return err("X-Profile-Id obrigatório", 400, request);
        const author = await env.DB.prepare("SELECT id FROM profiles WHERE id = ?").bind(profileId).first();
        if (!author) return err("perfil não encontrado — sincronize o perfil antes", 400, request);

        const id = request.headers.get("X-Media-Id") || uid("m");
        const name = request.headers.get("X-Media-Name") || id;
        const kind = request.headers.get("X-Media-Kind") || "music";
        const duration = parseInt(request.headers.get("X-Duration") || "0", 10) || 0;
        const mime = request.headers.get("Content-Type") || "application/octet-stream";
        const buf = await request.arrayBuffer();
        const size = buf.byteLength;
        if (size < 1) return err("arquivo vazio", 400, request);
        if (size > 25 * 1024 * 1024) return err("arquivo máx. 25 MB", 413, request);

        const key = "media/" + profileId + "/" + id;
        await env.MEDIA.put(key, buf, {
          httpMetadata: { contentType: mime },
          customMetadata: { name, kind, profileId },
        });

        const ts = now();
        await env.DB.prepare(
          `INSERT INTO media (id, profile_id, name, mime, size, kind, duration, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             mime = excluded.mime,
             size = excluded.size,
             kind = excluded.kind,
             duration = excluded.duration`
        )
          .bind(id, profileId, name, mime, size, kind, duration, ts)
          .run();

        const url = new URL(request.url);
        const publicUrl = url.origin + "/api/media/" + encodeURIComponent(id);
       
