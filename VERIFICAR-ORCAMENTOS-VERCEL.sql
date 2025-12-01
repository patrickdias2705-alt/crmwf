-- Script para verificar e corrigir orçamentos no Vercel
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a coluna status existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'budget_documents'
  AND column_name = 'status';

-- 2. Se a coluna não existir, criar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'budget_documents' 
      AND column_name = 'status'
  ) THEN
    -- Adicionar coluna status
    ALTER TABLE public.budget_documents 
    ADD COLUMN status TEXT DEFAULT 'aberto' 
    CHECK (status IN ('aberto', 'vendido', 'cancelado', 'expirado'));
    
    -- Atualizar orçamentos existentes sem status
    UPDATE public.budget_documents 
    SET status = 'aberto' 
    WHERE status IS NULL;
    
    RAISE NOTICE 'Coluna status criada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna status já existe!';
  END IF;
END $$;

-- 3. Verificar se a coluna file_base64 existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'budget_documents'
  AND column_name = 'file_base64';

-- 4. Se a coluna file_base64 não existir, criar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'budget_documents' 
      AND column_name = 'file_base64'
  ) THEN
    ALTER TABLE public.budget_documents 
    ADD COLUMN file_base64 TEXT;
    
    RAISE NOTICE 'Coluna file_base64 criada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna file_base64 já existe!';
  END IF;
END $$;

-- 5. Verificar se a coluna sale_id existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'budget_documents'
  AND column_name = 'sale_id';

-- 6. Se a coluna sale_id não existir, criar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'budget_documents' 
      AND column_name = 'sale_id'
  ) THEN
    ALTER TABLE public.budget_documents 
    ADD COLUMN sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Coluna sale_id criada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna sale_id já existe!';
  END IF;
END $$;

-- 7. Tornar file_url e file_path opcionais (caso não sejam)
DO $$ 
BEGIN
  ALTER TABLE public.budget_documents 
  ALTER COLUMN file_url DROP NOT NULL,
  ALTER COLUMN file_path DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignora se já estiver opcional
END $$;

-- 8. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_budget_documents_status 
ON public.budget_documents(status);

CREATE INDEX IF NOT EXISTS idx_budget_documents_status_tenant 
ON public.budget_documents(tenant_id, status) 
WHERE status = 'aberto';

-- 9. Verificar orçamentos existentes
SELECT 
  COUNT(*) as total_orcamentos,
  COUNT(CASE WHEN status = 'aberto' THEN 1 END) as orcamentos_abertos,
  COUNT(CASE WHEN status = 'vendido' THEN 1 END) as orcamentos_vendidos,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as sem_status
FROM public.budget_documents;

-- 10. Atualizar orçamentos sem status para 'aberto'
UPDATE public.budget_documents 
SET status = 'aberto' 
WHERE status IS NULL;

-- 11. Verificar RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'budget_documents';

-- 12. Testar query de orçamentos em aberto
SELECT 
  id,
  lead_id,
  amount,
  status,
  created_at
FROM public.budget_documents
WHERE status = 'aberto'
ORDER BY created_at DESC
LIMIT 10;

