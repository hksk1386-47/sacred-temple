/* Sacred Temple — cliente da API Cloudflare (opcional) */
(function (global) {
  "use strict";

  const KEY = "st_api_base";
  // URL padrão: qualquer aparelho já usa esta API sem configurar manualmente
  const DEFAULT_API_BASE = "https://sacred-temple-api.hksk1386.workers.dev";

  function getBase() {
    try {
      const stored = (localStorage.getItem(KEY) || "").replace(/\/+$/, "");
      return stored || DEFAULT_API_BASE;
    } catch {
      return DEFAULT_API_BASE;
    }
  }

  function setBase(url) {
    const u = (url || "").trim().replace(/\/+$/, "");
    if (u) localStorage.setItem(KEY, u);
    else localStorage.removeItem(KEY);
    return u;
  }

  function enabled() {
    return !!getBase();
  }

  async function request(path, options = {}) {
    const base = getBase();
    if (!base) throw new Error("API não configurada");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 12000);
    try {
      const res = await fetch(base + path, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || ("HTTP " + res.status));
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function health() {
    return request("/api/health");
  }

  async function upsertProfile(profile) {
    return request("/api/profiles", {
      method: "POST",
      body: JSON.stringify(profile),
    });
  }

  async function searchProfiles(q) {
    const qs = q ? "?q=" + encodeURIComponent(q) : "";
    return request("/api/profiles/search" + qs);
  }

  async function getProfile(handleOrId) {
    return request("/api/profiles/" + encodeURIComponent(handleOrId));
  }

  async function createPost(post) {
    return request("/api/posts", {
      method: "POST",
      body: JSON.stringify(post),
    });
  }

  async function listPosts(params = {}) {
    const sp = new URLSearchParams();
    if (params.author) sp.set("author", params.author);
    if (params.q) sp.set("q", params.q);
    const q = sp.toString();
    return request("/api/posts" + (q ? "?" + q : ""));
  }

  async function apoiar(fromId, toId) {
    return request("/api/apoio", {
      method: "POST",
      body: JSON.stringify({ from_id: fromId, to_id: toId }),
    });
  }

  async function deixarApoiar(fromId, toId) {
    return request("/api/apoio", {
      method: "DELETE",
      body: JSON.stringify({ from_id: fromId, to_id: toId }),
    });
  }

  /** Upload de mídia (áudio/vídeo) para o Worker/R2 — body binário */
  async function uploadMedia({ id, blob, name, kind, duration, profileId, mime }) {
    const base = getBase();
    if (!base) throw new Error("API não configurada");
    if (!blob) throw new Error("arquivo vazio");
    if (!profileId) throw new Error("profileId obrigatório");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch(base + "/api/media", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": mime || blob.type || "application/octet-stream",
          "X-Profile-Id": profileId,
          "X-Media-Id": id || "",
          "X-Media-Name": name || id || "file",
          "X-Media-Kind": kind || "music",
          "X-Duration": String(duration || 0),
        },
        body: blob,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || ("HTTP " + res.status));
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function listMusic(author) {
    return request("/api/music?author=" + encodeURIComponent(author || ""));
  }

  global.SacredAPI = {
    getBase,
    setBase,
    enabled,
    health,
    upsertProfile,
    searchProfiles,
    getProfile,
    createPost,
    listPosts,
    apoiar,
    deixarApoiar,
    uploadMedia,
    listMusic,
  };
})(typeof window !== "undefined" ? window : globalThis);
  
