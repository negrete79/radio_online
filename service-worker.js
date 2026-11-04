/* ════════════════════════════════════════════════════════════
   SERVICE WORKER — Sertaneja Pop
   ────────────────────────────────────────────────────────────
   • Faz cache do "shell" (interface) para abrir OFFLINE.
   • NUNCA faz cache do stream de áudio (ao vivo tem que ser ao vivo).
   • NUNCA faz cache das APIs de metadata/capa.
   • Para forçar atualização do app depois de editar o index.html,
     troque a versão abaixo (ex.: v2).
   ════════════════════════════════════════════════════════════ */
const VERSION = "v2";
const CACHE = "sertanejapop-shell-" + VERSION;

const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png"
];

/* Instalação: guarda o shell antes de ativar.
   IMPORTANTE: cacheia arquivo por arquivo — se a pasta icons/ não foi
   subida no servidor, o SW MESMO ASSIM instala (addAll falharia todo). */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(
        SHELL.map((f) => c.add(f).catch(() => { /* arquivo faltando: segue */ }))
      ))
      .then(() => self.skipWaiting())
  );
});

/* Ativação: apaga caches de versões antigas */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Estratégia de rede */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  /* ── STREAM DE ÁUDIO: nunca intercepta, nunca cacheia ──
     O áudio vai direto para a rede (ao vivo, sem buffer de cache). */
  if (url.hostname.includes("soundstream.com.br") && url.pathname.includes("/listen/")) {
    return; // sem respondWith -> navegador busca direto
  }

  /* ── APIs de metadata/capa/proxy/worker: rede direta, sem cache ── */
  const host = url.hostname;
  if (
    host.includes("allorigins.win") ||
    host.includes("workers.dev") ||
    host.includes("deezer.com") ||
    host.includes("itunes.apple.com") ||
    host.includes("mzstatic.com") ||
    host.includes("dzcdn.net")
  ) {
    return;
  }

  /* ── Shell do app: cache-first com atualização em segundo plano ── */
  if (req.mode === "navigate" || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => {
        const rede = fetch(req).then((res) => {
          if (res && res.ok) {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          }
          return res;
        }).catch(() => null);

        /* Navegação: se offline, devolve o index.html do cache */
        if (req.mode === "navigate") {
          return rede.then((res) => res || caches.match("./index.html"));
        }
        return hit || rede;
      })
    );
  }
});
