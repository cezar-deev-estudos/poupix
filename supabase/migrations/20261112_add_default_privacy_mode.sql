-- ==============================================================================
-- MIGRATION: 20261112_add_default_privacy_mode.sql
-- Descrição: Adiciona a coluna default_privacy_mode na tabela user_preferences
--            para permitir que o usuário defina se o sistema sempre deve abrir
--            com valores ocultos (olhinho fechado) por padrão no desktop e mobile.
-- ==============================================================================

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS default_privacy_mode BOOLEAN NOT NULL DEFAULT false;

-- Comentário da coluna
COMMENT ON COLUMN public.user_preferences.default_privacy_mode IS 'Define se o sistema inicia sempre com o modo de privacidade ativo (valores ocultos) por padrão';
