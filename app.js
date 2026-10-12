/* Sacred Temple — Complete Web/PWA Prototype */
(function () {
  "use strict";

  const APP_VERSION = "13.15.4";
  const APP_BUILD = "2026-10-12-sync";

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

  /** Full post card for the P
