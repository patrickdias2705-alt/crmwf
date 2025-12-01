-- ========================================
-- VERIFICAR SE O TRIGGER ESTÁ FUNCIONANDO
-- ========================================
-- Execute no SQL Editor do Supabase

-- 1. VERIFICAR SE A FUNÇÃO update_budget_on_sale EXISTE
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_budget_on_sale';

-- 2. VERIFICAR SE O TRIGGER EXISTE
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_update_budget_on_sale';

-- 3. VERIFICAR ORÇAMENTOS QUE DEVERIAM TER SIDO ATUALIZADOS
-- (orçamentos em aberto de leads que têm vendas)
SELECT 
  bd.id as orcamento_id,
  bd.lead_id,
  bd.status as status_orcamento,
  bd.sale_id,
  bd.amount,
  bd.created_at as orcamento_criado,
  s.id as venda_id,
  s.sold_at as venda_criada,
  CASE 
    WHEN s.id IS NOT NULL AND bd.status = 'aberto' THEN '❌ DEVERIA ESTAR VENDIDO'
    WHEN s.id IS NOT NULL AND bd.status = 'vendido' THEN '✅ CORRETO'
    WHEN s.id IS NULL AND bd.status = 'aberto' THEN '⏳ AGUARDANDO VENDA'
    ELSE '❓ STATUS DESCONHECIDO'
  END as situacao
FROM budget_documents bd
LEFT JOIN sales s ON s.lead_id = bd.lead_id 
  AND s.sold_at >= bd.created_at
  AND s.sold_at <= bd.created_at + INTERVAL '1 day'
WHERE bd.status = 'aberto'
ORDER BY bd.created_at DESC
LIMIT 20;

-- 4. VERIFICAR ÚLTIMAS VENDAS E SEUS ORÇAMENTOS
SELECT 
  s.id as venda_id,
  s.lead_id,
  s.amount as valor_venda,
  s.sold_at,
  bd.id as orcamento_id,
  bd.status as status_orcamento,
  bd.sale_id,
  bd.amount as valor_orcamento,
  CASE 
    WHEN bd.sale_id = s.id THEN '✅ VINCULADO'
    WHEN bd.status = 'vendido' AND bd.sale_id IS NULL THEN '⚠️ VENDIDO MAS SEM VINCULO'
    WHEN bd.status = 'aberto' THEN '❌ AINDA ABERTO'
    ELSE '❓'
  END as situacao
FROM sales s
LEFT JOIN budget_documents bd ON bd.lead_id = s.lead_id 
  AND bd.status = 'aberto'
  AND bd.created_at <= s.sold_at
ORDER BY s.sold_at DESC
LIMIT 20;

-- 5. TESTAR O TRIGGER MANUALMENTE (substitua os IDs)
/*
-- Primeiro, crie uma venda de teste:
INSERT INTO sales (
  tenant_id,
  lead_id,
  amount,
  stage_id,
  sold_by
) VALUES (
  'SEU_TENANT_ID',
  'ID_DO_LEAD',
  100.00,
  'ID_DO_STAGE',
  'ID_DO_USUARIO'
) RETURNING id;

-- Depois verifique se o orçamento foi atualizado:
SELECT * FROM budget_documents 
WHERE lead_id = 'ID_DO_LEAD' 
  AND status = 'vendido';
*/

