-- ==============================================================================
-- MIGRATION: 20261102_user_settings_and_filters.sql
-- Descrição: Criação das tabelas user_preferences e saved_transaction_filters
--            para eliminação definitiva de dados no localStorage e user_metadata.
-- ==============================================================================

-- 1. TABELA: user_preferences (Preferências gerais, layout do dashboard e orçamentos)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark',
    language TEXT NOT NULL DEFAULT 'pt-BR',
    currency TEXT NOT NULL DEFAULT 'BRL',
    receive_notifications BOOLEAN NOT NULL DEFAULT true,
    financial_alerts BOOLEAN NOT NULL DEFAULT true,
    dashboard_layout_desktop JSONB DEFAULT '{
      "left": ["summary", "flow_calendar", "accounts"],
      "right": ["invoices", "goals", "budget_preview"]
    }'::jsonb,
    dashboard_layout_mobile JSONB DEFAULT '["summary", "accounts", "invoices", "goals"]'::jsonb,
    budgets_layout_columns TEXT NOT NULL DEFAULT '2col',
    group_by_card BOOLEAN NOT NULL DEFAULT false,
    desktop_category_order TEXT[] DEFAULT '{}',
    mobile_category_order TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS em user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para user_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
ON public.user_preferences FOR DELETE 
USING (auth.uid() = user_id);


-- 2. TABELA: saved_transaction_filters (Filtros salvos na tela de transações)
CREATE TABLE IF NOT EXISTS public.saved_transaction_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scope TEXT DEFAULT 'monthly', -- 'monthly' | 'yearly' | 'custom' | 'all'
    year INT,
    month INT,
    type TEXT, -- 'expense' | 'income' | 'transfer'
    status TEXT, -- 'all' | 'paid' | 'pending'
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sub_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    tag TEXT,
    search_query TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS em saved_transaction_filters
ALTER TABLE public.saved_transaction_filters ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para saved_transaction_filters
CREATE POLICY "Users can view their own saved filters" 
ON public.saved_transaction_filters FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved filters" 
ON public.saved_transaction_filters FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters" 
ON public.saved_transaction_filters FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters" 
ON public.saved_transaction_filters FOR DELETE 
USING (auth.uid() = user_id);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON public.saved_transaction_filters(user_id);

