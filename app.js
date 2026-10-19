/* Sacred Temple — Complete Web/PWA Prototype */
(function () {
  "use strict";

  const APP_VERSION = "13.16.8";
  const APP_BUILD = "2026-10-16-social-link-logos";

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
    templeTheme: "classic",
    photo: null,
    // Até 3 links de site / redes sociais
    links: [
      { label: "", url: "" },
      { label: "", url: "" },
      { label: "", url: "" },
    ],
  };

  /** Temas do templo — vários claros + clássico escuro */
  const TEMPLE_THEMES = {
    classic: {
      label: "Clássico",
      light: false,
      vars: {
        "--purple-deep": "#2E1A47",
        "--purple-mid": "#4A2C6A",
        "--purple-soft": "#6B4C8A",
        "--purple-bg": "#1a0f2e",
        "--gold": "#C9A227",
        "--gold-light": "#E8C84A",
        "--gold-dim": "#8B6914",
        "--white": "#F8F4FF",
        "--white-dim": "#D4C8E8",
        "--glass": "rgba(255,255,255,0.08)",
        "--glass-border": "rgba(255,255,255,0.12)",
      },
      themeColor: "#C9A227",
    },
    pearl: {
      label: "Pérola",
      light: true,
      vars: {
        "--purple-deep": "#4A3A6A",
        "--purple-mid": "#7B6A9A",
        "--purple-soft": "#A898C8",
        "--purple-bg": "#F7F3FF",
        "--gold": "#B8922A",
        "--gold-light": "#D4B24A",
        "--gold-dim": "#8A6A18",
        "--white": "#2A1F3D",
        "--white-dim": "#5A4E70",
        "--glass": "rgba(255,255,255,0.65)",
        "--glass-border": "rgba(80,60,120,0.12)",
      },
      themeColor: "#B8922A",
    },
    sunrise: {
      label: "Aurora",
      light: true,
      vars: {
        "--purple-deep": "#6B4A20",
        "--purple-mid": "#C9A227",
        "--purple-soft": "#E8C84A",
        "--purple-bg": "#FFF6E8",
        "--gold": "#C47A1A",
        "--gold-light": "#E09A3A",
        "--gold-dim": "#9A5A10",
        "--white": "#3A2A18",
        "--white-dim": "#6A5640",
        "--glass": "rgba(255,255,255,0.7)",
        "--glass-border": "rgba(160,100,40,0.14)",
      },
      themeColor: "#C47A1A",
    },
    sky: {
      label: "Céu",
      light: true,
      vars: {
        "--purple-deep": "#2A4A6A",
        "--purple-mid": "#5A8AB0",
        "--purple-soft": "#8AB8D8",
        "--purple-bg": "#EAF4FF",
        "--gold": "#3A7AB0",
        "--gold-light": "#5A9AD0",
        "--gold-dim": "#2A5A88",
        "--white": "#1A2A3A",
        "--white-dim": "#4A5A6A",
        "--glass": "rgba(255,255,255,0.72)",
        "--glass-border": "rgba(40,90,140,0.12)",
      },
      themeColor: "#3A7AB0",
    },
    mint: {
      label: "Menta",
      light: true,
      vars: {
        "--purple-deep": "#1A5A48",
        "--purple-mid": "#3A9A78",
        "--purple-soft": "#6AC8A8",
        "--purple-bg": "#E8F8F2",
        "--gold": "#2A8A68",
        "--gold-light": "#4ABA90",
        "--gold-dim": "#1A6A4A",
        "--white": "#14382C",
        "--white-dim": "#3A5A4C",
        "--glass": "rgba(255,255,255,0.72)",
        "--glass-border": "rgba(30,100,80,0.12)",
      },
      themeColor: "#2A8A68",
    },
    rose: {
      label: "Rosa",
      light: true,
      vars: {
        "--purple-deep": "#6A3048",
        "--purple-mid": "#C07090",
        "--purple-soft": "#E0A0B8",
        "--purple-bg": "#FFF0F3",
        "--gold": "#C05070",
        "--gold-light": "#E07090",
        "--gold-dim": "#903050",
        "--white": "#3A1828",
        "--white-dim": "#6A4050",
        "--glass": "rgba(255,255,255,0.72)",
        "--glass-border": "rgba(140,60,90,0.12)",
      },
      themeColor: "#C05070",
    },
    lavender: {
      label: "Lavanda",
      light: true,
      vars: {
        "--purple-deep": "#4A3A7A",
        "--purple-mid": "#8A7AB8",
        "--purple-soft": "#B8A8E0",
        "--purple-bg": "#F3EEFF",
        "--gold": "#7A5AC0",
        "--gold-light": "#9A7AD8",
        "--gold-dim": "#5A3A98",
        "--white": "#2A2040",
        "--white-dim": "#5A4A70",
        "--glass": "rgba(255,255,255,0.7)",
        "--glass-border": "rgba(90,70,140,0.12)",
      },
      themeColor: "#7A5AC0",
    },
    sand: {
      label: "Areia",
      light: true,
      vars: {
        "--purple-deep": "#5A4830",
        "--purple-mid": "#A89060",
        "--purple-soft": "#D0C090",
        "--purple-bg": "#FBF6EC",
        "--gold": "#A07830",
        "--gold-light": "#C09850",
        "--gold-dim": "#785820",
        "--white": "#2E2618",
        "--white-dim": "#5A5040",
        "--glass": "rgba(255,255,255,0.7)",
        "--glass-border": "rgba(120,90,40,0.12)",
      },
      themeColor: "#A07830",
    },
    midnight: {
      label: "Meia-noite",
      light: false,
      vars: {
        "--purple-deep": "#0D1520",
        "--purple-mid": "#1A2A40",
        "--purple-soft": "#2A4060",
        "--purple-bg": "#080E16",
        "--gold": "#6AB0E0",
        "--gold-light": "#9AD0F0",
        "--gold-dim": "#3A7098",
        "--white": "#E8F0F8",
        "--white-dim": "#90A8C0",
        "--glass": "rgba(255,255,255,0.06)",
        "--glass-border": "rgba(120,160,200,0.14)",
      },
      themeColor: "#6AB0E0",
    },
    forest: {
      label: "Floresta",
      light: false,
      vars: {
        "--purple-deep": "#0F1F18",
        "--purple-mid": "#1A3A2C",
        "--purple-soft": "#2A5A44",
        "--purple-bg": "#0A1410",
        "--gold": "#6BC48A",
        "--gold-light": "#9AE0B0",
        "--gold-dim": "#3A8A58",
        "--white": "#E8F8EE",
        "--white-dim": "#90B8A0",
        "--glass": "rgba(255,255,255,0.06)",
        "--glass-border": "rgba(100,180,120,0.14)",
      },
      themeColor: "#6BC48A",
    },
    ocean: {
      label: "Oceano",
      light: true,
      vars: {
        "--purple-deep": "#1A4A5A",
        "--purple-mid": "#3A8AA0",
        "--purple-soft": "#6AB8C8",
        "--purple-bg": "#E6F6FA",
        "--gold": "#1A8A9A",
        "--gold-light": "#3AB0C0",
        "--gold-dim": "#0A6A78",
        "--white": "#0E2A32",
        "--white-dim": "#3A5A62",
        "--glass": "rgba(255,255,255,0.72)",
        "--glass-border": "rgba(20,100,120,0.12)",
      },
      themeColor: "#1A8A9A",
    },
    coral: {
      label: "Coral",
      light: true,
      vars: {
        "--purple-deep": "#6A3028",
        "--purple-mid": "#C07060",
        "--purple-soft": "#E0A090",
        "--purple-bg": "#FFF2EE",
        "--gold": "#D05040",
        "--gold-light": "#E87860",
        "--gold-dim": "#A03028",
        "--white": "#3A1814",
        "--white-dim": "#6A4038",
        "--glass": "rgba(255,255,255,0.72)",
        "--glass-border": "rgba(160,60,40,0.12)",
      },
      themeColor: "#D05040",
    },
    slate: {
      label: "Ardósia",
      light: false,
      vars: {
        "--purple-deep": "#1A1C22",
        "--purple-mid": "#2E323C",
        "--purple-soft": "#4A5060",
        "--purple-bg": "#12141A",
        "--gold": "#C0A878",
        "--gold-light": "#D8C090",
        "--gold-dim": "#8A7850",
        "--white": "#F0EEE8",
        "--white-dim": "#A8A498",
        "--glass": "rgba(255,255,255,0.07)",
        "--glass-border": "rgba(180,170,140,0.12)",
      },
      themeColor: "#C0A878",
    },
  };

  function applyTempleTheme(themeId, opts) {
    opts = opts || {};
    const id = (themeId && TEMPLE_THEMES[themeId]) ? themeId : "classic";
    const theme = TEMPLE_THEMES[id];
    const root = document.documentElement;
    Object.keys(theme.vars).forEach((k) => {
      root.style.setProperty(k, theme.vars[k]);
    });
    // Aliases de texto acompanham --white / --white-dim (claro = fonte escura)
    root.style.setProperty("--text", theme.vars["--white"]);
    root.style.setProperty("--text-muted", theme.vars["--white-dim"]);
    if (theme.light) {
      root.style.setProperty("--surface-soft", "rgba(40,30,60,0.06)");
      root.style.setProperty("--surface-hover", "rgba(40,30,60,0.1)");
    } else {
      root.style.setProperty("--surface-soft", "rgba(255,255,255,0.06)");
      root.style.setProperty("--surface-hover", "rgba(255,255,255,0.12)");
    }
    root.classList.toggle("temple-light", !!theme.light);
    root.dataset.templeTheme = id;
    // Barra do navegador / PWA
    if (!opts.skipMeta) {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme.themeColor || theme.vars["--gold"]);
      try {
        const metas = document.querySelectorAll('meta[name="theme-color"]');
        metas.forEach((m) => m.setAttribute("content", theme.themeColor || theme.vars["--gold"]));
      } catch (_) {}
    }
    ret
