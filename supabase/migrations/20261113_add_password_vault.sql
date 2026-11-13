-- ==============================================================================
-- Migration: 20261113_add_password_vault.sql
-- Descrição: Criação da tabela public.password_vault com criptografia e RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.password_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other', -- 'bank' | 'card' | 'email' | 'service' | 'other'
    username TEXT,
    password_encrypted TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    icon TEXT DEFAULT 'KeyRound',
    color TEXT DEFAULT '#10B981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_password_vault_user_id ON public.password_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_category ON public.password_vault(category);
CREATE INDEX IF NOT EXISTS idx_password_vault_title ON public.password_vault(title);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.password_vault ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS isolando estritamente por auth.uid()
CREATE POLICY "Users can view their own vault entries"
    ON public.password_vault
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vault entries"
    ON public.password_vault
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault entries"
    ON public.password_vault
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vault entries"
    ON public.password_vault
    FOR DELETE
    USING (auth.uid() = user_id);
