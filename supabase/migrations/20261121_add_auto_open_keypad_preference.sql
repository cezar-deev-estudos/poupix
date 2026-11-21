-- ==============================================================================
-- MIGRATION: 20261121_add_auto_open_keypad_preference.sql
-- Descrição: Adiciona a coluna auto_open_keypad_on_mobile na tabela user_preferences
--            para permitir que o usuário configure se o teclado numérico virtual
--            abre automaticamente ao solicitar uma transação no mobile ou somente
--            quando o campo de valor for tocado.
-- ==============================================================================

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS auto_open_keypad_on_mobile BOOLEAN NOT NULL DEFAULT true;

-- Comentário da coluna
COMMENT ON COLUMN public.user_preferences.auto_open_keypad_on_mobile IS 'Define se o teclado numérico abre automaticamente ao abrir o modal de nova transação no mobile';
