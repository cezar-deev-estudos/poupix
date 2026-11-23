-- ==============================================================================
-- MIGRATION: 20261123_add_manual_invoice_status_to_credit_cards.sql
-- Descrição: Adiciona coluna manual_invoice_status na tabela credit_cards
--            para persistência real do status de faturas no Supabase
-- ==============================================================================

ALTER TABLE public.credit_cards 
ADD COLUMN IF NOT EXISTS manual_invoice_status JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.credit_cards.manual_invoice_status IS 'Armazena overrides manuais de status da fatura por competência (ex: {"2026-11": "paid"})';
