-- ========================================
-- INVESTIGAR DIFERENÇA DE VALORES ENTRE CONTAS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar total de vendas na tabela sales
SELECT 
    'TOTAL_SALES_TABELA' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 2: Verificar vendas por vendedor na tabela sales
SELECT 
    'VENDAS_POR_VENDEDOR_SALES' as tipo,
    sold_by_name,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY sold_by_name
ORDER BY total_vendas DESC;

-- PASSO 3: Verificar vendas no fields dos leads
SELECT 
    'VENDAS_FIELDS_LEADS' as tipo,
    COUNT(*) as total_leads_vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total_sold_amount,
    SUM(CAST(fields->>'budget_amount' AS NUMERIC)) as valor_total_budget_amount
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL);

-- PASSO 4: Verificar vendas no fields por agente
SELECT 
    'VENDAS_FIELDS_POR_AGENTE' as tipo,
    assigned_to,
    COUNT(*) as total_leads_vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL)
GROUP BY assigned_to
ORDER BY total_leads_vendidos DESC;

-- PASSO 5: Verificar métricas diárias
SELECT 
    'METRICAS_DIARIAS' as tipo,
    COUNT(*) as total_registros,
    SUM(total_revenue) as valor_total_revenue,
    SUM(closed) as total_fechados,
    MIN(date) as primeira_data,
    MAX(date) as ultima_data
FROM metrics_daily
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 6: Verificar se há vendas duplicadas
SELECT 
    'VENDAS_DUPLICADAS' as tipo,
    lead_id,
    COUNT(*) as duplicatas,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY lead_id
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;

-- PASSO 7: Verificar se há leads com vendas em ambas as fontes
SELECT 
    'LEADS_DUPLICADOS_VENDAS' as tipo,
    l.id,
    l.name,
    l.fields->>'sold_amount' as sold_amount_field,
    s.amount as sold_amount_sales,
    s.id as sales_id
FROM leads l
LEFT JOIN sales s ON s.lead_id = l.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL)
AND s.id IS NOT NULL;

-- PASSO 8: Verificar diferença exata
SELECT 
    'DIFERENCA_EXATA' as tipo,
    'Tabela Sales' as fonte,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'DIFERENCA_EXATA' as tipo,
    'Fields Leads' as fonte,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL);
