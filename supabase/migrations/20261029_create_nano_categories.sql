-- ==============================================================================
-- MIGRATION: 20261029_create_nano_categories.sql
-- Descrição: Criação da tabela oficial de nano_categories e coluna auxiliar em categories
-- ==============================================================================

-- 1. Criação da tabela de Nano-Categorias (Estrutura relacional normalizada)
CREATE TABLE IF NOT EXISTS public.nano_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#10B981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security) na tabela nano_categories
ALTER TABLE public.nano_categories ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS para isolar por usuário
CREATE POLICY "Users can view their own nano categories" 
ON public.nano_categories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nano categories" 
ON public.nano_categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nano categories" 
ON public.nano_categories FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nano categories" 
ON public.nano_categories FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Índice de performance por subcategoria e usuário
CREATE INDEX IF NOT EXISTS idx_nano_categories_category_id ON public.nano_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_nano_categories_user_id ON public.nano_categories(user_id);

-- 5. Coluna JSONB auxiliar diretamente na tabela categories (para compatibilidade e queries rápidas)
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS nano_categories JSONB DEFAULT '[]'::jsonb;

