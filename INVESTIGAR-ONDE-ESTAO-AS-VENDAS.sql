-- =====================================================
-- INVESTIGAÇÃO: Onde estão as vendas realmente?
-- =====================================================

-- 1. Verificar se há dados na tabela sales
SELECT 'TABELA SALES:' as origem, COUNT(*) as total_registros, SUM(amount) as valor_total
FROM sales;

-- 2. Verificar leads com vendas no fields (provável local real)
SELECT 
  'LEADS COM FIELDS SOLD:' as origem,
  COUNT(*) as total_leads,
  SUM(CAST(fields->>'sold_amount' AS DECIMAL)) as valor_total
FROM leads 
WHERE fields->>'sold' = 'true' 
   AND fields->>'sold_amount' IS NOT NULL
   AND CAST(fields->>'sold_amount' AS DECIMAL) > 0;

-- 3. Verificar leads vendidos de hoje (fields)
SELECT 
  'VENDAS HOJE (FIELDS):' as origem,
  COUNT(*) as quantidade,
  SUM(CAST(fields->>'sold_amount' AS DECIMAL)) as valor_total,
  AVG(CAST(fields->>'sold_amount' AS DECIMAL)) as ticket_medio
FROM leads 
WHERE fields->>'sold' = 'true' 
   AND fields->>'sold_amount' IS NOT NULL
   AND CAST(fields->>'sold_amount' AS DECIMAL) > 0
   AND DATE(updated_at) = CURRENT_DATE;

-- 4. Verificar leads em estágios "fechado/vendido"
SELECT 
  'LEADS EM ESTÁGIOS FECHADOS:' as origem,
  COUNT(*) as total_leads,
  s.name as stage_name
FROM leads l
JOIN stages s ON l.stage_id = s.id
WHERE s.name ILIKE '%fechado%' 
   OR s.name ILIKE '%vendido%' 
   OR s.name ILIKE '%ganho%' 
   OR s.name ILIKE '%bolso%'
GROUP BY s.name;

-- 5. Verificar leads vendidos de hoje por estágio
SELECT 
  'VENDAS HOJE POR ESTÁGIO:' as origem,
  s.name as stage_name,
  COUNT(*) as quantidade,
  SUM(CAST(l.fields->>'sold_amount' AS DECIMAL)) as valor_total
FROM leads l
JOIN stages s ON l.stage_id = s.id
WHERE l.fields->>'sold' = 'true' 
   AND l.fields->>'sold_amount' IS NOT NULL
   AND CAST(l.fields->>'sold_amount' AS DECIMAL) > 0
   AND DATE(l.updated_at) = CURRENT_DATE
GROUP BY s.name;

-- 6. Verificar se há orçamentos nos leads vendidos
SELECT 
  'ORÇAMENTOS EM LEADS VENDIDOS:' as origem,
  COUNT(*) as leads_com_orcamento,
  SUM(CAST(fields->>'budget_amount' AS DECIMAL)) as valor_total_orcamentos,
  SUM(CAST(fields->>'sold_amount' AS DECIMAL)) as valor_total_vendido
FROM leads 
WHERE fields->>'sold' = 'true'
   AND fields->>'sold_amount' IS NOT NULL
   AND CAST(fields->>'sold_amount' AS DECIMAL) > 0;

-- 7. Verificar detalhes dos leads vendidos de hoje
SELECT 
  'DETALHES VENDAS HOJE:' as origem,
  l.id,
  l.fields->>'sold_amount' as valor_venda,
  l.fields->>'sold_at' as data_venda,
  l.fields->>'sold_by' as vendido_por,
  l.updated_at,
  s.name as stage_atual
FROM leads l
LEFT JOIN stages s ON l.stage_id = s.id
WHERE l.fields->>'sold' = 'true' 
   AND l.fields->>'sold_amount' IS NOT NULL
   AND CAST(l.fields->>'sold_amount' AS DECIMAL) > 0
   AND DATE(l.updated_at) = CURRENT_DATE
ORDER BY l.updated_at DESC;

-- 8. Verificar se há dados em metrics_daily
SELECT 
  'METRICS_DAILY:' as origem,
  COUNT(*) as total_dias,
  SUM(total_sold) as valor_total_historico,
  MAX(date) as ultima_data
FROM metrics_daily
WHERE total_sold > 0;
