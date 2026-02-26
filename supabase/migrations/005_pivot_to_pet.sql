-- ═══════════════════════════════════════════════════════════════
-- Migration 005: Pivot de "Ajude JF" para "AjudePet"
-- Transforma schema de emergência humana para plataforma pet
-- Execute no SQL Editor do Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════
-- ROLLBACK: Ver comentários [ROLLBACK] em cada seção
-- ═══════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
-- PARTE 1: ALTERAÇÕES EM TABELAS EXISTENTES
-- ════════════════════════════════════════════════════════════════


-- ── 1.1 ABRIGOS: adaptar para abrigos de animais ──────────────
-- [ROLLBACK] ALTER TABLE abrigos ADD COLUMN IF NOT EXISTS aceita_animais text;
-- [ROLLBACK] ALTER TABLE abrigos RENAME COLUMN capacidade TO vagas;
-- [ROLLBACK] DROP COLUMN especies_aceitas, aceita_resgate, veterinario_disponivel;

-- Remover coluna aceita_animais (não faz mais sentido)
ALTER TABLE abrigos DROP COLUMN IF EXISTS aceita_animais;

-- Renomear vagas para capacidade
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'abrigos' AND column_name = 'vagas'
  ) THEN
    ALTER TABLE abrigos RENAME COLUMN vagas TO capacidade;
  END IF;
END $$;

-- Adicionar novas colunas pet
ALTER TABLE abrigos ADD COLUMN IF NOT EXISTS especies_aceitas text[] DEFAULT '{}';
ALTER TABLE abrigos ADD COLUMN IF NOT EXISTS aceita_resgate boolean DEFAULT true;
ALTER TABLE abrigos ADD COLUMN IF NOT EXISTS veterinario_disponivel text
  CHECK (veterinario_disponivel IN ('Sim', 'Não', 'Parceiro'));


-- ── 1.2 PONTOS DE ALIMENTAÇÃO: adaptar para comedouros pet ────
-- [ROLLBACK] ALTER TABLE pontos_alimentacao ADD COLUMN IF NOT EXISTS capacidade text;
-- [ROLLBACK] ALTER TABLE pontos_alimentacao ADD COLUMN IF NOT EXISTS refeicoes text[] DEFAULT '{}';
-- [ROLLBACK] DROP COLUMN tipo_alimento, atende_especies, frequencia_reposicao;

-- Remover colunas humanas
ALTER TABLE pontos_alimentacao DROP COLUMN IF EXISTS capacidade;
ALTER TABLE pontos_alimentacao DROP COLUMN IF EXISTS refeicoes;

-- Adicionar colunas pet
ALTER TABLE pontos_alimentacao ADD COLUMN IF NOT EXISTS tipo_alimento text[] DEFAULT '{}';
ALTER TABLE pontos_alimentacao ADD COLUMN IF NOT EXISTS atende_especies text[] DEFAULT '{}';
ALTER TABLE pontos_alimentacao ADD COLUMN IF NOT EXISTS frequencia_reposicao text;


-- ════════════════════════════════════════════════════════════════
-- PARTE 2: RENOMEAR TABELAS
-- ════════════════════════════════════════════════════════════════


-- ── 2.1 desaparecidos → pets_perdidos ─────────────────────────
-- [ROLLBACK] ALTER TABLE pets_perdidos RENAME TO desaparecidos;
-- [ROLLBACK] Restaurar colunas removidas e renomear de volta

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'desaparecidos') THEN
    ALTER TABLE desaparecidos RENAME TO pets_perdidos;
  END IF;
END $$;

-- Remover colunas humanas
ALTER TABLE pets_perdidos DROP COLUMN IF EXISTS idade;
ALTER TABLE pets_perdidos DROP COLUMN IF EXISTS condicao_saude;
ALTER TABLE pets_perdidos DROP COLUMN IF EXISTS informante_nome;
ALTER TABLE pets_perdidos DROP COLUMN IF EXISTS informante_tel;
ALTER TABLE pets_perdidos DROP COLUMN IF EXISTS relacao;

-- Renomear nome_pessoa → nome_pet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets_perdidos' AND column_name = 'nome_pessoa'
  ) THEN
    ALTER TABLE pets_perdidos RENAME COLUMN nome_pessoa TO nome_pet;
  END IF;
END $$;

-- Adicionar colunas pet
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS especie text;
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS raca text;
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS cor text;
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS porte text
  CHECK (porte IN ('Pequeno', 'Médio', 'Grande'));
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS sexo text
  CHECK (sexo IN ('Macho', 'Fêmea', 'Não sei'));
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS microchip text;
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS castrado text
  CHECK (castrado IN ('Sim', 'Não', 'Não sei'));
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS tutor_nome text;
ALTER TABLE pets_perdidos ADD COLUMN IF NOT EXISTS tutor_tel text;

-- Tornar especie NOT NULL (para registros existentes, preencher com default)
UPDATE pets_perdidos SET especie = 'Não informado' WHERE especie IS NULL;
ALTER TABLE pets_perdidos ALTER COLUMN especie SET NOT NULL;

-- Tornar tutor_nome NOT NULL (para registros existentes, migrar de nome_pet)
UPDATE pets_perdidos SET tutor_nome = 'Não informado' WHERE tutor_nome IS NULL;
ALTER TABLE pets_perdidos ALTER COLUMN tutor_nome SET NOT NULL;

-- Atualizar CHECK constraint de status
ALTER TABLE pets_perdidos DROP CONSTRAINT IF EXISTS desaparecidos_status_check;
ALTER TABLE pets_perdidos DROP CONSTRAINT IF EXISTS pets_perdidos_status_check;
ALTER TABLE pets_perdidos ADD CONSTRAINT pets_perdidos_status_check
  CHECK (status IN ('perdido', 'encontrado', 'arquivado'));

-- Atualizar dados existentes: mapear status antigos
UPDATE pets_perdidos SET status = 'perdido' WHERE status = 'desaparecido';

-- Atualizar indexes (renomear para nova tabela)
DROP INDEX IF EXISTS idx_desaparecidos_cidade;
DROP INDEX IF EXISTS idx_desaparecidos_status;
DROP INDEX IF EXISTS idx_desaparecidos_created;
CREATE INDEX IF NOT EXISTS idx_pets_perdidos_cidade  ON pets_perdidos(cidade_id);
CREATE INDEX IF NOT EXISTS idx_pets_perdidos_status  ON pets_perdidos(status);
CREATE INDEX IF NOT EXISTS idx_pets_perdidos_created ON pets_perdidos(created_at DESC);


-- ── 2.2 comunidades → ongs_protetores ─────────────────────────
-- [ROLLBACK] ALTER TABLE ongs_protetores RENAME TO comunidades;
-- [ROLLBACK] Restaurar colunas removidas e renomear de volta

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comunidades') THEN
    ALTER TABLE comunidades RENAME TO ongs_protetores;
  END IF;
END $$;

-- Remover colunas humanas
ALTER TABLE ongs_protetores DROP COLUMN IF EXISTS familias;

-- Adicionar colunas pet
ALTER TABLE ongs_protetores ADD COLUMN IF NOT EXISTS tipo text;
ALTER TABLE ongs_protetores ADD COLUMN IF NOT EXISTS animais_atendidos integer DEFAULT 0;
ALTER TABLE ongs_protetores ADD COLUMN IF NOT EXISTS especies text[] DEFAULT '{}';
ALTER TABLE ongs_protetores ADD COLUMN IF NOT EXISTS site text;
ALTER TABLE ongs_protetores ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE ongs_protetores ADD COLUMN IF NOT EXISTS cnpj text;

-- Tornar tipo NOT NULL (para registros existentes, preencher com default)
UPDATE ongs_protetores SET tipo = 'Protetor Independente' WHERE tipo IS NULL;
ALTER TABLE ongs_protetores ALTER COLUMN tipo SET NOT NULL;
ALTER TABLE ongs_protetores ADD CONSTRAINT ongs_protetores_tipo_check
  CHECK (tipo IN ('ONG', 'Protetor Independente', 'Grupo de Resgate', 'Associação'));

-- Converter necessidades de text para text[] se necessário
-- A coluna original era text[], então mantemos como está

-- Atualizar indexes (renomear para nova tabela)
DROP INDEX IF EXISTS idx_comunidades_cidade;
DROP INDEX IF EXISTS idx_comunidades_status;
DROP INDEX IF EXISTS idx_comunidades_prioridade;
DROP INDEX IF EXISTS idx_comunidades_created;
CREATE INDEX IF NOT EXISTS idx_ongs_prot_cidade     ON ongs_protetores(cidade_id);
CREATE INDEX IF NOT EXISTS idx_ongs_prot_status     ON ongs_protetores(status);
CREATE INDEX IF NOT EXISTS idx_ongs_prot_prioridade ON ongs_protetores(prioridade);
CREATE INDEX IF NOT EXISTS idx_ongs_prot_created    ON ongs_protetores(created_at DESC);


-- ════════════════════════════════════════════════════════════════
-- PARTE 3: CRIAR TABELAS NOVAS
-- ════════════════════════════════════════════════════════════════


-- ── 3.1 ADOÇÃO ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adocao (
  id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              timestamptz DEFAULT now() NOT NULL,
  updated_at              timestamptz DEFAULT now() NOT NULL,
  cidade_id               smallint    NOT NULL REFERENCES cidades(id),
  nome_pet                text        NOT NULL,
  especie                 text        NOT NULL,
  raca                    text,
  cor                     text,
  porte                   text        CHECK (porte IN ('Pequeno', 'Médio', 'Grande')),
  sexo                    text        CHECK (sexo IN ('Macho', 'Fêmea')),
  idade_estimada          text,
  castrado                text        CHECK (castrado IN ('Sim', 'Não', 'Agendado')),
  vacinado                text        CHECK (vacinado IN ('Sim', 'Não', 'Parcialmente')),
  descricao               text,
  necessidades_especiais  text,
  responsavel             text        NOT NULL,
  telefone                text,
  foto_url                text,
  obs                     text,
  status                  text        DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_processo', 'adotado'))
);

CREATE INDEX IF NOT EXISTS idx_adocao_cidade  ON adocao(cidade_id);
CREATE INDEX IF NOT EXISTS idx_adocao_status  ON adocao(status);
CREATE INDEX IF NOT EXISTS idx_adocao_created ON adocao(created_at DESC);

DROP TRIGGER IF EXISTS trg_adocao_updated_at ON adocao;
CREATE TRIGGER trg_adocao_updated_at
  BEFORE UPDATE ON adocao
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 3.2 LARES TEMPORÁRIOS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS lares_temporarios (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  cidade_id           smallint    NOT NULL REFERENCES cidades(id),
  responsavel         text        NOT NULL,
  telefone            text,
  endereco            text        NOT NULL,
  bairro              text,
  especies_aceitas    text[]      DEFAULT '{}',
  capacidade          integer     DEFAULT 1,
  disponivel          boolean     DEFAULT true,
  tem_outros_animais  boolean     DEFAULT false,
  tem_criancas        boolean     DEFAULT false,
  experiencia         text        CHECK (experiencia IN ('Sim, já fiz lar temporário', 'Sim, tenho pets', 'Não, primeira vez')),
  obs                 text,
  status              text        DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'ocupado', 'inativo'))
);

CREATE INDEX IF NOT EXISTS idx_lares_temp_cidade  ON lares_temporarios(cidade_id);
CREATE INDEX IF NOT EXISTS idx_lares_temp_status  ON lares_temporarios(status);
CREATE INDEX IF NOT EXISTS idx_lares_temp_created ON lares_temporarios(created_at DESC);

DROP TRIGGER IF EXISTS trg_lares_temp_updated_at ON lares_temporarios;
CREATE TRIGGER trg_lares_temp_updated_at
  BEFORE UPDATE ON lares_temporarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ════════════════════════════════════════════════════════════════
-- PARTE 4: ATUALIZAR RLS POLICIES
-- ════════════════════════════════════════════════════════════════

-- ── 4.1 Remover policies antigas das tabelas renomeadas ───────

-- Policies da antiga desaparecidos (agora pets_perdidos)
DROP POLICY IF EXISTS "insert_publico" ON pets_perdidos;
DROP POLICY IF EXISTS "select_publico" ON pets_perdidos;
DROP POLICY IF EXISTS "select_autenticado" ON pets_perdidos;
DROP POLICY IF EXISTS "update_autenticado" ON pets_perdidos;

-- Policies da antiga comunidades (agora ongs_protetores)
DROP POLICY IF EXISTS "insert_publico" ON ongs_protetores;
DROP POLICY IF EXISTS "select_publico" ON ongs_protetores;
DROP POLICY IF EXISTS "select_autenticado" ON ongs_protetores;
DROP POLICY IF EXISTS "update_autenticado" ON ongs_protetores;


-- ── 4.2 Habilitar RLS nas tabelas novas e renomeadas ─────────
ALTER TABLE pets_perdidos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE adocao             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lares_temporarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ongs_protetores    ENABLE ROW LEVEL SECURITY;


-- ── 4.3 Criar policies para tabelas renomeadas e novas ───────

-- pets_perdidos: SELECT público (sem moderação), INSERT público
CREATE POLICY "insert_publico" ON pets_perdidos
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_publico" ON pets_perdidos
  FOR SELECT TO anon USING (true);
CREATE POLICY "select_autenticado" ON pets_perdidos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_autenticado" ON pets_perdidos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- adocao: SELECT público (sem moderação), INSERT público
CREATE POLICY "insert_publico" ON adocao
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_publico" ON adocao
  FOR SELECT TO anon USING (true);
CREATE POLICY "select_autenticado" ON adocao
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_autenticado" ON adocao
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- lares_temporarios: SELECT público (sem moderação), INSERT público
CREATE POLICY "insert_publico" ON lares_temporarios
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_publico" ON lares_temporarios
  FOR SELECT TO anon USING (true);
CREATE POLICY "select_autenticado" ON lares_temporarios
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_autenticado" ON lares_temporarios
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ongs_protetores: SELECT público (sem moderação), INSERT público
CREATE POLICY "insert_publico" ON ongs_protetores
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_publico" ON ongs_protetores
  FOR SELECT TO anon USING (true);
CREATE POLICY "select_autenticado" ON ongs_protetores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_autenticado" ON ongs_protetores
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════
-- PARTE 5: STORAGE — Bucket para fotos de pets
-- ════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-fotos',
  'pet-fotos',
  true,
  2097152,  -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Política de upload público para pet-fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'upload_publico_pet_fotos'
  ) THEN
    CREATE POLICY "upload_publico_pet_fotos"
      ON storage.objects FOR INSERT TO anon
      WITH CHECK (bucket_id = 'pet-fotos');
  END IF;
END $$;

-- Política de leitura pública para pet-fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'select_publico_pet_fotos'
  ) THEN
    CREATE POLICY "select_publico_pet_fotos"
      ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'pet-fotos');
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- PARTE 6: ATUALIZAR COMENTÁRIOS
-- ════════════════════════════════════════════════════════════════

COMMENT ON TABLE cidades            IS 'Cidades atendidas pela plataforma AjudePet';
COMMENT ON TABLE abrigos            IS 'Abrigos que recebem animais resgatados ou abandonados';
COMMENT ON TABLE pontos_doacao      IS 'Pontos físicos de coleta de doações pet + dados PIX';
COMMENT ON TABLE pets_perdidos      IS 'Pets perdidos reportados pela comunidade';
COMMENT ON TABLE adocao             IS 'Animais disponíveis para adoção responsável';
COMMENT ON TABLE lares_temporarios  IS 'Lares temporários disponíveis para acolher animais';
COMMENT ON TABLE pontos_alimentacao IS 'Comedouros e pontos de alimentação para animais de rua';
COMMENT ON TABLE ongs_protetores    IS 'ONGs, protetores independentes e grupos de resgate';
COMMENT ON TABLE voluntarios        IS 'Pessoas disponíveis para ajudar como voluntárias (pet)';
COMMENT ON TABLE vaquinhas          IS 'Campanhas de arrecadação (vaquinhas online)';
COMMENT ON TABLE doadores           IS 'Pessoas que querem doar itens para animais';
