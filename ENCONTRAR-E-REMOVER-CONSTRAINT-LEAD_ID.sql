-- ========================================
-- ENCONTRAR E REMOVER CONSTRAINT UNIQUE DE lead_id
-- ========================================
-- Execute no SQL Editor do Supabase

-- 1. VERIFICAR TODAS AS CONSTRAINTS (incluindo as ocultas)
SELECT 
  conname as nome_constraint,
  contype as tipo,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    ELSE contype::text
  END as descricao,
  pg_get_constraintdef(oid) as definicao
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
ORDER BY contype, conname;

-- 2. VERIFICAR TODOS OS ÍNDICES
SELECT 
  indexname as nome_indice,
  indexdef as definicao
FROM pg_indexes
WHERE tablename = 'sales'
  AND schemaname = 'public'
ORDER BY indexname;

-- 3. TENTAR REMOVER DIRETAMENTE PELO NOME DO ERRO
DO $$
BEGIN
  -- Tentar remover pelo nome exato do erro
  BEGIN
    ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_lead_id_key;
    RAISE NOTICE '✅ Constraint sales_lead_id_key removida (se existia)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro ao tentar remover sales_lead_id_key: %', SQLERRM;
  END;
END $$;

-- 4. VERIFICAR SE AINDA EXISTE
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND conname = 'sales_lead_id_key';

-- 5. SE AINDA NÃO FUNCIONOU, LISTAR TODAS AS CONSTRAINTS ÚNICAS
SELECT 
  'CONSTRAINT' as tipo,
  conname as nome,
  contype as tipo_constraint,
  pg_get_constraintdef(oid) as definicao_completa
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND contype = 'u'
UNION ALL
SELECT 
  'INDEX' as tipo,
  indexname as nome,
  'unique index' as tipo_constraint,
  indexdef as definicao_completa
FROM pg_indexes
WHERE tablename = 'sales'
  AND schemaname = 'public'
  AND (
    indexdef LIKE '%UNIQUE%'
    OR indexname LIKE '%unique%'
    OR indexname LIKE '%key%'
  );

-- ✅ Execute este script e me mostre os resultados para identificar a constraint correta

