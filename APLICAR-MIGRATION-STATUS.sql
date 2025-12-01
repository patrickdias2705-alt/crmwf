-- ========================================
-- APLICAR MIGRATION: Adicionar coluna status
-- ========================================
-- Execute este script no SQL Editor do Supabase ANTES de executar LIMPAR-ORCAMENTOS-ANTIGOS.sql

-- 1. VERIFICAR SE A COLUNA status JÁ EXISTE
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'budget_documents'
    AND column_name = 'status'
) as coluna_status_existe;

-- 2. SE NÃO EXISTIR, CRIAR A COLUNA status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budget_documents'
      AND column_name = 'status'
  ) THEN
    -- Adicionar coluna status
    ALTER TABLE public.budget_documents 
    ADD COLUMN status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'vendido', 'cancelado', 'expirado'));
    
    RAISE NOTICE '✅ Coluna status criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna status já existe.';
  END IF;
END $$;

-- 3. VERIFICAR SE A COLUNA file_base64 EXISTE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budget_documents'
      AND column_name = 'file_base64'
  ) THEN
    -- Adicionar coluna file_base64
    ALTER TABLE public.budget_documents 
    ADD COLUMN file_base64 TEXT;
    
    RAISE NOTICE '✅ Coluna file_base64 criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna file_base64 já existe.';
  END IF;
END $$;

-- 4. VERIFICAR SE A COLUNA sale_id EXISTE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budget_documents'
      AND column_name = 'sale_id'
  ) THEN
    -- Adicionar coluna sale_id
    ALTER TABLE public.budget_documents 
    ADD COLUMN sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Coluna sale_id criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna sale_id já existe.';
  END IF;
END $$;

-- 5. TORNAR file_url E file_path OPCIONAIS (se ainda não forem)
DO $$
BEGIN
  -- Verificar se file_url é NOT NULL e tornar opcional
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budget_documents'
      AND column_name = 'file_url'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.budget_documents 
    ALTER COLUMN file_url DROP NOT NULL;
    RAISE NOTICE '✅ Coluna file_url agora é opcional.';
  END IF;
  
  -- Verificar se file_path é NOT NULL e tornar opcional
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budget_documents'
      AND column_name = 'file_path'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.budget_documents 
    ALTER COLUMN file_path DROP NOT NULL;
    RAISE NOTICE '✅ Coluna file_path agora é opcional.';
  END IF;
END $$;

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_budget_documents_status ON public.budget_documents(status);
CREATE INDEX IF NOT EXISTS idx_budget_documents_status_tenant ON public.budget_documents(tenant_id, status) WHERE status = 'aberto';

-- 7. VERIFICAR RESULTADO FINAL
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'budget_documents'
  AND column_name IN ('status', 'file_base64', 'sale_id', 'file_url', 'file_path')
ORDER BY column_name;

-- 8. ATUALIZAR ORÇAMENTOS EXISTENTES SEM STATUS PARA 'aberto'
UPDATE budget_documents
SET status = 'aberto'
WHERE status IS NULL;

-- ✅ Migration aplicada com sucesso! Agora você pode executar LIMPAR-ORCAMENTOS-ANTIGOS.sql

