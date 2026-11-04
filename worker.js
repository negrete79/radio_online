/* ════════════════════════════════════════════════════════════
   CLOUDFLARE WORKER — Metadata + Capa oficial (Sertaneja Pop)
   ────────────────────────────────────────────────────────────
   O QUE ELE FAZ
   • Lê a música que está tocando agora no servidor da rádio:
       1) /api/nowplaying/sertanejapop  (AzuraCast — a que funciona hoje)
       2) /status-json.xsl              (Icecast, fallback)
       3) /stats?sid=1&json=1           (Shoutcast v2, fallback)
       4) /7.html                       (Shoutcast v1, fallback)
   • Separa "Artista - Música"
   • Busca a CAPA OFICIAL no Deezer (album.cover_xl) com fallback
     para iTunes (artworkUrl100 em 600x600) e por último a arte do
     próprio servidor (se não for a genérica).
   • Devolve JSON {title, artist, raw, cover, album, history} com
     CORS liberado (Access-Control-Allow-Origin: *).
   • Modo de busca: /?q=Gusttavo+Lima+Retrovisor devolve até 8
     resultados {results:[{title, artist, album, cover}]}.

   COMO INSTALAR (3 passos)
   1) Acesse https://workers.cloudflare.com → Create Worker
   2) Apague tudo, cole ESTE arquivo inteiro e clique em Deploy
   3) Copie a URL do Worker e cole no index.html, na variável
      const WORKER_URL = "..."
   ════════════════════════════════════════════════════════════ */

const RADIO_HOST = "https://srv3.soundstream.com.br/";
const AZURACAST_API = "https://srv3.soundstream.com.br/api/nowplaying/sertanejapop";
const DEEZER = "https://api.deezer.com/search";
const ITUNES = "https://itunes.apple.com/search";
const TIMEOUT_MS = 7000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=5"
};

/* ── Rotas ── */
export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    const url = new URL(request.url);
    try {
      const q = url.searchParams.get("q");
      if (q) return json(await searchCovers(q));
      return json(await nowPlaying());
    } catch (err) {
      return json({
        error: String((err && err.message) || err),
        title: "", artist: "", raw: "", cover: "", album: "", results: []
      }, 502);
    }
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CORS });
}

/* fetch com timeout (Workers não têm AbortSignal.timeout em todas as versões) */
async function fetchT(url, ms = TIMEOUT_MS) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { signal: c.signal, cf: { cacheTtl: 5, cacheEverything: false } });
  } finally {
    clearTimeout(t);
  }
}

/* ══════════════ LEITURA DA MÚSICA ATUAL ══════════════ */

async function nowPlaying() {
  const raw = await readRaw();
  const { artist, title } = splitTitle(raw);
  const cap = await coverFor(artist, title, true);
  return {
    title: cap.title || title || raw,
    artist: cap.artist || artist || "Rádio Sertaneja Pop",
    raw: raw,
    cover: cap.cover || "",
    album: cap.album || "",
    coverSource: cap.source || "",
    history: cap.history || []
  };
}

/* Tenta as 4 fontes de metadata, na ordem */
async function readRaw() {
  /* limpa os globais da leitura anterior (evita histórico velho) */
  globalThis.__hist = null;
  globalThis.__serverArt = "";

  /* 1) AzuraCast — dá artista, título e histórico separados */
  try {
    const r = await fetchT(AZURACAST_API);
    if (r.ok) {
      const j = await r.json();
      const np = j && j.now_playing && j.now_playing.song;
      if (np && (np.text || np.title)) {
        // guarda o histórico no "cache" global para o coverFor anexar depois
        globalThis.__hist = (j.song_history || [])
          .map((h) => h.song || {})
          .filter((s) => s.text && s.text !== (np.text || ""))
          .slice(0, 4)
          .map((s) => ({
            title: s.title || s.text || "",
            artist: s.artist || "",
            raw: s.text || "",
            album: s.album || "",
            cover: (s.art && s.art.indexOf("generic_song") === -1) ? s.art : ""
          }));
        globalThis.__serverArt =
          (np.art && np.art.indexOf("generic_song") === -1) ? np.art : "";
        return np.text || (np.artist ? np.artist + " - " + np.title : np.title);
      }
    }
  } catch (e) { /* tenta o próximo */ }

  /* 2) Icecast status-json.xsl */
  try {
    const r = await fetchT(RADIO_HOST + "status-json.xsl");
    if (r.ok) {
      const j = await r.json();
      const t = pickIcecastTitle(j);
      if (t) return t;
    }
  } catch (e) { /* tenta o próximo */ }

  /* 3) Shoutcast v2 stats json */
  try {
    const r = await fetchT(RADIO_HOST + "stats?sid=1&json=1");
    if (r.ok) {
      const j = await r.json();
      if (j && (j.songtitle || j.title)) return j.songtitle || j.title;
    }
  } catch (e) { /* tenta o próximo */ }

  /* 4) Shoutcast v1 7.html */
  const r = await fetchT(RADIO_HOST + "7.html");
  if (r.ok) {
    const txt = await r.text();
    const m = txt.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (m) {
      const p = m[1].split(",");
      if (p.length >= 6) {
        const t = p.slice(5, p.length - 1).join(",") || p[5];
        if (t) return t;
      }
    }
  }
  throw new Error("Nenhuma fonte de metadata respondeu");
}

function pickIcecastTitle(j) {
  const s = j && j.icestats && j.icestats.source;
  if (!s) return "";
  const arr = Array.isArray(s) ? s : [s];
  arr.sort((a, b) =>
    (String(b.listenurl || "").includes("sertanejapop") ? 1 : 0) -
    (String(a.listenurl || "").includes("sertanejapop") ? 1 : 0));
  for (const src of arr) {
    const t = src.title || src.yp_currently_playing || src.server_description || "";
    if (t) return t;
  }
  return "";
}

/* Separa "Artista - Música" */
function splitTitle(raw) {
  let s = String(raw).trim();
  s = s.replace(/^\s*[\[(]?(ao vivo|live)[\])]?\s*[-–—:]\s*/i, "");
  const parts = s.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "", title: s };
}

/* ══════════════ CAPA OFICIAL (Deezer -> iTunes -> servidor) ══════════════ */

/* Cache em memória do isolate: mesma música não repete busca */
const coverMemo = new Map();

/* withHistory=true apenas na chamada principal — as chamadas aninhadas
   (capas do histórico) NUNCA re-anexam o histórico, senão recursão infinita. */
async function coverFor(artist, title, withHistory = false) {
  const q = ((artist ? artist + " " : "") + title).trim();
  if (!q) return { cover: "", album: "", source: "" };

  const key = q.toLowerCase();
  if (coverMemo.has(key)) return coverMemo.get(key);

  let out = { cover: "", album: "", source: "", title: "", artist: "" };

  /* 1) Deezer — cover_xl 1000x1000 */
  try {
    const r = await fetchT(DEEZER + "?q=" + encodeURIComponent(q) + "&limit=1");
    const j = await r.json();
    const hit = j && j.data && j.data[0];
    if (hit && hit.album && hit.album.cover_xl) {
      out = {
        cover: hit.album.cover_xl,
        album: hit.album.title || "",
        source: "deezer",
        title: hit.title || "",
        artist: (hit.artist && hit.artist.name) || ""
      };
    }
  } catch (e) { /* tenta iTunes */ }

  /* 2) iTunes — artworkUrl100 -> 600x600 */
  if (!out.cover) {
    try {
      const r = await fetchT(ITUNES + "?term=" + encodeURIComponent(q) +
        "&media=music&entity=song&limit=1&country=BR");
      const j = await r.json();
      const hit = j && j.results && j.results[0];
      if (hit && hit.artworkUrl100) {
        out = {
          cover: String(hit.artworkUrl100).replace("100x100", "600x600"),
          album: hit.collectionName || "",
          source: "itunes",
          title: hit.trackName || "",
          artist: hit.artistName || ""
        };
      }
    } catch (e) { /* usa a arte do servidor */ }
  }

  /* 3) Arte do próprio servidor (se não for a genérica) */
  if (!out.cover && globalThis.__serverArt) {
    out.cover = globalThis.__serverArt;
    out.source = "servidor";
  }

  /* Anexa o histórico (capas resolvidas em paralelo, com cache) */
  if (withHistory && globalThis.__hist) {
    const hist = globalThis.__hist.slice(0, 4);
    await Promise.all(hist.map(async (h) => {
      if (!h.cover) {
        const cv = await coverFor(h.artist, h.title).catch(() => null);
        if (cv && cv.cover) { h.cover = cv.cover; h.album = h.album || cv.album || ""; }
      }
    }));
    out.history = hist;
  }

  if (coverMemo.size > 300) coverMemo.clear();
  coverMemo.set(key, out);
  return out;
}

/* ══════════════ MODO BUSCA (/?q=...) ══════════════ */

async function searchCovers(q) {
  /* 1) Deezer */
  try {
    const r = await fetchT(DEEZER + "?q=" + encodeURIComponent(q) + "&limit=8");
    const j = await r.json();
    if (j && j.data && j.data.length) {
      return {
        source: "deezer",
        results: j.data.map((h) => ({
          title: h.title || "",
          artist: (h.artist && h.artist.name) || "",
          album: (h.album && h.album.title) || "",
          cover: (h.album && (h.album.cover_big || h.album.cover_medium || h.album.cover_xl)) || ""
        }))
      };
    }
  } catch (e) { /* tenta iTunes */ }

  /* 2) iTunes */
  const r = await fetchT(ITUNES + "?term=" + encodeURIComponent(q) +
    "&media=music&entity=song&limit=8&country=BR");
  const j = await r.json();
  return {
    source: "itunes",
    results: ((j && j.results) || []).map((h) => ({
      title: h.trackName || "",
      artist: h.artistName || "",
      album: h.collectionName || "",
      cover: h.artworkUrl100 ? String(h.artworkUrl100).replace("100x100", "600x600") : ""
    }))
  };
}
