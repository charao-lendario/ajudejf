-- ═══════════════════════════════════════════════════════════════
-- Migration 006: Security Fix — RLS Hardening
-- Pentest Report: 2026-03-02 (Sidney Fernandes, SAIOS Cyber Squad)
-- Score Geral: HIGH 7.8
--
-- F01 (CRITICAL 9.1): SELECT sem RLS expoe PII de 93+ pessoas
-- F02 (HIGH 7.5): INSERT anonimo em tabelas criticas
-- ═══════════════════════════════════════════════════════════════


-- ── PHASE 1: Fix F01 — Remover SELECT publico de tabelas com PII ──

-- Voluntarios (73 registros com nome, telefone, bairro)
DROP POLICY IF EXISTS "select_publico" ON voluntarios;

-- Desaparecidos (informante_nome, informante_tel)
DROP POLICY IF EXISTS "select_publico" ON desaparecidos;

-- Pets Perdidos (contato_nome, contato_tel)
DROP POLICY IF EXISTS "select_publico" ON pets_perdidos;

-- Lares Temporarios (nome, telefone, endereco)
DROP POLICY IF EXISTS "select_publico" ON lares_temporarios;

-- Doadores (nome, telefone)
DROP POLICY IF EXISTS "select_publico_doadores" ON doadores;
DROP POLICY IF EXISTS "select_publico" ON doadores;


-- ── PHASE 2: Criar VIEWs publicas SEM PII ──

-- Voluntarios: mostra habilidades e disponibilidade, SEM dados pessoais
CREATE OR REPLACE VIEW voluntarios_public AS
SELECT id, cidade_id, habilidades, disponibilidade, veiculo, status, created_at
FROM voluntarios;

GRANT SELECT ON voluntarios_public TO anon;
GRANT SELECT ON voluntarios_public TO authenticated;


-- Desaparecidos: mostra descricao para ajudar a encontrar, SEM contato do informante
CREATE OR REPLACE VIEW desaparecidos_public AS
SELECT id, cidade_id, nome_pessoa, idade, descricao,
       ultima_vez_visto, local_visto, condicao_saude,
       status, created_at
FROM desaparecidos;

GRANT SELECT ON desaparecidos_public TO anon;
GRANT SELECT ON desaparecidos_public TO authenticated;


-- Pets Perdidos: mostra dados do pet, SEM contato do tutor
CREATE OR REPLACE VIEW pets_perdidos_public AS
SELECT id, cidade_id, nome_pet, especie, raca, cor, descricao,
       ultima_vez_visto, local_visto, foto_url,
       status, created_at
FROM pets_perdidos;

GRANT SELECT ON pets_perdidos_public TO anon;
GRANT SELECT ON pets_perdidos_public TO authenticated;


-- Lares Temporarios: mostra capacidade, SEM dados pessoais
-- (tabela pode ter colunas diferentes dependendo da criacao)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lares_temporarios') THEN
    EXECUTE 'CREATE OR REPLACE VIEW lares_temporarios_public AS
      SELECT id, cidade_id,
             CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = ''lares_temporarios'' AND column_name = ''vagas'') THEN NULL END AS _check
      FROM lares_temporarios';
  END IF;
END $$;

-- Vista simplificada — seleciona apenas colunas seguras que existem
DROP VIEW IF EXISTS lares_temporarios_public;

CREATE OR REPLACE VIEW lares_temporarios_public AS
SELECT lt.id, lt.cidade_id, lt.status, lt.created_at
FROM lares_temporarios lt;

GRANT SELECT ON lares_temporarios_public TO anon;
GRANT SELECT ON lares_temporarios_public TO authenticated;


-- Doadores: mostra o que oferecem, SEM dados pessoais
CREATE OR REPLACE VIEW doadores_public AS
SELECT id, cidade_id, oferece, obs, created_at
FROM doadores;

GRANT SELECT ON doadores_public TO anon;
GRANT SELECT ON doadores_public TO authenticated;


-- ── PHASE 3: Fix F02 — Remover INSERT anonimo ──
-- Todos os INSERTs agora passam por /api/notify (service_role_key)

DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'abrigos','pontos_doacao','desaparecidos',
    'pontos_alimentacao','comunidades','voluntarios'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "insert_publico" ON %I', t);
  END LOOP;
END $$;

-- Tabelas de migrations posteriores
DROP POLICY IF EXISTS "insert_publico" ON ongs_protetores;
DROP POLICY IF EXISTS "insert_publico" ON pets_perdidos;
DROP POLICY IF EXISTS "insert_anon_doadores" ON doadores;

-- Lares temporarios (se existir policy)
DROP POLICY IF EXISTS "insert_publico" ON lares_temporarios;


-- ══════════════════════════════════════════════════════════
-- RESUMO DAS POLICIES RESTANTES (pos-migration)
-- ══════════════════════════════════════════════════════════
--
-- cidades:             SELECT anon (dados de referencia, sem PII)
-- abrigos:             SELECT anon (organizacoes publicas) — via select_publico existente
-- pontos_doacao:       SELECT anon WHERE moderation_status='aprovado'
-- pontos_alimentacao:  SELECT anon (locais publicos)
-- comunidades:         SELECT anon (bairros publicos)
-- ongs_protetores:     SELECT anon (organizacoes publicas)
-- vaquinhas:           SELECT anon WHERE moderation_status='aprovado'
--
-- VIEWs (sem PII):
-- voluntarios_public, desaparecidos_public, pets_perdidos_public,
-- lares_temporarios_public, doadores_public
--
-- INSERT: Nenhuma tabela aceita INSERT anonimo
-- Todos os cadastros passam por /api/notify (service_role_key)
--
-- SELECT/UPDATE authenticated: mantido para futuro painel admin
-- ══════════════════════════════════════════════════════════
