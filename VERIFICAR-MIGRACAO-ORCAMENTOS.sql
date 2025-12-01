-- ========================================
-- VERIFICAR SE A MIGRAÇÃO FUNCIONOU
-- ========================================
-- Execute estas queries no SQL Editor do Supabase para verificar

-- 1. VERIFICAR QUANTOS ORÇAMENTOS FORAM MIGRADOS
SELECT 
  'Orçamentos na tabela budget_documents' as tipo,
  COUNT(*) as total,
  COUNT(DISTINCT lead_id) as leads_com_orcamento,
  SUM(amount) as valor_total
FROM budget_documents;

-- 2. VERIFICAR ORÇAMENTOS POR STATUS
SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total
FROM budget_documents
GROUP BY status
ORDER BY status;

-- 3. VERIFICAR LEADS QUE TÊM ORÇAMENTO NOS FIELDS MAS NÃO NA TABELA
SELECT 
  l.id,
  l.name,
  l.tenant_id,
  CASE 
    WHEN l.fields->>'budget_file_base64' IS NOT NULL THEN 'Formato antigo'
    WHEN l.fields->'budget_documents' IS NOT NULL THEN 'Formato novo (array)'
    ELSE 'Sem orçamento'
  END as tipo_orcamento,
  CASE 
    WHEN EXISTS (SELECT 1 FROM budget_documents WHERE lead_id = l.id) THEN '✅ Migrado'
    ELSE '❌ NÃO migrado'
  END as status_migracao
FROM leads l
WHERE (
  l.fields->>'budget_file_base64' IS NOT NULL 
  OR l.fields->'budget_documents' IS NOT NULL
)
AND NOT EXISTS (
  SELECT 1 FROM budget_documents WHERE lead_id = l.id
)
ORDER BY l.created_at DESC;

-- 4. VERIFICAR ORÇAMENTOS MIGRADOS COM DETALHES
SELECT 
  bd.id,
  bd.lead_id,
  l.name as lead_name,
  bd.file_name,
  bd.amount,
  bd.status,
  bd.created_at,
  bd.description
FROM budget_documents bd
JOIN leads l ON l.id = bd.lead_id
ORDER BY bd.created_at DESC
LIMIT 20;

-- 5. COMPARAR: ORÇAMENTOS NOS FIELDS vs TABELA
SELECT 
  'Orçamentos nos fields (formato antigo)' as fonte,
  COUNT(*) as total
FROM leads
WHERE fields->>'budget_file_base64' IS NOT NULL

UNION ALL

SELECT 
  'Orçamentos nos fields (formato novo - array)' as fonte,
  COUNT(*) as total
FROM leads
WHERE fields->'budget_documents' IS NOT NULL
  AND jsonb_typeof(fields->'budget_documents') = 'array'

UNION ALL

SELECT 
  'Orçamentos na tabela budget_documents' as fonte,
  COUNT(*) as total
FROM budget_documents;

-- 6. VERIFICAR SE HÁ DUPLICATAS (mesmo lead, mesmo arquivo)
SELECT 
  lead_id,
  file_name,
  COUNT(*) as quantidade_duplicatas
FROM budget_documents
GROUP BY lead_id, file_name
HAVING COUNT(*) > 1;

-- 7. VERIFICAR ORÇAMENTOS EM ABERTO (status = 'aberto')
SELECT 
  'Orçamentos em aberto' as tipo,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total,
  AVG(amount) as valor_medio
FROM budget_documents
WHERE status = 'aberto';

-- 8. VERIFICAR ORÇAMENTOS POR TENANT
SELECT 
  t.name as tenant_name,
  COUNT(bd.id) as total_orcamentos,
  SUM(bd.amount) as valor_total,
  COUNT(DISTINCT bd.lead_id) as leads_com_orcamento
FROM budget_documents bd
JOIN tenants t ON t.id = bd.tenant_id
GROUP BY t.id, t.name
ORDER BY total_orcamentos DESC;

