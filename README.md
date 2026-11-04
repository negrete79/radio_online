# Sertaneja Pop — Rádio PWA (pronto para instalar)

App de rádio ao vivo 24h, instalável no celular (Android e iPhone), que
**continua tocando com a tela apagada** e mostra na tela de bloqueio o
**nome da música + a capa oficial do artista** (buscada no Deezer, com
fallback para iTunes).

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O app inteiro (visual + lógica). Único arquivo que você precisa editar. |
| `manifest.json` | Faz o app ser instalável (ícones, nome, cores). |
| `service-worker.js` | Guarda a interface em cache p/ abrir offline. **Nunca** cacheia o áudio. |
| `worker.js` | Código do Cloudflare Worker (metadata + capa oficial). Só roda na Cloudflare. |
| `icons/` | Ícones 192/512 + maskable + apple-touch (nota musical rosa). |

---

## OS 3 PASSOS

### PASSO 1 — Criar o Cloudflare Worker (capa oficial em tempo real)

1. Acesse **https://workers.cloudflare.com** e crie uma conta grátis.
2. Clique em **Create Worker → Deploy** (pode manter o nome sugerido).
3. Clique em **Edit code**, **apague tudo**, cole o conteúdo inteiro do
   arquivo **`worker.js`** e clique em **Deploy**.
4. Copie a URL que aparecer (algo como
   `https://sertaneja-meta.sua-conta.workers.dev`).
5. Abra `index.html`, ache no topo do script:

   ```js
   const WORKER_URL = "";
   ```

   e cole sua URL entre as aspas:

   ```js
   const WORKER_URL = "https://sertaneja-meta.sua-conta.workers.dev";
   ```

> **Importante:** o app funciona MESMO sem o Worker. O servidor da rádio
> (AzuraCast) libera CORS na API `/api/nowplaying/sertanejapop`, então o
> próprio navegador lê a música atual, e as capas vêm do Deezer/iTunes
> direto do aparelho. O Worker deixa tudo mais rápido e confiável (as
> buscas saem da Cloudflare, sem depender da rede de quem ouve).

### PASSO 2 — Subir no GitHub Pages

1. Crie um repositório no GitHub (ex.: `sertaneja-pop`).
2. Envie `index.html`, `manifest.json`, `service-worker.js` e a pasta
   `icons/` na raiz do repositório. (`worker.js` é só da Cloudflare,
   mas pode subir junto, não atrapalha.)
3. Em **Settings → Pages**, em *Branch* escolha `main` / `/ (root)` e
   **Save**. Em ~1 minuto o link fica no ar:
   `https://seu-usuario.github.io/sertaneja-pop/`

### PASSO 3 — Abrir no celular e instalar

**Android (Chrome):**
1. Abra o link no Chrome.
2. Toque no botão laranja **INSTALAR APP** que vai aparecer.
3. Pronto — ícone na tela inicial, app em tela cheia.

**iPhone (Safari):**
1. Abra o link no Safari.
2. Toque no botão **Compartilhar** (caixinha com seta) →
   **Adicionar à Tela de Início**.
3. Pronto — o app abre em tela cheia como aplicativo.

**Teste do segundo plano:** dê o play, apague a tela — a música continua
e aparece na tela de bloqueio com capa, título e artista, com botões
play/pause funcionando.

---

## Como funciona a metadata (por dentro)

A cada **10 segundos** (só enquanto está tocando) o app lê a música atual:

1. **Worker** (se `WORKER_URL` estiver configurado) — ele tenta
   `/api/nowplaying/sertanejapop` → `status-json.xsl` → `stats?json=1` →
   `7.html`, separa **Artista - Música** e busca a capa no
   **Deezer** (`cover_xl`) com fallback para **iTunes** (600x600).
2. **Sem Worker:** o navegador lê a API do AzuraCast direto (tem CORS),
   e a capa sai do Deezer → iTunes → proxy allorigins → arte do servidor.
3. Mudou a música? Troca capa, título, artista e `MediaMetadata` na hora,
   sem recarregar a página. A anterior entra em **"Tocaram agora pouco"**.

## Solução de problemas

- **Capa não muda:** veja a linha de debug no rodapé do app. Ela mostra a
  hora + o status (TOCANDO, buscando capa, ERRO…). Erros de `deezer` são
  normais em algumas redes (o app cai no iTunes automaticamente).
- **Atualizei o index.html mas o celular mostra o app velho:** aumente a
  `VERSION` no topo do `service-worker.js` (ex.: `v1` → `v2`) e recarregue.
- **iPhone não baixa volume pelo slider:** no iOS o volume segue os
  botões físicos do aparelho (o slider funciona no Android/desktop).
- **Stream caiu:** o app reconecta sozinho em 5s, sempre na ponta ao vivo.
