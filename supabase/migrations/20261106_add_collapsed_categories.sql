-- ==============================================================================
-- MIGRATION: 20261106_add_collapsed_categories.sql
-- Descrição: Adiciona coluna collapsed_categories na tabela user_preferences
--            para persistir categorias que o usuário recolhe na interface.
-- ==============================================================================

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS collapsed_categories TEXT[] DEFAULT '{}';

