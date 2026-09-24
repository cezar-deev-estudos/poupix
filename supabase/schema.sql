-- ==============================================================================
-- POUPIX PRO - MODELAGEM DE BANCO DE DADOS POSTGRESQL (SUPABASE)
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABELA: profiles (Perfis de Usuários)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member' | 'guest'
    currency TEXT NOT NULL DEFAULT 'BRL',
    monthly_income_target NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABELA: accounts (Contas Bancárias e Carteiras)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    color TEXT NOT NULL DEFAULT '#10B981',
    institution TEXT,
    include_in_total BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABELA: credit_cards (Cartões de Crédito)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    limit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    closing_day INT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color TEXT NOT NULL DEFAULT '#8B5CF6',
    brand TEXT NOT NULL DEFAULT 'mastercard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABELA: categories (Categorias e Orçamentos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'expense' | 'income'
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#64748B',
    budget_limit NUMERIC(12, 2),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABELA: transactions (Lançamentos Financeiros e Parcelamentos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'income' | 'expense' | 'transfer'
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT true,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_period TEXT,
    installment_current INT,
    installment_total INT,
    installment_group_id TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABELA: goals (Metas Financeiras e Cofres)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    target_date DATE NOT NULL,
    category TEXT,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    color TEXT NOT NULL DEFAULT '#06B6D4',
    icon TEXT NOT NULL DEFAULT 'Target',
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABELA: open_finance_connections (Conexões Bancárias Open Finance)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.open_finance_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected', -- 'connected' | 'disconnected' | 'syncing' | 'error'
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_expires_at TIMESTAMPTZ NOT NULL,
    synced_accounts_count INT NOT NULL DEFAULT 1,
    synced_cards_count INT NOT NULL DEFAULT 1,
    auto_sync BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_open_finance_user ON public.open_finance_connections(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_finance_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
    CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access accounts" ON public.accounts;
    CREATE POLICY "Public access accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access credit_cards" ON public.credit_cards;
    CREATE POLICY "Public access credit_cards" ON public.credit_cards FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access categories" ON public.categories;
    CREATE POLICY "Public access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access transactions" ON public.transactions;
    CREATE POLICY "Public access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access goals" ON public.goals;
    CREATE POLICY "Public access goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access open_finance" ON public.open_finance_connections;
    CREATE POLICY "Public access open_finance" ON public.open_finance_connections FOR ALL USING (true) WITH CHECK (true);
END $$;
