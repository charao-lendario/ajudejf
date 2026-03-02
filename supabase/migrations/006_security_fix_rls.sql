-- ═══════════════════════════════════════════════════════════════
-- Migration 006: Security Fix — RLS Hardening
-- Pentest Report: 2026-03-02 (Sidney Fernandes, SAIOS Cyber Squad)
-- Score Geral: HIGH 7.8
--
-- F01 (CRITICAL 9.1): SELECT sem RLS expoe PII de 93+ pessoas
-- F02 (HIGH 7.5): INSERT anonimo em tabelas criticas
--
-- Tabelas existentes no banco:
-- abrigos, adocao, cidades, doadores, lares_temporarios,
-- ongs_protetores, pets_perdidos, pontos_alimentacao,
-- pontos_doacao, vaquinhas, voluntarios
-- (desaparecidos e comunidades NAO existem no banco)
-- ═══════════════════════════════════════════════════════════════

-- PHASE 1: Remover SELECT publico de tabelas com PII
DROP POLICY IF EXISTS "select_publico" ON voluntarios;
DROP POLICY IF EXISTS "select_publico" ON pets_perdidos;
DROP POLICY IF EXISTS "select_publico" ON lares_temporarios;
DROP POLICY IF EXISTS "select_publico_doadores" ON doadores;
DROP POLICY IF EXISTS "select_publico" ON doadores;

-- PHASE 2: Criar VIEWs publicas SEM PII
CREATE OR REPLACE VIEW voluntarios_public AS
SELECT id, cidade_id, habilidades, disponibilidade, veiculo, status, created_at
FROM voluntarios;

GRANT SELECT ON voluntarios_public TO anon;
GRANT SELECT ON voluntarios_public TO authenticated;

CREATE OR REPLACE VIEW pets_perdidos_public AS
SELECT id, cidade_id, nome_pet, especie, raca, cor, descricao,
       ultima_vez_visto, local_visto, foto_url,
       status, created_at
FROM pets_perdidos;

GRANT SELECT ON pets_perdidos_public TO anon;
GRANT SELECT ON pets_perdidos_public TO authenticated;

CREATE OR REPLACE VIEW lares_temporarios_public AS
SELECT id, cidade_id, status, created_at
FROM lares_temporarios;

GRANT SELECT ON lares_temporarios_public TO anon;
GRANT SELECT ON lares_temporarios_public TO authenticated;

CREATE OR REPLACE VIEW doadores_public AS
SELECT id, cidade_id, oferece, obs, created_at
FROM doadores;

GRANT SELECT ON doadores_public TO anon;
GRANT SELECT ON doadores_public TO authenticated;

-- PHASE 3: Remover INSERT anonimo
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'abrigos','pontos_doacao',
    'pontos_alimentacao','voluntarios'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "insert_publico" ON %I', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "insert_publico" ON ongs_protetores;
DROP POLICY IF EXISTS "insert_publico" ON pets_perdidos;
DROP POLICY IF EXISTS "insert_anon_doadores" ON doadores;
DROP POLICY IF EXISTS "insert_publico" ON lares_temporarios;
