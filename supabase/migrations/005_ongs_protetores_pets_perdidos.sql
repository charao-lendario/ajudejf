-- ═══════════════════════════════════════════════════════════════
-- Migration 005 — ONGs/Protetores + Pets Perdidos
-- Novas tabelas com suporte a foto (URL do Supabase Storage)
-- ═══════════════════════════════════════════════════════════════


-- ── 1. ONGs / PROTETORES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ongs_protetores (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  cidade_id       smallint    NOT NULL REFERENCES cidades(id),
  nome            text        NOT NULL,
  tipo            text        NOT NULL CHECK (tipo IN ('ONG', 'Protetor independente')),
  telefone        text,
  endereco        text,
  descricao       text        NOT NULL,
  animais_aceitos text[]      DEFAULT '{}',
  capacidade      text,
  necessidades    text,
  foto_url        text,
  obs             text,
  status          text        DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo'))
);

CREATE INDEX IF NOT EXISTS idx_ongs_protetores_cidade  ON ongs_protetores(cidade_id);
CREATE INDEX IF NOT EXISTS idx_ongs_protetores_tipo    ON ongs_protetores(tipo);
CREATE INDEX IF NOT EXISTS idx_ongs_protetores_status  ON ongs_protetores(status);
CREATE INDEX IF NOT EXISTS idx_ongs_protetores_created ON ongs_protetores(created_at DESC);

CREATE TRIGGER trg_ongs_protetores_updated_at
  BEFORE UPDATE ON ongs_protetores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE ongs_protetores IS 'ONGs e protetores independentes de animais';


-- ── 2. PETS PERDIDOS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pets_perdidos (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL,
  cidade_id         smallint    NOT NULL REFERENCES cidades(id),
  nome_pet          text        NOT NULL,
  especie           text        NOT NULL CHECK (especie IN ('Cão', 'Gato', 'Outro')),
  raca              text,
  cor               text        NOT NULL,
  descricao         text        NOT NULL,
  ultima_vez_visto  timestamptz,
  local_visto       text        NOT NULL,
  contato_nome      text        NOT NULL,
  contato_tel       text        NOT NULL,
  foto_url          text,
  obs               text,
  status            text        DEFAULT 'perdido' CHECK (status IN ('perdido', 'encontrado', 'arquivado'))
);

CREATE INDEX IF NOT EXISTS idx_pets_perdidos_cidade  ON pets_perdidos(cidade_id);
CREATE INDEX IF NOT EXISTS idx_pets_perdidos_especie ON pets_perdidos(especie);
CREATE INDEX IF NOT EXISTS idx_pets_perdidos_status  ON pets_perdidos(status);
CREATE INDEX IF NOT EXISTS idx_pets_perdidos_created ON pets_perdidos(created_at DESC);

CREATE TRIGGER trg_pets_perdidos_updated_at
  BEFORE UPDATE ON pets_perdidos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE pets_perdidos IS 'Pets perdidos reportados pela comunidade';


-- ── 3. RLS ──────────────────────────────────────────────────────
ALTER TABLE ongs_protetores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets_perdidos   ENABLE ROW LEVEL SECURITY;

-- INSERT público (anon)
CREATE POLICY "insert_publico" ON ongs_protetores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "insert_publico" ON pets_perdidos   FOR INSERT TO anon WITH CHECK (true);

-- SELECT público (anon) — dados são públicos
CREATE POLICY "select_publico" ON ongs_protetores FOR SELECT TO anon USING (true);
CREATE POLICY "select_publico" ON pets_perdidos   FOR SELECT TO anon USING (true);

-- SELECT e UPDATE para autenticados (futuro painel admin)
CREATE POLICY "select_autenticado" ON ongs_protetores FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_autenticado" ON ongs_protetores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "select_autenticado" ON pets_perdidos   FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_autenticado" ON pets_perdidos   FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- ── 4. STORAGE BUCKETS (executar via Dashboard ou CLI) ──────────
-- Os buckets precisam ser criados manualmente no Supabase Dashboard:
--   1. Bucket: fotos-ongs   (public: true, max: 2MB, MIME: image/png, image/jpeg, image/webp)
--   2. Bucket: fotos-pets   (public: true, max: 2MB, MIME: image/png, image/jpeg, image/webp)
--
-- Policies de Storage (criar no Dashboard > Storage > Policies):
--   - anon pode INSERT (upload)
--   - anon pode SELECT (visualizar)
--   - authenticated pode DELETE/UPDATE
