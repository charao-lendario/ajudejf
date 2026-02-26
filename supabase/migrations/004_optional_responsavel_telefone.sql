-- ═══════════════════════════════════════════════════════════════
-- Migration 004: Torna responsável e telefone opcionais
-- Execute no SQL Editor do Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════

-- ── Abrigos ──
ALTER TABLE abrigos ALTER COLUMN responsavel DROP NOT NULL;
ALTER TABLE abrigos ALTER COLUMN telefone DROP NOT NULL;

-- ── Pontos de Doação ──
ALTER TABLE pontos_doacao ALTER COLUMN responsavel DROP NOT NULL;
ALTER TABLE pontos_doacao ALTER COLUMN telefone DROP NOT NULL;

-- ── Pontos de Alimentação ──
ALTER TABLE pontos_alimentacao ALTER COLUMN responsavel DROP NOT NULL;
ALTER TABLE pontos_alimentacao ALTER COLUMN telefone DROP NOT NULL;

-- ── Comunidades ──
ALTER TABLE comunidades ALTER COLUMN responsavel DROP NOT NULL;
ALTER TABLE comunidades ALTER COLUMN telefone DROP NOT NULL;

-- ── Voluntários ──
ALTER TABLE voluntarios ALTER COLUMN telefone DROP NOT NULL;

-- ── Doadores ──
ALTER TABLE doadores ALTER COLUMN telefone DROP NOT NULL;

-- ── Vaquinhas (responsavel já era NOT NULL) ──
ALTER TABLE vaquinhas ALTER COLUMN responsavel DROP NOT NULL;
