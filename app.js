/* Sacred Temple — Complete Web/PWA Prototype */
(function () {
  "use strict";

  const APP_VERSION = "13.15.3";
  const APP_BUILD = "2026-10-08-e";

  // ---------- Config ----------
  // Client ID do Google Cloud Console (OAuth 2.0 → Aplicativo da Web).
  // 1) Crie em https://console.cloud.google.com/apis/credentials
  // 2) Adicione o domínio (ex.: localhost, seu site) em "Origens JavaScript autorizadas"
  // 3) Cole o Client ID abaixo OU em Perfil → Contas → Configurar Google
  // Se vazio, tenta ler de localStorage ("st_google_client_id"); senão modo demo.
  let GOOGLE_CLIENT_ID = "";
  try {
    const savedId = localStorage.getItem("st_google_client_id");
    if (savedId) GOOGLE_CLIENT_ID = savedId;
  } catch (_) {}

  // ---------- IndexedDB for audio blobs ----------
  const IDB_NAME = "sacred-temple-media";
  const IDB_STORE = "audio";
  let idbPromise = null;

  function openIDB() {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return idbPromise;
  }

  async function idbPut(key, blob) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbGet(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbDelete(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function readAudioDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => {
        const d = Math.round(a.duration) || 180;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      a.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(180);
      };
      a.src = url;
    });
  }

  const SPIRIT_SVG = `<svg viewBox="0 0 100 100"><defs><radialGradient id="g%ID%" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".95"/><stop offset="60%" stop-color="#e8e0ff" stop-opacity=".55"/><stop offset="100%" stop-color="#c9b8ff" stop-opacity=".15"/></radialGradient></defs><ellipse cx="50" cy="42" rx="22" ry="28" fill="url(#g%ID%)"/><ellipse cx="50" cy="68" rx="18" ry="12" fill="url(#g%ID%)" opacity=".7"/><circle cx="43" cy="38" r="2.5" fill="#2E1A47" opacity=".3"/><circle cx="57" cy="38" r="2.5" fill="#2E1A47" opacity=".3"/></svg>`;

  // Dados iniciais do templo GUIDER (progresso exportado)
  const SAMPLE_MUSIC = [
    { id: "m179139109124689gr", name: "ANIMA V2", type: "music", duration: 253, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m17913910929217w1g", name: "ANIMA", type: "music", duration: 218, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391093488d1ne", name: "Self-Rejection", type: "music", duration: 266, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391094002qv70", name: "Self-Rejection V2", type: "music", duration: 303, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391094535j1s3", name: "Hostage", type: "music", duration: 203, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391095051qqbv", name: "Hostage V2", type: "music", duration: 208, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391095573d1e3", name: "Versus", type: "music", duration: 267, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m17913910961011lwb", name: "Versus V2", type: "music", duration: 260, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391096594f744", name: "Mockery", type: "music", duration: 252, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m17913910970866ze3", name: "Mockery V2", type: "music", duration: 274, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391097589pq9e", name: "Eternal Flame", type: "music", duration: 193, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391098095am03", name: "Eternal Flame V2", type: "music", duration: 301, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m1791391098797h6su", name: "All For All", type: "music", duration: 211, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m179139109932027dv", name: "All for All V2", type: "music", duration: 215, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m179139109983413h9", name: "Immense Brightness", type: "music", duration: 290, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
    { id: "m17913911004339ya8", name: "Immense Brightness V2", type: "music", duration: 366, fav: false, hasAudio: false, mime: "audio/mpeg", views: 1 },
  ];
  const SAMPLE_POSTS = [
    {
      id: "p1791391225017x1jk",
      name: "You who are leaning on things and in oth…",
      type: "post",
      text: "You who are leaning on things and in other people, including on idols thinking that's what gives you strength, when in fact the strength comes from within and because you don't know this, think that these things, this idols give you strength and are what keep you standing but in reality, these things are only keeping you disconnected from yourself, taking advantage of your pain, making money off of it and keeping you blind to the truth, while you are living a wasted life on something worthless to the soul especially when you've been on it for a long time, meaning you've had enough experience, draining you while you don't know that all you need is yourself, while your soul is calling \"I want to live, to live what uplifts me, what makes me feel good, what motivates me, I don't want to miss this chance to go back home\" \n\nThe soul has been rejected, ignored, and despised when in fact it is our truth, not living our truth is not valuing ourselves. The soul has been rejected, ignored, and despised when in fact it is our truth; not living our truth is not valuing ourselves.\n\nI know this because I lived like that a long time ago, and thank God I freed myself from it and I freed myself before I found that channel\n\nhttps://youtube.com/@vitalfrosi?si=Iz4lbHlBWq4UyRzl 👈 Link to the channel I\'m mentioning\n\nSo I am spreading this channel because it can bring as many souls as possible back to their true essence, as long as each person has the willpower and attitude to do so because only ourselves can free ourselves, there are guides but it is we who choose whether to follow them or not, we are the ones who decide our destiny.\n\nI am revealing the truth so that you can get out of this precipice that are walking towards without even realizing it.",
      duration: 25, fav: false, createdAt: "2026-10-07T16:40:25.017Z", views: 1, reactions: {},
    },
    {
      id: "p1791391205008t0yq",
      name: "We are all lights, we are all unique, Em…",
      type: "post",
      text: "We are all lights, we are all unique, Embrace the truth of your soul and stop looking at the \"light of others\" as if you didn't have your own. \n\nYou who are leaning on things and in other people, including on idols thinking that's what gives you strength, when in fact the strength comes from within and because you don't know this, think that these things, this idols give you strength and are what keep you standing but in reality, these things are only keeping you disconnected from yourself, taking advantage of your pain, making money off of it and keeping you blind to the truth, while you are living a wasted life on something worthless to the soul especially when you've been on it for a long time, meaning you've had enough experience, draining you while you don't know that all you need is yourself, while your soul is calling \"I want to live, to live what uplifts me, what makes me feel good, what motivates me, I don't want to miss this chance to go back home\" \n\nThe soul has been rejected, ignored, and despised when in fact it is our truth, not living our truth is not valuing ourselves. The soul has been rejected, ignored, and despised when in fact it is our truth; not living our truth is not valuing ourselves.\n\nI know this because I lived like that a long time ago, and thank God I freed myself from it and I freed myself before I found that channel\n\nhttps://youtube.com/@vitalfrosi?si=Iz4lbHlBWq4UyRzl 👈 Link to the channel I\'m mentioning\n\nSo I am spreading this channel because it can bring as many souls as possible back to their true essence, as long as each person has the willpower and attitude to do so because only ourselves can free ourselves, there are guides but it is we who choose whether to follow them or not, we are the ones who decide our destiny.\n\nI am revealing the truth so that you can get out of this precipice that are walking towards without even realizing it.",
      duration: 25, fav: false, createdAt: "2026-10-07T16:40:05.008Z", views: 1, reactions: {},
    },
    {
      id: "p17913911884864i1m",
      name: "My profile on X is where I also send gui…",
      type: "post",
      text: "My profile on X is where I also send guides to souls, also a place where them feel supported, heard, uplifted, and reminded of their true beauty and worth✨ Including guides to escape illusions such as idolatry, fanaticism, and the complete farce, lie, and illusion that is the celebrity, Idol, In short, the Impostor's world, which is based solely on appearances, that is, it is not real, has no purpose for the soul, only distance from oneself and from one's true, eternal, and unique only everything🥺✨",
      duration: 25, fav: false, createdAt: "2026-10-07T16:39:48.489Z", views: 1, reactions: {},
      externalLink: "https://x.com/AnaBeat47pb",
    },
  ];
  const SAMPLE_X = [
    { id: "x1", name: "A quiet morning thought…", type: "x", text: "The light that finds you when you stop running.", duration: 25, fav: true, views: 9 },
    { id: "x2", name: "Fragment from last night", type: "x", text: "Some silences are fuller than words.", duration: 25, fav: false, views: 3 },
  ];
  const SAMPLE_TT = [
    { id: "t1", name: "Short prayer in motion", type: "tiktok", duration: 30, fav: false, views: 7 },
  ];
  // GUIDER seed (só para perfil público ?u=Guider — não é o templo do visitante)
  const GUIDER_PROFILE = {
    name: "GUIDER",
    bio: "I bring guides to your soul, the place where you feel supported, uplifted, heard, and remember your true beauty and worth✨👻",
    avatarColor: "#e8e0ff",
    photo: null,
  };
  // Perfil inicial vazio — o usuário preenche no onboarding / Google
  const DEFAULT_PROFILE = {
    name: "",
    bio: "",
    avatarColor: "#e8e0ff",
    photo: null,
  };

  const BAD_WORDS = { soft: ["spam"], medium: ["spam", "hate", "idiot"], strict: ["spam", "hate", "idiot", "stupid", "kill"] };

  // ---------- State ----------
  function load(key, def) {
    try { const v = localStorage.getItem("st_" + key); return v ? JSON.parse(v) : def; } catch { return def; }
  }
  function save(key, val) { localStorage.setItem("st_" + key, JSON.stringify(val)); }

  const POST_REACTIONS = [
    { key: "revived", emoji: "👻", title: "Estou revigorado" },
    { key: "light", emoji: "✨", title: "Quanta luz" },
    { key: "remember", emoji: "🤩", title: "Lembro quem sou eu" },
    { key: "flame", emoji: "🔥", title: "Nunca deixarei o impostor me derrotar" },
    { key: "soul", emoji: "🥺", title: "A alma sofre a inconsciência do corpo no qual está" },
  ];

  const state = {
    onboarded: load("onboarded", false),
    lang: load("lang", null),
    profile: load("profile", DEFAULT_PROFILE),
    music: load("music", []),
    posts: load("posts", []),
    xposts: load("xposts", []),
    tiktok: load("tiktok", []),
    queue: load("queue", []),       // soul queue
    eternal: load("eternal", []),   // eternal station queue
    lives: load("lives", []),
    connected: load("connected", { x: false, tiktok: false, suno: false, google: false }),
    auth: load("auth", null), // { provider, email, name, picture, sub }
    privacy: load("privacy", { profile: "public", eternal: "public", lives: "public", comment: "everyone", quiet: "everyone", download: "allow" }),
    moderation: load("moderation", { level: "medium", words: "", action: "censor", spam: "on" }),
    downloads: load("downloads", { music: "yes", lives: "yes", viewers: "yes" }),
    notifications: load("notifications", { posts: "on", eternal: "off", lives: "on", permissionAsked: false }),
    autoSync: load("autoSync", true), // sincronizar com API automaticamente após postar/importar
    quietRequests: load("quietRequests", []),
    apoio: load("apoio", { apoiadores: [], apoiando: [] }), // demo lists of { id, name }
    captions: load("captions", {}), // itemId -> { lang: text }
    translations: load("translations", {}), // itemId -> { lang: translated }
    // Diretório local de perfis conhecidos neste dispositivo
    profilesDirectory: load("profilesDirectory", []), // [{ id, name, bio, handle, color, photo, source, updatedAt }]
    draft: load("draft", null), // { text, link, savedAt }
    a11y: load("a11y", { font: "normal", motion: "off", contrast: "off" }),
    streak: load("streak", { count: 0, lastDate: null }),
    libraryFilterPinned: false,
    libraryQuery: "",
    sleepTimerId: null,
    sleepEndsAt: null,
    _undoItem: null,
    _undoTimer: null,
    liveStart: null,
    livePeakPresence: 1,
    currentView: "home",
    isPlaying: false,
    eternalIndex: 0,
    progress: 0,
    duration: 0,
    cameraStream: null,
    isLive: false,
    deferredPrompt: null,
    selectedItem: null,
    presence: 1,
    eternalListeners: 1,
    eternalPeakListeners: 1,
    composeMedia: null, // { kind: 'image'|'video', dataUrl?, blobUrl?, name, file? }
    composeMode: null, // null | 'thread' | 'repost'
    composeParentId: null,
    screenRecorder: null,
    screenRecChunks: [],
  };

  // ---------- DOM ----------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function injectSpirits() {
    let i = 0;
    ["splash-spirit", "ob-spirit-2", "ob-spirit-3", "ob-spirit-4", "topbar-spirit", "home-spirit", "profile-spirit"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = SPIRIT_SVG.replace(/%ID%/g, "s" + (i++));
    });
  }

  function showScreen(id) {
    $$(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }

  function showView(name) {
    state.currentView = name;
    $$(".view").forEach((v) => v.classList.remove("active"));
    const v = document.getElementById("view-" + name);
    if (v) v.classList.add("active");
    $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.nav === name));
    // Scroll main content to top on view change
    const main = document.getElementById("main");
    if (main) main.scrollTop = 0;
    // Refresh view-specific UI
    if (name === "home") renderHome();
    else if (name === "library") renderLibrary();
    else if (name === "eternal") renderEternal();
    else if (name === "live") { renderSoulQueue(); renderLives(); }
    else if (name === "profile") renderProfile();
  }


  function toast(msg, ms = 2500, type = "info") {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    t.classList.remove("hidden", "toast-ok", "toast-err", "toast-info");
    t.classList.add(type === "ok" ? "toast-ok" : type === "err" ? "toast-err" : "toast-info");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.add("hidden"), ms);
    // light haptic on supported devices
    try {
      if (navigator.vibrate && type !== "info") navigator.vibrate(type === "err" ? [40, 30, 40] : 25);
    } catch (_) {}
  }

  function fmtTime(s) {
    s = Math.floor(s) || 0;
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ---------- Persist helpers ----------
  function persistAll() {
    save("onboarded", state.onboarded);
    save("lang", state.lang);
    save("profile", state.profile);
    save("music", state.music);
    // Persist posts without large video blob URLs (keep image dataURLs + metadata)
    const postsToSave = state.posts.map((p) => {
      const copy = { ...p };
      // Videos live in IndexedDB; strip ephemeral blob URLs only
      if (copy.mediaKind === "video") delete copy.mediaUrl;
      return copy;
    });
    save("posts", postsToSave);
    save("xposts", state.xposts);
    save("tiktok", state.tiktok);
    save("queue", state.queue);
    save("eternal", state.eternal);
    save("lives", state.lives);
    save("connected", state.connected);
    save("auth", state.auth);
    save("privacy", state.privacy);
    save("moderation", state.moderation);
    save("downloads", state.downloads);
    save("notifications", state.notifications);
    save("autoSync", state.autoSync);
    save("quietRequests", state.quietRequests);
    save("apoio", state.apoio);
    save("captions", state.captions);
    save("profilesDirectory", state.profilesDirectory);
    save("draft", state.draft);
    save("a11y", state.a11y);
    save("streak", state.streak);
  }

  // ---------- Item rendering ----------
  function itemHTML(item, opts = {}) {
    const flame = item.fav
      ? `<div class="item-flame"><div class="white-flame"></div></div>`
      : `<div class="item-flame" style="opacity:.25"><div class="white-flame" style="animation:none;opacity:.4"></div></div>`;
    let sub = item.type === "music" ? fmtTime(item.duration) : (item.text || item.type);
    if (item.type === "post") {
      if (item.mediaKind === "image") sub = "📷 " + (item.text ? item.text.slice(0, 40) : "Imagem");
      else if (item.mediaKind === "video") sub = "🎬 " + (item.text ? item.text.slice(0, 40) : "Vídeo");
      else sub = item.text ? item.text.slice(0, 60) : "Texto";
    }
    let thumb = "";
    if (item.type === "post" && item.mediaKind === "image" && item.mediaUrl) {
      thumb = `<img class="item-thumb" src="${item.mediaUrl}" alt="" />`;
    } else if (item.type === "post" && item.mediaKind === "video") {
      thumb = `<div class="item-thumb-placeholder">🎬</div>`;
    } else if (item.type === "post") {
      thumb = `<div class="item-thumb-placeholder">✎</div>`;
    }
    const viewsLabel = "👁 " + fmtViews(item.views || 0);
    return `<div class="item" data-id="${item.id}" data-type="${item.type}">
      ${flame}
      ${thumb}
      <div class="item-info">
        <div class="item-title">${escapeHtml(item.name)}</div>
        <div class="item-sub">${escapeHtml(sub)} · ${viewsLabel}</div>
      </div>
      <div class="item-actions">
        <button class="btn-small" data-open="${item.id}">⋯</button>
      </div>
    </div>`;
  }

  /** Full post card for the Posts tab — text, image and video complete */
  function postCardHTML(item) {
    const flame = item.fav
      ? `<div class="item-flame"><div class="white-flame"></div></div>`
      : `<div class="item-flame" style="opacity:.25"><div class="white-flame" style="animation:none;opacity:.4"></div></div>`;

    let badge = "Texto";
    if (item.mediaKind === "image") badge = "Imagem";
    else if (item.mediaKind === "video") badge = "Vídeo";

    const body = (item.text || "").trim();
    const textBlock = body
      ? `<p class="post-card-text">${linkifyHtml(escapeHtml(body))}</p>`
      : "";
    const externalLink = (item.externalLink || "").trim();
    const linkBlock = externalLink
      ? `<p class="post-external-link"><a class="ext-link" href="${escapeHtml(externalLink)}" target="_blank" rel="noopener noreferrer">🔗 ${escapeHtml(externalLink)}</a></p>`
      : "";

    let mediaBlock = "";
    if (item.mediaKind === "image" && item.mediaUrl) {
      mediaBlock = `<div class="post-card-media"><img src="${item.mediaUrl}" alt="" loading="lazy" /></div>`;
    } else if (item.mediaKind === "video" && item.hasMedia) {
      mediaBlock = `<div class="post-card-media">
        <video class="post-card-video" data-video-id="${item.id}" controls playsinline preload="metadata"></video>
        <p class="muted post-card-media-hint">Toque para reproduzir com áudio</p>
      </div>`;
    } else if (item.mediaKind === "video") {
      mediaBlock = `<div class="post-card-media post-card-media-missing"><span>🎬</span><p class="muted">Vídeo indisponível nesta sessão</p></div>`;
    }

    const time = item.createdAt
      ? new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
      : "";
    const viewsLabel = "👁 " + fmtViews(item.views || 0);

    const flameActive = item.fav ? " active" : "";
    const flameLabel = item.fav ? "Chama branca" : "Marcar chama";
    const reactions = item.reactions || {};
    const reactRow = POST_REACTIONS.map((r) => {
      const c = reactions[r.key] || 0;
      const active = c > 0 ? " active" : "";
      return `<button type="button" class="post-react-btn${active}" data-post-react="${r.key}" data-id="${item.id}" title="${r.title}">${r.emoji}<span class="react-count">${c || ""}</span></button>`;
    }).join("");
    const capBadge = state.captions[item.id] ? `<span class="caption-badge">CC</span>` : "";
    const threadBadge = item.threadId ? `<span class="thread-badge">Thread</span>` : "";
    const pinBadge = item.pinned ? `<span class="thread-badge">📌 Fixado</span>` : "";
    const tags = extractHashtags(item.text);
    const tagsBlock = tags.length
      ? `<div class="post-tags">${tags.map((t) => `<span class="hashtag-chip mini">${escapeHtml(t)}</span>`).join("")}</div>`
      : "";
    const repostMeta = item.repostOf
      ? `<p class="repost-meta">↻ Repost de ${escapeHtml(item.repostOfName || "post")}</p>`
      : "";
    const mediaClickable = item.mediaKind === "image" && item.mediaUrl
      ? mediaBlock.replace("<img ", `<img class="zoomable" data-lightbox="image" data-src="${item.mediaUrl}" `)
      : item.mediaKind === "video"
        ? mediaBlock.replace("<video ", `<video class="zoomable" data-lightbox="video" data-video-id="${item.id}" `)
        : mediaBlock;
    return `<article class="post-card" data-id="${item.id}" data-type="post">
      <div class="post-card-header">
        ${flame}
        <div class="post-card-meta">
          <span class="post-card-badge">${badge}</span>
          ${threadBadge}
          ${pinBadge}
          ${capBadge}
          ${time ? `<span class="post-card-time">${escapeHtml(time)}</span>` : ""}
          <span class="post-card-views">${viewsLabel}</span>
        </div>
        <button class="btn-small" data-open="${item.id}" title="Ações">⋯</button>
      </div>
      ${repostMeta}
      ${textBlock}
      ${tagsBlock}
      ${linkBlock}
      ${mediaClickable}
      <div class="post-reactions">${reactRow}</div>
      <div class="post-card-actions">
        <button type="button" class="post-action-btn flame-btn${flameActive}" data-post-action="fav" data-id="${item.id}" title="${flameLabel}">
          <span class="post-action-flame"><span class="white-flame"></span></span>
          <span class="post-action-label">${flameLabel}</span>
        </button>
        <button type="button" class="post-action-btn" data-post-action="queue" data-id="${item.id}" title="Soul Queue">
          <span class="post-action-icon">✦</span>
          <span class="post-action-label">Queue</span>
        </button>
        <button type="button" class="post-action-btn" data-post-action="eternal" data-id="${item.id}" title="Eternal Station">
          <span class="post-action-icon">∞</span>
          <span class="post-action-label">Eternal</span>
        </button>
        <button type="button" class="post-action-btn" data-post-action="repost" data-id="${item.id}" title="Repostar">
          <span class="post-action-icon">↻</span>
          <span class="post-action-label">Repost</span>
        </button>
        <button type="button" class="post-action-btn" data-post-action="thread" data-id="${item.id}" title="Criar thread">
          <span class="post-action-icon">🧵</span>
          <span class="post-action-label">Thread</span>
        </button>
        <button type="button" class="post-action-btn" data-post-action="translate" data-id="${item.id}" title="Traduzir">
          <span class="post-action-icon">文A</span>
          <span class="post-action-label">Traduzir</span>
        </button>
      </div>
      <div class="post-translation hidden" data-translation-for="${item.id}"></div>
    </article>`;
  }

  async function hydratePostVideos(root) {
    if (!root) return;
    const videos = root.querySelectorAll("video.post-card-video[data-video-id]");
    for (const vid of videos) {
      const id = vid.dataset.videoId;
      if (!id || vid.dataset.hydrated === "1") continue;
      try {
        const blob = await idbGet(id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          vid.src = url;
          vid.dataset.hydrated = "1";
          vid.onended = null;
          vid.addEventListener("play", () => {
            const item = findItem(id);
            if (item) {
              recordView(item);
              const card = vid.closest(".post-card");
              if (card) {
                const el = card.querySelector(".post-card-views");
                if (el) el.textContent = "👁 " + fmtViews(item.views || 0);
              }
            }
          }, { once: false });
        }
      } catch (e) {
        console.warn("hydrate video", id, e);
      }
    }
  }

  function allItems() {
    return [...state.music, ...state.posts, ...state.xposts, ...state.tiktok];
  }

  function findItem(id) {
    return allItems().find((i) => i.id === id);
  }

  function fmtViews(n) {
    n = n || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  /** Increment views once per item per short session window */
  const _viewedSession = new Set();
  function recordView(item, opts = {}) {
    if (!item || !item.id) return;
    const force = opts.force === true;
    const key = item.id;
    if (!force && _viewedSession.has(key)) return;
    _viewedSession.add(key);
    item.views = (item.views || 0) + 1;
    persistAll();
  }

  // ---------- Renderers ----------
  function timeGreeting() {
    const h = new Date().getHours();
    if (h < 5) return "A noite escuta";
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }

  function updateStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const s = state.streak || { count: 0, lastDate: null };
    if (s.lastDate === today) {
      // already counted
    } else {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterday = y.toISOString().slice(0, 10);
      if (s.lastDate === yesterday) s.count = (s.count || 0) + 1;
      else s.count = 1;
      s.lastDate = today;
      state.streak = s;
      persistAll();
    }
    const el = $("#streak-count");
    if (el) el.textContent = state.streak.count || 1;
    const pill = $("#streak-pill");
    if (pill) {
      const n = state.streak.count || 1;
      pill.innerHTML = "✦ <span id=\"streak-count\">" + n + "</span> " + (n === 1 ? "dia" : "dias");
    }
  }

  function extractHashtags(text) {
    const m = String(text || "").match(/#[\wÀ-ÿ]+/gi);
    return m ? [...new Set(m.map((t) => t.toLowerCase()))] : [];
  }

  function renderHashtagCloud() {
    const cloud = $("#home-hashtags");
    const empty = $("#home-hashtags-empty");
    if (!cloud) return;
    const counts = {};
    state.posts.forEach((p) => {
      extractHashtags(p.text).forEach((h) => { counts[h] = (counts[h] || 0) + 1; });
    });
    const tags = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
    if (!tags.length) {
      cloud.innerHTML = "";
      if (empty) empty.style.display = "";
      return;
    }
    if (empty) empty.style.display = "none";
    cloud.innerHTML = tags.map(([t, c]) =>
      `<button type="button" class="hashtag-chip" data-hashtag="${escapeHtml(t)}">${escapeHtml(t)} <span>${c}</span></button>`
    ).join("");
    cloud.querySelectorAll("[data-hashtag]").forEach((btn) => {
      btn.onclick = () => {
        state.libraryQuery = btn.dataset.hashtag;
        showView("library");
        const postsTab = document.querySelector('.tab[data-tab="posts"]');
        if (postsTab) postsTab.click();
        const inp = $("#library-search");
        if (inp) { inp.value = state.libraryQuery; }
        renderLibrary();
      };
    });
  }

  function renderDraftBanner() {
    const block = $("#home-draft-block");
    const prev = $("#home-draft-preview");
    if (!block) return;
    if (state.draft && (state.draft.text || state.draft.link)) {
      block.hidden = false;
      if (prev) prev.textContent = (state.draft.text || state.draft.link || "").slice(0, 100);
    } else {
      block.hidden = true;
    }
  }

  function renderHome() {
    updateStreak();
    $("#welcome-text").textContent = timeGreeting() + ", " + (state.profile.name || "Criador");
    const sub = $("#home-sub");
    if (sub) {
      const prompts = [
        "O que a alma está dizendo hoje?",
        "Há luz que só aparece no silêncio.",
        "Compartilhe o que ainda não tem palavras.",
        "O templo escuta sem pressa.",
      ];
      sub.textContent = prompts[new Date().getDate() % prompts.length];
    }
    renderDraftBanner();
    renderHashtagCloud();
    const q = $("#home-queue");
    const qe = $("#home-queue-empty");
    if (state.queue.length) {
      q.innerHTML = state.queue.map((id) => {
        const it = findItem(id);
        return it ? itemHTML(it) : "";
      }).join("");
      qe.style.display = "none";
    } else {
      q.innerHTML = "";
      qe.style.display = "";
    }
    const favs = allItems().filter((i) => i.fav);
    const fl = $("#home-favs");
    const fe = $("#home-favs-empty");
    if (favs.length) {
      fl.innerHTML = favs.map((i) => itemHTML(i)).join("");
      fe.style.display = "none";
    } else {
      fl.innerHTML = "";
      fe.style.display = "";
    }
    bindItemClicks();
  }

  function matchesQuery(item, q) {
    if (!q) return true;
    const qq = q.toLowerCase();
    const blob = [item.name, item.text, item.type, item.externalLink, ...(extractHashtags(item.text || ""))].join(" ").toLowerCase();
    return blob.includes(qq);
  }

  function renderLibrary() {
    const q = state.libraryQuery || (($("#library-search") || {}).value || "");
    state.libraryQuery = q;
    let music = state.music.filter((i) => matchesQuery(i, q));
    let posts = state.posts.filter((i) => matchesQuery(i, q));
    if (state.libraryFilterPinned) posts = posts.filter((p) => p.pinned);
    // Pinned first
    posts = posts.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    $("#music-count").textContent = music.length;
    $("#posts-count").textContent = posts.length;
    $("#x-count").textContent = state.xposts.filter((i) => matchesQuery(i, q)).length;
    $("#tt-count").textContent = state.tiktok.filter((i) => matchesQuery(i, q)).length;

    const ml = $("#music-list");
    ml.innerHTML = music.length
      ? music.map((i) => itemHTML(i)).join("")
      : `<div class="empty-hint muted">${q ? "Nada encontrado." : "Nenhuma música. Faça upload ou importe do Suno."}</div>`;

    const pl = $("#posts-list");
    if (posts.length) {
      pl.innerHTML = posts.map((i) => postCardHTML(i)).join("");
      hydratePostVideos(pl);
      // Count a view when the full post card becomes visible
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            const id = en.target.getAttribute("data-id");
            const item = findItem(id);
            if (item) {
              recordView(item);
              const el = en.target.querySelector(".post-card-views");
              if (el) el.textContent = "👁 " + fmtViews(item.views || 0);
            }
            io.unobserve(en.target);
          });
        }, { threshold: 0.55 });
        pl.querySelectorAll(".post-card[data-id]").forEach((el) => io.observe(el));
      }
    } else {
      pl.innerHTML = `<div class="empty-hint muted">Nenhum post ainda. Toque em “+ Novo post” para criar.</div>`;
    }

    const xl = $("#x-list");
    if (state.connected.x) {
      xl.innerHTML = state.xposts.length
        ? state.xposts.map((i) => itemHTML(i)).join("")
        : `<div class="empty-hint muted">Nenhum post ainda. Novos posts do X aparecerão aqui.</div>`;
      $("#btn-connect-x").textContent = "Conectado ✓";
    } else {
      xl.innerHTML = `<div class="empty-hint muted">Conecte sua conta X para sincronização automática.</div>`;
      $("#btn-connect-x").textContent = "Conectar X";
    }

    const tl = $("#tt-list");
    if (state.connected.tiktok) {
      tl.innerHTML = state.tiktok.length
        ? state.tiktok.map((i) => itemHTML(i)).join("")
        : `<div class="empty-hint muted">Nenhum vídeo ainda.</div>`;
      $("#btn-connect-tt").textContent = "Conectado ✓";
    } else {
      tl.innerHTML = `<div class="empty-hint muted">Conecte sua conta TikTok para sincronização automática.</div>`;
      $("#btn-connect-tt").textContent = "Conectar TikTok";
    }
    bindItemClicks();
  }

  function renderEternal() {
    const list = state.eternal.map((id) => findItem(id)).filter(Boolean);
    $("#queue-count").textContent = list.length;
    updateEternalListenersUI();
    const eq = $("#eternal-queue");
    const ee = $("#queue-empty");
    if (list.length) {
      eq.innerHTML = list.map((i, idx) => {
        const active = idx === state.eternalIndex ? ' style="border-color:var(--gold)"' : "";
        return `<div class="item" data-id="${i.id}"${active}>
          ${i.fav ? '<div class="item-flame"><div class="white-flame"></div></div>' : '<div class="item-flame" style="opacity:.2"></div>'}
          <div class="item-info"><div class="item-title">${escapeHtml(i.name)}</div>
          <div class="item-sub">${i.type === "music" ? fmtTime(i.duration) : i.type} · 👁 ${fmtViews(i.views || 0)}</div></div>
        </div>`;
      }).join("");
      ee.style.display = "none";
      updateNowPlaying();
    } else {
      eq.innerHTML = "";
      ee.style.display = "";
      $("#eternal-title").textContent = "Aguardando conteúdo…";
      $("#eternal-meta").textContent = "Eternal Station – always playing";
    }
  }

  function updateNowPlaying() {
    const list = state.eternal.map((id) => findItem(id)).filter(Boolean);
    if (!list.length) {
      $("#eternal-title").textContent = "Aguardando conteúdo…";
      $("#eternal-meta").textContent = "Eternal Station – always playing";
      const card = document.getElementById("eternal-post-card");
      if (card) card.classList.add("hidden");
      return;
    }
    const cur = list[state.eternalIndex % list.length];
    $("#eternal-title").textContent = cur.name;
    const typeLabel = cur.type === "music" ? "Música" : (cur.type === "post" ? "Post" : cur.type);
    $("#eternal-meta").textContent = (cur.fav ? "✦ Chama branca · " : "") + typeLabel + " · Now flowing through the temple";
    // Show full post (text + media) even when paused
    if (typeof showEternalPost === "function") showEternalPost(cur);
    if (!state.isPlaying) {
      const postDur = parseInt(($("#post-duration") || {}).value) || 25;
      state.duration = cur.type === "music" ? (cur.duration || 180) : (cur.duration || postDur);
      $("#time-total").textContent = fmtTime(state.duration);
    }
  }

  function renderSoulQueue() {
    const sq = $("#soul-queue");
    const se = $("#soul-empty");
    if (state.queue.length) {
      sq.innerHTML = state.queue.map((id) => {
        const it = findItem(id);
        return it ? itemHTML(it) : "";
      }).join("");
      se.style.display = "none";
    } else {
      sq.innerHTML = "";
      se.style.display = "";
    }
    bindItemClicks();
  }

  function renderLives() {
    const ll = $("#lives-list");
    const le = $("#lives-empty");
    if (state.lives.length) {
      ll.innerHTML = state.lives.map((l) => `
        <div class="item">
          <div class="item-info">
            <div class="item-title">${escapeHtml(l.title)}</div>
            <div class="item-sub">${l.date} · ${fmtTime(l.duration)}</div>
          </div>
        </div>`).join("");
      le.style.display = "none";
    } else {
      ll.innerHTML = "";
      le.style.display = "";
    }
  }

  function slugify(name) {
    return (name || "criador")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "criador";
  }

  function getProfileHandle() {
    return "@" + slugify((state.profile && state.profile.name) || "criador");
  }

  /** Payload público completo (para snapshot local / link offline opcional) */
  function buildPublicPayload() {
    const isPublic = state.privacy.profile !== "private";
    const eternalPublic = state.privacy.eternal === "public";
    const posts = isPublic
      ? (state.posts || []).slice(0, 15).map((p) => ({
          id: p.id,
          t: (p.text || p.name || "").slice(0, 2500),
          k: p.mediaKind || "",
          img: (p.mediaKind === "image" && p.mediaUrl && String(p.mediaUrl).length < 4000) ? p.mediaUrl : "",
          vid: (p.mediaKind === "video" && p.mediaUrl && String(p.mediaUrl).length < 4000) ? p.mediaUrl : "",
          link: p.externalLink || "",
          v: p.views || 0,
          pin: p.pinned ? 1 : 0,
          at: p.createdAt || "",
          fav: p.fav ? 1 : 0,
          reactions: p.reactions || {},
        }))
      : [];
    const music = isPublic
      ? (state.music || []).slice(0, 16).map((m) => ({
          id: m.id,
          n: (m.name || "").slice(0, 80),
          d: m.duration || 0,
          fav: m.fav ? 1 : 0,
          v: m.views || 0,
          url: m.mediaUrl || m.url || "",
        }))
      : [];
    const station = eternalPublic
      ? (state.eternal || []).slice(0, 20).map((id) => {
          const it = typeof findItem === "function" ? findItem(id) : null;
          if (!it) return null;
          return {
            id: it.id,
            n: (it.name || "").slice(0, 80),
            ty: it.type || "",
            t: (it.text || "").slice(0, 500),
            k: it.mediaKind || "",
            d: it.duration || 0,
          };
        }).filter(Boolean)
      : [];

    const payload = {
      n: state.profile.name || "Criador",
      b: (state.profile.bio || "").slice(0, 200),
      h: slugify(state.profile.name),
      c: state.profile.avatarColor || "#e8e0ff",
      posts,
      music,
      station,
      temple: true,
      priv: {
        profile: state.privacy.profile || "public",
        eternal: state.privacy.eternal || "public",
        lives: state.privacy.lives || "public",
      },
      stats: isPublic
        ? {
            posts: (state.posts || []).length,
            music: (state.music || []).length,
            views: (state.posts || []).reduce((s, p) => s + (p.views || 0), 0),
          }
        : null,
    };
    const tryPhoto = state.profile.photo || (state.auth && state.auth.picture) || "";
    if (tryPhoto && tryPhoto.length < 1500) {
      if (state.profile.photo && state.profile.photo.length < 1500) payload.p = state.profile.photo;
      else if (state.auth && state.auth.picture) payload.gp = state.auth.picture;
    }
    return payload;
  }

  /** Base do app sem query/hash (evita herdar ?u= de outra pessoa) */
  function getAppBaseUrl() {
    try {
      const u = new URL(location.href);
      u.search = "";
      u.hash = "";
      let s = u.toString();
      if (s.endsWith("/")) s = s.slice(0, -1);
      // se termina em index.html, mantém pasta
      return s;
    } catch (_) {
      return (location.origin + location.pathname).replace(/\/+$/, "");
    }
  }

  /** Handle do perfil ATUAL do usuário (nunca o do visitado) */
  function getMyHandle() {
    return slugify((state.profile && state.profile.name) || "criador");
  }

  /** Remove ?u= e #p/ de outra pessoa da barra de endereço */
  function clearVisitorUrl() {
    try {
      history.replaceState(null, "", getAppBaseUrl() || (location.pathname));
    } catch (_) {}
  }

  /** Após criar/salvar perfil: URL e link passam a ser ?u=NOME_DELA */
  function claimOwnProfileUrl() {
    const handle = getMyHandle();
    if (!handle) return;
    try {
      const base = getAppBaseUrl();
      const next = base + "?u=" + encodeURIComponent(handle);
      history.replaceState(null, "", next);
    } catch (_) {}
    // atualiza campos de link na UI
    const link = getProfileShareLink();
    const a = document.getElementById("profile-link-input");
    if (a) a.value = link;
    const b = document.getElementById("share-link-input");
    if (b) b.value = link;
  }

  /** Link curto do perfil: sempre o nome DESTA pessoa */
  function getProfileShareLink() {
    const handle = getMyHandle();
    return getAppBaseUrl() + "?u=" + encodeURIComponent(handle);
  }

  /** Link longo opcional (leva posts/músicas embutidos — só se precisar offline) */
  function getProfileFullLink() {
    const payload = buildPublicPayload();
    let encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    if (encoded.length > 4000) {
      delete payload.p;
      delete payload.gp;
      // enxuga textos longos
      (payload.posts || []).forEach((p) => {
        if (p.t && p.t.length > 400) p.t = p.t.slice(0, 400) + "…";
        delete p.img;
        delete p.vid;
      });
      encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }
    return getAppBaseUrl() + "#p/" + encoded;
  }


  /**
   * Atualiza o "templo público" sempre que houver post/importação:
   * - snapshot local (diretório + localStorage por handle)
   * - sincroniza perfil + posts na API (se configurada)
   * Assim quem abre ?u=handle vê o conteúdo atualizado.
   */
  function savePublicSnapshotLocal(payload) {
    if (!payload || !payload.h) return;
    const handle = String(payload.h).toLowerCase();
    try {
      localStorage.setItem("st_pub_" + handle, JSON.stringify(payload));
    } catch (e) {
      // quota: tenta sem imagens
      try {
        const slim = JSON.parse(JSON.stringify(payload));
        (slim.posts || []).forEach((x) => { delete x.img; delete x.vid; });
        delete slim.p;
        delete slim.gp;
        localStorage.setItem("st_pub_" + handle, JSON.stringify(slim));
      } catch (_) {}
    }
    upsertProfileEntry({
      id: handle,
      name: payload.n || handle,
      bio: payload.b || "",
      handle: "@" + handle,
      color: payload.c || "#e8e0ff",
      photo: payload.p || payload.gp || "",
      source: "self",
      isSelf: true,
      snapshot: payload,
    });
  }

  function loadPublicSnapshotLocal(handle) {
    try {
      const raw = localStorage.getItem("st_pub_" + String(handle).toLowerCase());
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  async function refreshPublicCatalog(opts) {
    opts = opts || {};
    if (!state.onboarded) return null;
    let payload = null;
    try {
      payload = buildPublicPayload();
      savePublicSnapshotLocal(payload);
      registerMyProfileQuiet();
    } catch (e) {
      console.warn("refreshPublicCatalog local", e);
    }

    // API: só se autoSync ligado (ou force) e API configurada
    const doApi = window.SacredAPI && SacredAPI.enabled() && (opts.force || state.autoSync !== false);
    if (doApi) {
      try {
        let id = typeof getOrCreateServerProfileId === "function" ? getOrCreateServerProfileId() : null;
        const handle = slugify(state.profile.name || "criador");
        const upRes = await SacredAPI.upsertProfile({
          id: id || undefined,
          handle,
          name: state.profile.name || "Criador",
          bio: state.profile.bio || "",
          avatar_color: state.profile.avatarColor || "#e8e0ff",
          photo_url: (state.profile.photo || (state.auth && state.auth.picture) || "").slice(0, 1800),
          google_sub: (state.auth && state.auth.sub) || "",
        });
        if (upRes && upRes.profile && upRes.profile.id) {
          id = upRes.profile.id;
          save("serverProfileId", id);
        }
        if (!id) throw new Error("sem profile id no servidor");
        // Publica posts que ainda não foram enviados (últimos 20)
        const recent = (state.posts || []).slice(0, 20);
        for (const post of recent) {
          if (!post || !post.id) continue;
          if (post._synced) continue;
          try {
            await SacredAPI.createPost({
              id: post.id,
              author_id: id,
              text: (post.text || post.name || "").slice(0, 4000),
              external_link: post.externalLink || "",
              media_kind: post.mediaKind || "",
              media_url: (post.mediaUrl && String(post.mediaUrl).length < 1800) ? post.mediaUrl : "",
              pinned: !!post.pinned,
              views: post.views || 0,
              created_at: post.createdAt || undefined,
            });
            post._synced = true;
          } catch (err) {
            // se já existe no servidor, marca como sincronizado para não retentar eternamente
            const msg = String((err && err.message) || err || "");
            if (/UNIQUE|already|conflict|constraint/i.test(msg) || /HTTP 409/.test(msg)) {
              post._synced = true;
            } else {
              console.warn("sync post", post.id, err);
            }
          }
        }
        // Upload músicas locais ainda sem URL no servidor
        if (SacredAPI.uploadMedia) {
          const tracks = (state.music || []).slice(0, 20);
          for (const m of tracks) {
            if (!m || !m.id) continue;
            if (m.mediaUrl || m.url) continue;
            try {
              const blob = await idbGet(m.id);
              if (!blob) continue;
              const up = await SacredAPI.uploadMedia({
                id: m.id,
                blob,
                name: m.name || m.id,
                kind: "music",
                duration: m.duration || 0,
                profileId: id,
                mime: m.mime || blob.type || "audio/mpeg",
              });
              if (up && up.url) {
                m.mediaUrl = up.url;
                m.url = up.url;
                m._synced = true;
              }
            } catch (err) {
              console.warn("sync music upload", err);
            }
          }
        }
        persistAll();
        if (opts.toast) toast("Sincronizado com o servidor ✓", 2000, "ok");
        else if (opts.quiet !== true) {
          /* silencioso após post — snapshot local já salvo */
        }
      } catch (e) {
        console.warn("refreshPublicCatalog API", e);
        if (opts.toast) toast("Salvo localmente (API indisponível)", 2200, "err");
      }
    } else if (opts.toast && window.SacredAPI && !SacredAPI.enabled()) {
      toast("Templo atualizado localmente · configure a API para sync remoto", 2800, "info");
    }
    return payload;
  }

  /** Busca templo público de um handle (local → API) */
  async function fetchPublicTemple(handle) {
    handle = String(handle || "").toLowerCase().replace(/^@/, "");
    if (!handle) return null;

    // 1) snapshot local
    let data = loadPublicSnapshotLocal(handle);
    if (data && ((data.posts && data.posts.length) || (data.music && data.music.length))) {
      return data;
    }

    // 2) diretório
    try {
      const dir = (state.profilesDirectory || []).find((p) => String(p.id).toLowerCase() === handle);
      if (dir && dir.snapshot) return JSON.parse(JSON.stringify(dir.snapshot));
    } catch (_) {}

    // 3) próprio usuário neste aparelho
    if (state.onboarded && slugify(state.profile.name || "") === handle) {
      return buildPublicPayload();
    }

    // 4) API
    if (window.SacredAPI && SacredAPI.enabled()) {
      try {
        const prof = await SacredAPI.getProfile(handle);
        const profile = prof.profile || prof;
        const postsRes = await SacredAPI.listPosts({ author: handle });
        const rows = (postsRes.posts || postsRes.results || []);
        const posts = rows.map((r) => ({
          id: r.id,
          t: r.text || "",
          k: r.media_kind || "",
          img: r.media_kind === "image" ? (r.media_url || "") : "",
          vid: r.media_kind === "video" ? (r.media_url || "") : "",
          link: r.external_link || "",
          v: r.views || 0,
          pin: r.pinned ? 1 : 0,
          at: r.created_at || "",
          reactions: {},
        }));
        let music = [];
        try {
          if (SacredAPI.listMusic) {
            const mr = await SacredAPI.listMusic(handle);
            music = (mr.music || []).map((m) => ({
              id: m.id,
              n: m.n || m.name || "Música",
              d: m.d || m.duration || 0,
              url: m.url || "",
              v: 0,
            }));
          }
        } catch (_) {}
        data = {
          n: profile.name || handle,
          b: profile.bio || "",
          h: profile.handle || handle,
          c: profile.avatar_color || "#e8e0ff",
          p: profile.photo_url || "",
          posts,
          music,
          station: [
            ...music.slice(0, 12).map((m) => ({
              id: m.id, n: m.n, ty: "music", t: "", k: "", d: m.d || 0, url: m.url || "",
            })),
            ...posts.slice(0, 8).map((p) => ({
              id: p.id, n: (p.t || "Post").slice(0, 40), ty: "post", t: p.t, k: p.k, d: 25,
            })),
          ],
          temple: true,
          priv: { profile: "public", eternal: "public", lives: "public" },
          stats: {
            posts: posts.length,
            music: music.length,
            views: posts.reduce((s, x) => s + (x.v || 0), 0),
          },
        };
        savePublicSnapshotLocal(data);
        return data;
      } catch (e) {
        console.warn("fetchPublicTemple API", e);
      }
    }
    return data || null;
  }

  function renderProfile() {
    $("#profile-name").textContent = state.profile.name;
    $("#profile-bio").textContent = state.profile.bio;
    const handleEl = $("#profile-handle");
    if (handleEl) handleEl.textContent = getProfileHandle();
    const linkInput = $("#profile-link-input");
    if (linkInput) linkInput.value = getProfileShareLink();
    $("#btn-x-status").textContent = state.connected.x ? "Conectado ✓" : "Conectar";
    $("#btn-tt-status").textContent = state.connected.tiktok ? "Conectado ✓" : "Conectar";
    $("#btn-suno-status").textContent = state.connected.suno ? "Conectado ✓" : "Opcional";
    updateSettingsMenuBadges();
  }

  /** Visual feedback: menu items show current saved state */
  function updateSettingsMenuBadges() {
    const map = {
      privacy: state.privacy.profile === "public" ? "Público" : "Privado",
      moderation: (state.moderation.level || "medium"),
      downloads: state.downloads.music === "yes" ? "OK" : "Bloq.",
      notifications: state.notifications.posts === "on" ? "On" : "Off",
    };
    $$(".menu-item[data-action]").forEach((el) => {
      const a = el.dataset.action;
      if (!map[a]) return;
      let badge = el.querySelector(".setting-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "setting-badge";
        el.appendChild(badge);
      }
      badge.textContent = map[a];
    });
  }

  /** Linkify http(s) URLs in plain text (escaped HTML) */
  function linkifyHtml(escapedText) {
    return escapedText.replace(
      /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g,
      '<a class="ext-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  function toggleWhiteFlame(item) {
    if (!item) return;
    item.fav = !item.fav;
    persistAll();
    toast(item.fav ? "Marcado com a chama branca" : "Chama removida", 2200, "ok");
    // Refresh current view
    if (state.currentView === "library") renderLibrary();
    else if (state.currentView === "home") renderHome();
    else if (state.currentView === "eternal") renderEternal();
    else showView(state.currentView);
  }

  function bindPostCardActions(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-post-action]").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.id;
        const action = btn.dataset.postAction;
        const item = findItem(id);
        if (!item) return;
        if (action === "fav") {
          toggleWhiteFlame(item);
        } else if (action === "queue") {
          if (!state.queue.includes(item.id)) state.queue.push(item.id);
          persistAll();
          toast("Adicionado à Soul Queue", 2200, "ok");
        } else if (action === "eternal") {
          if (!state.eternal.includes(item.id)) state.eternal.push(item.id);
          persistAll();
          toast("Entrou no fluxo eterno", 2200, "ok");
        } else if (action === "repost") {
          doRepost(item);
        } else if (action === "thread") {
          openComposeThread(item);
        } else if (action === "translate") {
          openTranslateModal(item.text || item.name || "", {
            itemId: item.id,
            onResult: (translated) => {
              const box = document.querySelector('[data-translation-for="' + item.id + '"]');
              if (box) {
                box.innerHTML = '<span class="translate-label">Tradução</span> ' + escapeHtml(translated);
                box.classList.remove("hidden");
              }
            },
          });
        }
      };
    });
    scope.querySelectorAll("[data-post-react]").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.id;
        const key = btn.dataset.postReact;
        const item = findItem(id);
        if (!item) return;
        if (!item.reactions) item.reactions = {};
        item.reactions[key] = (item.reactions[key] || 0) + 1;
        persistAll();
        const countEl = btn.querySelector(".react-count");
        if (countEl) countEl.textContent = item.reactions[key];
        btn.classList.add("active");
        const meta = POST_REACTIONS.find((r) => r.key === key);
        toast((meta && meta.emoji) + " " + (meta && meta.title));
      };
    });
    scope.querySelectorAll("[data-lightbox]").forEach((el) => {
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(el);
      };
    });
  }

  function bindItemClicks() {
    $$("[data-open]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        openItemModal(btn.dataset.open);
      };
    });
    $$(".item[data-id]").forEach((el) => {
      el.onclick = () => openItemModal(el.dataset.id);
    });
    bindPostCardActions();
  }

  // ---------- Lightbox ----------
  function openLightbox(el) {
    const kind = el.dataset.lightbox;
    const lb = $("#lightbox");
    const img = $("#lightbox-img");
    const vid = $("#lightbox-video");
    img.hidden = true;
    vid.hidden = true;
    vid.removeAttribute("src");
    if (kind === "image") {
      img.src = el.dataset.src || el.src;
      img.hidden = false;
    } else if (kind === "video") {
      const id = el.dataset.videoId;
      if (el.src) {
        vid.src = el.src;
        vid.hidden = false;
        vid.play().catch(() => {});
      } else if (id) {
        idbGet(id).then((blob) => {
          if (!blob) return;
          vid.src = URL.createObjectURL(blob);
          vid.hidden = false;
          vid.play().catch(() => {});
        });
      }
    }
    lb.classList.remove("hidden");
  }
  function closeLightbox() {
    const lb = $("#lightbox");
    const vid = $("#lightbox-video");
    lb.classList.add("hidden");
    try { vid.pause(); } catch (_) {}
    vid.removeAttribute("src");
  }
  const lbClose = $("#lightbox-close");
  if (lbClose) lbClose.onclick = closeLightbox;
  const lbEl = $("#lightbox");
  if (lbEl) lbEl.addEventListener("click", (e) => { if (e.target === lbEl) closeLightbox(); });

  function doRepost(item) {
    const id = "p" + Date.now() + Math.random().toString(36).slice(2, 6);
    const post = {
      id,
      name: "↻ " + (item.name || "Post"),
      type: "post",
      text: item.text || "",
      duration: item.duration || 25,
      fav: false,
      createdAt: new Date().toISOString(),
      views: 0,
      reactions: {},
      repostOf: item.id,
      repostOfName: item.name,
      mediaKind: item.mediaKind,
      mediaUrl: item.mediaUrl,
      hasMedia: item.hasMedia,
    };
    state.posts.unshift(post);
    persistAll();
    try { refreshPublicCatalog({ toast: !!(state.autoSync && window.SacredAPI && SacredAPI.enabled()) }); } catch (_) {}
    toast("Repostado", 2500, "ok");
    if (state.notifications.posts === "on") {
      showLocalNotification("Repost no Sacred Temple", post.name, "new-post");
    }
    showView("library");
    const postsTab = document.querySelector('.tab[data-tab="posts"]');
    if (postsTab) postsTab.click();
  }

  function openComposeThread(item) {
    state.composeMode = "thread";
    state.composeParentId = item.id;
    openCompose();
    const title = $("#compose-title");
    const hint = $("#compose-hint");
    if (title) title.textContent = "Continuar thread";
    if (hint) hint.textContent = "Resposta na thread de: " + (item.name || "post");
  }

  // ---------- Item modal ----------
  function openItemModal(id) {
    const item = findItem(id);
    if (!item) return;
    recordView(item);
    state.selectedItem = item;
    const views = " · 👁 " + fmtViews(item.views || 0);
    $("#modal-item-title").textContent = item.name + views;
    $("#modal-item").classList.remove("hidden");
  }
  $("#btn-close-item").onclick = () => $("#modal-item").classList.add("hidden");

  $$("[data-item-action]").forEach((btn) => {
    btn.onclick = () => {
      const action = btn.dataset.itemAction;
      const item = state.selectedItem;
      if (!item) return;
      if (action === "fav") {
        item.fav = !item.fav;
        toast(item.fav ? "Marcado com a chama branca" : "Chama removida", 2200, "ok");
      } else if (action === "queue") {
        if (!state.queue.includes(item.id)) state.queue.push(item.id);
        toast("Adicionado à Soul Queue", 2200, "ok");
      } else if (action === "eternal") {
        if (!state.eternal.includes(item.id)) state.eternal.push(item.id);
        toast("Entrou no fluxo eterno", 2200, "ok");
      } else if (action === "repost") {
        doRepost(item);
        $("#modal-item").classList.add("hidden");
        return;
      } else if (action === "thread") {
        openComposeThread(item);
        $("#modal-item").classList.add("hidden");
        return;
      } else if (action === "captions") {
        openCaptionsModal(item);
        $("#modal-item").classList.add("hidden");
        return;
      } else if (action === "pin") {
        if (item.type !== "post") { toast("Só posts podem ser fixados"); return; }
        item.pinned = !item.pinned;
        toast(item.pinned ? "Post fixado 📌" : "Post desafixado");
      } else if (action === "translate") {
        openTranslateModal(item.text || item.name || "", {
          itemId: item.id,
          onResult: (translated) => {
            const box = document.querySelector('[data-translation-for="' + item.id + '"]');
            if (box) {
              box.textContent = translated;
              box.classList.remove("hidden");
            }
          },
        });
        $("#modal-item").classList.add("hidden");
        return;
      } else if (action === "share") {
        shareItem(item);
        $("#modal-item").classList.add("hidden");
        return;
      } else if (action === "copy") {
        const t = item.text || item.name || "";
        copyText(t).then(() => toast("Texto copiado"));
        $("#modal-item").classList.add("hidden");
        return;
      } else if (action === "download") {
        toast("Download disponível na versão com backend");
      } else if (action === "delete") {
        softDeleteItem(item);
        $("#modal-item").classList.add("hidden");
        return;
      }
      persistAll();
      $("#modal-item").classList.add("hidden");
      showView(state.currentView);
    };
  });

  function softDeleteItem(item) {
    if (!item) return;
    state._undoItem = JSON.parse(JSON.stringify(item));
    state.music = state.music.filter((i) => i.id !== item.id);
    state.posts = state.posts.filter((i) => i.id !== item.id);
    state.xposts = state.xposts.filter((i) => i.id !== item.id);
    state.tiktok = state.tiktok.filter((i) => i.id !== item.id);
    state.queue = state.queue.filter((id) => id !== item.id);
    state.eternal = state.eternal.filter((id) => id !== item.id);
    persistAll();
    try { refreshPublicCatalog({ toast: !!(state.autoSync && window.SacredAPI && SacredAPI.enabled()) }); } catch (_) {}
    showUndoBar("Removido · pode desfazer");
    showView(state.currentView);
  }

  function showUndoBar(msg) {
    const bar = $("#undo-bar");
    const m = $("#undo-msg");
    if (m) m.textContent = msg;
    if (bar) bar.classList.remove("hidden");
    clearTimeout(state._undoTimer);
    state._undoTimer = setTimeout(() => {
      if (bar) bar.classList.add("hidden");
      // permanent delete media after undo window
      if (state._undoItem && (state._undoItem.hasAudio || state._undoItem.hasMedia)) {
        idbDelete(state._undoItem.id).catch(() => {});
      }
      state._undoItem = null;
    }, 6000);
  }

  const btnUndo = $("#btn-undo");
  if (btnUndo) {
    btnUndo.onclick = () => {
      const it = state._undoItem;
      if (!it) return;
      if (it.type === "music") state.music.unshift(it);
      else if (it.type === "post") state.posts.unshift(it);
      else if (it.type === "x") state.xposts.unshift(it);
      else if (it.type === "tiktok") state.tiktok.unshift(it);
      state._undoItem = null;
      clearTimeout(state._undoTimer);
      const bar = $("#undo-bar");
      if (bar) bar.classList.add("hidden");
      persistAll();
      showView(state.currentView);
      toast("Restaurado");
    };
  }


  // ---------- Translate posts ----------
  const TRANSLATE_LANG_NAMES = {
    pt: "Português", en: "English", es: "Español", ko: "한국어",
    zh: "中文", ja: "日本語", fr: "Français", de: "Deutsch", it: "Italiano",
  };

  async function translateText(text, targetLang) {
    const q = String(text || "").trim();
    if (!q) throw new Error("Sem texto");
    const tl = targetLang || state.lang || "pt";
    // 1) Google gtx (auto detect source)
    try {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
        encodeURIComponent(tl) +
        "&dt=t&q=" +
        encodeURIComponent(q.slice(0, 4500));
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const out = data[0].map((row) => (row && row[0]) || "").join("");
          if (out.trim()) return out.trim();
        }
      }
    } catch (e) {
      console.warn("gtx translate", e);
    }
    // 2) MyMemory fallback
    try {
      const url2 =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(q.slice(0, 500)) +
        "&langpair=autodetect|" +
        encodeURIComponent(tl);
      const res2 = await fetch(url2);
      if (res2.ok) {
        const data2 = await res2.json();
        const out2 = data2 && data2.responseData && data2.responseData.translatedText;
        if (out2 && !String(out2).includes("MYMEMORY WARNING")) return String(out2).trim();
      }
    } catch (e) {
      console.warn("mymemory", e);
    }
    throw new Error("Tradução indisponível (rede ou limite)");
  }

  let _translateCtx = { text: "", onResult: null, itemId: null };

  function openTranslateModal(text, opts) {
    opts = opts || {};
    const raw = String(text || "").trim();
    if (!raw) {
      toast("Nada para traduzir", 2200, "err");
      return;
    }
    _translateCtx = { text: raw, onResult: opts.onResult || null, itemId: opts.itemId || null };
    const modal = $("#modal-translate");
    const preview = $("#translate-original-preview");
    const result = $("#translate-result");
    const sel = $("#translate-target-lang");
    if (preview) preview.textContent = raw.length > 200 ? raw.slice(0, 200) + "…" : raw;
    if (result) result.textContent = "";
    if (sel) {
      const preferred = state.lang || "pt";
      if ([].some.call(sel.options, (o) => o.value === preferred)) sel.value = preferred;
    }
    if (modal) modal.classList.remove("hidden");
  }

  async function runTranslateFromModal() {
    const sel = $("#translate-target-lang");
    const result = $("#translate-result");
    const tl = (sel && sel.value) || state.lang || "pt";
    const text = _translateCtx.text || "";
    if (!text) return;
    if (result) result.textContent = "Traduzindo…";
    try {
      const out = await translateText(text, tl);
      if (result) result.textContent = out;
      // cache opcional
      if (_translateCtx.itemId) {
        if (!state.translations) state.translations = {};
        if (!state.translations[_translateCtx.itemId]) state.translations[_translateCtx.itemId] = {};
        state.translations[_translateCtx.itemId][tl] = out;
        try { save("translations", state.translations); } catch (_) {}
      }
      if (typeof _translateCtx.onResult === "function") {
        try { _translateCtx.onResult(out); } catch (_) {}
      }
      toast("Traduzido · " + (TRANSLATE_LANG_NAMES[tl] || tl), 2200, "ok");
    } catch (e) {
      if (result) result.textContent = "";
      toast(e.message || "Falha na tradução", 3000, "err");
    }
  }

  const btnDoTranslate = $("#btn-do-translate");
  if (btnDoTranslate) btnDoTranslate.onclick = () => runTranslateFromModal();
  const btnCloseTranslate = $("#btn-close-translate");
  if (btnCloseTranslate) btnCloseTranslate.onclick = () => {
    const m = $("#modal-translate");
    if (m) m.classList.add("hidden");
  };
  const btnCopyTranslation = $("#btn-copy-translation");
  if (btnCopyTranslation) {
    btnCopyTranslation.onclick = () => {
      const result = $("#translate-result");
      const text = (result && result.textContent) || "";
      if (!text || text === "Traduzindo…") {
        toast("Traduza antes de copiar", 2000, "err");
        return;
      }
      copyText(text);
    };
  }
  const translateModal = $("#modal-translate");
  if (translateModal) {
    translateModal.addEventListener("click", (e) => {
      if (e.target === translateModal) translateModal.classList.add("hidden");
    });
  }

  // shared item: translate button if we add id later — hook via shared text
  const btnSharedTranslate = document.getElementById("btn-shared-translate");
  if (btnSharedTranslate) {
    btnSharedTranslate.onclick = () => {
      const textEl = $("#shared-item-text");
      const text = (textEl && (textEl.innerText || textEl.textContent)) || "";
      openTranslateModal(text);
    };
  }


  /** Link direto: ?u=handle&i=id&k=music|post&n=nome&d=duracao */
  function getItemShareLink(item) {
    if (!item || !item.id) return getProfileShareLink();
    const handle = getMyHandle();
    const base = getAppBaseUrl();
    const kind = item.type || "post";
    let url =
      base +
      "?u=" + encodeURIComponent(handle) +
      "&i=" + encodeURIComponent(item.id) +
      "&k=" + encodeURIComponent(kind);
    const name = (item.name || item.text || "").slice(0, 80);
    if (name) url += "&n=" + encodeURIComponent(name);
    if (item.duration) url += "&d=" + encodeURIComponent(String(Math.round(item.duration)));
    if (item.mediaKind) url += "&mk=" + encodeURIComponent(item.mediaKind);
    return url;
  }

  async function shareItem(item) {
    // Garante que a postagem/música está no snapshot público antes de compartilhar
    try {
      if (typeof refreshPublicCatalog === "function") {
        await refreshPublicCatalog({ toast: false, quiet: true });
      }
    } catch (_) {}
    const text = (item.text || item.name || "Sacred Temple").slice(0, 200);
    const url = getItemShareLink(item);
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name || "Sacred Temple", text, url });
        toast("Link da postagem compartilhado", 2200, "ok");
      } else {
        await copyText(url);
        toast("Link da postagem copiado", 2200, "ok");
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
      try {
        await copyText(url);
        toast("Link da postagem copiado", 2200, "ok");
      } catch (_) {
        toast(url, 4000);
      }
    }
  }

  function itemFromQueryParams(params) {
    const itemId = (params.get("i") || params.get("post") || params.get("item") || "").trim();
    if (!itemId) return null;
    const k = (params.get("k") || "post").toLowerCase();
    const n = params.get("n") || "";
    const d = parseInt(params.get("d") || "0", 10) || 0;
    const mk = params.get("mk") || "";
    return {
      id: itemId,
      type: k === "music" ? "music" : "post",
      name: n ? decodeURIComponent(n) : (k === "music" ? "Música" : "Post"),
      text: k === "music" ? "" : (n ? decodeURIComponent(n) : ""),
      duration: d,
      mediaKind: mk || "",
      hasAudio: k === "music",
      hasMedia: mk === "image" || mk === "video",
      views: 0,
      _fromLink: true,
    };
  }

  function findItemAnywhere(id) {
    if (!id) return null;
    // 1) Biblioteca local (mesmo aparelho do criador)
    try {
      const local = typeof findItem === "function" ? findItem(id) : null;
      if (local) return local;
    } catch (_) {}
    // 2) SAMPLE (Guider demo)
    try {
      const sm = (SAMPLE_MUSIC || []).find((m) => m.id === id);
      if (sm) return { ...sm, hasAudio: !!sm.hasAudio };
      const sp = (SAMPLE_POSTS || []).find((p) => p.id === id);
      if (sp) return { ...sp };
    } catch (_) {}
    // 3) Snapshot da visita pública
    try {
      const data = state._publicProfileVisit && state._publicProfileVisit.data;
      if (data) {
        const p = (data.posts || []).find((x) => x.id === id);
        if (p) {
          return {
            id: p.id,
            type: "post",
            name: (p.t || "Post").slice(0, 60),
            text: p.t || "",
            mediaKind: p.k || "",
            mediaUrl: p.img || p.vid || "",
            hasMedia: !!(p.img || p.vid),
            externalLink: p.link || "",
            views: p.v || 0,
            duration: 25,
          };
        }
        const m = (data.music || []).find((x) => x.id === id);
        if (m) {
          return {
            id: m.id,
            type: "music",
            name: m.n || "Música",
            duration: m.d || 0,
            views: m.v || 0,
            hasAudio: true,
            mediaUrl: m.url || "",
            url: m.url || "",
          };
        }
        const st = (data.station || []).find((x) => x.id === id);
        if (st) {
          return {
            id: st.id,
            type: st.ty || "music",
            name: st.n || "Item",
            text: st.t || "",
            duration: st.d || 0,
            mediaKind: st.k || "",
            hasAudio: (st.ty || "") === "music",
          };
        }
      }
    } catch (_) {}
    // 4) st_pub_* localStorage
    try {
      const params = new URLSearchParams(location.search || "");
      const h = (params.get("u") || (typeof getMyHandle === "function" ? getMyHandle() : "") || "").toLowerCase();
      if (typeof loadPublicSnapshotLocal === "function" && h) {
        const snap = loadPublicSnapshotLocal(h);
        if (snap) {
          const p = (snap.posts || []).find((x) => x.id === id);
          if (p) {
            return {
              id: p.id,
              type: "post",
              name: (p.t || "Post").slice(0, 60),
              text: p.t || "",
              mediaKind: p.k || "",
              mediaUrl: p.img || p.vid || "",
              hasMedia: !!(p.img || p.vid),
              externalLink: p.link || "",
              views: p.v || 0,
              duration: 25,
            };
          }
          const m = (snap.music || []).find((x) => x.id === id);
          if (m) {
            return {
              id: m.id,
              type: "music",
              name: m.n || "Música",
              duration: m.d || 0,
              views: m.v || 0,
              hasAudio: true,
              mediaUrl: m.url || "",
              url: m.url || "",
            };
          }
        }
      }
    } catch (_) {}
    return null;
  }

  async function tryPlayMusicItem(item) {
    if (!item || !item.id) return false;
    const audio = $("#audio-player");
    if (!audio) return false;
    // IndexedDB (mesmo dispositivo)
    try {
      const blob = await idbGet(item.id);
      if (blob) {
        try { audio.pause(); } catch (_) {}
        audio.src = URL.createObjectURL(blob);
        await audio.play();
        toast("▶ " + (item.name || "Música"), 2200, "ok");
        return true;
      }
    } catch (e) {
      console.warn("tryPlayMusicItem idb", e);
    }
    // URL remota se houver
    if (item.url || item.src || item.mediaUrl) {
      try {
        audio.src = item.url || item.src || item.mediaUrl;
        await audio.play();
        toast("▶ " + (item.name || "Música"), 2200, "ok");
        return true;
      } catch (e) {
        console.warn("tryPlayMusicItem url", e);
      }
    }
    return false;
  }

  function openSharedItemView(item) {
    if (!item) {
      toast("Postagem não encontrada", 2500, "err");
      return;
    }
    const modal = $("#modal-shared-item");
    if (!modal) return;
    const kindEl = $("#shared-item-kind");
    const titleEl = $("#shared-item-title");
    const metaEl = $("#shared-item-meta");
    const mediaEl = $("#shared-item-media");
    const textEl = $("#shared-item-text");
    const playBtn = $("#btn-shared-play");

    const isMusic = item.type === "music";
    const isImage = item.mediaKind === "image" && item.mediaUrl;
    const isVideo = item.mediaKind === "video";
    let kindLabel = "Texto";
    if (isMusic) kindLabel = "Música";
    else if (isImage) kindLabel = "Imagem";
    else if (isVideo) kindLabel = "Vídeo";
    else if (item.type === "post") kindLabel = "Post";

    if (kindEl) kindEl.textContent = kindLabel;
    if (titleEl) titleEl.textContent = item.name || kindLabel;
    if (metaEl) {
      const bits = [];
      if (item.duration) bits.push(typeof fmtTime === "function" ? fmtTime(item.duration) : item.duration + "s");
      if (item.views) bits.push("👁 " + fmtViews(item.views));
      if (item._fromLink && isMusic) bits.push("via link");
      metaEl.textContent = bits.join(" · ");
    }
    if (textEl) {
      const body = item.text || "";
      textEl.innerHTML = body ? linkifyHtml(escapeHtml(body)) : "";
      textEl.style.display = body ? "" : "none";
    }
    if (mediaEl) {
      mediaEl.innerHTML = "";
      mediaEl.classList.add("hidden");
      if (isImage) {
        mediaEl.innerHTML = `<img src="${item.mediaUrl}" alt="" style="width:100%;border-radius:12px;max-height:50vh;object-fit:contain" />`;
        mediaEl.classList.remove("hidden");
      } else if (isVideo) {
        mediaEl.innerHTML = `<video controls playsinline style="width:100%;border-radius:12px;max-height:50vh;background:#000"></video>`;
        mediaEl.classList.remove("hidden");
        const vid = mediaEl.querySelector("video");
        if (item.mediaUrl) vid.src = item.mediaUrl;
        else if (item.id) {
          idbGet(item.id).then((blob) => {
            if (blob) vid.src = URL.createObjectURL(blob);
          }).catch(() => {});
        }
      } else if (isMusic) {
        mediaEl.innerHTML =
          '<div style="text-align:center;padding:1rem 0.5rem">' +
          '<div class="item-flame" style="margin:0 auto 0.6rem;width:48px;height:48px"><div class="white-flame"></div></div>' +
          '<p class="muted" style="font-size:0.85rem">Toque em Reproduzir para ouvir</p>' +
          '</div>';
        mediaEl.classList.remove("hidden");
      }
    }
    if (playBtn) {
      if (isMusic || isVideo) {
        playBtn.style.display = "";
        playBtn.textContent = isMusic ? "▶ Reproduzir música" : "▶ Reproduzir vídeo";
        playBtn.onclick = async () => {
          if (isMusic) {
            const ok = await tryPlayMusicItem(item);
            if (!ok) {
              toast("Áudio só toca no aparelho onde a música foi importada (ou com sync no servidor)", 4200, "err");
            }
          } else if (isVideo) {
            const vid = mediaEl && mediaEl.querySelector("video");
            if (vid) vid.play().catch(() => toast("Vídeo indisponível neste dispositivo", 2500, "err"));
          }
        };
      } else {
        playBtn.style.display = "none";
      }
    }
    try { recordView(item); } catch (_) {}
    modal.classList.remove("hidden");

    // Auto-play música no mesmo aparelho do criador
    if (isMusic) {
      setTimeout(() => {
        tryPlayMusicItem(item).then((ok) => {
          if (!ok && item._fromLink) {
            const metaEl2 = $("#shared-item-meta");
            if (metaEl2) {
              metaEl2.textContent = (metaEl2.textContent ? metaEl2.textContent + " · " : "") +
                "Áudio no aparelho do criador";
            }
          }
        });
      }, 350);
    }
  }

  function closeSharedItemView() {
    const modal = $("#modal-shared-item");
    if (modal) modal.classList.add("hidden");
  }

  /** Abre postagem/música a partir de ?i=id&u=handle&k=&n=&d= */
  function openItemFromQuery() {
    try {
      const params = new URLSearchParams(location.search || "");
      const itemId = (params.get("i") || params.get("post") || params.get("item") || "").trim();
      if (!itemId) return false;

      const handle = (params.get("u") || params.get("user") || params.get("handle") || "")
        .trim()
        .replace(/^@/, "");

      // Carrega contexto do templo do dono (snapshot)
      if (handle) {
        try {
          const data = typeof buildGuestPayloadFromHandle === "function"
            ? buildGuestPayloadFromHandle(handle)
            : null;
          if (data) {
            state._publicProfileVisit = {
              id: handle.toLowerCase(),
              name: data.n || handle,
              data,
            };
          }
        } catch (_) {}
      }

      // 1) biblioteca / snapshot
      let item = findItemAnywhere(itemId);
      // 2) metadados embutidos no próprio link (sempre disponível)
      if (!item) {
        item = itemFromQueryParams(params);
      } else {
        // completa nome se o link trouxe n=
        const fromLink = itemFromQueryParams(params);
        if (fromLink) {
          if (!item.name && fromLink.name) item.name = fromLink.name;
          if (!item.duration && fromLink.duration) item.duration = fromLink.duration;
          if (!item.type && fromLink.type) item.type = fromLink.type;
        }
      }

      if (!item) {
        toast("Postagem não encontrada", 3000, "err");
        if (handle) openHandleFromQuery();
        return !!handle;
      }

      document.documentElement.classList.add("deep-link-profile");
      // esconde splash se estiver visível
      try {
        const splash = document.getElementById("splash");
        if (splash) splash.classList.remove("active");
      } catch (_) {}

      openSharedItemView(item);
      return true;
    } catch (e) {
      console.warn("openItemFromQuery", e);
      return false;
    }
  }

  const btnSharedClose = $("#btn-shared-close");
  if (btnSharedClose) btnSharedClose.onclick = closeSharedItemView;
  const btnSharedTemple = $("#btn-shared-temple");
  if (btnSharedTemple) {
    btnSharedTemple.onclick = () => {
      closeSharedItemView();
      const params = new URLSearchParams(location.search || "");
      const handle = (params.get("u") || "").trim();
      if (handle) {
        openHandleFromQuery();
        try { enterPersonTemple(); } catch (_) {}
      } else if (state.onboarded) {
        showScreen("app");
        showView("library");
      }
    };
  }
  const sharedModal = $("#modal-shared-item");
  if (sharedModal) {
    sharedModal.addEventListener("click", (e) => {
      if (e.target === sharedModal) closeSharedItemView();
    });
  }

  // ---------- Onboarding ----------
  function setObStep(n) {
    $$(".ob-step").forEach((s) => s.classList.toggle("active", s.dataset.step == n));
    $("#ob-bar").style.width = n * 25 + "%";
  }

  /** Atualiza splash: se já tem perfil, mostra “bem-vindo de volta” e texto de entrada */
  function refreshSplashForUser() {
    const btn = $("#btn-start");
    const title = document.querySelector("#splash .app-title");
    const tag = document.querySelector("#splash .tagline");
    const googleBtn = $("#btn-google-splash");
    const divider = document.querySelector("#splash .auth-divider");
    if (!btn) return;
    if (state.onboarded && state.profile && state.profile.name) {
      const name = state.profile.name;
      btn.textContent = "Entrar no meu templo";
      if (tag) tag.textContent = "Bem-vindo de volta, " + name;
      if (title) title.textContent = "Sacred Temple";
      // Já logado: Google fica secundário
      if (googleBtn) googleBtn.style.display = "none";
      if (divider) divider.style.display = "none";
    } else {
      btn.textContent = "Começar";
      if (tag) tag.textContent = "A place to share what the soul is saying";
      if (googleBtn) googleBtn.style.display = "";
      if (divider) divider.style.display = "";
    }
  }

  /** Atualiza botões de “voltar / meu templo” quando o usuário já tem perfil */
  function refreshOwnTempleButtons() {
    const hasOwn = !!(state.onboarded && state.profile && state.profile.name);
    const label = hasOwn ? "◀️ Meu templo sagrado" : "Criar meu templo";
    const shortLabel = hasOwn ? "◀️ Meu templo" : "Meu templo";
    const ids = ["btn-open-own-app", "btn-guest-create-mine"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = label;
    });
    const fromTemple = document.getElementById("btn-open-own-app-from-temple");
    if (fromTemple) fromTemple.textContent = shortLabel;
    const hint = document.querySelector(".public-hint");
    if (hint) {
      hint.textContent = hasOwn
        ? "“Entrar no templo” abre o espaço público desta pessoa · “◀️ Meu templo sagrado” volta ao seu."
        : "“Entrar no templo” abre o espaço público desta pessoa · “Criar meu templo” inicia o seu.";
    }
  }

  $("#btn-start").onclick = () => {
    if (state.onboarded) {
      showScreen("app");
      showView("home");
      toast("Bem-vindo de volta, " + (state.profile.name || "Criador"), 2200, "ok");
    } else {
      showScreen("onboarding");
      setObStep(1);
    }
  };

  $$(".lang-btn").forEach((btn) => {
    btn.onclick = () => {
      state.lang = btn.dataset.lang;
      setObStep(2);
    };
  });
  $("#btn-ob-next-2").onclick = () => setObStep(3);
  $("#btn-ob-next-3").onclick = () => setObStep(4);
  $("#btn-ob-x").onclick = () => { state.connected.x = true; toast("X conectado (demo)"); $("#btn-ob-x").textContent = "X conectado ✓"; };
  $("#btn-ob-tt").onclick = () => { state.connected.tiktok = true; toast("TikTok conectado (demo)"); $("#btn-ob-tt").textContent = "TikTok conectado ✓"; };

  /** Zera conteúdo do templo do usuário (posts, músicas, filas, etc.) — templo limpo */
  function resetTempleContent() {
    state.music = [];
    state.posts = [];
    state.xposts = [];
    state.tiktok = [];
    state.queue = [];
    state.eternal = [];
    state.lives = [];
    state.quietRequests = [];
    state.captions = {};
    state.draft = null;
    state.composeMedia = null;
    state.composeMode = null;
    state.composeParentId = null;
    state.selectedItem = null;
    state.apoio = { apoiadores: [], apoiando: [] };
  }

  $("#btn-ob-finish").onclick = () => {
    const name = $("#ob-name").value.trim();
    const bio = $("#ob-bio").value.trim();
    if (!name) {
      toast("Escolha um nome para o seu templo", 2500, "err");
      return;
    }
    // Templo novo: sempre limpo (sem posts/músicas de demonstração)
    resetTempleContent();
    state.profile = {
      name: name,
      bio: bio || "",
      avatarColor: state.profile.avatarColor || "#e8e0ff",
      photo: state.profile.photo || null,
    };
    state.onboarded = true;
    persistAll();
    if (typeof registerMyProfileQuiet === "function") {
      try { registerMyProfileQuiet(); persistAll(); } catch (_) {}
    }
    // Link do perfil = nome que ela acabou de escolher
    claimOwnProfileUrl();
    try { refreshPublicCatalog({ toast: !!(state.autoSync && window.SacredAPI && SacredAPI.enabled()) }); } catch (_) {}
    try { refreshSplashForUser(); refreshOwnTempleButtons(); } catch (_) {}
    showScreen("app");
    showView("home");
    renderProfile();
    toast("Templo criado · link: ?u=" + getMyHandle(), 3500, "ok");
  };

  // ---------- Navigation ----------
  $$(".nav-btn, .action-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.nav;
      if (nav) showView(nav);
    });
  });

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      $$(".tab-content").forEach((c) => c.classList.remove("active"));
      const c = document.getElementById("tab-" + tab.dataset.tab);
      if (c) c.classList.add("active");
    });
  });

  // ---------- Music upload (with real audio in IndexedDB) ----------
  $("#btn-add-music").onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      toast("Processando áudio…");
      for (const file of files) {
        const id = "m" + Date.now() + Math.random().toString(36).slice(2, 6);
        const duration = await readAudioDuration(file);
        try {
          await idbPut(id, file);
        } catch (e) {
          console.warn("IDB put failed", e);
          toast("Não foi possível salvar o áudio localmente");
        }
        const item = {
          id,
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: "music",
          duration,
          fav: false,
          hasAudio: true,
          mime: file.type || "audio/mpeg",
          views: 0,
        };
        state.music.push(item);
        // Automático: nova música → Eternal Station
        if (!state.eternal.includes(id)) state.eternal.push(id);
        // Upload para o servidor (R2) se API + autoSync — assim o link toca em qualquer aparelho
        if (window.SacredAPI && SacredAPI.enabled() && state.autoSync !== false) {
          try {
            const profileId = typeof getOrCreateServerProfileId === "function" ? getOrCreateServerProfileId() : null;
            // garante perfil no servidor
            try {
              await SacredAPI.upsertProfile({
                id: profileId,
                handle: slugify(state.profile.name || "criador"),
                name: state.profile.name || "Criador",
                bio: state.profile.bio || "",
                avatar_color: state.profile.avatarColor || "#e8e0ff",
              });
            } catch (_) {}
            const blob = file;
            const up = await SacredAPI.uploadMedia({
              id,
              blob,
              name: item.name,
              kind: "music",
              duration: duration || 0,
              profileId,
              mime: file.type || "audio/mpeg",
            });
            if (up && up.url) {
              item.mediaUrl = up.url;
              item.url = up.url;
              item._synced = true;
              toast("☁ " + item.name + " no servidor", 2000, "ok");
            }
          } catch (err) {
            console.warn("upload music", err);
            toast("Música local OK · upload: " + (err.message || "falhou"), 3500, "err");
          }
        }
      }
      persistAll();
      try { refreshPublicCatalog({ toast: !!(state.autoSync && window.SacredAPI && SacredAPI.enabled()) }); } catch (_) {}
      renderLibrary();
      if (state.currentView === "eternal") renderEternal();
      toast(files.length + " música(s) adicionada(s)", 2800, "ok");
    };
    input.click();
  };
  $("#btn-suno").onclick = () => toast("Importe o áudio gerado pelo Suno com + Upload");

  // ---------- Compose / New Post (text, image, video) ----------
  function clearComposeMedia() {
    if (state.composeMedia && state.composeMedia.blobUrl) {
      try { URL.revokeObjectURL(state.composeMedia.blobUrl); } catch (_) {}
    }
    state.composeMedia = null;
    const img = $("#compose-preview-img");
    const vid = $("#compose-preview-video");
    img.hidden = true;
    img.src = "";
    vid.hidden = true;
    vid.src = "";
    $("#compose-preview").classList.add("hidden");
    $("#compose-media-name").textContent = "";
    $("#btn-clear-media").classList.add("hidden");
    $("#compose-image-input").value = "";
    $("#compose-video-input").value = "";
  }

  function openCompose(fromDraft) {
    if (!state.composeMode) {
      const title = $("#compose-title");
      const hint = $("#compose-hint");
      if (title) title.textContent = "Novo post";
      if (hint) hint.textContent = "Compartilhe o que a alma está dizendo — texto, imagem, vídeo ou link. Use #hashtags.";
      state.composeParentId = null;
    }
    clearComposeMedia();
    if (fromDraft && state.draft) {
      $("#compose-text").value = state.draft.text || "";
      const linkIn = $("#compose-link");
      if (linkIn) linkIn.value = state.draft.link || "";
    } else {
      $("#compose-text").value = "";
      const linkIn = $("#compose-link");
      if (linkIn) linkIn.value = "";
    }
    updateComposeCharCount();
    $("#modal-compose").classList.remove("hidden");
    setTimeout(() => $("#compose-text").focus(), 100);
  }

  function closeCompose(saveDraft) {
    if (saveDraft !== false) {
      const text = ($("#compose-text") || {}).value || "";
      const link = ($("#compose-link") || {}).value || "";
      if (text.trim() || link.trim()) {
        state.draft = { text, link, savedAt: new Date().toISOString() };
        persistAll();
      }
    }
    clearComposeMedia();
    state.composeMode = null;
    state.composeParentId = null;
    $("#modal-compose").classList.add("hidden");
  }

  function updateComposeCharCount() {
    const ta = $("#compose-text");
    const el = $("#compose-char-count");
    if (ta && el) el.textContent = (ta.value || "").length + " / 4000";
    // autosave draft while typing
    const text = (ta && ta.value) || "";
    const link = (($("#compose-link") || {}).value) || "";
    if (text.trim() || link.trim()) {
      state.draft = { text, link, savedAt: new Date().toISOString() };
      // light persist
      try { save("draft", state.draft); } catch (_) {}
    }
  }
  const composeTextEl = $("#compose-text");
  if (composeTextEl) composeTextEl.addEventListener("input", updateComposeCharCount);
  const composeLinkEl = $("#compose-link");
  if (composeLinkEl) composeLinkEl.addEventListener("input", updateComposeCharCount);

  // Paste image into compose
  if (composeTextEl) {
    composeTextEl.addEventListener("paste", (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (const it of items) {
        if (it.type && it.type.startsWith("image/")) {
          e.preventDefault();
          const file = it.getAsFile();
          if (!file) return;
          if (file.size > 8 * 1024 * 1024) { toast("Imagem muito grande (máx. 8 MB)"); return; }
          const reader = new FileReader();
          reader.onload = () => {
            clearComposeMedia();
            state.composeMedia = { kind: "image", dataUrl: reader.result, name: file.name || "paste.png" };
            const img = $("#compose-preview-img");
            img.src = reader.result;
            img.hidden = false;
            $("#compose-preview-video").hidden = true;
            $("#compose-preview").classList.remove("hidden");
            $("#compose-media-name").textContent = "Imagem colada";
            $("#btn-clear-media").classList.remove("hidden");
            toast("Imagem colada no post");
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    });
  }

  const btnResumeDraft = $("#btn-resume-draft");
  if (btnResumeDraft) btnResumeDraft.onclick = () => openCompose(true);

  $("#btn-new-post").onclick = openCompose;
  const homeNewPost = $("#btn-home-new-post");
  if (homeNewPost) homeNewPost.onclick = openCompose;
  $("#btn-cancel-compose").onclick = closeCompose;

  $("#btn-attach-image").onclick = () => $("#compose-image-input").click();
  $("#btn-attach-video").onclick = () => $("#compose-video-input").click();
  $("#btn-clear-media").onclick = clearComposeMedia;

  $("#compose-image-input").onchange = () => {
    const file = $("#compose-image-input").files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast("Imagem muito grande (máx. 8 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      clearComposeMedia();
      state.composeMedia = { kind: "image", dataUrl: reader.result, name: file.name };
      const img = $("#compose-preview-img");
      img.src = reader.result;
      img.hidden = false;
      $("#compose-preview-video").hidden = true;
      $("#compose-preview").classList.remove("hidden");
      $("#compose-media-name").textContent = file.name;
      $("#btn-clear-media").classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  };

  $("#compose-video-input").onchange = () => {
    const file = $("#compose-video-input").files[0];
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) {
      toast("Vídeo muito grande (máx. 80 MB nesta versão)");
      return;
    }
    clearComposeMedia();
    const blobUrl = URL.createObjectURL(file);
    state.composeMedia = { kind: "video", blobUrl, name: file.name, file };
    const vid = $("#compose-preview-video");
    vid.src = blobUrl;
    vid.muted = false;
    vid.volume = 1;
    vid.hidden = false;
    $("#compose-preview-img").hidden = true;
    $("#compose-preview").classList.remove("hidden");
    $("#compose-media-name").textContent = file.name + " (com áudio)";
    $("#btn-clear-media").classList.remove("hidden");
  };

  $("#btn-publish-post").onclick = async () => {
    const textVal = $("#compose-text").value.trim();
    const media = state.composeMedia;
    const hasLink = !!(($("#compose-link") || {}).value || "").trim();
    if (!textVal && !media && !hasLink) {
      toast("Escreva algo, anexe uma mídia ou adicione um link");
      return;
    }
    const id = "p" + Date.now() + Math.random().toString(36).slice(2, 6);
    const name = textVal
      ? (textVal.length > 40 ? textVal.slice(0, 40) + "…" : textVal)
      : (media ? media.name.replace(/\.[^/.]+$/, "") : "Post");
    const linkVal = (($("#compose-link") || {}).value || "").trim();
    let externalLink = "";
    if (linkVal) {
      try {
        const u = new URL(linkVal.match(/^https?:\/\//i) ? linkVal : "https://" + linkVal);
        if (u.protocol === "http:" || u.protocol === "https:") externalLink = u.href;
      } catch (_) {
        toast("Link externo inválido");
        return;
      }
    }
    const post = {
      id,
      name,
      type: "post",
      text: textVal || "",
      duration: media && media.kind === "video" ? 30 : 25,
      fav: false,
      createdAt: new Date().toISOString(),
      views: 0,
      reactions: {},
    };
    if (externalLink) post.externalLink = externalLink;
    if (state.composeMode === "thread" && state.composeParentId) {
      post.threadId = state.composeParentId;
      post.name = "🧵 " + name;
    }
    if (media) {
      post.mediaKind = media.kind;
      post.mediaName = media.name;
      if (media.kind === "image") {
        post.mediaUrl = media.dataUrl;
        post.hasMedia = true;
      } else if (media.kind === "video" && media.file) {
        toast("Salvando vídeo com áudio…");
        try {
          await idbPut(id, media.file);
          post.hasMedia = true;
          // Read duration from video element if possible
          const tmp = document.createElement("video");
          tmp.preload = "metadata";
          const u = URL.createObjectURL(media.file);
          await new Promise((res) => {
            tmp.onloadedmetadata = () => {
              post.duration = Math.round(tmp.duration) || 30;
              URL.revokeObjectURL(u);
              res();
            };
            tmp.onerror = () => { URL.revokeObjectURL(u); res(); };
            tmp.src = u;
          });
        } catch (e) {
          console.warn(e);
          toast("Falha ao salvar vídeo");
        }
      }
    }
    state.posts.unshift(post);
    // Automático: novo post → Eternal Station
    if (!state.eternal.includes(post.id)) state.eternal.push(post.id);
    state.draft = null;
    persistAll();
    // Atualiza templo público (link ?u= e app) com o novo post
    try { refreshPublicCatalog({ toast: !!(state.autoSync && window.SacredAPI && SacredAPI.enabled()) }); } catch (_) {}
    closeCompose(false);
    $$(".tab").forEach((t) => t.classList.remove("active"));
    const postsTab = document.querySelector('.tab[data-tab="posts"]');
    if (postsTab) postsTab.classList.add("active");
    $$(".tab-content").forEach((c) => c.classList.remove("active"));
    const postsContent = $("#tab-posts");
    if (postsContent) postsContent.classList.add("active");
    showView("library");
    toast(post.mediaKind === "video" ? "Vídeo publicado · templo atualizado" : "Post publicado · templo atualizado", 2800, "ok");
    if (state.notifications.posts === "on") {
      const preview = (post.text || post.name || "Novo post").slice(0, 80);
      showLocalNotification("Novo post no Sacred Temple", preview, "new-post");
    }
    // Sync automática com o servidor Cloudflare (se API + autoSync)
    if (window.SacredAPI && SacredAPI.enabled() && state.autoSync !== false) {
      (async () => {
        try {
          await syncProfileToServer();
          const authorId = load("serverProfileId", null);
          if (!authorId) return;
          await SacredAPI.createPost({
            id: post.id,
            author_id: authorId,
            text: post.text || "",
            external_link: post.externalLink || "",
            media_kind: post.mediaKind || "",
            media_url: (post.mediaKind === "image" && post.mediaUrl) ? String(post.mediaUrl).slice(0, 1800) : "",
            pinned: post.pinned ? 1 : 0,
            views: post.views || 0,
            created_at: post.createdAt,
          });
          post._synced = true;
          persistAll();
          toast("Post também no servidor", 2000, "ok");
        } catch (e) {
          console.warn("sync post", e);
          toast("Post local OK · sync: " + (e.message || "falhou"), 3200, "err");
        }
      })();
    }
  };

  // Library search + pin filter
  const libSearch = $("#library-search");
  if (libSearch) {
    libSearch.addEventListener("input", () => {
      state.libraryQuery = libSearch.value;
      renderLibrary();
    });
  }
  const btnFilterPinned = $("#btn-filter-pinned");
  if (btnFilterPinned) {
    btnFilterPinned.onclick = () => {
      state.libraryFilterPinned = !state.libraryFilterPinned;
      btnFilterPinned.classList.toggle("gold", state.libraryFilterPinned);
      toast(state.libraryFilterPinned ? "Mostrando só fixados" : "Todos os posts");
      renderLibrary();
    };
  }

  // ---------- Connect ----------
  function toggleConnect(platform) {
    state.connected[platform] = !state.connected[platform];
    persistAll();
    toast(state.connected[platform] ? platform.toUpperCase() + " conectado (demo)" : platform.toUpperCase() + " desconectado");
    renderLibrary();
    renderProfile();
  }
  $("#btn-connect-x").onclick = () => toggleConnect("x");
  $("#btn-connect-tt").onclick = () => toggleConnect("tiktok");
  $("#btn-x-status").onclick = () => toggleConnect("x");
  $("#btn-tt-status").onclick = () => toggleConnect("tiktok");
  $("#btn-suno-status").onclick = () => toggleConnect("suno");

  // ---------- Eternal player (real audio + video with sound) ----------
  const audioEl = () => document.getElementById("audio-player");
  const videoEl = () => document.getElementById("eternal-video");
  const imageEl = () => document.getElementById("eternal-image");
  const mediaBox = () => document.getElementById("eternal-post-media");
  const postCardBox = () => document.getElementById("eternal-post-card");
  const flameBox = () => document.getElementById("eternal-flame");
  let progressTimer = null;
  let currentObjectUrl = null;
  let listenersTimer = null;

  function updateEternalListenersUI() {
    const el = document.getElementById("eternal-listeners-count");
    if (el) el.textContent = String(state.eternalListeners || 1);
    const box = document.getElementById("eternal-listeners");
    if (box) {
      box.classList.toggle("is-live", !!state.isPlaying);
      box.title = state.isPlaying
        ? (state.eternalListeners + " ouvindo ao vivo · pico " + state.eternalPeakListeners)
        : "Ouvintes na Eternal Station";
    }
  }

  function tickEternalListeners() {
    // Simulate organic listener fluctuation while station is playing
    if (!state.isPlaying || !state.eternal.length) return;
    const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
    state.eternalListeners = Math.max(1, Math.min(9999, (state.eternalListeners || 1) + delta));
    // Occasional small surge
    if (Math.random() < 0.12) {
      state.eternalListeners += Math.floor(Math.random() * 4) + 1;
    }
    if (state.eternalListeners > state.eternalPeakListeners) {
      state.eternalPeakListeners = state.eternalListeners;
    }
    updateEternalListenersUI();
  }

  function startListenersSimulation() {
    clearInterval(listenersTimer);
    // Seed a realistic baseline when playback starts
    if (state.eternalListeners < 2) {
      state.eternalListeners = Math.floor(Math.random() * 12) + 3;
    }
    updateEternalListenersUI();
    listenersTimer = setInterval(tickEternalListeners, 4500);
  }

  function stopListenersSimulation() {
    clearInterval(listenersTimer);
    listenersTimer = null;
    // Soft decay when paused
    state.eternalListeners = Math.max(1, Math.floor((state.eternalListeners || 1) * 0.6));
    updateEternalListenersUI();
  }

  function revokeCurrentUrl() {
    if (currentObjectUrl) {
      try { URL.revokeObjectURL(currentObjectUrl); } catch (_) {}
      currentObjectUrl = null;
    }
  }

  function stopAllMedia() {
    clearInterval(progressTimer);
    progressTimer = null;
    const a = audioEl();
    if (a) { a.pause(); a.removeAttribute("src"); a.load(); }
    const v = videoEl();
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); v.hidden = true; }
    const img = imageEl();
    if (img) { img.hidden = true; img.removeAttribute("src"); }
    if (mediaBox()) mediaBox().classList.add("hidden");
    if (postCardBox()) postCardBox().classList.add("hidden");
    if (flameBox()) flameBox().style.display = "";
    revokeCurrentUrl();
  }

  function showEternalPost(cur) {
    const card = postCardBox();
    const postText = document.getElementById("eternal-post-text");
    const postBadge = document.getElementById("eternal-post-badge");
    const postTime = document.getElementById("eternal-post-time");
    const media = mediaBox();
    const v = videoEl();
    const img = imageEl();
    if (!card || !postText) return;

    const isPostLike = cur.type === "post" || cur.type === "x" || cur.type === "tiktok";
    if (!isPostLike) {
      card.classList.add("hidden");
      if (media) media.classList.add("hidden");
      return;
    }

    // Badge
    let badge = "Texto";
    if (cur.type === "x") badge = "X";
    else if (cur.type === "tiktok") badge = "TikTok";
    else if (cur.mediaKind === "image") badge = "Imagem";
    else if (cur.mediaKind === "video") badge = "Vídeo";
    if (postBadge) postBadge.textContent = badge;

    // Time + views
    if (postTime) {
      const parts = [];
      if (cur.createdAt) {
        parts.push(new Date(cur.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }));
      }
      parts.push("👁 " + fmtViews(cur.views || 0));
      postTime.textContent = parts.join(" · ");
    }

    // Full text
    const body = (cur.text || "").trim();
    postText.textContent = body || (cur.name || "—");
    postText.style.display = body || !cur.mediaKind ? "" : (body ? "" : "none");
    if (!body && cur.mediaKind) postText.style.display = "none";
    else postText.style.display = "";

    // Media area — image / video placeholders (src filled by playCurrentItem)
    if (media && v && img) {
      if (cur.mediaKind === "image" && cur.mediaUrl) {
        img.src = cur.mediaUrl;
        img.hidden = false;
        v.hidden = true;
        media.classList.remove("hidden");
      } else if (cur.mediaKind === "video") {
        img.hidden = true;
        img.removeAttribute("src");
        v.hidden = false;
        media.classList.remove("hidden");
        // src set async in playCurrentItem from IndexedDB
      } else {
        media.classList.add("hidden");
        img.hidden = true;
        v.hidden = true;
      }
    }

    card.classList.remove("hidden");
    // Hide decorative flame when showing a post card
    if (flameBox()) flameBox().style.display = "none";

    // Sync action buttons under the eternal post
    const favBtn = document.getElementById("btn-eternal-fav");
    const favLabel = document.getElementById("eternal-fav-label");
    if (favBtn) {
      favBtn.dataset.id = cur.id;
      favBtn.classList.toggle("active", !!cur.fav);
      if (favLabel) favLabel.textContent = cur.fav ? "Chama branca" : "Marcar chama";
    }
    const qBtn = document.getElementById("btn-eternal-queue");
    if (qBtn) qBtn.dataset.id = cur.id;
  }

  function syncProgressFromMedia(el) {
    if (!el || !state.isPlaying) return;
    state.progress = el.currentTime || 0;
    if (el.duration && isFinite(el.duration)) state.duration = el.duration;
    const pct = state.duration ? Math.min(100, (state.progress / state.duration) * 100) : 0;
    $("#progress").style.width = pct + "%";
    $("#time-cur").textContent = fmtTime(state.progress);
    $("#time-total").textContent = fmtTime(state.duration);
  }

  function onMediaEnded() {
    state.progress = 0;
    state.eternalIndex = (state.eternalIndex + 1) % Math.max(1, state.eternal.length);
    playCurrentItem(true);
    renderEternal();
  }

  async function playCurrentItem(autoplay) {
    stopAllMedia();
    const list = state.eternal.map((id) => findItem(id)).filter(Boolean);
    if (!list.length) {
      state.isPlaying = false;
      $("#btn-play").textContent = "▶";
      if (typeof stopListenersSimulation === "function") stopListenersSimulation();
      return;
    }
    const cur = list[state.eternalIndex % list.length];
    recordView(cur);
    $("#eternal-title").textContent = cur.name;
    const typeLabel = cur.type === "music" ? "Música" : (cur.type === "post" ? "Post" : cur.type);
    const viewsPart = " · 👁 " + fmtViews(cur.views || 0);
    $("#eternal-meta").textContent = (cur.fav ? "✦ Chama branca · " : "") + typeLabel + viewsPart + " · Now flowing through the temple";
    showEternalPost(cur);

    // Default duration for non-media (posts use post-duration setting)
    const postDur = parseInt(($("#post-duration") || {}).value) || 25;
    state.duration = cur.type === "music" ? (cur.duration || 180) : (cur.duration || postDur);
    state.progress = 0;
    $("#time-cur").textContent = "0:00";
    $("#time-total").textContent = fmtTime(state.duration);
    $("#progress").style.width = "0%";

    let mediaElement = null;

    // Music with real audio
    if (cur.type === "music" && cur.hasAudio) {
      try {
        const blob = await idbGet(cur.id);
        if (blob) {
          currentObjectUrl = URL.createObjectURL(blob);
          const a = audioEl();
          a.src = currentObjectUrl;
          a.onended = onMediaEnded;
          a.ontimeupdate = () => syncProgressFromMedia(a);
          a.onloadedmetadata = () => {
            state.duration = a.duration || cur.duration || 180;
            $("#time-total").textContent = fmtTime(state.duration);
          };
          mediaElement = a;
          if (flameBox()) flameBox().style.display = "";
        }
      } catch (e) { console.warn(e); }
    }

    // Video post with audio — full card already visible via showEternalPost
    if ((cur.type === "post" || cur.type === "tiktok") && cur.mediaKind === "video" && cur.hasMedia) {
      try {
        const blob = await idbGet(cur.id);
        if (blob) {
          currentObjectUrl = URL.createObjectURL(blob);
          const v = videoEl();
          v.src = currentObjectUrl;
          v.muted = false;
          v.volume = 1;
          v.hidden = false;
          if (mediaBox()) mediaBox().classList.remove("hidden");
          if (postCardBox()) postCardBox().classList.remove("hidden");
          if (flameBox()) flameBox().style.display = "none";
          if (imageEl()) imageEl().hidden = true;
          v.onended = onMediaEnded;
          v.ontimeupdate = () => syncProgressFromMedia(v);
          v.onloadedmetadata = () => {
            state.duration = v.duration || cur.duration || 30;
            $("#time-total").textContent = fmtTime(state.duration);
          };
          mediaElement = v;
        }
      } catch (e) { console.warn(e); }
    }

    // Image post — already shown in card; keep visible for duration timer
    if (cur.type === "post" && cur.mediaKind === "image" && cur.mediaUrl) {
      const img = imageEl();
      if (img) {
        img.src = cur.mediaUrl;
        img.hidden = false;
        if (mediaBox()) mediaBox().classList.remove("hidden");
        if (postCardBox()) postCardBox().classList.remove("hidden");
        if (flameBox()) flameBox().style.display = "none";
        if (videoEl()) videoEl().hidden = true;
      }
    }

    // X / text posts — card with full text already visible; flame stays if no media
    if ((cur.type === "post" || cur.type === "x") && !cur.mediaKind) {
      if (postCardBox()) postCardBox().classList.remove("hidden");
      if (flameBox()) flameBox().style.display = "none";
    }

    // Fallback timer for items without real media (sample tracks, text posts)
    if (!mediaElement) {
      if (autoplay || state.isPlaying) {
        clearInterval(progressTimer);
        progressTimer = setInterval(() => {
          if (!state.isPlaying) return;
          state.progress += 0.25;
          const pct = Math.min(100, (state.progress / state.duration) * 100);
          $("#progress").style.width = pct + "%";
          $("#time-cur").textContent = fmtTime(state.progress);
          if (state.progress >= state.duration) onMediaEnded();
        }, 250);
      }
      return;
    }

    if (autoplay || state.isPlaying) {
      try {
        await mediaElement.play();
        state.isPlaying = true;
        $("#btn-play").textContent = "⏸";
      } catch (e) {
        console.warn("Autoplay blocked", e);
        toast("Toque em ▶ para ouvir (política do navegador)");
        state.isPlaying = false;
        $("#btn-play").textContent = "▶";
        if (typeof stopListenersSimulation === "function") stopListenersSimulation();
      }
    }
  }

  // Keep updateNowPlaying as a light UI sync used by renderEternal
  const _updateNowPlayingOrig = typeof updateNowPlaying === "function" ? updateNowPlaying : null;

  $("#btn-play").onclick = async () => {
    if (!state.eternal.length) { toast("Adicione itens à Eternal Station primeiro"); return; }
    if (state.isPlaying) {
      state.isPlaying = false;
      $("#btn-play").textContent = "▶";
      const a = audioEl(); if (a) a.pause();
      const v = videoEl(); if (v) v.pause();
      clearInterval(progressTimer);
      stopListenersSimulation();
      toast("Pausado");
    } else {
      state.isPlaying = true;
      $("#btn-play").textContent = "⏸";
      await playCurrentItem(true);
      startListenersSimulation();
      toast("Reproduzindo com áudio…");
    }
  };
  $("#btn-prev").onclick = async () => {
    if (!state.eternal.length) return;
    state.eternalIndex = (state.eternalIndex - 1 + state.eternal.length) % state.eternal.length;
    state.progress = 0;
    await playCurrentItem(state.isPlaying);
    renderEternal();
  };
  $("#btn-next").onclick = async () => {
    if (!state.eternal.length) return;
    state.eternalIndex = (state.eternalIndex + 1) % state.eternal.length;
    state.progress = 0;
    await playCurrentItem(state.isPlaying);
    renderEternal();
  };

  const btnEternalFav = document.getElementById("btn-eternal-fav");
  if (btnEternalFav) {
    btnEternalFav.onclick = (e) => {
      e.stopPropagation();
      const id = btnEternalFav.dataset.id;
      const item = findItem(id);
      if (item) toggleWhiteFlame(item);
    };
  }
  const btnEternalQueue = document.getElementById("btn-eternal-queue");
  if (btnEternalQueue) {
    btnEternalQueue.onclick = (e) => {
      e.stopPropagation();
      const id = btnEternalQueue.dataset.id;
      const item = findItem(id);
      if (!item) return;
      if (!state.queue.includes(item.id)) state.queue.push(item.id);
      persistAll();
      toast("Adicionado à Soul Queue", 2200, "ok");
    };
  }

  $("#btn-clear-queue").onclick = () => {
    state.queue = [];
    persistAll();
    renderHome();
    toast("Soul Queue limpa");
  };

  // ---------- Live / Camera ----------
  function stopMedia() {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((t) => t.stop());
      state.cameraStream = null;
    }
    const video = $("#camera-preview");
    video.hidden = true;
    video.srcObject = null;
    $("#preview-ph").style.display = "";
  }
  $("#btn-camera").onclick = async () => {
    try {
      stopMedia();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      state.cameraStream = stream;
      const video = $("#camera-preview");
      video.srcObject = stream;
      video.hidden = false;
      $("#preview-ph").style.display = "none";
      toast("Câmera ativada");
    } catch { toast("Permissão de câmera negada"); }
  };
  $("#btn-screen").onclick = async () => {
    try {
      if (!navigator.mediaDevices.getDisplayMedia) { toast("Não suportado neste navegador"); return; }
      stopMedia();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      state.cameraStream = stream;
      const video = $("#camera-preview");
      video.srcObject = stream;
      video.hidden = false;
      $("#preview-ph").style.display = "none";
      toast("Compartilhamento de tela ativo");
      stream.getVideoTracks()[0].onended = stopMedia;
    } catch { toast("Compartilhamento cancelado"); }
  };
  $("#btn-stop-media").onclick = () => { stopMedia(); toast("Mídia parada"); };

  function updateLiveListenersUI() {
    const countEl = document.getElementById("live-listeners-count");
    if (countEl) countEl.textContent = String(state.presence || 1);
    const box = document.getElementById("live-listeners");
    if (box) {
      box.classList.toggle("hidden", !state.isLive);
      box.title = state.isLive
        ? (state.presence + " ouvindo ao vivo · pico " + state.livePeakPresence)
        : "Ouvintes da live";
    }
    // Keep topbar in sync
    const top = document.getElementById("presence");
    if (top) top.textContent = "✦ " + (state.presence || 1);
  }

  $("#btn-go-live").onclick = () => {
    if (state.isLive) {
      state.isLive = false;
      $("#btn-go-live").textContent = "Go Live";
      $("#live-badge").classList.add("hidden");
      $("#now-overlay").classList.add("hidden");
      updateLiveListenersUI();
      // save live record
      const durationSec = state.liveStart ? Math.floor((Date.now() - state.liveStart) / 1000) : 120;
      state.lives.unshift({
        title: "Live · " + new Date().toLocaleString("pt-BR"),
        date: new Date().toLocaleDateString("pt-BR"),
        duration: durationSec,
        peakViewers: state.livePeakPresence,
      });
      persistAll();
      addChat("system", "The transmission has ended. What was shared remains.");
      showPostLive(durationSec);
      state.liveStart = null;
      return;
    }
    if (!state.cameraStream) { toast("Ative a câmera ou a tela primeiro"); return; }
    state.isLive = true;
    state.liveStart = Date.now();
    // Seed live audience
    state.presence = Math.floor(Math.random() * 14) + 4;
    state.livePeakPresence = state.presence;
    $("#btn-go-live").textContent = "Encerrar Live";
    $("#live-badge").classList.remove("hidden");
    updateLiveListenersUI();
    if (state.queue.length) {
      const first = findItem(state.queue[0]);
      if (first) {
        $("#now-overlay-text").textContent = first.name;
        $("#now-overlay").classList.remove("hidden");
      }
    }
    addChat("system", "Live iniciada. The temple is listening…");
    toast("Você está ao vivo · " + state.presence + " ouvindo");
  };

  // ---------- Chat ----------
  function filterMsg(text) {
    const level = ($("#mod-level") && $("#mod-level").value) || state.moderation.level || "medium";
    let words = BAD_WORDS[level] || [];
    if (state.moderation.words) {
      words = words.concat(state.moderation.words.split(",").map(w => w.trim()).filter(Boolean));
    }
    let out = text;
    words.forEach((w) => {
      if (!w) return;
      const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      out = out.replace(re, "***");
    });
    // basic link/spam protection
    if (state.moderation.spam === "on" && /https?:\/\//i.test(out)) {
      out = out.replace(/https?:\/\/\S+/gi, "[link removido]");
    }
    return out;
  }
  function addChat(who, text) {
    const box = $("#chat-box");
    const div = document.createElement("div");
    div.className = "chat-msg" + (who === "system" ? " system" : "");
    if (who === "system") div.textContent = text;
    else div.innerHTML = `<span class="who">${escapeHtml(who)}</span>${escapeHtml(text)}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }
  $("#btn-chat-send").onclick = sendChat;
  $("#chat-input").addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });
  function sendChat() {
    const input = $("#chat-input");
    let text = input.value.trim();
    if (!text) return;
    text = filterMsg(text);
    addChat(state.profile.name || "Você", text);
    input.value = "";
  }
  $$(".react-btn").forEach((btn) => {
    if (btn.id === "btn-quiet-request" || btn.id === "btn-music-request") return;
    btn.onclick = () => {
      const labels = {
        revived: "👻 Estou revigorado",
        light: "✨ Quanta luz",
        remember: "🤩 Lembro quem sou eu",
        flame: "🔥 Nunca deixarei o impostor me derrotar",
        soul: "🥺 A alma sofre a inconsciência do corpo no qual está",
      };
      const msg = labels[btn.dataset.r] || "✦";
      addChat("system", msg);
      toast(msg);
    };
  });

  // ---------- Profile edit ----------
  $("#btn-edit-profile").onclick = () => {
    $("#edit-name").value = state.profile.name;
    $("#edit-bio").value = state.profile.bio || "";
    const color = state.profile.avatarColor || "#e8e0ff";
    $$(".avatar-color-btn").forEach((b) => {
      b.style.setProperty("--ac", b.dataset.color);
      b.classList.toggle("active", b.dataset.color === color);
    });
    $("#modal-profile").classList.remove("hidden");
  };
  $("#btn-cancel-profile").onclick = () => $("#modal-profile").classList.add("hidden");
  $$(".avatar-color-btn").forEach((b) => {
    b.style.setProperty("--ac", b.dataset.color);
    b.onclick = () => {
      $$(".avatar-color-btn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      state.profile.avatarColor = b.dataset.color;
    };
  });
  const photoInput = $("#edit-photo-input");
  if (photoInput) {
    photoInput.onchange = () => {
      const file = photoInput.files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) { toast("Imagem máx. 4 MB"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        state.profile.photo = reader.result;
        toast("Foto selecionada — salve o perfil");
      };
      reader.readAsDataURL(file);
    };
  }
  $("#btn-save-profile").onclick = () => {
    state.profile.name = $("#edit-name").value.trim() || state.profile.name;
    state.profile.bio = $("#edit-bio").value.trim() || state.profile.bio;
    persistAll();
    registerMyProfileQuiet();
    persistAll();
    claimOwnProfileUrl();
    $("#modal-profile").classList.add("hidden");
    renderProfile();
    toast("Perfil atualizado · link: ?u=" + getMyHandle(), 3000, "ok");
  };

  // ---------- Share profile ----------
  function openShareModal() {
    // Atualiza snapshot local e mostra link curto
    try {
      registerMyProfileQuiet();
      persistAll();
    } catch (_) {}
    const link = getProfileShareLink();
    $("#share-link-input").value = link;
    const hint = document.getElementById("share-link-hint");
    if (hint) hint.textContent = "Link curto: " + link;
    $("#modal-share").classList.remove("hidden");
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Link curto copiado", 2000, "ok");
      return true;
    } catch (_) {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      try { document.execCommand("copy"); toast("Link curto copiado", 2000, "ok"); return true; }
      catch (e) { toast("Não foi possível copiar"); return false; }
      finally { document.body.removeChild(input); }
    }
  }

  const btnShareProfile = $("#btn-share-profile");
  if (btnShareProfile) btnShareProfile.onclick = openShareModal;
  const btnCopyProfileLink = $("#btn-copy-profile-link");
  if (btnCopyProfileLink) btnCopyProfileLink.onclick = () => copyText(getProfileShareLink());
  const btnCloseShare = $("#btn-close-share");
  if (btnCloseShare) btnCloseShare.onclick = () => $("#modal-share").classList.add("hidden");
  const btnCopyShare = $("#btn-copy-share-link");
  if (btnCopyShare) btnCopyShare.onclick = () => copyText(getProfileShareLink());

  const btnNativeShare = $("#btn-native-share");
  if (btnNativeShare) {
    btnNativeShare.onclick = async () => {
      const link = getProfileShareLink();
      const text = "Conheça meu perfil no Sacred Temple — " + getProfileHandle();
      if (navigator.share) {
        try {
          await navigator.share({ title: "Sacred Temple", text, url: link });
          toast("Compartilhado");
        } catch (e) {
          if (e.name !== "AbortError") copyText(link);
        }
      } else {
        copyText(link);
      }
    };
  }

  const btnShareX = $("#btn-share-x");
  if (btnShareX) {
    btnShareX.onclick = () => {
      const link = getProfileShareLink();
      const text = encodeURIComponent("Conheça meu perfil no Sacred Temple — " + getProfileHandle() + "\n" + link);
      window.open("https://twitter.com/intent/tweet?text=" + text, "_blank", "noopener");
    };
  }

  const btnShareWa = $("#btn-share-whatsapp");
  if (btnShareWa) {
    btnShareWa.onclick = () => {
      const link = getProfileShareLink();
      const text = encodeURIComponent("Conheça meu perfil no Sacred Temple — " + getProfileHandle() + "\n" + link);
      window.open("https://wa.me/?text=" + text, "_blank", "noopener");
    };
  }

  // ---------- Public profile from shared link ----------
  function renderPublicTempleContent(data) {
    const name = data.n || "Criador";
    const label = $("#public-temple-label");
    if (label) label.textContent = "Templo Sagrado de " + name;

    const postsTitle = $("#public-posts-title");
    if (postsTitle) postsTitle.textContent = "Posts de " + name;

    const musicTitle = $("#public-music-title");
    if (musicTitle) musicTitle.textContent = "Músicas de " + name;

    const posts = Array.isArray(data.posts) ? data.posts : [];
    const music = Array.isArray(data.music) ? data.music : [];
    const canDl = state.downloads && state.downloads.viewers !== "no";

    const pl = $("#public-posts-list");
    const pe = $("#public-posts-empty");
    if (pl) {
      if (posts.length) {
        pl.innerHTML = posts.map((p, idx) => {
          const kind = p.k === "image" ? "📷" : p.k === "video" ? "🎬" : "✎";
          const pin = p.pin ? " 📌" : "";
          const full = escapeHtml(p.t || "Post");
          const linked = linkifyHtml(full);
          const views = p.v ? "👁 " + fmtViews(p.v) : "";
          const img = p.img
            ? `<div class="post-card-media"><img class="zoomable" data-lightbox="image" data-src="${p.img}" src="${p.img}" alt="" /></div>`
            : "";
          const vid = (p.vid || (p.k === "video" && p.img))
            ? `<div class="post-card-media"><video class="zoomable" data-lightbox="video" data-src="${escapeHtml(p.vid || p.img)}" src="${escapeHtml(p.vid || p.img)}" controls playsinline preload="metadata"></video></div>`
            : "";
          const link = p.link
            ? `<p class="post-external-link"><a class="ext-link" href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer">🔗 ${escapeHtml(p.link)}</a></p>`
            : "";
          const reactions = POST_REACTIONS.map((r) => {
            const c = (p.reactions && p.reactions[r.key]) || 0;
            return `<button type="button" class="post-react-btn" data-guest-react="${r.key}" data-guest-post="${idx}" title="${r.title}">${r.emoji}<span class="react-count">${c || ""}</span></button>`;
          }).join("");
          const dl = canDl
            ? `<button type="button" class="btn-small" data-guest-dl-post="${idx}">Download texto</button>`
            : "";
          const tr = `<button type="button" class="btn-small" data-guest-translate="${idx}">文A Traduzir</button>`;
          return `<article class="post-card guest-post-card">
            <div class="post-card-header">
              <div class="post-card-meta">
                <span class="post-card-badge">${kind} Post${pin}</span>
                <span class="post-card-views">${views}</span>
              </div>
            </div>
            <p class="post-card-text">${linked}</p>
            ${link}${img}${vid}
            <div class="post-reactions">${reactions}</div>
            <div class="post-card-actions">${tr}${dl}</div>
            <div class="post-translation hidden" data-guest-translation="${idx}"></div>
          </article>`;
        }).join("");
        if (pe) pe.style.display = "none";
        // bind guest reactions / download / lightbox
        pl.querySelectorAll("[data-guest-react]").forEach((btn) => {
          btn.onclick = () => {
            const i = parseInt(btn.dataset.guestPost, 10);
            const key = btn.dataset.guestReact;
            if (!data.posts[i].reactions) data.posts[i].reactions = {};
            data.posts[i].reactions[key] = (data.posts[i].reactions[key] || 0) + 1;
            const countEl = btn.querySelector(".react-count");
            if (countEl) countEl.textContent = data.posts[i].reactions[key];
            btn.classList.add("active");
            const meta = POST_REACTIONS.find((r) => r.key === key);
            toast((meta && meta.emoji) + " " + (meta && meta.title));
          };
        });
        pl.querySelectorAll("[data-guest-dl-post]").forEach((btn) => {
          btn.onclick = () => {
            const i = parseInt(btn.dataset.guestDlPost, 10);
            const text = data.posts[i].t || "";
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "post-" + (i + 1) + ".txt";
            a.click();
            URL.revokeObjectURL(url);
            toast("Download iniciado");
          };
        });
        pl.querySelectorAll("[data-guest-translate]").forEach((btn) => {
          btn.onclick = () => {
            const i = parseInt(btn.dataset.guestTranslate, 10);
            const text = (data.posts[i] && data.posts[i].t) || "";
            openTranslateModal(text, {
              onResult: (translated) => {
                const box = pl.querySelector('[data-guest-translation="' + i + '"]');
                if (box) {
                  box.textContent = translated;
                  box.classList.remove("hidden");
                }
              },
            });
          };
        });
        pl.querySelectorAll("[data-lightbox]").forEach((el) => {
          el.onclick = (e) => { e.preventDefault(); openLightbox(el); };
        });
      } else {
        pl.innerHTML = "";
        if (pe) pe.style.display = "";
      }
    }

    const ml = $("#public-music-list");
    const me = $("#public-music-empty");
    if (ml) {
      if (music.length) {
        ml.innerHTML = music.map((m, idx) => {
          const flame = m.fav ? "✦ " : "";
          return `<div class="item">
            <div class="item-flame" style="opacity:${m.fav ? 1 : 0.25}"><div class="white-flame" style="animation:none"></div></div>
            <div class="item-info">
              <div class="item-title">${flame}${escapeHtml(m.n || "Música")}</div>
              <div class="item-sub">${fmtTime(m.d || 0)}${m.v ? " · 👁 " + fmtViews(m.v) : ""}</div>
            </div>
            <button type="button" class="btn-small gold" data-guest-play-music="${idx}">▶</button>
          </div>`;
        }).join("");
        if (me) me.style.display = "none";
        ml.querySelectorAll("[data-guest-play-music]").forEach((btn) => {
          btn.onclick = async () => {
            const i = parseInt(btn.dataset.guestPlayMusic, 10);
            const m = music[i];
            if (!m) return;
            const audio = $("#audio-player");
            try {
              if (m.id) {
                const blob = await idbGet(m.id);
                if (blob) {
                  audio.src = URL.createObjectURL(blob);
                  await audio.play();
                  toast("▶ " + (m.n || "Música"), 2000, "ok");
                  return;
                }
              }
              if (m.url || m.src) {
                audio.src = m.url || m.src;
                await audio.play();
                toast("▶ " + (m.n || "Música"), 2000, "ok");
                return;
              }
            } catch (e) {
              console.warn(e);
            }
            toast("Áudio indisponível neste dispositivo — peça o link atualizado do criador", 3200, "err");
          };
        });
      } else {
        ml.innerHTML = "";
        if (me) me.style.display = "";
      }
    }
  }

  function tryOpenPublicProfile() {
    const hash = location.hash || "";
    if (!hash.startsWith("#p/")) return false;
    try {
      let b64 = hash.slice(3).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const json = decodeURIComponent(escape(atob(b64)));
      const data = JSON.parse(json);
      const displayName = data.n || "Criador";
      $("#public-name").textContent = displayName;
      $("#public-handle").textContent = "@" + (data.h || slugify(data.n));
      $("#public-bio").textContent = data.b || "A place to share what the soul is saying";
      const spirit = $("#public-spirit");
      if (spirit) {
        spirit.innerHTML = SPIRIT_SVG.replace(/%ID%/g, "pub");
        spirit.style.display = "";
        if (data.c) {
          spirit.querySelectorAll("stop").forEach((stop, i) => {
            if (i === 0) stop.setAttribute("stop-color", "#fff");
            else stop.setAttribute("stop-color", data.c);
          });
        }
      }
      const photo = $("#public-photo");
      const pic = data.p || data.gp || "";
      if (photo) {
        if (pic) {
          photo.src = pic;
          photo.hidden = false;
          if (spirit) spirit.style.display = "none";
        } else {
          photo.hidden = true;
          photo.removeAttribute("src");
        }
      }
      const visitId = (data.h || slugify(data.n || "user")).toLowerCase();
      state._publicProfileVisit = {
        id: visitId,
        name: displayName,
        data,
      };
      // Stats no cartão do perfil público
      const st = data.stats || {};
      const postsN = st.posts != null ? st.posts : (Array.isArray(data.posts) ? data.posts.length : 0);
      const musicN = st.music != null ? st.music : (Array.isArray(data.music) ? data.music.length : 0);
      const viewsN = st.views != null ? st.views : 0;
      const elPosts = document.getElementById("public-stat-posts");
      const elMusic = document.getElementById("public-stat-music");
      const elViews = document.getElementById("public-stat-views");
      if (elPosts) elPosts.textContent = String(postsN);
      if (elMusic) elMusic.textContent = String(musicN);
      if (elViews) elViews.textContent = fmtViews(viewsN);
      // Preview dos últimos posts no cartão
      const preview = document.getElementById("public-posts-preview");
      if (preview) {
        const list = Array.isArray(data.posts) ? data.posts.slice(0, 3) : [];
        if (list.length) {
          preview.innerHTML = list.map((p) => {
            const kind = p.k === "image" ? "📷" : p.k === "video" ? "🎬" : "✎";
            const txt = escapeHtml((p.t || "Post").slice(0, 120));
            return `<div class="public-preview-item"><span class="public-preview-kind">${kind}</span><span class="public-preview-text">${txt}${(p.t || "").length > 120 ? "…" : ""}</span></div>`;
          }).join("");
          preview.classList.remove("hidden");
        } else {
          preview.innerHTML = "";
          preview.classList.add("hidden");
        }
      }
      upsertProfileEntry({
        id: visitId,
        name: displayName,
        bio: data.b || "",
        handle: "@" + visitId,
        color: data.c || "#e8e0ff",
        photo: data.p || data.gp || "",
        source: "link",
        snapshot: data,
      });
      const apoioBtn = $("#btn-public-apoiar");
      if (apoioBtn) {
        const already = (state.apoio.apoiando || []).some((x) => x.id === visitId);
        apoioBtn.textContent = already ? "Apoiando ✓" : "Apoiar";
        apoioBtn.classList.toggle("btn-gold", !already);
        apoioBtn.classList.toggle("btn-outline", already);
      }
      renderPublicTempleContent(data);
      // Ir DIRETO ao perfil — sem splash / onboarding
      document.documentElement.classList.add("deep-link-profile");
      showScreen("public-profile");
      ["splash", "onboarding", "app"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("active");
      });
      const pub = document.getElementById("public-profile");
      if (pub) pub.classList.add("active");
      // Começa no modo perfil; "Entrar no templo" abre o templo da pessoa
      showPublicProfileMode();
      try { refreshOwnTempleButtons(); } catch (_) {}
      document.title = displayName + " · Sacred Temple";
      return true;
    } catch (e) {
      console.warn("Invalid profile link", e);
      document.documentElement.classList.remove("deep-link-profile");
      return false;
    }
  }

  /** Modo perfil público (cartão) */
  function showPublicProfileMode() {
    const profileMode = $("#public-mode-profile");
    const templeMode = $("#public-mode-temple");
    if (profileMode) profileMode.classList.remove("hidden");
    if (templeMode) templeMode.classList.add("hidden");
    document.body.classList.remove("in-guest-temple");
    const scroll = $("#public-profile-scroll");
    if (scroll) scroll.scrollTop = 0;
    const name = (state._publicProfileVisit && state._publicProfileVisit.name) || "Criador";
    document.title = name + " · Sacred Temple";
  }

  function isGuestTemplePublic(data) {
    // Apoiar ou não NÃO bloqueia visualização. Só perfil marcado "private" trava o templo.
    const priv = (data && data.priv) || {};
    if (!data || !data.priv) return true;
    return priv.profile !== "private";
  }

  function setGuestTempleTab(tab) {
    $$(".temple-guest-tab").forEach((b) => b.classList.toggle("active", b.dataset.guestTab === tab));
    $$("#temple-guest-bottom .nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.guestTab === tab));
    $$(".temple-guest-panel").forEach((p) => {
      p.classList.toggle("active", p.id === "guest-tab-" + tab);
    });
    const body = $("#temple-guest-body");
    if (body) body.scrollTop = 0;
  }

  function renderGuestTempleFull(data) {
    const name = data.n || "Criador";
    renderPublicTempleContent(data);

    // Home highlights
    const highlights = $("#guest-home-highlights");
    const homeEmpty = $("#guest-home-empty");
    const welcome = $("#guest-home-welcome");
    const homeSub = $("#guest-home-sub");
    if (welcome) welcome.textContent = "Templo de " + name;
    if (homeSub) homeSub.textContent = data.b || "A place to share what the soul is saying";

    const posts = Array.isArray(data.posts) ? data.posts : [];
    const music = Array.isArray(data.music) ? data.music : [];
    const pinned = posts.filter((p) => p.pin).slice(0, 3);
    const favMusic = music.filter((m) => m.fav).slice(0, 3);
    const bits = [];
    pinned.forEach((p) => {
      bits.push(`<div class="item"><div class="item-thumb-placeholder">📌</div><div class="item-info"><div class="item-title">${escapeHtml((p.t || "").slice(0, 80))}</div><div class="item-sub">Post fixado</div></div></div>`);
    });
    favMusic.forEach((m) => {
      bits.push(`<div class="item"><div class="item-flame"><div class="white-flame" style="animation:none"></div></div><div class="item-info"><div class="item-title">✦ ${escapeHtml(m.n || "")}</div><div class="item-sub">Chama branca · ${fmtTime(m.d || 0)}</div></div></div>`);
    });
    if (!bits.length && posts[0]) {
      bits.push(`<div class="item"><div class="item-thumb-placeholder">✎</div><div class="item-info"><div class="item-title">${escapeHtml((posts[0].t || "").slice(0, 80))}</div><div class="item-sub">Post recente</div></div></div>`);
    }
    if (highlights) {
      highlights.innerHTML = bits.join("");
      if (homeEmpty) homeEmpty.style.display = bits.length ? "none" : "";
    }

    // Station + player
    const station = Array.isArray(data.station) ? data.station : [];
    const eternalOk = !data.priv || data.priv.eternal === "public";
    const stList = $("#guest-station-list");
    const stEmpty = $("#guest-station-empty");
    const stStatus = $("#guest-station-status");
    state._guestStation = eternalOk ? station.slice() : [];
    state._guestStationIndex = 0;
    if (stStatus) {
      stStatus.textContent = eternalOk
        ? (station.length ? station.length + " item(ns) · toque ▶ para ouvir/ver a estação" : "Station pública — fila vazia neste link")
        : "Eternal Station privada";
    }
    if (stList) {
      if (eternalOk && station.length) {
        stList.innerHTML =
          `<div class="guest-station-player">
            <p class="now-label">Now flowing through the temple</p>
            <h3 id="guest-station-now-title">${escapeHtml(station[0].n || "—")}</h3>
            <p class="muted" id="guest-station-now-meta">${escapeHtml(station[0].ty || "")}</p>
            <div class="player-controls" style="justify-content:center;margin:0.8rem 0">
              <button type="button" class="ctrl-btn" id="guest-station-prev">⏮</button>
              <button type="button" class="ctrl-btn play" id="guest-station-play">▶</button>
              <button type="button" class="ctrl-btn" id="guest-station-next">⏭</button>
            </div>
            <div id="guest-station-post-body" class="post-card-text" style="text-align:left;max-height:200px;overflow:auto"></div>
          </div>` +
          station.map((s, idx) =>
            `<div class="item" data-guest-station-idx="${idx}">
              <div class="item-info">
                <div class="item-title">${escapeHtml(s.n || "—")}</div>
                <div class="item-sub">${escapeHtml(s.ty || "item")}${s.d ? " · " + fmtTime(s.d) : ""}</div>
              </div>
              <button type="button" class="btn-small" data-guest-station-play="${idx}">▶</button>
            </div>`
          ).join("");
        if (stEmpty) stEmpty.style.display = "none";
        bindGuestStationControls(data);
      } else {
        stList.innerHTML = "";
        if (stEmpty) stEmpty.style.display = "";
      }
    }

    // About
    const aboutBio = $("#guest-about-bio");
    if (aboutBio) aboutBio.textContent = data.b || "Sem bio.";
    const aboutStats = $("#guest-about-stats");
    const st = data.stats || {};
    if (aboutStats) {
      aboutStats.innerHTML = [
        ["Posts", st.posts != null ? st.posts : posts.length],
        ["Músicas", st.music != null ? st.music : music.length],
        ["Views", st.views != null ? st.views : "—"],
      ].map(([k, v]) => `<div class="stat-cell"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(k)}</span></div>`).join("");
    }
  }

  function bindGuestStationControls(data) {
    const list = state._guestStation || [];
    function showIdx(i) {
      if (!list.length) return;
      state._guestStationIndex = ((i % list.length) + list.length) % list.length;
      const cur = list[state._guestStationIndex];
      const title = $("#guest-station-now-title");
      const meta = $("#guest-station-now-meta");
      const body = $("#guest-station-post-body");
      if (title) title.textContent = cur.n || "—";
      if (meta) meta.textContent = (cur.ty || "") + (cur.d ? " · " + fmtTime(cur.d) : "");
      if (body) {
        body.innerHTML = cur.t ? linkifyHtml(escapeHtml(cur.t)) : "";
      }
    }
    async function playCurrent() {
      const cur = list[state._guestStationIndex];
      if (!cur) return;
      showIdx(state._guestStationIndex);
      if (cur.ty === "music" || cur.ty === "post") {
        try {
          if (cur.id) {
            const blob = await idbGet(cur.id);
            if (blob) {
              const audio = $("#audio-player");
              const url = URL.createObjectURL(blob);
              audio.src = url;
              audio.onended = () => {
                showIdx(state._guestStationIndex + 1);
                playCurrent();
              };
              await audio.play();
              toast("▶ Eternal Station · " + (cur.n || ""));
              return;
            }
          }
        } catch (_) {}
      }
      // Post de texto: mostra e avança após alguns segundos
      if (cur.t) {
        toast("Post na estação · " + (cur.n || "").slice(0, 40));
        clearTimeout(state._guestStationTimer);
        state._guestStationTimer = setTimeout(() => {
          showIdx(state._guestStationIndex + 1);
          playCurrent();
        }, Math.max(8, Math.min(40, (cur.t || "").length / 20)) * 1000);
        return;
      }
      toast("Item sem áudio local — reimporte mídia no templo do criador ou use servidor");
    }
    const playBtn = $("#guest-station-play");
    const prevBtn = $("#guest-station-prev");
    const nextBtn = $("#guest-station-next");
    if (playBtn) playBtn.onclick = () => playCurrent();
    if (prevBtn) prevBtn.onclick = () => { showIdx(state._guestStationIndex - 1); playCurrent(); };
    if (nextBtn) nextBtn.onclick = () => { showIdx(state._guestStationIndex + 1); playCurrent(); };
    document.querySelectorAll("[data-guest-station-play]").forEach((btn) => {
      btn.onclick = () => {
        showIdx(parseInt(btn.dataset.guestStationPlay, 10));
        playCurrent();
      };
    });
    showIdx(0);
  }

  /** Entra no Templo Sagrado da pessoa em tela cheia (abas públicas) */
  function enterPersonTemple() {
    const visit = state._publicProfileVisit;
    const data = (visit && visit.data) || {};
    const name = (visit && visit.name) || data.n || "alguém";
    const profileMode = $("#public-mode-profile");
    const templeMode = $("#public-mode-temple");
    if (profileMode) profileMode.classList.add("hidden");
    if (templeMode) templeMode.classList.remove("hidden");
    document.body.classList.add("in-guest-temple");

    const title = $("#temple-visit-title");
    const sub = $("#temple-visit-sub");
    if (title) title.textContent = "Templo de " + name;
    if (sub) sub.textContent = "@" + ((visit && visit.id) || data.h || "perfil");

    const locked = $("#temple-guest-locked");
    const open = $("#temple-guest-open");
    const bottom = $("#temple-guest-bottom");

    if (!isGuestTemplePublic(data)) {
      if (locked) locked.classList.remove("hidden");
      if (open) open.classList.add("hidden");
      if (bottom) bottom.classList.add("hidden");
      toast("Este templo está privado");
      return;
    }

    if (locked) locked.classList.add("hidden");
    if (open) open.classList.remove("hidden");
    if (bottom) bottom.classList.remove("hidden");

    renderGuestTempleFull(data);
    setGuestTempleTab("home");

    const scroll = $("#public-profile-scroll");
    if (scroll) scroll.scrollTop = 0;
    document.title = "Templo de " + name + " · Sacred Temple";
    toast("Você entrou no Templo Sagrado de " + name);
  }

  // Tabs do templo visitado
  function bindGuestTempleTabs() {
    document.querySelectorAll("[data-guest-tab]").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const tab = btn.dataset.guestTab;
        if (tab) setGuestTempleTab(tab);
      };
    });
  }
  bindGuestTempleTabs();

  const btnEnterTemple = $("#btn-enter-temple");
  if (btnEnterTemple) {
    btnEnterTemple.onclick = (e) => {
      e.preventDefault();
      enterPersonTemple();
    };
  }
  const btnBackPublicProfile = $("#btn-back-public-profile");
  if (btnBackPublicProfile) {
    btnBackPublicProfile.onclick = () => {
      showPublicProfileMode();
      toast("Voltou ao perfil");
    };
  }
  const btnLockedBack = $("#btn-locked-back-profile");
  if (btnLockedBack) btnLockedBack.onclick = () => showPublicProfileMode();
  const btnGuestCreate = $("#btn-guest-create-mine");
  if (btnGuestCreate) btnGuestCreate.onclick = () => openOwnTempleCreation();
  const btnGuestApoiar = $("#btn-guest-apoiar-again");
  if (btnGuestApoiar) {
    btnGuestApoiar.onclick = () => {
      const b = $("#btn-public-apoiar");
      if (b) b.click();
    };
  }

  /**
   * “Criar meu templo” / “◀️ Meu templo sagrado”:
   * se já tiver perfil neste aparelho → volta ao próprio Templo Sagrado;
   * senão → onboarding para criar perfil + templo limpo.
   */
  function openOwnTempleCreation() {
    // Sai do link da outra pessoa (não herdar ?u=Guider etc.)
    document.documentElement.classList.remove("deep-link-profile");
    document.body.classList.remove("in-guest-temple");
    state._publicProfileVisit = null;
    clearVisitorUrl();
    const pub = document.getElementById("public-profile");
    if (pub) pub.classList.remove("active");
    // Restaura modos do perfil público
    const profileMode = $("#public-mode-profile");
    const templeMode = $("#public-mode-temple");
    if (profileMode) profileMode.classList.remove("hidden");
    if (templeMode) templeMode.classList.add("hidden");

    if (state.onboarded && state.profile && state.profile.name) {
      // Já tem templo neste dispositivo → retorna ao próprio
      document.title = "Sacred Temple — " + state.profile.name;
      showScreen("app");
      showView("home");
      renderProfile();
      toast("◀️ De volta ao seu Templo Sagrado — " + state.profile.name, 2500, "ok");
      return;
    }

    // Fluxo de criação: onboarding — garante templo limpo desde o início
    document.title = "Sacred Temple — Crie o seu templo";
    resetTempleContent();
    state.profile = {
      name: "",
      bio: "",
      avatarColor: "#e8e0ff",
      photo: null,
    };
    persistAll();
    showScreen("onboarding");
    setObStep(1);
    toast("Crie seu perfil — o templo começa vazio para você preencher", 3000, "ok");
  }

  const btnOpenOwnApp = $("#btn-open-own-app");
  if (btnOpenOwnApp) btnOpenOwnApp.onclick = openOwnTempleCreation;
  const btnOpenOwnFromTemple = $("#btn-open-own-app-from-temple");
  if (btnOpenOwnFromTemple) btnOpenOwnFromTemple.onclick = openOwnTempleCreation;

  const btnPublicShare = $("#btn-public-share");
  if (btnPublicShare) {
    btnPublicShare.onclick = async () => {
      const visit = state._publicProfileVisit;
      const name = (visit && visit.name) || "Criador";
      const handle = (visit && visit.id) || "perfil";
      const link = location.origin + location.pathname + "?u=" + encodeURIComponent(handle);
      const text = "Conheça o Templo Sagrado de " + name + " no Sacred Temple";
      if (navigator.share) {
        try {
          await navigator.share({ title: name + " · Sacred Temple", text, url: link });
          toast("Compartilhado", 2000, "ok");
        } catch (e) {
          if (e.name !== "AbortError") {
            try {
              await navigator.clipboard.writeText(link);
              toast("Link copiado", 2000, "ok");
            } catch (_) {
              toast(link, 4000);
            }
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(link);
          toast("Link copiado", 2000, "ok");
        } catch (_) {
          toast(link, 4000);
        }
      }
    };
  }

  const btnPublicApoiar = $("#btn-public-apoiar");
  if (btnPublicApoiar) {
    btnPublicApoiar.onclick = () => {
      const visit = state._publicProfileVisit;
      if (!visit) return;
      if (!state.apoio.apoiando) state.apoio.apoiando = [];
      const idx = state.apoio.apoiando.findIndex((x) => x.id === visit.id);
      if (idx >= 0) {
        state.apoio.apoiando.splice(idx, 1);
        btnPublicApoiar.textContent = "Apoiar";
        btnPublicApoiar.classList.add("btn-gold");
        btnPublicApoiar.classList.remove("btn-outline");
        toast("Deixou de apoiar");
      } else {
        state.apoio.apoiando.push({ id: visit.id, name: visit.name });
        btnPublicApoiar.textContent = "Apoiando ✓";
        btnPublicApoiar.classList.remove("btn-gold");
        btnPublicApoiar.classList.add("btn-outline");
        toast("Agora você está apoiando " + visit.name);
      }
      persistAll();
      renderApoioCounts();
    };
  }


  // ---------- Google Sign-In ----------
  function parseJwt(token) {
    try {
      const base = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(atob(base).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
      return JSON.parse(json);
    } catch (_) { return null; }
  }

  function applyGoogleUser(payload) {
    const wasOnboarded = !!state.onboarded;
    const hadOwnContent =
      (state.posts && state.posts.length > 0) ||
      (state.music && state.music.length > 0) ||
      (state.xposts && state.xposts.length > 0) ||
      (state.tiktok && state.tiktok.length > 0);

    state.auth = {
      provider: "google",
      email: payload.email || "",
      name: payload.name || payload.given_name || "Usuário Google",
      picture: payload.picture || "",
      sub: payload.sub || "",
    };
    state.connected.google = true;

    // Primeira vez (visitante Google ou novo templo): começa completamente limpo
    if (!wasOnboarded || !hadOwnContent) {
      resetTempleContent();
      state.profile = {
        name: payload.name || payload.given_name || "Usuário Google",
        bio: "",
        avatarColor: state.profile.avatarColor || "#e8e0ff",
        photo: payload.picture || null,
      };
    } else {
      if (payload.name && !state.profile.name) state.profile.name = payload.name;
      if (payload.picture && !state.profile.photo) state.profile.photo = payload.picture;
    }

    state.onboarded = true;
    persistAll();
    if (typeof registerMyProfileQuiet === "function") {
      try { registerMyProfileQuiet(); persistAll(); } catch (_) {}
    }
    // Link próprio (não o de quem estava visitando)
    claimOwnProfileUrl();
    try { refreshSplashForUser(); refreshOwnTempleButtons(); } catch (_) {}
    renderProfile();
    if (!wasOnboarded || !hadOwnContent) {
      toast("Templo limpo · seu link: ?u=" + getMyHandle(), 3500, "ok");
    } else {
      toast("Bem-vindo de volta, " + state.auth.name, 2500, "ok");
    }
  }

  function demoGoogleLogin() {
    applyGoogleUser({
      name: "Visitante Google",
      email: "demo@sacred-temple.app",
      picture: "",
      sub: "demo-" + Date.now(),
    });
    try {
      document.documentElement.classList.remove("deep-link-profile");
      state._publicProfileVisit = null;
    } catch (_) {}
    showScreen("app");
    showView("home");
    claimOwnProfileUrl();
    renderProfile();
  }

  function handleGoogleCredential(response) {
    const payload = parseJwt(response.credential);
    if (!payload) { toast("Falha ao ler credencial Google", 2500, "err"); return; }
    const host = document.getElementById("gsi-btn-host");
    if (host) host.remove();
    // Sai do modo visitante / perfil de outra pessoa
    try {
      document.documentElement.classList.remove("deep-link-profile");
      state._publicProfileVisit = null;
      const pub = document.getElementById("public-profile");
      if (pub) pub.classList.remove("active");
      ["splash", "onboarding", "public-profile"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("active");
      });
    } catch (_) {}
    applyGoogleUser(payload);
    // Login direto: já entra no templo dela (sem onboarding longo)
    showScreen("app");
    showView("home");
    claimOwnProfileUrl();
    renderProfile();
  }

  function getGoogleClientId() {
    return (GOOGLE_CLIENT_ID || localStorage.getItem("st_google_client_id") || "").trim();
  }

  function setGoogleClientId(id) {
    GOOGLE_CLIENT_ID = (id || "").trim();
    if (GOOGLE_CLIENT_ID) localStorage.setItem("st_google_client_id", GOOGLE_CLIENT_ID);
    else localStorage.removeItem("st_google_client_id");
  }

  function initGoogleSignIn() {
    const cid = getGoogleClientId();
    if (!cid) return;
    if (!window.google || !google.accounts || !google.accounts.id) return;
    try {
      google.accounts.id.initialize({
        client_id: cid,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        ux_mode: "popup",
      });
    } catch (e) { console.warn("GSI init", e); }
  }

  function startGoogleLogin() {
    const cid = getGoogleClientId();
    if (!cid) {
      const want = confirm(
        "Login real no Google precisa de um Client ID OAuth (tipo Web) no Google Cloud Console.\n\n" +
        "Origens autorizadas: este domínio (ex. http://localhost:3000).\n\n" +
        "OK = colar Client ID agora\nCancelar = entrar em modo demo"
      );
      if (want) {
        const id = prompt("Cole o Client ID do Google (…apps.googleusercontent.com):", "");
        if (id && id.trim()) {
          setGoogleClientId(id.trim());
          toast("Client ID salvo. Iniciando login…");
          // wait for init then retry
          setTimeout(() => {
            initGoogleSignIn();
            startGoogleLogin();
          }, 300);
          return;
        }
      }
      demoGoogleLogin();
      return;
    }
    if (!window.google || !google.accounts || !google.accounts.id) {
      toast("SDK Google ainda carregando… tente de novo em 1s");
      setTimeout(() => {
        if (window.google && google.accounts) startGoogleLogin();
      }, 800);
      return;
    }
    try {
      initGoogleSignIn();
      // Overlay com botão oficial Google (login direto)
      const existing = document.getElementById("gsi-btn-host");
      if (existing) existing.remove();
      const parent = document.createElement("div");
      parent.id = "gsi-btn-host";
      parent.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(10,5,20,.78);backdrop-filter:blur(6px)";
      parent.innerHTML =
        '<div style="background:#1a0f2e;border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:1.4rem 1.2rem;text-align:center;max-width:340px;width:90%">' +
        '<p style="color:#C9A227;font-size:0.75rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:0.4rem">Sacred Temple</p>' +
        '<p style="color:#F8F4FF;margin-bottom:0.35rem;font-size:1.05rem;font-weight:600">Entrar com Google</p>' +
        '<p style="color:#D4C8E8;margin-bottom:1rem;font-size:0.82rem;line-height:1.4">Seu templo será criado com seu nome. Link: ?u=seunome</p>' +
        '<div id="gsi-btn-target" style="display:flex;justify-content:center"></div>' +
        '<button type="button" id="gsi-cancel" style="margin-top:1rem;background:transparent;border:1px solid rgba(255,255,255,.2);color:#D4C8E8;padding:0.45rem 1.1rem;border-radius:999px;cursor:pointer;font-size:0.85rem">Cancelar</button>' +
        '</div>';
      document.body.appendChild(parent);
      parent.querySelector("#gsi-cancel").onclick = () => parent.remove();
      parent.addEventListener("click", (e) => { if (e.target === parent) parent.remove(); });
      google.accounts.id.renderButton(parent.querySelector("#gsi-btn-target"), {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 280,
        logo_alignment: "left",
      });
      // One Tap em paralelo (quando o navegador permitir)
      try {
        google.accounts.id.prompt((notification) => {
          if (notification && typeof notification.isNotDisplayed === "function" && notification.isNotDisplayed()) {
            /* botão no overlay já está visível */
          }
        });
      } catch (_) {}
    } catch (e) {
      console.warn(e);
      toast("Erro no login Google: " + (e.message || "tente de novo"), 3000, "err");
    }
  }

  // Configurar Client ID manualmente
  const btnGoogleConfig = $("#btn-google-config");
  if (btnGoogleConfig) {
    btnGoogleConfig.onclick = () => {
      const current = getGoogleClientId();
      const id = prompt(
        "Client ID OAuth 2.0 (Web) do Google Cloud Console.\nDeixe vazio para remover.\n\nEx.: 123456789-abc.apps.googleusercontent.com",
        current || ""
      );
      if (id === null) return;
      setGoogleClientId(id.trim());
      initGoogleSignIn();
      const hint = $("#google-config-hint");
      if (hint) {
        hint.textContent = getGoogleClientId()
          ? "Client ID configurado ✓ — use Entrar com Google"
          : "Login real: configure o Client ID OAuth (Web) do Google Cloud.";
      }
      toast(getGoogleClientId() ? "Client ID salvo" : "Client ID removido (modo demo)");
    };
  }

  function googleLogout() {
    state.auth = null;
    state.connected.google = false;
    persistAll();
    renderProfile();
    if (window.google && google.accounts && google.accounts.id) {
      try { google.accounts.id.disableAutoSelect(); } catch (_) {}
    }
    toast("Saiu da conta Google");
  }

  ["btn-google-splash", "btn-google-ob"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.onclick = startGoogleLogin;
  });
  const btnGoogleStatus = $("#btn-google-status");
  if (btnGoogleStatus) {
    btnGoogleStatus.onclick = () => {
      if (state.connected.google) googleLogout();
      else startGoogleLogin();
    };
  }

  // Patch renderProfile for Google status + avatar
  const _renderProfile = renderProfile;
  renderProfile = function () {
    _renderProfile();
    const gBtn = $("#btn-google-status");
    if (gBtn) gBtn.textContent = state.connected.google ? "Conectado ✓" : "Entrar";
    // Avatar
    let avatar = document.getElementById("profile-avatar");
    const spirit = document.getElementById("profile-spirit");
    if (state.auth && state.auth.picture) {
      if (!avatar && spirit) {
        avatar = document.createElement("img");
        avatar.id = "profile-avatar";
        avatar.className = "profile-avatar";
        avatar.alt = "";
        spirit.parentNode.insertBefore(avatar, spirit);
        spirit.style.display = "none";
      }
      if (avatar) {
        avatar.src = state.auth.picture;
        avatar.style.display = "block";
        if (spirit) spirit.style.display = "none";
      }
    } else if (avatar) {
      avatar.style.display = "none";
      if (spirit) spirit.style.display = "";
    }
  };

  // Init GSI when SDK ready
  window.addEventListener("load", () => {
    setTimeout(initGoogleSignIn, 400);
  });


  // ---------- Notifications (PWA) ----------
  function notifPermissionLabel() {
    if (!("Notification" in window)) return "Não suportado neste navegador";
    const p = Notification.permission;
    if (p === "granted") return "Permitido ✓";
    if (p === "denied") return "Bloqueado — ative nas configurações do sistema/navegador";
    return "Ainda não pedido";
  }

  async function ensureNotificationPermission() {
    if (!("Notification" in window)) {
      toast("Notificações não suportadas neste navegador");
      return false;
    }
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") {
      toast("Permissão bloqueada. Ative nas configurações do dispositivo");
      return false;
    }
    const result = await Notification.requestPermission();
    state.notifications.permissionAsked = true;
    persistAll();
    return result === "granted";
  }

  async function showLocalNotification(title, body, tag) {
    if (state.notifications.posts !== "on" && tag === "new-post") return;
    if (state.notifications.lives !== "on" && tag === "live-start") return;
    if (state.notifications.eternal !== "on" && tag === "eternal") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const icon = state.profile.photo || "./icons/spirit-192.png";
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body,
          tag: tag || "sacred-temple",
          url: "./index.html",
          icon,
        });
      } else {
        new Notification(title, { body, icon, tag: tag || "sacred-temple" });
      }
    } catch (e) {
      try {
        new Notification(title, { body, icon, tag: tag || "sacred-temple" });
      } catch (err) {
        console.warn("notification failed", err);
      }
    }
  }

  function openNotifications() {
    const n = state.notifications;
    $("#notif-posts").value = n.posts || "on";
    $("#notif-eternal").value = n.eternal || "off";
    $("#notif-lives").value = n.lives || "on";
    const st = $("#notif-permission-status");
    if (st) st.textContent = "Status da permissão: " + notifPermissionLabel();
    $("#modal-notifications").classList.remove("hidden");
  }

  const btnCloseNotif = $("#btn-close-notif");
  if (btnCloseNotif) btnCloseNotif.onclick = () => $("#modal-notifications").classList.add("hidden");
  const btnSaveNotif = $("#btn-save-notif");
  if (btnSaveNotif) {
    btnSaveNotif.onclick = () => {
      state.notifications.posts = $("#notif-posts").value;
      state.notifications.eternal = $("#notif-eternal").value;
      state.notifications.lives = $("#notif-lives").value;
      markSettingSaved("#modal-notifications", "Notificações salvas");
      setTimeout(() => $("#modal-notifications").classList.add("hidden"), 500);
    };
  }
  ["notif-posts", "notif-eternal", "notif-lives"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => {
      const key = id.replace("notif-", "");
      state.notifications[key] = el.value;
      markSettingSaved("#modal-notifications",
        (key === "posts" ? "Posts" : key === "lives" ? "Lives" : "Eternal") +
        (el.value === "on" ? " ativado ✓" : " desativado"));
    });
  });
  const btnReqNotif = $("#btn-request-notif");
  if (btnReqNotif) {
    btnReqNotif.onclick = async () => {
      const ok = await ensureNotificationPermission();
      const st = $("#notif-permission-status");
      if (st) st.textContent = "Status da permissão: " + notifPermissionLabel();
      toast(ok ? "Notificações ativadas" : "Não foi possível ativar");
    };
  }
  const btnTestNotif = $("#btn-test-notif");
  if (btnTestNotif) {
    btnTestNotif.onclick = async () => {
      const ok = await ensureNotificationPermission();
      if (!ok) return;
      await showLocalNotification(
        "Sacred Temple",
        "As notificações estão funcionando. Você será avisado de novos posts.",
        "test-notif"
      );
      toast("Aviso de teste enviado");
    };
  }

  // Open Posts tab when notification is clicked
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const data = event.data || {};
      if (data.type === "NOTIFICATION_CLICK") {
        showScreen("app");
        showView("library");
        $$(".tab").forEach((t) => t.classList.remove("active"));
        const postsTab = document.querySelector('.tab[data-tab="posts"]');
        if (postsTab) postsTab.classList.add("active");
        $$(".tab-content").forEach((c) => c.classList.remove("active"));
        const postsContent = $("#tab-posts");
        if (postsContent) postsContent.classList.add("active");
      }
    });
  }

  // ---------- Settings menu ----------
  $$(".menu-item[data-action]").forEach((item) => {
    item.addEventListener("click", () => {
      const a = item.dataset.action;
      if (a === "install") installPWA();
      else if (a === "update-app") checkAppUpdate();
      else if (a === "copy-temple-link") copyOwnTempleLink();
      else if (a === "language") { showScreen("onboarding"); setObStep(1); }
      else if (a === "privacy") openPrivacy();
      else if (a === "moderation") openModeration();
      else if (a === "downloads") openDownloads();
      else if (a === "notifications") openNotifications();
      else if (a === "security") { $("#modal-security").classList.remove("hidden"); }
      else if (a === "terms") { $("#modal-terms").classList.remove("hidden"); }
      else if (a === "privacy-policy") { $("#modal-privacy-policy").classList.remove("hidden"); }
      else if (a === "stats") { openStats(); }
      else if (a === "accessibility") { openA11y(); }
      else if (a === "qr") { openProfileQR(); }
      else if (a === "export") {
        const data = {
          profile: state.profile, music: state.music, posts: state.posts,
          xposts: state.xposts, tiktok: state.tiktok, lives: state.lives,
          privacy: state.privacy, moderation: state.moderation,
          downloads: state.downloads, quietRequests: state.quietRequests,
          apoio: state.apoio, captions: state.captions,
          eternal: state.eternal, queue: state.queue, onboarded: state.onboarded
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = "sacred-temple-data.json"; link.click();
        URL.revokeObjectURL(url);
        toast("Dados exportados");
      } else if (a === "import") {
        openImportDataPicker();
      } else if (a === "reset") {
        if (confirm("Apagar todos os dados locais?")) {
          Object.keys(localStorage).filter(k => k.startsWith("st_")).forEach(k => localStorage.removeItem(k));
          location.reload();
        }
      }
    });
  });

  function applyImportedData(data) {
    if (!data || typeof data !== "object") return false;
    // Aceita export do Sacred Temple (profile, music, posts…)
    if (data.profile) state.profile = { ...state.profile, ...data.profile };
    if (Array.isArray(data.music)) state.music = data.music;
    if (Array.isArray(data.posts)) state.posts = data.posts;
    if (Array.isArray(data.xposts)) state.xposts = data.xposts;
    if (Array.isArray(data.tiktok)) state.tiktok = data.tiktok;
    if (Array.isArray(data.lives)) state.lives = data.lives;
    if (data.privacy) state.privacy = { ...state.privacy, ...data.privacy };
    if (data.moderation) state.moderation = { ...state.moderation, ...data.moderation };
    if (data.downloads) state.downloads = { ...state.downloads, ...data.downloads };
    if (data.apoio) state.apoio = data.apoio;
    if (data.captions) state.captions = data.captions;
    if (Array.isArray(data.eternal)) state.eternal = data.eternal;
    else {
      state.eternal = []
        .concat((state.music || []).map((m) => m.id))
        .concat((state.posts || []).map((p) => p.id));
    }
    if (Array.isArray(data.queue)) state.queue = data.queue;
    if (data.onboarded != null) state.onboarded = !!data.onboarded;
    else state.onboarded = true;
    persistAll();
    renderProfile();
    if (typeof registerMyProfileQuiet === "function") {
      try { registerMyProfileQuiet(); persistAll(); } catch (_) {}
    }
    if (state.currentView === "library") renderLibrary();
    if (state.currentView === "home") renderHome();
    if (state.currentView === "eternal") renderEternal();
    if (state.currentView === "people") renderPeopleSearch();
    return true;
  }

  function looksLikeTempleExport(obj) {
    return obj && typeof obj === "object" && (obj.profile || obj.music || obj.posts);
  }

  function openImportDataPicker() {
    const choice = confirm(
      "OK = escolher arquivo JSON exportado\nCancelar = escolher uma pasta (procura JSON dentro)"
    );
    if (choice) {
      const inp = $("#import-data-input");
      if (inp) inp.click();
    } else {
      const folder = $("#import-folder-input");
      if (folder) folder.click();
      else {
        const inp = $("#import-data-input");
        if (inp) inp.click();
      }
    }
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function importFromFileList(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) {
      toast("Nenhum arquivo selecionado");
      return;
    }
    // Prefer files named like sacred-temple-data*.json
    const sorted = files.slice().sort((a, b) => {
      const score = (f) => {
        const n = (f.name || "").toLowerCase();
        if (n.includes("sacred-temple-data")) return 0;
        if (n.endsWith(".json")) return 1;
        return 2;
      };
      return score(a) - score(b);
    });
    let lastErr = null;
    for (const file of sorted) {
      if (!/\.json$/i.test(file.name) && file.type && !file.type.includes("json")) continue;
      try {
        const text = await readFileAsText(file);
        const data = JSON.parse(text);
        if (!looksLikeTempleExport(data)) {
          lastErr = "JSON sem dados de perfil";
          continue;
        }
        applyImportedData(data);
        const who = (data.profile && data.profile.name) || "perfil";
        toast("Perfil restaurado: " + who);
        return;
      } catch (e) {
        lastErr = e.message || String(e);
      }
    }
    toast(lastErr ? ("Falha ao importar: " + lastErr) : "Nenhum JSON de perfil encontrado na pasta");
  }

  const importInput = $("#import-data-input");
  if (importInput) {
    importInput.onchange = () => {
      importFromFileList(importInput.files).finally(() => { importInput.value = ""; });
    };
  }
  const importFolder = $("#import-folder-input");
  if (importFolder) {
    importFolder.onchange = () => {
      importFromFileList(importFolder.files).finally(() => { importFolder.value = ""; });
    };
  }

  const btnCloseTerms = $("#btn-close-terms");
  if (btnCloseTerms) btnCloseTerms.onclick = () => $("#modal-terms").classList.add("hidden");
  const btnClosePP = $("#btn-close-privacy-policy");
  if (btnClosePP) btnClosePP.onclick = () => $("#modal-privacy-policy").classList.add("hidden");
  const btnCloseSec = $("#btn-close-security");
  if (btnCloseSec) btnCloseSec.onclick = () => $("#modal-security").classList.add("hidden");

  // ---------- Privacy / Moderation / Downloads ----------
  function openPrivacy() {
    const p = state.privacy;
    $("#priv-profile").value = p.profile;
    $("#priv-eternal").value = p.eternal;
    $("#priv-lives").value = p.lives;
    $("#priv-comment").value = p.comment;
    $("#priv-quiet").value = p.quiet;
    $("#priv-download").value = p.download;
    $("#modal-privacy").classList.remove("hidden");
  }
  $("#btn-close-privacy").onclick = () => $("#modal-privacy").classList.add("hidden");
  function markSettingSaved(modalId, msg) {
    persistAll();
    updateSettingsMenuBadges();
    const modal = $(modalId);
    if (modal) {
      let ok = modal.querySelector(".save-feedback");
      if (!ok) {
        ok = document.createElement("p");
        ok.className = "save-feedback";
        const actions = modal.querySelector(".modal-actions");
        if (actions) actions.parentNode.insertBefore(ok, actions);
        else modal.querySelector(".modal-card").appendChild(ok);
      }
      ok.textContent = "✓ " + (msg || "Salvo");
      ok.classList.add("visible");
      setTimeout(() => ok.classList.remove("visible"), 2200);
    }
    toast(msg || "Configuração salva");
  }

  // Auto-save on change for privacy selects
  ["priv-profile", "priv-eternal", "priv-lives", "priv-comment", "priv-quiet", "priv-download"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => {
      state.privacy[id.replace("priv-", "")] = el.value;
      // map keys: priv-profile -> profile, etc. already matches except structure
      state.privacy = {
        profile: ($("#priv-profile") || {}).value || state.privacy.profile,
        eternal: ($("#priv-eternal") || {}).value || state.privacy.eternal,
        lives: ($("#priv-lives") || {}).value || state.privacy.lives,
        comment: ($("#priv-comment") || {}).value || state.privacy.comment,
        quiet: ($("#priv-quiet") || {}).value || state.privacy.quiet,
        download: ($("#priv-download") || {}).value || state.privacy.download,
      };
      markSettingSaved("#modal-privacy", "Privacidade atualizada: " + el.value);
    });
  });

  $("#btn-save-privacy").onclick = () => {
    state.privacy = {
      profile: $("#priv-profile").value,
      eternal: $("#priv-eternal").value,
      lives: $("#priv-lives").value,
      comment: $("#priv-comment").value,
      quiet: $("#priv-quiet").value,
      download: $("#priv-download").value
    };
    markSettingSaved("#modal-privacy", "Privacidade salva");
    setTimeout(() => $("#modal-privacy").classList.add("hidden"), 500);
  };

  function openModeration() {
    const m = state.moderation;
    $("#mod-default").value = m.level;
    $("#mod-words").value = m.words || "";
    $("#mod-action").value = m.action;
    $("#mod-spam").value = m.spam;
    $("#modal-moderation").classList.remove("hidden");
  }
  $("#btn-close-mod").onclick = () => $("#modal-moderation").classList.add("hidden");
  $("#btn-save-mod").onclick = () => {
    state.moderation = {
      level: $("#mod-default").value,
      words: $("#mod-words").value.trim(),
      action: $("#mod-action").value,
      spam: $("#mod-spam").value
    };
    if ($("#mod-level")) $("#mod-level").value = state.moderation.level;
    markSettingSaved("#modal-moderation", "Moderação salva · " + state.moderation.level);
    setTimeout(() => $("#modal-moderation").classList.add("hidden"), 500);
  };
  ["mod-default", "mod-action", "mod-spam"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => {
      if (id === "mod-default") state.moderation.level = el.value;
      if (id === "mod-action") state.moderation.action = el.value;
      if (id === "mod-spam") state.moderation.spam = el.value;
      if ($("#mod-level") && id === "mod-default") $("#mod-level").value = el.value;
      markSettingSaved("#modal-moderation", "Moderação: " + el.value);
    });
  });

  function openDownloads() {
    const d = state.downloads;
    $("#dl-music").value = d.music;
    $("#dl-lives").value = d.lives;
    $("#dl-viewers").value = d.viewers;
    $("#modal-downloads").classList.remove("hidden");
  }
  $("#btn-close-dl").onclick = () => $("#modal-downloads").classList.add("hidden");
  $("#btn-save-dl").onclick = () => {
    state.downloads = {
      music: $("#dl-music").value,
      lives: $("#dl-lives").value,
      viewers: $("#dl-viewers").value
    };
    markSettingSaved("#modal-downloads", "Downloads salvos");
    setTimeout(() => $("#modal-downloads").classList.add("hidden"), 500);
  };
  ["dl-music", "dl-lives", "dl-viewers"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => {
      const key = id.replace("dl-", "");
      state.downloads[key] = el.value;
      markSettingSaved("#modal-downloads", "Download: " + key + " → " + el.value);
    });
  });

  // ---------- Quiet Request ----------
  const quietBtn = $("#btn-quiet-request");
  if (quietBtn) {
    quietBtn.onclick = () => {
      if (state.privacy.quiet === "none") { toast("Quiet Requests desativados"); return; }
      $("#quiet-text").value = "";
      $("#modal-quiet").classList.remove("hidden");
    };
  }
  $("#btn-close-quiet").onclick = () => $("#modal-quiet").classList.add("hidden");
  $("#btn-send-quiet").onclick = () => {
    const text = $("#quiet-text").value.trim();
    if (!text) return;
    state.quietRequests.push({ text, time: new Date().toISOString(), from: "Espectador" });
    persistAll();
    $("#modal-quiet").classList.add("hidden");
    addChat("system", "Quiet Request recebido (visível só para você)");
    toast("Quiet Request enviado");
  };

  // ---------- Post-Live Summary ----------
  function showPostLive(durationSec) {
    $("#pl-duration").textContent = fmtTime(durationSec);
    $("#pl-queue").textContent = state.queue.length;
    $("#pl-presence").textContent = state.livePeakPresence;
    $("#modal-postlive").classList.remove("hidden");
  }
  $("#btn-pl-close").onclick = () => $("#modal-postlive").classList.add("hidden");
  $("#btn-pl-eternal").onclick = () => {
    state.queue.forEach((id) => {
      if (!state.eternal.includes(id)) state.eternal.push(id);
    });
    persistAll();
    $("#modal-postlive").classList.add("hidden");
    toast("Entrou no fluxo eterno", 2200, "ok");
  };


  // ---------- PWA ----------
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); state.deferredPrompt = e; });
  function installPWA() {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      state.deferredPrompt.userChoice.then((r) => {
        if (r.outcome === "accepted") toast("App instalado!", 2500, "ok");
        state.deferredPrompt = null;
      });
    } else {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      if (standalone) toast("App já está instalado neste aparelho", 2500, "ok");
      else toast(ios ? "iOS: Compartilhar → Adicionar à Tela de Início" : "Menu do navegador → Instalar aplicativo");
    }
  }

  /** Força atualização do Service Worker (grátis — só cache local) */
  async function checkAppUpdate() {
    if (!("serviceWorker" in navigator)) {
      toast("Service Worker indisponível neste navegador", 2500, "err");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        toast("Atualização pronta — recarregando…", 2000, "ok");
        setTimeout(() => location.reload(), 800);
        return;
      }
      if (reg.installing) {
        toast("Baixando atualização…", 2500, "info");
        reg.installing.addEventListener("statechange", () => {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
            setTimeout(() => location.reload(), 600);
          }
        });
        return;
      }
      toast("App já está na versão mais recente (v" + APP_VERSION + ")", 2800, "ok");
    } catch (e) {
      toast("Falha ao verificar atualização: " + (e.message || e), 3000, "err");
    }
  }

  /** Copia o link do próprio templo (Web Share API / clipboard — grátis) */
  async function copyOwnTempleLink() {
    if (!state.onboarded || !state.profile || !state.profile.name) {
      toast("Crie seu templo primeiro", 2500, "err");
      return;
    }
    const link = typeof getProfileShareLink === "function" ? getProfileShareLink() : (getAppBaseUrl() + "?u=" + encodeURIComponent(slugify(state.profile.name)));
    try {
      if (navigator.share) {
        await navigator.share({ title: state.profile.name + " · Sacred Temple", text: "Conheça meu Templo Sagrado", url: link });
        toast("Compartilhado", 2000, "ok");
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copiado: ?u=" + slugify(state.profile.name), 2800, "ok");
    } catch (_) {
      prompt("Copie o link do seu templo:", link);
    }
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      // Nova versão em segundo plano
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            toast("Nova versão disponível · Perfil → Atualizar app", 4000, "info");
          }
        });
      });
    }).catch(() => {});
    // Controlo de abas: quando o SW assume, recarrega uma vez
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      // não recarrega automaticamente para não interromper compose; só se user pediu update
    });
  }

  /** Atalhos de manifesto (?go=home|compose|eternal) e share_target — 100% grátis */
  function handleLaunchParams() {
    try {
      const params = new URLSearchParams(location.search || "");
      const go = (params.get("go") || "").toLowerCase();
      const shareText = params.get("share_text") || params.get("share_title") || "";
      const shareUrl = params.get("share_url") || "";

      if (shareText || shareUrl) {
        const combined = [shareText, shareUrl].filter(Boolean).join("\n\n").trim();
        if (combined) {
          state.draft = { text: combined.slice(0, 4000), link: shareUrl || "", savedAt: new Date().toISOString() };
          persistAll();
          if (state.onboarded) {
            showScreen("app");
            showView("library");
            try {
              if (typeof openCompose === "function") openCompose(true);
              else {
                const btn = document.getElementById("btn-new-post");
                if (btn) btn.click();
              }
            } catch (_) {}
            toast("Conteúdo recebido do compartilhar — revise e publique", 3500, "ok");
          }
        }
      }

      if (go && state.onboarded) {
        showScreen("app");
        if (go === "home") showView("home");
        else if (go === "eternal" || go === "station") showView("eternal");
        else if (go === "library" || go === "posts") showView("library");
        else if (go === "live") showView("live");
        else if (go === "profile") showView("profile");
        else if (go === "compose") {
          showView("library");
          setTimeout(() => {
            try {
              if (typeof openCompose === "function") openCompose();
              else {
                const btn = document.getElementById("btn-new-post");
                if (btn) btn.click();
              }
            } catch (_) {}
          }, 200);
        }
      }
    } catch (e) {
      console.warn("handleLaunchParams", e);
    }
  }

  // ---------- Presence simulation ----------
  setInterval(() => {
    if (state.isLive) {
      const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
      state.presence = Math.max(1, state.presence + delta);
      if (Math.random() < 0.15) state.presence += Math.floor(Math.random() * 5) + 1;
      if (state.presence > state.livePeakPresence) state.livePeakPresence = state.presence;
      updateLiveListenersUI();
    }
  }, 5000);

  // ---------- Music request (pedido no chat) ----------
  function openMusicRequest() {
    const list = $("#music-request-list");
    const empty = $("#music-request-empty");
    const search = $("#music-request-search");
    function renderMR(filter) {
      const q = (filter || "").toLowerCase().trim();
      const items = state.music.filter((m) => !q || (m.name || "").toLowerCase().includes(q));
      list.innerHTML = items.map((m) =>
        `<div class="item" data-music-req="${m.id}">
          <div class="item-flame" style="opacity:.3"><div class="white-flame" style="animation:none;opacity:.4"></div></div>
          <div class="item-info"><div class="item-title">${escapeHtml(m.name)}</div>
          <div class="item-sub">${fmtTime(m.duration || 0)} · 👁 ${fmtViews(m.views || 0)}</div></div>
        </div>`
      ).join("");
      empty.style.display = items.length ? "none" : "";
      list.querySelectorAll("[data-music-req]").forEach((el) => {
        el.onclick = () => {
          const m = state.music.find((x) => x.id === el.dataset.musicReq);
          if (!m) return;
          if (!state.queue.includes(m.id)) state.queue.push(m.id);
          persistAll();
          addChat("system", "🎵 Pedido: " + m.name);
          toast("Pedido enviado: " + m.name);
          $("#modal-music-request").classList.add("hidden");
          renderSoulQueue();
        };
      });
    }
    if (search) {
      search.value = "";
      search.oninput = () => renderMR(search.value);
    }
    renderMR("");
    $("#modal-music-request").classList.remove("hidden");
  }
  const btnMusicReq = $("#btn-music-request");
  if (btnMusicReq) btnMusicReq.onclick = openMusicRequest;
  const btnCloseMR = $("#btn-close-music-request");
  if (btnCloseMR) btnCloseMR.onclick = () => $("#modal-music-request").classList.add("hidden");

  // ---------- Captions ----------
  function openCaptionsModal(item) {
    state.selectedItem = item;
    $("#captions-item-name").textContent = item.name || item.id;
    const lang = state.lang || "pt";
    $("#caption-lang").value = lang;
    const map = state.captions[item.id] || {};
    $("#caption-text").value = map[lang] || "";
    $("#caption-lang").onchange = () => {
      const l = $("#caption-lang").value;
      const m = state.captions[item.id] || {};
      $("#caption-text").value = m[l] || "";
    };
    $("#modal-captions").classList.remove("hidden");
  }
  const btnCloseCap = $("#btn-close-captions");
  if (btnCloseCap) btnCloseCap.onclick = () => $("#modal-captions").classList.add("hidden");
  const btnSaveCap = $("#btn-save-captions");
  if (btnSaveCap) {
    btnSaveCap.onclick = () => {
      const item = state.selectedItem;
      if (!item) return;
      const lang = $("#caption-lang").value;
      const text = $("#caption-text").value.trim();
      if (!state.captions[item.id]) state.captions[item.id] = {};
      if (text) state.captions[item.id][lang] = text;
      else delete state.captions[item.id][lang];
      persistAll();
      $("#modal-captions").classList.add("hidden");
      toast("Legenda salva (" + lang + ")");
      showView(state.currentView);
    };
  }

  // ---------- Apoio (follow) ----------
  function renderApoioCounts() {
    const ac = $("#apoiadores-count");
    const ao = $("#apoiando-count");
    if (ac) ac.textContent = (state.apoio.apoiadores || []).length;
    if (ao) ao.textContent = (state.apoio.apoiando || []).length;
  }
  function openApoioList(kind) {
    const list = kind === "apoiadores" ? (state.apoio.apoiadores || []) : (state.apoio.apoiando || []);
    $("#apoio-modal-title").textContent = kind === "apoiadores" ? "Apoiadores" : "Apoiando";
    const box = $("#apoio-list");
    const empty = $("#apoio-empty");
    box.innerHTML = list.map((p) =>
      `<div class="item"><div class="item-info"><div class="item-title">${escapeHtml(p.name)}</div>
      <div class="item-sub">@${escapeHtml(p.id || "user")}</div></div></div>`
    ).join("");
    empty.style.display = list.length ? "none" : "";
    $("#modal-apoio").classList.remove("hidden");
  }
  const btnApoiadores = $("#btn-show-apoiadores");
  if (btnApoiadores) btnApoiadores.onclick = () => openApoioList("apoiadores");
  const btnApoiando = $("#btn-show-apoiando");
  if (btnApoiando) btnApoiando.onclick = () => openApoioList("apoiando");
  const btnCloseApoio = $("#btn-close-apoio");
  if (btnCloseApoio) btnCloseApoio.onclick = () => $("#modal-apoio").classList.add("hidden");

  // Demo: seed a couple of supporters if empty
  if (!(state.apoio.apoiadores || []).length) {
    state.apoio.apoiadores = [
      { id: "alma1", name: "Luz Quiet" },
      { id: "alma2", name: "Echo" },
    ];
  }

  // ---------- Screen recording with color background ----------
  async function toggleScreenRec() {
    if (state.screenRecorder && state.screenRecorder.state !== "inactive") {
      state.screenRecorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const bg = ($("#screen-rec-bg") || {}).value || "none";
      // Optional color overlay hint (visual only in-app)
      let overlay = document.getElementById("screen-rec-badge");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "screen-rec-badge";
        overlay.className = "screen-rec-badge";
        document.body.appendChild(overlay);
      }
      overlay.textContent = "⏺ Gravando" + (bg !== "none" ? " · fundo " + bg : "");
      overlay.style.display = "block";
      if (bg !== "none") {
        document.documentElement.style.setProperty("--rec-bg", bg);
      }
      state.screenRecChunks = [];
      const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm" });
      state.screenRecorder = rec;
      rec.ondataavailable = (e) => { if (e.data.size) state.screenRecChunks.push(e.data); };
      rec.onstop = () => {
        overlay.style.display = "none";
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(state.screenRecChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sacred-temple-screen-" + Date.now() + ".webm";
        a.click();
        URL.revokeObjectURL(url);
        toast("Gravação salva");
        state.screenRecorder = null;
      };
      rec.start(1000);
      toast("Gravação de tela iniciada");
    } catch (e) {
      console.warn(e);
      toast("Não foi possível gravar a tela");
    }
  }
  const btnScreenRec = $("#btn-screen-rec");
  if (btnScreenRec) btnScreenRec.onclick = toggleScreenRec;

  // ---------- Enhance renderProfile with avatar color / photo / apoio ----------
  const _origRenderProfile2 = renderProfile;
  renderProfile = function () {
    _origRenderProfile2();
    renderApoioCounts();
    const spirit = $("#profile-spirit");
    if (spirit && state.profile.avatarColor) {
      const svg = spirit.querySelector("svg");
      if (svg) {
        svg.querySelectorAll("stop").forEach((stop, i) => {
          if (i === 0) stop.setAttribute("stop-color", "#fff");
          else stop.setAttribute("stop-color", state.profile.avatarColor);
        });
      }
    }
    if (state.profile.photo) {
      let avatar = document.getElementById("profile-avatar");
      if (!avatar && spirit) {
        avatar = document.createElement("img");
        avatar.id = "profile-avatar";
        avatar.className = "profile-avatar";
        avatar.alt = "";
        spirit.parentNode.insertBefore(avatar, spirit);
        spirit.style.display = "none";
      }
      if (avatar) {
        avatar.src = state.profile.photo;
        avatar.style.display = "block";
        if (spirit) spirit.style.display = "none";
      }
    }
  };

  // Notify when live starts (hook existing go-live if available)
  const _goLiveBtn = $("#btn-go-live");
  if (_goLiveBtn) {
    _goLiveBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (state.isLive && state.notifications.lives === "on") {
          showLocalNotification(
            "Live no Sacred Temple",
            (state.profile.name || "Criador") + " está ao vivo",
            "live-start"
          );
        }
      }, 800);
    });
  }


  // ---------- Cloud API (Cloudflare Worker) ----------
  function updateApiStatusHint() {
    const hint = $("#api-status-hint");
    if (!hint) return;
    if (window.SacredAPI && SacredAPI.enabled()) {
      hint.textContent = "API: " + SacredAPI.getBase();
      hint.style.color = "var(--green-soft)";
    } else {
      hint.textContent = "API: local apenas (sem servidor)";
      hint.style.color = "";
    }
  }

  function getOrCreateServerProfileId() {
    let id = load("serverProfileId", null);
    if (!id) {
      id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      save("serverProfileId", id);
    }
    return id;
  }

  async function syncProfileToServer() {
    if (!window.SacredAPI || !SacredAPI.enabled()) {
      toast("Configure a URL da API antes", 2500, "err");
      return;
    }
    try {
      const id = getOrCreateServerProfileId();
      const handle = slugify(state.profile.name || "criador");
      const res = await SacredAPI.upsertProfile({
        id,
        handle,
        name: state.profile.name || "Criador",
        bio: state.profile.bio || "",
        avatar_color: state.profile.avatarColor || "#e8e0ff",
        photo_url: (state.profile.photo || (state.auth && state.auth.picture) || "").slice(0, 1800),
        google_sub: (state.auth && state.auth.sub) || "",
      });
      if (res.profile) {
        save("serverProfileId", res.profile.id);
        toast("Perfil no servidor: @" + res.profile.handle);
        upsertProfileEntry({
          id: res.profile.handle,
          name: res.profile.name,
          bio: res.profile.bio,
          handle: "@" + res.profile.handle,
          color: res.profile.avatar_color,
          photo: res.profile.photo_url,
          source: "server",
          isSelf: true,
        });
        if (state.currentView === "people") renderPeopleSearch();
      }
    } catch (e) {
      console.warn(e);
      toast("Falha ao sincronizar: " + (e.message || e));
    }
  }

  async function searchProfilesOnServer(q) {
    if (!window.SacredAPI || !SacredAPI.enabled()) return null;
    try {
      const res = await SacredAPI.searchProfiles(q || "");
      return res.profiles || [];
    } catch (e) {
      console.warn(e);
      return null;
    }
  }

  const btnApiConfig = $("#btn-api-config");
  if (btnApiConfig) {
    btnApiConfig.onclick = async () => {
      const current = (window.SacredAPI && SacredAPI.getBase()) || "";
      const url = prompt(
        "URL do Worker Cloudflare (ex: https://sacred-temple-api.SEU_USER.workers.dev)\nDeixe vazio para usar so local.",
        current
      );
      if (url === null) return;
      if (window.SacredAPI) SacredAPI.setBase(url.trim());
      updateApiStatusHint();
      if (url.trim() && window.SacredAPI) {
        try {
          await SacredAPI.health();
          toast("Servidor OK", 2500, "ok");
        } catch (e) {
          toast("URL salva, mas health falhou: " + (e.message || e), 3500, "err");
        }
      } else {
        toast("Modo local (sem API)", 2500, "info");
      }
    };
  }
  const btnApiSync = $("#btn-api-sync");
  if (btnApiSync) btnApiSync.onclick = async () => {
    try {
      await refreshPublicCatalog({ force: true, toast: true });
    } catch (_) {
      syncProfileToServer();
    }
  };

  function updateAutoSyncUI() {
    const el = $("#btn-auto-sync");
    if (!el) return;
    const on = state.autoSync !== false;
    el.textContent = on ? "Ativada ✓" : "Desativada";
    el.classList.toggle("gold", on);
  }

  const btnAutoSync = $("#btn-auto-sync");
  if (btnAutoSync) {
    btnAutoSync.onclick = () => {
      state.autoSync = !(state.autoSync !== false);
      persistAll();
      updateAutoSyncUI();
      toast(
        state.autoSync
          ? "Sync automática ativada — após postar envia ao servidor"
          : "Sync automática desligada — só manual",
        3000,
        "ok"
      );
    };
  }
  updateAutoSyncUI();
  updateApiStatusHint();

  // ---------- Profiles directory & search ----------
  function upsertProfileEntry(entry) {
    if (!entry || !entry.id) return;
    if (!Array.isArray(state.profilesDirectory)) state.profilesDirectory = [];
    const id = String(entry.id).toLowerCase();
    const idx = state.profilesDirectory.findIndex((p) => String(p.id).toLowerCase() === id);
    const next = {
      id,
      name: entry.name || id,
      bio: entry.bio || "",
      handle: entry.handle || ("@" + id),
      color: entry.color || "#e8e0ff",
      photo: entry.photo || "",
      source: entry.source || "app",
      updatedAt: new Date().toISOString(),
      isSelf: !!entry.isSelf,
    };
    // Guarda cópia do conteúdo público para a busca (ver posts/músicas/estação sem precisar apoiar)
    if (entry.snapshot && typeof entry.snapshot === "object") {
      try {
        next.snapshot = JSON.parse(JSON.stringify(entry.snapshot));
      } catch (_) {
        next.snapshot = entry.snapshot;
      }
    } else if (idx >= 0 && state.profilesDirectory[idx].snapshot) {
      next.snapshot = state.profilesDirectory[idx].snapshot;
    }
    if (idx >= 0) {
      state.profilesDirectory[idx] = { ...state.profilesDirectory[idx], ...next };
    } else {
      state.profilesDirectory.unshift(next);
    }
    persistAll();
  }

  function registerMyProfile() {
    const handle = slugify(state.profile.name || "criador");
    upsertProfileEntry({
      id: handle,
      name: state.profile.name || "Criador",
      bio: state.profile.bio || "",
      handle: "@" + handle,
      color: state.profile.avatarColor || "#e8e0ff",
      photo: state.profile.photo || (state.auth && state.auth.picture) || "",
      source: "self",
      isSelf: true,
    });
    toast("Seu perfil está no diretório de busca");
    if (state.currentView === "people") renderPeopleSearch();
  }

  function importProfileFromLink(raw) {
    const text = (raw || "").trim();
    if (!text) return false;
    let hash = "";
    try {
      if (text.includes("#p/")) hash = text.slice(text.indexOf("#p/"));
      else if (text.startsWith("#p/")) hash = text;
      else hash = "#p/" + text;
      let b64 = hash.slice(3).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const json = decodeURIComponent(escape(atob(b64)));
      const data = JSON.parse(json);
      const id = (data.h || slugify(data.n || "user")).toLowerCase();
      upsertProfileEntry({
        id,
        name: data.n || id,
        bio: data.b || "",
        handle: "@" + id,
        color: data.c || "#e8e0ff",
        photo: data.p || data.gp || "",
        source: "link",
        snapshot: data,
      });
      toast("Perfil importado: " + (data.n || id), 2500, "ok");
      return true;
    } catch (e) {
      console.warn(e);
      toast("Link de perfil inválido");
      return false;
    }
  }

  function openDirectoryProfile(entry) {
    if (!entry) return;
    if (entry.isSelf) {
      showView("profile");
      return;
    }
    // Snapshot completo (posts/músicas/estação) se disponível — independente de apoio
    let payload = entry.snapshot || null;
    if (!payload && typeof buildGuestPayloadFromHandle === "function" && /^guider$/i.test(String(entry.id))) {
      payload = buildGuestPayloadFromHandle(entry.id);
    }
    if (!payload) {
      payload = {
        n: entry.name || entry.id,
        b: entry.bio || "",
        h: entry.id,
        c: entry.color || "#e8e0ff",
        posts: [],
        music: [],
        station: [],
        temple: true,
        priv: { profile: "public", eternal: "public", lives: "public" },
        stats: { posts: 0, music: 0, views: 0 },
      };
    } else {
      // clone leve
      payload = JSON.parse(JSON.stringify(payload));
      payload.n = payload.n || entry.name || entry.id;
      payload.h = payload.h || entry.id;
      payload.b = payload.b != null ? payload.b : (entry.bio || "");
      payload.temple = true;
      if (!payload.priv) payload.priv = { profile: "public", eternal: "public", lives: "public" };
    }
    if (entry.photo && entry.photo.length < 12000 && !payload.p) payload.p = entry.photo;

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    location.hash = "#p/" + encoded;
    const ok = tryOpenPublicProfile();
    if (ok) {
      // Abre direto o templo: ver posts/músicas/vídeos e dar play na Eternal Station
      try { enterPersonTemple(); } catch (_) {}
    }
  }

  async function renderPeopleSearch(filter) {
    const q = (filter != null ? filter : (($("#people-search") || {}).value || "")).toLowerCase().trim();
    registerMyProfileQuiet();
    (state.apoio.apoiando || []).forEach((p) => {
      if (!p || !p.id) return;
      const exists = state.profilesDirectory.some((x) => String(x.id).toLowerCase() === String(p.id).toLowerCase());
      if (!exists) {
        upsertProfileEntry({ id: p.id, name: p.name || p.id, handle: "@" + p.id, source: "apoio" });
      }
    });
    (state.apoio.apoiadores || []).forEach((p) => {
      if (!p || !p.id) return;
      const exists = state.profilesDirectory.some((x) => String(x.id).toLowerCase() === String(p.id).toLowerCase());
      if (!exists) {
        upsertProfileEntry({ id: p.id, name: p.name || p.id, handle: "@" + p.id, source: "apoio" });
      }
    });

    // Merge server results when API is configured
    const remote = await searchProfilesOnServer(q);
    if (remote && remote.length) {
      remote.forEach((r) => {
        upsertProfileEntry({
          id: r.handle || r.id,
          name: r.name,
          bio: r.bio || "",
          handle: "@" + (r.handle || r.id),
          color: r.avatar_color || "#e8e0ff",
          photo: r.photo_url || "",
          source: "server",
          serverId: r.id,
        });
      });
    }

    let list = state.profilesDirectory.slice();
    if (q) {
      list = list.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.handle || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q) ||
        (p.bio || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    const box = $("#people-list");
    const empty = $("#people-empty");
    const count = $("#people-count");
    if (count) count.textContent = list.length;
    if (!box) return;
    box.innerHTML = list.map((p) => {
      const thumb = p.photo
        ? `<img class="people-avatar" src="${p.photo}" alt="" />`
        : `<div class="people-avatar people-avatar-spirit" style="--ac:${escapeHtml(p.color || "#e8e0ff")}"></div>`;
      const badge = p.isSelf ? `<span class="people-badge">Você</span>` : "";
      const src =
        p.source === "server" ? "servidor" :
        p.source === "link" ? "via link" :
        p.source === "apoio" ? "apoio" : "app";
      return `<div class="item people-item" data-people-id="${escapeHtml(p.id)}">
        ${thumb}
        <div class="item-info">
          <div class="item-title">${escapeHtml(p.name || p.id)} ${badge}</div>
          <div class="item-sub">${escapeHtml(p.handle || ("@" + p.id))} · ${escapeHtml(src)}</div>
        </div>
        <button type="button" class="btn-small" data-people-open="${escapeHtml(p.id)}">Ver</button>
      </div>`;
    }).join("");
    if (empty) empty.style.display = list.length ? "none" : "";
    box.querySelectorAll("[data-people-open], .people-item").forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.dataset.peopleOpen || el.dataset.peopleId;
        const entry = state.profilesDirectory.find((x) => String(x.id).toLowerCase() === String(id).toLowerCase());
        openDirectoryProfile(entry);
      };
    });
  }

  function registerMyProfileQuiet() {
    const handle = slugify(state.profile.name || "criador");
    const id = handle.toLowerCase();
    const idx = (state.profilesDirectory || []).findIndex((p) => String(p.id).toLowerCase() === id);
    // Snapshot público do próprio templo (para consistência do diretório)
    let snapshot = null;
    try {
      const isPublic = state.privacy.profile !== "private";
      const eternalPublic = state.privacy.eternal === "public";
      const posts = isPublic
        ? (state.posts || []).slice(0, 15).map((p) => ({
            id: p.id,
            t: (p.text || p.name || "").slice(0, 2500),
            k: p.mediaKind || "",
            img: (p.mediaKind === "image" && p.mediaUrl && String(p.mediaUrl).length < 4000) ? p.mediaUrl : "",
            vid: (p.mediaKind === "video" && p.mediaUrl && String(p.mediaUrl).length < 4000) ? p.mediaUrl : "",
            link: p.externalLink || "",
            v: p.views || 0,
            pin: p.pinned ? 1 : 0,
            at: p.createdAt || "",
            fav: p.fav ? 1 : 0,
            reactions: p.reactions || {},
          }))
        : [];
      const music = isPublic
        ? (state.music || []).slice(0, 16).map((m) => ({
            id: m.id,
            n: (m.name || "").slice(0, 80),
            d: m.duration || 0,
            fav: m.fav ? 1 : 0,
            v: m.views || 0,
          }))
        : [];
      const station = eternalPublic
        ? (state.eternal || []).slice(0, 20).map((eid) => {
            const it = typeof findItem === "function" ? findItem(eid) : null;
            if (!it) return null;
            return {
              id: it.id,
              n: (it.name || "").slice(0, 80),
              ty: it.type || "",
              t: (it.text || "").slice(0, 500),
              k: it.mediaKind || "",
              d: it.duration || 0,
            };
          }).filter(Boolean)
        : [];
      snapshot = {
        n: state.profile.name || "Criador",
        b: (state.profile.bio || "").slice(0, 200),
        h: id,
        c: state.profile.avatarColor || "#e8e0ff",
        posts,
        music,
        station,
        temple: true,
        priv: {
          profile: state.privacy.profile || "public",
          eternal: state.privacy.eternal || "public",
          lives: state.privacy.lives || "public",
        },
        stats: {
          posts: posts.length,
          music: music.length,
          views: posts.reduce((s, p) => s + (p.v || 0), 0),
        },
      };
    } catch (_) {}
    const entry = {
      id,
      name: state.profile.name || "Criador",
      bio: state.profile.bio || "",
      handle: "@" + handle,
      color: state.profile.avatarColor || "#e8e0ff",
      photo: state.profile.photo || (state.auth && state.auth.picture) || "",
      source: "self",
      isSelf: true,
      updatedAt: new Date().toISOString(),
      snapshot,
    };
    if (!Array.isArray(state.profilesDirectory)) state.profilesDirectory = [];
    if (idx >= 0) state.profilesDirectory[idx] = { ...state.profilesDirectory[idx], ...entry };
    else state.profilesDirectory.unshift(entry);
  }

  const peopleSearch = $("#people-search");
  if (peopleSearch) {
    peopleSearch.addEventListener("input", () => renderPeopleSearch(peopleSearch.value));
  }
  const btnPeopleMe = $("#btn-people-register-me");
  if (btnPeopleMe) btnPeopleMe.onclick = () => registerMyProfile();
  const btnPeopleImport = $("#btn-people-import-link");
  if (btnPeopleImport) {
    btnPeopleImport.onclick = () => {
      const raw = prompt("Cole o link do perfil (#p/… ou URL completa):", "");
      if (raw == null) return;
      if (importProfileFromLink(raw)) renderPeopleSearch();
    };
  }

  // ---------- Stats ----------
  function openStats() {
    const totalViews = allItems().reduce((s, i) => s + (i.views || 0), 0);
    const flames = allItems().filter((i) => i.fav).length;
    const posts = state.posts.length;
    const music = state.music.length;
    const pinned = state.posts.filter((p) => p.pinned).length;
    const tags = {};
    state.posts.forEach((p) => extractHashtags(p.text).forEach((h) => { tags[h] = (tags[h] || 0) + 1; }));
    const topTag = Object.entries(tags).sort((a, b) => b[1] - a[1])[0];
    const grid = $("#stats-grid");
    if (grid) {
      grid.innerHTML = [
        ["Posts", posts],
        ["Músicas", music],
        ["Visualizações", totalViews],
        ["Chamas brancas", flames],
        ["Fixados", pinned],
        ["Streak (dias)", state.streak.count || 0],
        ["Apoiando", (state.apoio.apoiando || []).length],
        ["Perfis no diretório", (state.profilesDirectory || []).length],
        ["Hashtag top", topTag ? topTag[0] + " ×" + topTag[1] : "—"],
      ].map(([k, v]) => `<div class="stat-cell"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(k)}</span></div>`).join("");
    }
    $("#modal-stats").classList.remove("hidden");
  }
  const btnCloseStats = $("#btn-close-stats");
  if (btnCloseStats) btnCloseStats.onclick = () => $("#modal-stats").classList.add("hidden");
  const btnHomeStats = $("#btn-home-stats");
  if (btnHomeStats) btnHomeStats.onclick = openStats;

  // ---------- Accessibility ----------
  function applyA11y() {
    const a = state.a11y || {};
    document.documentElement.dataset.font = a.font || "normal";
    document.documentElement.dataset.motion = a.motion || "off";
    document.documentElement.dataset.contrast = a.contrast || "off";
  }
  function openA11y() {
    const a = state.a11y || {};
    if ($("#a11y-font")) $("#a11y-font").value = a.font || "normal";
    if ($("#a11y-motion")) $("#a11y-motion").value = a.motion || "off";
    if ($("#a11y-contrast")) $("#a11y-contrast").value = a.contrast || "off";
    $("#modal-a11y").classList.remove("hidden");
  }
  const btnCloseA11y = $("#btn-close-a11y");
  if (btnCloseA11y) btnCloseA11y.onclick = () => $("#modal-a11y").classList.add("hidden");
  const btnSaveA11y = $("#btn-save-a11y");
  if (btnSaveA11y) {
    btnSaveA11y.onclick = () => {
      state.a11y = {
        font: $("#a11y-font").value,
        motion: $("#a11y-motion").value,
        contrast: $("#a11y-contrast").value,
      };
      persistAll();
      applyA11y();
      $("#modal-a11y").classList.add("hidden");
      toast("Acessibilidade salva");
    };
  }

  // ---------- Sleep timer (Eternal Station) ----------
  const sleepSelect = $("#sleep-timer");
  if (sleepSelect) {
    sleepSelect.onchange = () => {
      clearTimeout(state.sleepTimerId);
      state.sleepEndsAt = null;
      const mins = parseInt(sleepSelect.value, 10) || 0;
      const st = $("#sleep-timer-status");
      if (!mins) {
        if (st) st.textContent = "";
        toast("Timer de sono desligado");
        return;
      }
      state.sleepEndsAt = Date.now() + mins * 60 * 1000;
      if (st) st.textContent = "Para em " + mins + " min";
      state.sleepTimerId = setTimeout(() => {
        state.isPlaying = false;
        const audio = $("#audio-player");
        if (audio) { try { audio.pause(); } catch (_) {} }
        const btn = $("#btn-play");
        if (btn) btn.textContent = "▶";
        if (st) st.textContent = "Timer encerrado — pausado";
        if (sleepSelect) sleepSelect.value = "0";
        toast("Timer de sono: pausado");
      }, mins * 60 * 1000);
      toast("Timer de sono: " + mins + " min");
    };
  }

  // Shuffle for eternal — when order is shuffle, randomize next
  const orderSelect = $("#order-select");
  if (orderSelect) {
    orderSelect.addEventListener("change", () => {
      if (orderSelect.value === "shuffle" && state.eternal.length > 1) {
        // Fisher-Yates on eternal queue indices concept via reordering array
        const arr = state.eternal.slice();
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        state.eternal = arr;
        state.eternalIndex = 0;
        persistAll();
        renderEternal();
        toast("Fila embaralhada");
      }
    });
  }

  // ---------- QR code (minimal free matrix QR for short URLs) ----------
  function openProfileQR() {
    const link = getProfileShareLink();
    const prev = $("#qr-link-preview");
    if (prev) prev.textContent = link;
    const canvas = $("#qr-canvas");
    if (canvas) drawSimpleQR(canvas, link);
    $("#modal-qr").classList.remove("hidden");
  }
  const btnCloseQr = $("#btn-close-qr");
  if (btnCloseQr) btnCloseQr.onclick = () => $("#modal-qr").classList.add("hidden");

  /** Lightweight QR-like pattern using hash (readable as visual code + link shown below).
   *  For production scanning, use a real QR lib; this is a free visual fingerprint + copyable link. */
  function drawSimpleQR(canvas, text) {
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    // Use a simple deterministic pattern from string hash for aesthetic QR-style block
    const n = 25;
    const cell = Math.floor(size / (n + 2));
    const offset = cell;
    function hash(s) {
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }
    let h = hash(text);
    const grid = [];
    for (let y = 0; y < n; y++) {
      grid[y] = [];
      for (let x = 0; x < n; x++) {
        h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
        grid[y][x] = (h & 1) === 1;
      }
    }
    // Finder patterns (corners) like QR
    function finder(ox, oy) {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        const border = x === 0 || y === 0 || x === 6 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = border || inner;
      }
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    ctx.fillStyle = "#1a0f2e";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (grid[y][x]) ctx.fillRect(offset + x * cell, offset + y * cell, cell, cell);
      }
    }
    // Center spirit dot
    ctx.fillStyle = "#C9A227";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, cell * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- Install banner ----------
  function maybeShowInstallBanner() {
    const dismissed = localStorage.getItem("st_install_dismissed");
    if (dismissed) return;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (standalone) return;
    const ban = $("#install-banner");
    if (ban) ban.classList.remove("hidden");
  }
  const btnInstallBanner = $("#btn-install-banner");
  if (btnInstallBanner) btnInstallBanner.onclick = () => { installPWA(); };
  const btnDismissInstall = $("#btn-dismiss-install");
  if (btnDismissInstall) {
    btnDismissInstall.onclick = () => {
      localStorage.setItem("st_install_dismissed", "1");
      const ban = $("#install-banner");
      if (ban) ban.classList.add("hidden");
    };
  }

  // Offline indicator
  function updateOnlineStatus(opts) {
    const silent = opts && opts.silent;
    document.body.classList.toggle("is-offline", !navigator.onLine);
    if (!silent && !navigator.onLine) toast("Modo offline — dados locais disponíveis", 3000, "err");
  }
  window.addEventListener("online", () => { document.body.classList.remove("is-offline"); toast("Online de novo", 2000, "ok"); });
  window.addEventListener("offline", () => updateOnlineStatus());

  // ---------- Global UX helpers ----------
  function closeAllModals() {
    $$(".modal").forEach((m) => m.classList.add("hidden"));
    closeLightbox();
  }

  function isAnyModalOpen() {
    return !!document.querySelector(".modal:not(.hidden)") || (document.getElementById("lightbox") && !document.getElementById("lightbox").classList.contains("hidden"));
  }

  // Escape closes modal / lightbox; prevent body scroll when modal open
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (isAnyModalOpen()) {
        e.preventDefault();
        closeAllModals();
      }
    }
  });

  // Click on modal backdrop closes it
  document.addEventListener("click", (e) => {
    const modal = e.target.closest(".modal");
    if (modal && e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Warn before leaving if compose has draft text
  window.addEventListener("beforeunload", (e) => {
    const compose = document.getElementById("compose-text");
    if (compose && compose.value && compose.value.trim().length > 10) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // Double-tap prevention on primary gold buttons (mobile)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-gold");
    if (!btn || btn.disabled) return;
    if (btn.dataset._busy === "1") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    btn.dataset._busy = "1";
    setTimeout(() => { btn.dataset._busy = "0"; }, 450);
  }, true);

    // ---------- Deep link ?u=Handle (ex: ?u=Guider) ----------
  function buildGuestPayloadFromHandle(handle) {
    const isGuider = /^guider$/i.test(handle);
    handle = String(handle || "").toLowerCase().replace(/^@/, "");

    // Snapshot mais recente gravado ao postar/importar (st_pub_*)
    try {
      if (typeof loadPublicSnapshotLocal === "function") {
        const live = loadPublicSnapshotLocal(handle);
        if (live && (live.posts || live.music || live.n)) {
          live.h = live.h || handle;
          live.temple = true;
          return live;
        }
      }
    } catch (_) {}

    // Snapshot no diretório local
    try {
      const dir = (state.profilesDirectory || []).find(
        (p) => String(p.id).toLowerCase() === handle
      );
      if (dir && dir.snapshot && typeof dir.snapshot === "object") {
        const snap = JSON.parse(JSON.stringify(dir.snapshot));
        snap.h = snap.h || handle;
        snap.temple = true;
        return snap;
      }
    } catch (_) {}

    // Próprio perfil neste dispositivo — sempre ao vivo
    try {
      const myHandle = slugify(state.profile.name || "");
      if (myHandle && myHandle === handle && state.onboarded) {
        return buildPublicPayload();
      }
    } catch (_) {}

    const name = isGuider ? (GUIDER_PROFILE.name || "GUIDER") : handle;
    const bio = isGuider
      ? (GUIDER_PROFILE.bio || "A place to share what the soul is saying")
      : "A place to share what the soul is saying";
    const color = isGuider ? (GUIDER_PROFILE.avatarColor || "#e8e0ff") : "#e8e0ff";

    // Conteúdo público: para GUIDER usa amostras do templo; outros handles ficam vazios até API
    let posts = [];
    let music = [];
    let station = [];
    if (isGuider) {
      posts = (SAMPLE_POSTS || []).slice(0, 15).map((p) => ({
        id: p.id,
        t: (p.text || p.name || "").slice(0, 2500),
        k: p.mediaKind || "",
        img: "",
        link: "",
        v: p.views || 0,
        pin: p.pinned ? 1 : 0,
        at: p.createdAt || "",
        fav: p.fav ? 1 : 0,
        reactions: p.reactions || {},
      }));
      music = (SAMPLE_MUSIC || []).slice(0, 16).map((m) => ({
        id: m.id,
        n: (m.name || "").slice(0, 80),
        d: m.duration || 0,
        fav: m.fav ? 1 : 0,
        v: m.views || 0,
      }));
      station = music.slice(0, 12).map((m) => ({
        id: m.id,
        n: m.n,
        ty: "music",
        t: "",
        k: "",
        d: m.d || 0,
      }));
    }

    return {
      n: name,
      b: bio.slice(0, 280),
      h: handle.toLowerCase(),
      c: color,
      p: isGuider ? (GUIDER_PROFILE.photo || null) : null,
      posts,
      music,
      station,
      temple: true,
      priv: { profile: "public", eternal: "public", lives: "public" },
      stats: {
        posts: posts.length,
        music: music.length,
        views: posts.reduce((s, p) => s + (p.v || 0), 0),
      },
    };
  }

  function openHandleFromQuery() {
    try {
      const params = new URLSearchParams(location.search || "");
      let handle = (params.get("u") || params.get("user") || params.get("handle") || "").trim();
      if (!handle) return false;
      handle = handle.replace(/^@/, "");
      // Próprio templo neste aparelho → não abrir como visitante (evita "sumir" o app)
      try {
        const my = slugify((state.profile && state.profile.name) || "");
        if (state.onboarded && my && my === slugify(handle)) {
          return false;
        }
      } catch (_) {}
      const data = buildGuestPayloadFromHandle(handle);
      const json = JSON.stringify(data);
      const b64 = btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      location.hash = "#p/" + b64;
      const opened = tryOpenPublicProfile();
      // Atualiza em segundo plano (API / snapshot mais novo)
      if (opened && typeof fetchPublicTemple === "function") {
        fetchPublicTemple(handle).then((fresh) => {
          if (!fresh) return;
          if (!state._publicProfileVisit) return;
          state._publicProfileVisit.data = fresh;
          try {
            // reabre com dados frescos
            const json2 = JSON.stringify(fresh);
            const b642 = btoa(unescape(encodeURIComponent(json2)))
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");
            location.hash = "#p/" + b642;
            tryOpenPublicProfile();
            if (document.body.classList.contains("in-guest-temple")) {
              try { enterPersonTemple(); } catch (_) {}
            }
          } catch (_) {}
        }).catch(() => {});
      }
      return opened;
    } catch (e) {
      console.warn("openHandleFromQuery", e);
      return false;
    }
  }

  // ---------- Init ----------
  injectSpirits();
  applyA11y();
  updateStreak();


  // Prioridade: ?i= postagem > #p/ hash > ?u= handle > splash
  let openedDeep = false;
  if (typeof openItemFromQuery === "function") {
    openedDeep = openItemFromQuery();
  }
  if (!openedDeep && location.hash && location.hash.startsWith("#p/")) {
    openedDeep = tryOpenPublicProfile();
  }
  if (!openedDeep) {
    openedDeep = openHandleFromQuery();
  }

  // Eternal Station: só preenche se o usuário já tiver favoritos (nunca inventa conteúdo)
  if (!state.eternal.length) {
    const favs = allItems().filter((i) => i.fav);
    if (favs.length) {
      favs.forEach((i) => state.eternal.push(i.id));
      persistAll();
    }
  }

  // Google GIS may load async
  window.addEventListener("load", () => {
    initGoogleSignIn();
    const hint = $("#google-config-hint");
    if (hint && getGoogleClientId()) {
      hint.textContent = "Client ID configurado ✓ — use Entrar com Google";
    }
    maybeShowInstallBanner();
    // Badge de versão
    const ver = document.getElementById("app-version-badge");
    if (ver) ver.textContent = "v" + APP_VERSION;
  });
  setTimeout(initGoogleSignIn, 1200);

  updateSettingsMenuBadges();
  refreshSplashForUser();
  refreshOwnTempleButtons();
  try { updateApiStatusHint(); } catch (_) {}

  if (!openedDeep) {
    if (state.onboarded && state.profile && state.profile.name) {
      // Já logado / com perfil: entra direto no próprio Templo Sagrado
      showScreen("app");
      showView("home");
      renderProfile();
      document.title = "Sacred Temple — " + state.profile.name;
    }
    // senão permanece no splash para Começar / Google
  }
  // Atalhos PWA (?go=) e share_target — grátis
  try { handleLaunchParams(); } catch (_) {}
  // Status de rede na abertura
  try { updateOnlineStatus({ silent: true }); } catch (_) {}
  // Lembrete suave de backup local (a cada 14 dias) — grátis
  try {
    if (state.onboarded && state.posts && state.posts.length) {
      const last = parseInt(localStorage.getItem("st_backup_hint") || "0", 10);
      if (Date.now() - last > 14 * 24 * 3600 * 1000) {
        setTimeout(() => {
          toast("Dica grátis: Perfil → Exportar meus dados (backup local)", 4500, "info");
          localStorage.setItem("st_backup_hint", String(Date.now()));
        }, 5000);
      }
    }
  } catch (_) {}
  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#p/")) tryOpenPublicProfile();
  });
})();
