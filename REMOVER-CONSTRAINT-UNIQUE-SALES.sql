-- ========================================
-- REMOVER CONSTRAINT UNIQUE DE lead_id NA TABELA sales
-- ========================================
-- Execute no SQL Editor do Supabase
-- Permite múltiplas vendas do mesmo lead (recompra)

-- 1. VERIFICAR SE A CONSTRAINT EXISTE
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND (conname LIKE '%lead_id%' OR contype = 'u');

-- 2. REMOVER CONSTRAINT UNIQUE SE EXISTIR (tentar diretamente pelo nome do erro)
DO $$
DECLARE
  constraint_name TEXT;
  index_name TEXT;
BEGIN
  -- IMPORTANTE: Tentar remover diretamente pelo nome exato do erro
  BEGIN
    ALTER TABLE public.sales DROP CONSTRAINT sales_lead_id_key;
    RAISE NOTICE '✅ Constraint sales_lead_id_key REMOVIDA com sucesso!';
  EXCEPTION 
    WHEN undefined_object THEN
      RAISE NOTICE 'ℹ️ Constraint sales_lead_id_key não existe (pode ter sido removida)';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Erro ao remover sales_lead_id_key: %', SQLERRM;
  END;
  
  -- Buscar e remover qualquer constraint UNIQUE (exceto primary key)
  FOR constraint_name IN 
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.sales'::regclass
      AND contype = 'u'
      AND conname != 'sales_pkey'
  LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.sales DROP CONSTRAINT ' || quote_ident(constraint_name);
      RAISE NOTICE '✅ Constraint UNIQUE removida: %', constraint_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Erro ao remover %: %', constraint_name, SQLERRM;
    END;
  END LOOP;
  
  -- Buscar e remover índices únicos relacionados a lead_id
  FOR index_name IN 
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'sales'
      AND schemaname = 'public'
      AND (
        indexname LIKE '%lead_id%'
        OR (indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%lead_id%')
      )
  LOOP
    BEGIN
      EXECUTE 'DROP INDEX IF EXISTS public.' || quote_ident(index_name);
      RAISE NOTICE '✅ Índice removido: %', index_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Erro ao remover índice %: %', index_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- 3. VERIFICAR TODOS OS ÍNDICES E CONSTRAINTS
SELECT 
  'CONSTRAINT' as tipo,
  conname as nome,
  contype as tipo_item
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND contype = 'u'
UNION ALL
SELECT 
  'INDEX' as tipo,
  indexname as nome,
  'unique index' as tipo_item
FROM pg_indexes
WHERE tablename = 'sales'
  AND schemaname = 'public'
  AND indexdef LIKE '%UNIQUE%';

-- ✅ Agora é possível ter múltiplas vendas do mesmo lead (recompra)!
-- Teste marcando como vendido novamente no mesmo lead

