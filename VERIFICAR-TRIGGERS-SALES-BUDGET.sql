-- ========================================
-- VERIFICAR TRIGGERS QUE PODEM CAUSAR DUPLICATAS
-- ========================================
-- Execute este script no Supabase SQL Editor para verificar se há triggers
-- que possam estar criando duplicatas ou somando valores ao editar

-- 1. Verificar todos os triggers na tabela sales
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'sales'
ORDER BY trigger_name;

-- 2. Verificar todos os triggers na tabela budget_documents
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'budget_documents'
ORDER BY trigger_name;

-- 3. Verificar se há triggers que fazem INSERT em sales quando há UPDATE
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = t.action_statement
WHERE t.trigger_schema = 'public'
  AND (t.event_object_table = 'sales' OR t.event_object_table = 'budget_documents')
  AND t.event_manipulation = 'UPDATE'
ORDER BY t.trigger_name;

-- 4. Verificar funções que podem estar criando duplicatas
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname LIKE '%sale%' 
   OR proname LIKE '%budget%'
   OR proname LIKE '%insert%'
ORDER BY proname;

-- 5. Verificar se há constraints que impedem duplicatas
SELECT 
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('sales', 'budget_documents')
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_name;

-- 6. Verificar se há índices únicos que impedem duplicatas
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sales', 'budget_documents')
ORDER BY tablename, indexname;

