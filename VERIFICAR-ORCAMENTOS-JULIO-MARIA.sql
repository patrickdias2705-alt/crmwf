-- Script para verificar especificamente a divergência em "Orçamentos em Aberto"
-- entre Júlio e Maria

-- 1. Verificar leads com orçamento
SELECT 
  'Leads com orçamento' as tipo,
  COUNT(*) as quantidade,
  SUM(CAST(fields->>'budget_amount' AS NUMERIC)) as valor_total
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'budget_amount' IS NOT NULL
AND CAST(fields->>'budget_amount' AS NUMERIC) > 0;

-- 2. Verificar leads vendidos (que devem ser excluídos)
SELECT 
  'Leads vendidos' as tipo,
  COUNT(*) as quantidade,
  SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'sold' = 'true';

-- 3. Verificar leads vendidos na tabela sales
SELECT 
  'Vendas na tabela sales' as tipo,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 4. Verificar estágios finais
SELECT 
  'Estágios finais' as tipo,
  COUNT(*) as quantidade,
  string_agg(name, ', ') as nomes
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (name ILIKE '%dinheiro no bolso%' 
     OR name ILIKE '%vendido%' 
     OR name ILIKE '%fechado%' 
     OR name ILIKE '%ganho%');

-- 5. Verificar leads com orçamento que NÃO estão vendidos
WITH sold_lead_ids AS (
  SELECT lead_id FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  UNION
  SELECT id FROM leads 
  WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND fields->>'sold' = 'true'
),
final_stage_ids AS (
  SELECT id FROM stages 
  WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND (name ILIKE '%dinheiro no bolso%' 
       OR name ILIKE '%vendido%' 
       OR name ILIKE '%fechado%' 
       OR name ILIKE '%ganho%')
)
SELECT 
  'Orçamentos em aberto (correto)' as tipo,
  COUNT(*) as quantidade,
  SUM(CAST(fields->>'budget_amount' AS NUMERIC)) as valor_total
FROM leads l
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND l.fields->>'budget_amount' IS NOT NULL
AND CAST(l.fields->>'budget_amount' AS NUMERIC) > 0
AND l.id NOT IN (SELECT lead_id FROM sold_lead_ids)
AND l.stage_id NOT IN (SELECT id FROM final_stage_ids);

-- 6. Verificar leads específicos com orçamento
SELECT 
  id,
  name,
  email,
  fields->>'budget_amount' as orcamento,
  fields->>'sold' as vendido,
  fields->>'sold_amount' as valor_venda,
  stage_id,
  created_at
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'budget_amount' IS NOT NULL
AND CAST(fields->>'budget_amount' AS NUMERIC) > 0
ORDER BY created_at DESC
LIMIT 10;
