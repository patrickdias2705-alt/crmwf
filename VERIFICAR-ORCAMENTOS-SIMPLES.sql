-- Script simples para verificar orçamentos em aberto
-- Execute este script no Supabase SQL Editor

-- 1. Contar leads com orçamento
SELECT 
  COUNT(*) as total_leads_com_orcamento,
  SUM(CAST(fields->>'budget_amount' AS NUMERIC)) as valor_total_orcamentos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'budget_amount' IS NOT NULL
AND CAST(fields->>'budget_amount' AS NUMERIC) > 0;

-- 2. Contar leads vendidos
SELECT 
  COUNT(*) as total_leads_vendidos,
  SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total_vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'sold' = 'true';

-- 3. Verificar alguns leads específicos
SELECT 
  name,
  fields->>'budget_amount' as orcamento,
  fields->>'sold' as vendido,
  fields->>'sold_amount' as valor_venda
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'budget_amount' IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
