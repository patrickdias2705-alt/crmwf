-- ========================================
-- REMOVER CONSTRAINT/ÍNDICE UNIQUE DE lead_id NA TABELA sales
-- ========================================
-- Execute no SQL Editor do Supabase
-- Permite múltiplas vendas do mesmo lead (recompra)

-- 1. VERIFICAR TODAS AS CONSTRAINTS E ÍNDICES
SELECT 
  'CONSTRAINT' as tipo,
  conname as nome,
  contype as tipo_constraint,
  pg_get_constraintdef(oid) as definicao
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND (conname LIKE '%lead_id%' OR contype = 'u')
UNION ALL
SELECT 
  'INDEX' as tipo,
  indexname as nome,
  indexdef as tipo_constraint,
  indexdef as definicao
FROM pg_indexes
WHERE tablename = 'sales'
  AND schemaname = 'public'
  AND (indexname LIKE '%lead_id%' OR indexdef LIKE '%UNIQUE%lead_id%');

-- 2. REMOVER CONSTRAINT UNIQUE SE EXISTIR (tentar diferentes nomes)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Tentar remover com nome exato do erro
  BEGIN
    ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_lead_id_key;
    RAISE NOTICE '✅ Tentativa de remover sales_lead_id_key';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ sales_lead_id_key não existe ou já foi removida';
  END;
  
  -- Buscar e remover qualquer constraint UNIQUE em lead_id
  FOR constraint_name IN 
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.sales'::regclass
      AND contype = 'u'
      AND (
        conname LIKE '%lead_id%'
        OR conname LIKE '%sales%lead%'
      )
  LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.sales DROP CONSTRAINT ' || quote_ident(constraint_name);
      RAISE NOTICE '✅ Constraint UNIQUE removida: %', constraint_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Erro ao remover %: %', constraint_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- 3. REMOVER ÍNDICES ÚNICOS SE EXISTIREM
DO $$
DECLARE
  index_name TEXT;
BEGIN
  FOR index_name IN 
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'sales'
      AND schemaname = 'public'
      AND (
        indexname LIKE '%lead_id%unique%'
        OR indexname LIKE '%lead_id_key%'
        OR indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%lead_id%'
      )
  LOOP
    BEGIN
      EXECUTE 'DROP INDEX IF EXISTS public.' || quote_ident(index_name);
      RAISE NOTICE '✅ Índice UNIQUE removido: %', index_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Erro ao remover índice %: %', index_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- 4. VERIFICAR RESULTADO FINAL
SELECT 
  'CONSTRAINT' as tipo,
  conname as nome,
  contype as tipo_constraint
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND (conname LIKE '%lead_id%' OR contype = 'u')
UNION ALL
SELECT 
  'INDEX' as tipo,
  indexname as nome,
  'index' as tipo_constraint
FROM pg_indexes
WHERE tablename = 'sales'
  AND schemaname = 'public'
  AND indexname LIKE '%lead_id%';

-- ✅ Agora é possível ter múltiplas vendas do mesmo lead (recompra)!
-- Teste marcando como vendido novamente no mesmo lead

