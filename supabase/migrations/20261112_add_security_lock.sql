-- ==============================================================================
-- MIGRATION: 20261112_add_security_lock.sql
-- Descrição: Adiciona colunas para controle de bloqueio do app por PIN e Biometria
--            na tabela user_preferences.
-- ==============================================================================

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS app_lock_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS app_lock_pin_hash TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS app_lock_biometrics_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS app_lock_timeout_minutes INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.user_preferences.app_lock_enabled IS 'Indica se a tela de bloqueio do app está ativa';
COMMENT ON COLUMN public.user_preferences.app_lock_pin_hash IS 'Hash SHA-256 do PIN numérico de segurança';
COMMENT ON COLUMN public.user_preferences.app_lock_biometrics_enabled IS 'Indica se biometria (WebAuthn / Face ID / Digital) está habilitada';
COMMENT ON COLUMN public.user_preferences.app_lock_timeout_minutes IS 'Tempo de inatividade em minutos para bloquear (0 = imediato ao sair)';
