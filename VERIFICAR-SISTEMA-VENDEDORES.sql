-- ========================================
-- VERIFICAR SISTEMA DE VENDEDORES
-- ========================================
-- Execute no SQL Editor do Supabase

-- 1. VERIFICAR ESTRUTURA DA TABELA users (vendedores)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE A TABELA leads TEM CAMPO assigned_to
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN ('assigned_to', 'owner_user_id', 'created_by')
ORDER BY column_name;

-- 3. VERIFICAR SE A TABELA budget_documents TEM CAMPO uploaded_by
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'budget_documents'
  AND column_name IN ('uploaded_by', 'created_by', 'seller_id')
ORDER BY column_name;

-- 4. VERIFICAR FOREIGN KEYS DA TABELA leads
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'leads'
  AND kcu.column_name IN ('assigned_to', 'owner_user_id');

-- 5. VERIFICAR FOREIGN KEYS DA TABELA budget_documents
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'budget_documents'
  AND kcu.column_name = 'uploaded_by';

-- 6. VERIFICAR LEADS SEM VENDEDOR ASSIGNADO
SELECT 
  COUNT(*) as leads_sem_vendedor
FROM leads
WHERE assigned_to IS NULL;

-- 7. VERIFICAR ORÇAMENTOS SEM VENDEDOR
SELECT 
  COUNT(*) as orcamentos_sem_vendedor
FROM budget_documents
WHERE uploaded_by IS NULL;

-- 8. VER EXEMPLO DE LEADS COM VENDEDORES
SELECT 
  l.id,
  l.name,
  l.assigned_to,
  u.name as vendedor_nome,
  u.email as vendedor_email,
  u.tenant_id
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
LIMIT 10;

-- 9. VER EXEMPLO DE ORÇAMENTOS COM VENDEDORES
SELECT 
  bd.id,
  bd.file_name,
  bd.amount,
  bd.uploaded_by,
  u.name as vendedor_nome,
  u.email as vendedor_email,
  u.tenant_id
FROM budget_documents bd
LEFT JOIN users u ON bd.uploaded_by = u.id
LIMIT 10;

