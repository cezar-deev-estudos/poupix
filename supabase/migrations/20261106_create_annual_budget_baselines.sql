-- ==============================================================================
-- Migration: Criação da Tabela de Baselines do Orçamento Anual (Snapshots)
-- Descrição: Permite salvar a foto congelada da Matriz Horizontal Anual
--            (Plano Original + até 2 Revisões por ano) com isolamento por usuário (RLS).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.annual_budget_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('original', 'revision')),
    revision_number INTEGER DEFAULT NULL,
    title TEXT NOT NULL,
    notes TEXT DEFAULT NULL,
    matrix_snapshot JSONB NOT NULL,
    summary_totals JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance para busca rápida por usuário e ano
CREATE INDEX IF NOT EXISTS idx_annual_baselines_user_year 
    ON public.annual_budget_baselines(user_id, year);

CREATE INDEX IF NOT EXISTS idx_annual_baselines_user_year_type 
    ON public.annual_budget_baselines(user_id, year, type);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.annual_budget_baselines ENABLE ROW LEVEL SECURITY;

-- Política de RLS: o usuário só enxerga, cria, altera e exclui seus próprios snapshots
DROP POLICY IF EXISTS "Users can manage their own budget baselines" ON public.annual_budget_baselines;
CREATE POLICY "Users can manage their own budget baselines"
    ON public.annual_budget_baselines
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

