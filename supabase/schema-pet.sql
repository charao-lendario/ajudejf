-- ═══════════════════════════════════════════════════════════════
-- AjudePet — Schema completo v1
-- Plataforma de apoio a animais
-- Rodar no SQL Editor do Supabase Dashboard (schema limpo)
-- ═══════════════════════════════════════════════════════════════


-- ── 0. LIMPAR SCHEMA ANTERIOR (apenas para deploy limpo) ──────
DROP TABLE IF EXISTS registros CASCADE;
DROP TABLE IF EXISTS desaparecidos CASCADE;
DROP TABLE IF EXISTS comunidades CASCADE;


-- ── 1. CIDADES (referência) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS cidades (
  id    smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome  text NOT NULL UNIQUE
);

INSERT INTO cidades (nome) VALUES
  ('Juiz de Fora'),
  ('Ubá'),
  ('Senador Firmino'),
  ('Matias Barbosa')
ON CONFLICT (nome) DO NOTHING;


-- ── 2. TRIGGER: updated_at automático ───────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── 3. ABRIGOS (abrigos de animais) ────────────────────────────
CREATE TABLE IF NOT EXISTS abrigos (
  id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              timestamptz DEFAULT now() NOT NULL,
  updated_at              timestamptz DEFAULT now() NOT NULL,
  cidade_id               smallint    NOT NULL REFERENCES cidades(id),
  nome_local              text        NOT NULL,
  responsavel             text,
  telefone                text,
  endereco                text        NOT NULL,
  capacidade              integer     DEFAULT 0 CHECK (capacidade >= 0),
  especies_aceitas        text[]      DEFAULT '{}',
  recursos                text[]      DEFAULT '{}',
  aceita_resgate          boolean     DEFAULT true,
  veterinario_disponivel  text        CHECK (veterinario_disponivel IN ('Sim', 'Não', 'Parceiro')),
  necessidades            text,
  nao_precisa             text,
  prioridade              text        NOT NULL CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
  obs                     text,
  status                  text        DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'resolvido'))
);

CREATE INDEX IF NOT EXISTS idx_abrigos_cidade     ON abrigos(cidade_id);
CREATE INDEX IF NOT EXISTS idx_abrigos_status     ON abrigos(status);
CREATE INDEX IF NOT EXISTS idx_abrigos_prioridade ON abrigos(prioridade);
CREATE INDEX IF NOT EXISTS idx_abrigos_created    ON abrigos(created_at DESC);

CREATE TRIGGER trg_abrigos_updated_at
  BEFORE UPDATE ON abrigos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 4. PONTOS DE DOAÇÃO (doações pet) ──────────────────────────
CREATE TABLE IF NOT EXISTS pontos_doacao (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL,
  cidade_id         smallint    NOT NULL REFERENCES cidades(id),
  nome_local        text        NOT NULL,
  responsavel       text,
  telefone          text,
  endereco          text        NOT NULL,
  horario           text,
  aceita            text[]      DEFAULT '{}',
  pix_tipo          text        CHECK (pix_tipo IN ('CPF', 'CNPJ', 'E-mail', 'Telefone', 'Chave aleatória')),
  pix_chave         text,
  pix_titular       text,
  pix_qrcode_url    text,
  moderation_status text        NOT NULL DEFAULT 'aprovado',
  obs               text,
  status            text        DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'resolvido'))
);

CREATE INDEX IF NOT EXISTS idx_pontos_doacao_cidade  ON pontos_doacao(cidade_id);
CREATE INDEX IF NOT EXISTS idx_pontos_doacao_status  ON pontos_doacao(status);
CREATE INDEX IF NOT EXISTS idx_pontos_doacao_created ON pontos_doacao(created_at DESC);

CREATE TRIGGER trg_pontos_doacao_updated_at
  BEFORE UPDATE ON pontos_doacao
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 5. PETS PERDIDOS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pets_perdidos (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL,
  cidade_id         smallint    NOT NULL REFERENCES cidades(id),
  nome_pet          text        NOT NULL,
  especie           text        NOT NULL,
  raca              text,
  cor               text,
  porte             text        CHECK (porte IN ('Pequeno', 'Médio', 'Grande')),
  sexo              text        CHECK (sexo IN ('Macho', 'Fêmea', 'Não sei')),
  microchip         text,
  castrado          text        CHECK (castrado IN ('Sim', 'Não', 'Não sei')),
  descricao         text,
  ultima_vez_visto  timestamptz,
  local_visto       text,
  foto_url          text,
  tutor_nome        text        NOT NULL,
  tutor_tel         text,
  obs               text,
  status            text        DEFAULT 'perdido' CHECK (status IN ('perdido', 'encontrado', 'arquivado'))
);

CREATE INDEX IF NOT EXISTS idx_pets_perdidos_cidade  ON pets_perdidos(cidade_id);
CREATE INDEX IF NOT EXISTS idx_pets_perdidos_status  ON pets_perdidos(status);
CREATE INDEX IF NOT EXISTS idx_pets_perdidos_created ON pets_perdidos(created_at DESC);

CREATE TRIGGER trg_pets_perdidos_updated_at
  BEFORE UPDATE ON pets_perdidos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 6. ADOÇÃO ───────────────────────────────────────────────────
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

CREATE TRIGGER trg_adocao_updated_at
  BEFORE UPDATE ON adocao
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 7. LARES TEMPORÁRIOS ────────────────────────────────────────
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

CREATE TRIGGER trg_lares_temp_updated_at
  BEFORE UPDATE ON lares_temporarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 8. PONTOS DE ALIMENTAÇÃO (comedouros pet) ──────────────────
CREATE TABLE IF NOT EXISTS pontos_alimentacao (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL,
  cidade_id             smallint    NOT NULL REFERENCES cidades(id),
  nome_local            text        NOT NULL,
  responsavel           text,
  telefone              text,
  endereco              text        NOT NULL,
  horario               text,
  tipo_alimento         text[]      DEFAULT '{}',
  atende_especies       text[]      DEFAULT '{}',
  frequencia_reposicao  text,
  precisa_voluntarios   text        CHECK (precisa_voluntarios IN ('Sim, urgente', 'Sim, mas não urgente', 'Não')),
  necessidades          text,
  obs                   text,
  status                text        DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'resolvido'))
);

CREATE INDEX IF NOT EXISTS idx_pontos_alim_cidade  ON pontos_alimentacao(cidade_id);
CREATE INDEX IF NOT EXISTS idx_pontos_alim_status  ON pontos_alimentacao(status);
CREATE INDEX IF NOT EXISTS idx_pontos_alim_created ON pontos_alimentacao(created_at DESC);

CREATE TRIGGER trg_pontos_alim_updated_at
  BEFORE UPDATE ON pontos_alimentacao
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 9. ONGs E PROTETORES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ongs_protetores (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  cidade_id           smallint    NOT NULL REFERENCES cidades(id),
  nome_local          text        NOT NULL,
  tipo                text        NOT NULL CHECK (tipo IN ('ONG', 'Protetor Independente', 'Grupo de Resgate', 'Associação')),
  responsavel         text,
  telefone            text,
  endereco            text        NOT NULL,
  animais_atendidos   integer     DEFAULT 0,
  especies            text[]      DEFAULT '{}',
  necessidades        text[]      DEFAULT '{}',
  nao_precisa         text,
  prioridade          text        NOT NULL CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
  site                text,
  instagram           text,
  cnpj                text,
  obs                 text,
  status              text        DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'resolvido'))
);

CREATE INDEX IF NOT EXISTS idx_ongs_prot_cidade     ON ongs_protetores(cidade_id);
CREATE INDEX IF NOT EXISTS idx_ongs_prot_status     ON ongs_protetores(status);
CREATE INDEX IF NOT EXISTS idx_ongs_prot_prioridade ON ongs_protetores(prioridade);
CREATE INDEX IF NOT EXISTS idx_ongs_prot_created    ON ongs_protetores(created_at DESC);

CREATE TRIGGER trg_ongs_prot_updated_at
  BEFORE UPDATE ON ongs_protetores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 10. VOLUNTÁRIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voluntarios (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  cidade_id       smallint    NOT NULL REFERENCES cidades(id),
  nome            text        NOT NULL,
  telefone        text,
  bairro          text,
  veiculo         text        CHECK (veiculo IN ('Sim, carro', 'Sim, moto', 'Não')),
  habilidades     text[]      DEFAULT '{}',
  disponibilidade text,
  obs             text,
  status          text        DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'alocado', 'inativo'))
);

CREATE INDEX IF NOT EXISTS idx_voluntarios_cidade  ON voluntarios(cidade_id);
CREATE INDEX IF NOT EXISTS idx_voluntarios_status  ON voluntarios(status);
CREATE INDEX IF NOT EXISTS idx_voluntarios_created ON voluntarios(created_at DESC);

CREATE TRIGGER trg_voluntarios_updated_at
  BEFORE UPDATE ON voluntarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 11. VAQUINHAS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vaquinhas (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz DEFAULT now() NOT NULL,
  cidade_id         smallint    REFERENCES cidades(id),
  nome_campanha     text        NOT NULL,
  descricao         text,
  link_vakinha      text        NOT NULL,
  responsavel       text,
  telefone          text,
  pix_tipo          text,
  pix_chave         text,
  pix_titular       text,
  pix_qrcode_url    text,
  moderation_status text        NOT NULL DEFAULT 'pendente'
);

CREATE INDEX IF NOT EXISTS idx_vaquinhas_cidade  ON vaquinhas(cidade_id);
CREATE INDEX IF NOT EXISTS idx_vaquinhas_created ON vaquinhas(created_at DESC);


-- ── 12. DOADORES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doadores (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  cidade_id  smallint    REFERENCES cidades(id),
  nome       text        NOT NULL,
  telefone   text,
  bairro     text,
  oferece    text[],
  obs        text
);

CREATE INDEX IF NOT EXISTS idx_doadores_cidade  ON doadores(cidade_id);
CREATE INDEX IF NOT EXISTS idx_doadores_created ON doadores(created_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- RLS — TODAS AS TABELAS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE cidades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE abrigos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_doacao      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets_perdidos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE adocao             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lares_temporarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_alimentacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE ongs_protetores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE voluntarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaquinhas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE doadores           ENABLE ROW LEVEL SECURITY;

-- cidades: leitura pública (necessário para selects nos formulários)
CREATE POLICY "cidades_select_publico"
  ON cidades FOR SELECT TO anon USING (true);

-- INSERT público (anon) em todas as tabelas de cadastro
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'abrigos','pontos_doacao','pets_perdidos','adocao',
    'lares_temporarios','pontos_alimentacao','ongs_protetores',
    'voluntarios','doadores'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY "insert_publico" ON %I FOR INSERT TO anon WITH CHECK (true)', t
    );
  END LOOP;
END $$;

-- SELECT público (anon) para tabelas sem moderação
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'abrigos','pets_perdidos','adocao','lares_temporarios',
    'pontos_alimentacao','ongs_protetores','voluntarios','doadores'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY "select_publico" ON %I FOR SELECT TO anon USING (true)', t
    );
  END LOOP;
END $$;

-- SELECT público com filtro de moderação (pontos_doacao e vaquinhas)
CREATE POLICY "select_publico" ON pontos_doacao
  FOR SELECT TO anon USING (moderation_status = 'aprovado');

CREATE POLICY "select_aprovado_vaquinhas" ON vaquinhas
  FOR SELECT TO anon USING (moderation_status = 'aprovado');

-- INSERT público para vaquinhas (não incluída no loop acima)
CREATE POLICY "insert_publico" ON vaquinhas
  FOR INSERT TO anon WITH CHECK (true);

-- SELECT e UPDATE apenas para autenticados (painel admin)
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'abrigos','pontos_doacao','pets_perdidos','adocao',
    'lares_temporarios','pontos_alimentacao','ongs_protetores',
    'voluntarios','vaquinhas','doadores'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY "select_autenticado" ON %I FOR SELECT TO authenticated USING (true)', t
    );
    EXECUTE format(
      'CREATE POLICY "update_autenticado" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t
    );
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- STORAGE — Buckets para imagens
-- ═══════════════════════════════════════════════════════════════

-- Bucket para QR Codes PIX (mantido do schema original)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pix-qrcodes',
  'pix-qrcodes',
  true,
  524288,  -- 512KB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos de pets (perdidos e adoção)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-fotos',
  'pet-fotos',
  true,
  2097152,  -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Política de upload público para pet-fotos
CREATE POLICY "upload_publico_pet_fotos"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'pet-fotos');

-- Política de leitura pública para pet-fotos
CREATE POLICY "select_publico_pet_fotos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'pet-fotos');


-- ═══════════════════════════════════════════════════════════════
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ═══════════════════════════════════════════════════════════════
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
