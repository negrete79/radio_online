# Sertaneja Pop — Rádio PWA (pronto para instalar)

App de rádio ao vivo 24h, instalável no celular (Android e iPhone), que
**continua tocando com a tela apagada** e mostra na tela de bloqueio o
**nome da música + a capa oficial do artista** (buscada no Deezer, com
fallback para iTunes).

**Responsivo de verdade:** celular, tablet, notebook, PC e **Smart TV**
(Android TV, Samsung, LG, Fire TV). No celular o layout é o mesmo de
sempre (card de 400px, vertical — **nada mudou**). Em telas grandes
(≥1024px, ou ≥800px com altura ≥700px) o card passa a ocupar **96% da
largura e 92% da altura da tela**, igual a um letreiro de neon:

- **Esquerda:** **SERTANEJA** (laranja neon) / **POP** (rosa neon) + vinil
  gigante de 380px girando com a capa.
- **Direita (painel de vidro):** **PLAY verde neon GIGANTE** (até 180px)
  com o **equalizador colorido** ao lado, rótulo **Now Playing** com a
  música em 42px, artista, selo **AO VIVO**, volume e o botão
  **INSTALAR**.

Na **TV** o layout de tela cheia entra SEMPRE (detectado pelo userAgent
— Tizen, WebOS, Android TV, Fire TV), mesmo que o navegador da TV
reporte viewport pequeno — acabou a "tirinha fina" no meio da tela. Na
TV o histórico, a busca e a linha de debug ficam de fora (tela limpa,
só o player). O controle remoto funciona: **ENTER/OK ou ESPAÇO =
play/pause**, **SETA ↑/↓ = volume**, com foco verde visível no botão de
play e aviso para usar o navegador da TV em vez do Downloader.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O app inteiro (visual + lógica). Único arquivo que você precisa editar. |
| `manifest.json` | Faz o app ser instalável. **Os ícones já vêm embutidos dentro dele** (base64), então a pasta `icons/` é opcional. |
| `service-worker.js` | Guarda a interface em cache p/ abrir offline. **Nunca** cacheia o áudio. |
| `worker.js` | Código do Cloudflare Worker (metadata + capa oficial). Só roda na Cloudflare. |
| `icons/` | Ícones 192/512 + maskable + apple-touch (nota musical rosa). **Opcional** — sem ela o app instala do mesmo jeito (ícone vem do manifest). |

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
2. Envie `index.html`, `manifest.json` e `service-worker.js` na raiz do
   repositório. A pasta `icons/` é **opcional** (o manifest já tem os
   ícones embutidos), mas pode subir junto. (`worker.js` é só da
   Cloudflare, mas pode subir também, não atrapalha.)
3. Em **Settings → Pages**, em *Branch* escolha `main` / `/ (root)` e
   **Save**. Em ~1 minuto o link fica no ar:
   `https://seu-usuario.github.io/sertaneja-pop/`

### PASSO 3 — Abrir no celular e instalar

**Android (Chrome):**
1. Abra o link no Chrome.
2. Toque no botão laranja **⬇ INSTALAR APP NA TELA INICIAL** que aparece
   logo abaixo do volume (ele só aparece quando o Chrome avisa que dá para
   instalar; depois de instalar ele **some sozinho e não volta mais**).
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

## 📺 SMART TV (Android TV, Samsung, LG, Fire TV)

**Abra pelo NAVEGADOR da TV, não pelo Downloader.** O app travou no
Downloader porque ele é um WebView de app, não um navegador. Use:

| TV | Navegador para usar |
|---|---|
| Android TV / Fire TV / Chromecast | **TV Bro** (Play Store) ou **Silk Browser** (Fire Stick) |
| Samsung (Tizen) | **Samsung Internet** (já vem na TV) |
| LG (webOS) | **Navegador da TV** |
| Outras | **Puffin TV Browser** |

Como instalar o TV Bro: Play Store na TV → pesquisar "TV Bro" → instalar →
abrir → digitar o link do GitHub Pages → OK no controle.

**Controle remoto (funciona dentro do app):**
- **OK / ENTER / ESPAÇO** = toca ou pausa
- **SETA PARA CIMA / PARA BAIXO** = volume +5% / −5% (aparece "VOL xx%" na tela)
- O foco começa **no botão PLAY**, com contorno verde — é só apertar OK.

**Na TV o app fica em tela cheia** (96% × 92% da tela): letreiro
SERTANEJA (laranja) / POP (rosa) + vinil de 380px à esquerda; painel com
play verde neon gigante (até 180px), equalizador de 80px, "Now Playing",
música em 42px, selo AO VIVO e volume à direita — igual à imagem de
referência. Histórico, busca e debug ficam escondidos na TV.

**Botão INSTALAR na TV:** agora ele **também aparece na TV** quando o
navegador da TV avisa que dá para instalar (`beforeinstallprompt`) e
some sozinho depois de instalar. Se o navegador da TV não souber
instalar (é o caso do Downloader e da maioria deles), o app mostra
sozinho, depois de 6 segundos, a dica: **abra pelo navegador da TV**
(TV Bro, Puffin TV, Samsung Internet) — nunca pelo Downloader. Se abrir
dentro de um app tipo Downloader, o app também mostra um aviso no topo
dizendo para usar o navegador da TV.

---

## App não instala? O app agora te diz o motivo

Abra o app e olhe abaixo do lugar do botão **INSTALAR APP**: se algo estiver
impedindo a instalação, aparece um **aviso vermelho** dizendo exatamente o
quê e como resolver. Os casos mais comuns:

| Aviso | Motivo | Solução |
|---|---|---|
| "Você abriu o arquivo direto do aparelho" | Você abriu o `index.html` salvo no celular/PC (`file://…`) | Instalar só funciona **num link hospedado**. Suba no GitHub Pages (Passo 2) e abra o link |
| "Endereço não seguro (http://)" | O site não tem HTTPS | Use o GitHub Pages, que já vem com `https://` |
| "Você está vendo isso dentro de outro app" | Link aberto no navegador embutido do WhatsApp/Instagram | Toque em ⋮ / 🔗 → **Abrir no Chrome** |
| "manifest.json não encontrado (404)" | Você subiu só o `index.html` no repositório | Suba `index.html`, `manifest.json` e `service-worker.js` juntos na raiz |
| "Pasta icons não encontrada" | A pasta `icons/` não foi enviada | **Não é mais problema** — os ícones agora estão embutidos no `manifest.json` e o app instala igual. Se quiser, envie a pasta depois (só melhora o favicon) |
| Nenhum aviso, mas sem botão (Android) | Chrome às vezes não dispara o banner automático | Menu **⋮** do Chrome → **Instalar aplicativo** (o app também mostra essa dica sozinho) |
| iPhone | O Safari **nunca** mostra botão de instalar | Botão **Compartilhar** (↑) → **Adicionar à Tela de Início** |

> Dica: no Chrome do PC dá para conferir se o PWA está válido em
> **F12 → Application → Manifest**. Lá aparece qualquer erro de manifest,
> ícone ou service worker.

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
- **Atualizei o index.html mas o celular mostra o app velho:** a `VERSION`
  do `service-worker.js` já está em `v4`; se editar de novo, aumente
  (`v4` → `v5`) e recarregue.
- **Na TV ficou uma "tirinha fina" no meio da tela:** era o bug antigo —
  nesta versão o app detecta a TV pelo userAgent e força o layout de tela
  cheia em qualquer viewport. Atualize o `service-worker.js` (v4) e feche
  todas as abas para o Chrome pegar o index novo.
- **App travou no Downloader da TV:** o Downloader é um WebView limitado.
  Use o **TV Bro** (Android TV), **Silk** (Fire TV), **Samsung Internet**
  (Samsung) ou o navegador da LG — o próprio app mostra esse aviso quando
  detecta WebView.
- **Subi o manifest novo mas ainda não dá o botão instalar:** o Chrome
  guarda o manifest velho por um tempo. Feche TODAS as abas do app e
  abra o link de novo (ou espere uns minutos / teste em aba anônima).
- **iPhone não baixa volume pelo slider:** no iOS o volume segue os
  botões físicos do aparelho (o slider funciona no Android/desktop).
- **Stream caiu:** o app reconecta sozinho em 5s, sempre na ponta ao vivo.
