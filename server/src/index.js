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
          version: "1.1.1",
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
          "SELECT * FROM posts WHERE author_id = ? ORDER BY pinned DESC, created_at DESC LIMIT 50"
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
             views = excluded.views`
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
        return json({ ok: true, post: row }, 201, request);
      }

      // GET /api/posts?author= / feed
      if (path === "/api/posts" && method === "GET") {
        const author = url.searchParams.get("author");
        const q = (url.searchParams.get("q") || "").trim();
        let rows;
        if (author) {
          rows = await env.DB.prepare(
            "SELECT posts.*, profiles.handle, profiles.name as author_name FROM posts JOIN profiles ON profiles.id = posts.author_id WHERE posts.author_id = ? OR profiles.handle = ? ORDER BY pinned DESC, created_at DESC LIMIT 50"
          )
            .bind(author, author.toLowerCase())
            .all();
        } else if (q) {
          const like = "%" + q.toLowerCase() + "%";
          rows = await env.DB.prepare(
            `SELECT posts.*, profiles.handle, profiles.name as author_name FROM posts
             JOIN profiles ON profiles.id = posts.author_id
             WHERE lower(posts.text) LIKE ? ORDER BY created_at DESC LIMIT 50`
          )
            .bind(like)
            .all();
        } else {
          rows = await env.DB.prepare(
            `SELECT posts.*, profiles.handle, profiles.name as author_name FROM posts
             JOIN profiles ON profiles.id = posts.author_id
             ORDER BY created_at DESC LIMIT 50`
          ).all();
        }
        return json({ ok: true, posts: rows.results || [] }, 200, request);
      }

      // POST /api/posts/:id/view
      if (path.match(/^\/api\/posts\/[^/]+\/view$/) && method === "POST") {
        const id = path.split("/")[3];
        await env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").bind(id).run();
        return json({ ok: true }, 200, request);
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
        return json({ ok: true, id, url: publicUrl, size, mime }, 200, request);
      }

      // GET /api/media/:id  (suporta Range para seek em áudio/vídeo — grátis)
      if (path.startsWith("/api/media/") && method === "GET") {
        const id = decodeURIComponent(path.slice("/api/media/".length));
        if (!id || id.includes("/")) return err("id inválido", 400, request);
        if (!env.MEDIA) return err("R2 não configurado", 503, request);

        const row = await env.DB.prepare("SELECT * FROM media WHERE id = ?").bind(id).first();
        if (!row) return err("mídia não encontrada", 404, request);

        const key = "media/" + row.profile_id + "/" + id;
        const size = Number(row.size) || 0;
        const rangeHeader = request.headers.get("Range");

        // Pedido parcial (seek) — essencial para players mobile
        if (rangeHeader && size > 0) {
          const m = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
          if (m) {
            let start = m[1] === "" ? 0 : parseInt(m[1], 10);
            let end = m[2] === "" ? size - 1 : parseInt(m[2], 10);
            if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
              return new Response(null, {
                status: 416,
                headers: {
                  ...corsHeaders(request),
                  "Content-Range": "bytes */" + size,
                },
              });
            }
            end = Math.min(end, size - 1);
            const obj = await env.MEDIA.get(key, { range: { offset: start, length: end - start + 1 } });
            if (!obj) return err("arquivo não encontrado no storage", 404, request);
            const headers = {
              ...corsHeaders(request),
              "Content-Type": row.mime || "application/octet-stream",
              "Content-Length": String(end - start + 1),
              "Content-Range": "bytes " + start + "-" + end + "/" + size,
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=86400",
              "Content-Disposition": 'inline; filename="' + (row.name || id).replace(/"/g, "") + '"',
            };
            return new Response(obj.body, { status: 206, headers });
          }
        }

        const obj = await env.MEDIA.get(key);
        if (!obj) return err("arquivo não encontrado no storage", 404, request);

        const headers = {
          ...corsHeaders(request),
          "Content-Type": row.mime || "application/octet-stream",
          "Content-Length": String(size || ""),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
          "Content-Disposition": 'inline; filename="' + (row.name || id).replace(/"/g, "") + '"',
        };
        return new Response(obj.body, { status: 200, headers });
      }

      // GET /api/music?author=handleOrId
      if (path === "/api/music" && method === "GET") {
        const author = url.searchParams.get("author") || "";
        if (!author) return err("author obrigatório", 400, request);
        const profile =
          (await env.DB.prepare("SELECT * FROM profiles WHERE handle = ? OR id = ?").bind(author, author).first()) ||
          null;
        if (!profile) return json({ ok: true, music: [] }, 200, request);
        const { results } = await env.DB.prepare(
          "SELECT id, name, mime, size, kind, duration, created_at FROM media WHERE profile_id = ? AND kind = 'music' ORDER BY created_at DESC LIMIT 50"
        )
          .bind(profile.id)
          .all();
        const origin = new URL(request.url).origin;
        const music = (results || []).map((m) => ({
          id: m.id,
          n: m.name,
          d: m.duration || 0,
          mime: m.mime,
          size: m.size,
          url: origin + "/api/media/" + encodeURIComponent(m.id),
        }));
        return json({ ok: true, music }, 200, request);
      }

      return err("rota não encontrada", 404, request);
    } catch (e) {
      console.error(e);
      return err(String(e.message || e), 500, request);
    }
  },
};
    
