-- Migração para suporte a anexo de imagens e comprovantes em transações
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

