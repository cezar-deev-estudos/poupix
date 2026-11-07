-- ==============================================================================
-- MIGRATION: 20261106_add_initial_amount_to_transactions.sql
-- Descrição: Adiciona coluna initial_amount na tabela transactions
--            para registrar o valor inicial de partida de despesas decrescentes.
-- ==============================================================================

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS initial_amount NUMERIC(12, 2);

