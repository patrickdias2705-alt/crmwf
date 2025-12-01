-- ========================================
-- VERIFICAR SE ORÇAMENTOS TÊM DIFERENCIAÇÃO POR VENDEDOR
-- ========================================
-- Execute no SQL Editor do Supabase

-- 1. VERIFICAR SE O CAMPO uploaded_by EXISTE E ESTÁ PREENCHIDO
SELECT 
  COUNT(*) as total_orcamentos,
  COUNT(uploaded_by) as orcamentos_com_vendedor,
  COUNT(*) - COUNT(uploaded_by) as orcamentos_sem_vendedor
FROM budget_documents;

-- 2. VER ORÇAMENTOS POR VENDEDOR
SELECT 
  u.id as vendedor_id,
  u.name as vendedor_nome,
  u.email as vendedor_email,
  COUNT(bd.id) as total_orcamentos,
  SUM(bd.amount) as valor_total_orcamentos,
  COUNT(CASE WHEN bd.status = 'aberto' THEN 1 END) as orcamentos_abertos,
  COUNT(CASE WHEN bd.status = 'vendido' THEN 1 END) as orcamentos_vendidos
FROM budget_documents bd
INNER JOIN users u ON bd.uploaded_by = u.id
GROUP BY u.id, u.name, u.email
ORDER BY total_orcamentos DESC;

-- 3. VER EXEMPLO DE ORÇAMENTOS COM SEUS VENDEDORES
SELECT 
  bd.id,
  bd.file_name,
  bd.amount,
  bd.status,
  bd.created_at,
  u.id as vendedor_id,
  u.name as vendedor_nome,
  u.email as vendedor_email,
  l.name as lead_nome,
  l.assigned_to as lead_vendedor_id
FROM budget_documents bd
LEFT JOIN users u ON bd.uploaded_by = u.id
LEFT JOIN leads l ON bd.lead_id = l.id
ORDER BY bd.created_at DESC
LIMIT 20;

-- 4. VERIFICAR POLÍTICAS RLS ATUAIS
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
WHERE tablename = 'budget_documents'
ORDER BY policyname;

-- 5. VERIFICAR SE HÁ ORÇAMENTOS DE VENDEDORES DIFERENTES NO MESMO TENANT
SELECT 
  bd.tenant_id,
  COUNT(DISTINCT bd.uploaded_by) as vendedores_diferentes,
  COUNT(bd.id) as total_orcamentos
FROM budget_documents bd
WHERE bd.uploaded_by IS NOT NULL
GROUP BY bd.tenant_id;

