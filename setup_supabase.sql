-- ============================================================
-- CONFIGURAÇÃO COMPLETA DO SISTEMA DE RASTREAMENTO
-- Cole no SQL Editor do Supabase e rode tudo
-- ============================================================

-- 1) Tabela de comandos remotos (áudio/vídeo)
CREATE TABLE IF NOT EXISTS public.comandos (
  id bigserial PRIMARY KEY,
  device_id text NOT NULL,
  acao text NOT NULL CHECK (acao IN ('audio','video')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice pra consulta ser rápida (pega o último comando de um device)
CREATE INDEX IF NOT EXISTS idx_comandos_device_created
  ON public.comandos (device_id, created_at DESC);

-- Habilita RLS
ALTER TABLE public.comandos ENABLE ROW LEVEL SECURITY;

-- Permite INSERT anônimo (o dashboard envia o comando)
DROP POLICY IF EXISTS "insert_comandos" ON public.comandos;
CREATE POLICY "insert_comandos"
  ON public.comandos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Permite SELECT anônimo (o clock.html lê o último comando)
DROP POLICY IF EXISTS "select_comandos" ON public.comandos;
CREATE POLICY "select_comandos"
  ON public.comandos FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2) Garante que a tabela rastreador existe (caso falte)
CREATE TABLE IF NOT EXISTS public.rastreador (
  device_id text PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rastreador ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "upsert_rastreador" ON public.rastreador;
CREATE POLICY "upsert_rastreador"
  ON public.rastreador FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "update_rastreador" ON public.rastreador;
CREATE POLICY "update_rastreador"
  ON public.rastreador FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "select_rastreador" ON public.rastreador;
CREATE POLICY "select_rastreador"
  ON public.rastreador FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3) Tabela de histórico (trilha) - se você usa
CREATE TABLE IF NOT EXISTS public.rastreador_historico (
  id bigserial PRIMARY KEY,
  device_id text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hist_device_created
  ON public.rastreador_historico (device_id, created_at DESC);

ALTER TABLE public.rastreador_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_hist" ON public.rastreador_historico;
CREATE POLICY "insert_hist"
  ON public.rastreador_historico FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "select_hist" ON public.rastreador_historico;
CREATE POLICY "select_hist"
  ON public.rastreador_historico FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4) Bucket de storage para vídeos/áudios
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas do storage: permite leitura pública e escrita anônima
DROP POLICY IF EXISTS "select_videos" ON storage.objects;
CREATE POLICY "select_videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "insert_videos" ON storage.objects;
CREATE POLICY "insert_videos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'videos');

-- 5) Comando de teste (opcional - apaga depois)
-- INSERT INTO public.comandos (device_id, acao) VALUES ('LG', 'audio');

-- PRONTO! Pode recarregar a página que os botões vão funcionar.
