-- ═══════════════════════════════════════════════════════════════
-- Migration 002: Vaquinhas, Doadores e Moderação
-- Execute no SQL Editor do Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Adiciona moderation_status em pontos_doacao ──
ALTER TABLE pontos_doacao
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'aprovado';

-- Atualiza a política SELECT para filtrar por status
-- (entradas existentes e sem PIX ficam 'aprovado' pelo DEFAULT)
DROP POLICY IF EXISTS "select_publico" ON pontos_doacao;
CREATE POLICY "select_publico" ON pontos_doacao
  FOR SELECT TO anon USING (moderation_status = 'aprovado');

-- ── 2. Tabela de Vaquinhas ──
CREATE TABLE IF NOT EXISTS vaquinhas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id       uuid        REFERENCES cidades(id),
  nome_campanha   text        NOT NULL,
  descricao       text,
  link_vakinha    text        NOT NULL,
  responsavel     text        NOT NULL,
  telefone        text,
  pix_tipo        text,
  pix_chave       text,
  pix_titular     text,
  moderation_status text      NOT NULL DEFAULT 'pendente',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE vaquinhas ENABLE ROW LEVEL SECURITY;

-- anon só vê aprovadas
CREATE POLICY "select_aprovado_vaquinhas" ON vaquinhas
  FOR SELECT TO anon USING (moderation_status = 'aprovado');

-- ── 3. Tabela de Doadores (Quero Doar) ──
CREATE TABLE IF NOT EXISTS doadores (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id  uuid        REFERENCES cidades(id),
  nome       text        NOT NULL,
  telefone   text        NOT NULL,
  bairro     text,
  oferece    text[],
  obs        text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_anon_doadores" ON doadores
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "select_publico_doadores" ON doadores
  FOR SELECT TO anon USING (true);
