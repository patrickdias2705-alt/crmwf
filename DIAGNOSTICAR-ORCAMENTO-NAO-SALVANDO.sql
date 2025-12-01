-- ========================================
-- DIAGNOSTICAR: Orçamento não está salvando
-- ========================================
-- Execute estas queries no SQL Editor do Supabase

-- 1. VERIFICAR SE A TABELA budget_documents EXISTE
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'budget_documents'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE TEM ORÇAMENTOS NA TABELA
SELECT 
  COUNT(*) as total_orcamentos,
  COUNT(CASE WHEN status = 'aberto' THEN 1 END) as orcamentos_abertos,
  COUNT(CASE WHEN status = 'vendido' THEN 1 END) as orcamentos_vendidos
FROM budget_documents;

-- 3. VERIFICAR ÚLTIMOS ORÇAMENTOS INSERIDOS
SELECT 
  id,
  lead_id,
  file_name,
  amount,
  status,
  created_at,
  tenant_id
FROM budget_documents
ORDER BY created_at DESC
LIMIT 10;

-- 4. VERIFICAR SE HÁ ORÇAMENTOS NOS FIELDS DOS LEADS (mas não na tabela)
SELECT 
  l.id,
  l.name,
  l.tenant_id,
  CASE 
    WHEN l.fields->>'budget_file_base64' IS NOT NULL THEN 'Tem orçamento (formato antigo)'
    WHEN l.fields->'budget_documents' IS NOT NULL THEN 'Tem orçamento (formato novo)'
    ELSE 'Sem orçamento'
  END as status_orcamento,
  CASE 
    WHEN EXISTS (SELECT 1 FROM budget_documents WHERE lead_id = l.id) THEN '✅ Na tabela'
    ELSE '❌ NÃO na tabela'
  END as na_tabela
FROM leads l
WHERE (
  l.fields->>'budget_file_base64' IS NOT NULL 
  OR l.fields->'budget_documents' IS NOT NULL
)
ORDER BY l.updated_at DESC
LIMIT 20;

-- 5. VERIFICAR POLÍTICAS RLS DA TABELA budget_documents
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'budget_documents';

-- 6. VERIFICAR SE A COLUNA status EXISTE
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'budget_documents'
  AND column_name = 'status';

-- 7. VERIFICAR SE A COLUNA file_base64 EXISTE
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'budget_documents'
  AND column_name = 'file_base64';

