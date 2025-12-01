-- =====================================================
-- DIAGNÓSTICO: Por que as estatísticas mostram R$ 0,00?
-- =====================================================
-- 
-- Este script vai verificar:
-- 1. Se há dados na tabela sales
-- 2. Se há dados na tabela metrics_daily
-- 3. Se as vendas estão sendo registradas no lugar certo
-- 4. Se há problemas de tenant_id
-- =====================================================

-- 1. Verificar se há dados na tabela sales
SELECT 'TABELA SALES:' as tabela, COUNT(*) as total_registros, SUM(amount) as valor_total
FROM sales;

-- 2. Verificar registros da tabela sales (últimos 10)
SELECT 
    'ÚLTIMAS VENDAS:' as info,
    id, 
    tenant_id, 
    amount, 
    sold_at, 
    sold_by_name,
    stage_name
FROM sales 
ORDER BY sold_at DESC 
LIMIT 10;

-- 3. Verificar se há dados na tabela metrics_daily
SELECT 'METRICS_DAILY:' as tabela, COUNT(*) as total_registros, SUM(total_sold) as valor_total
FROM metrics_daily;

-- 4. Verificar registros da tabela metrics_daily (últimos 10)
SELECT 
    'ÚLTIMAS MÉTRICAS:' as info,
    tenant_id, 
    date, 
    closed, 
    total_sold, 
    avg_ticket
FROM metrics_daily 
WHERE total_sold > 0
ORDER BY date DESC 
LIMIT 10;

-- 5. Verificar leads que podem ter vendas no fields (fallback)
SELECT 
    'LEADS COM FIELDS SOLD:' as info,
    COUNT(*) as total_leads,
    SUM(CAST(fields->>'sold_amount' AS DECIMAL)) as valor_total
FROM leads 
WHERE fields->>'sold' = 'true' 
   AND fields->>'sold_amount' IS NOT NULL;

-- 6. Verificar leads em estágios "fechado/vendido"
SELECT 
    'LEADS EM ESTÁGIOS FECHADOS:' as info,
    COUNT(*) as total_leads,
    s.name as stage_name
FROM leads l
JOIN stages s ON l.stage_id = s.id
WHERE s.name ILIKE '%fechado%' 
   OR s.name ILIKE '%vendido%' 
   OR s.name ILIKE '%ganho%' 
   OR s.name ILIKE '%bolso%'
GROUP BY s.name;

-- 7. Testar a função get_sales_stats diretamente
SELECT 'TESTE FUNÇÃO get_sales_stats:' as info;
SELECT public.get_sales_stats(tenant_id) as resultado
FROM tenants 
LIMIT 1;

-- 8. Verificar se há problemas de tenant_id
SELECT 
    'PROBLEMA TENANT_ID:' as info,
    'sales' as tabela,
    COUNT(DISTINCT tenant_id) as tenants_distintos,
    ARRAY_AGG(DISTINCT tenant_id) as lista_tenants
FROM sales
UNION ALL
SELECT 
    'PROBLEMA TENANT_ID:' as info,
    'metrics_daily' as tabela,
    COUNT(DISTINCT tenant_id) as tenants_distintos,
    ARRAY_AGG(DISTINCT tenant_id) as lista_tenants
FROM metrics_daily;

-- 9. Verificar leads por tenant (para comparar)
SELECT 
    'LEADS POR TENANT:' as info,
    tenant_id,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN stage_id IN (
        SELECT id FROM stages WHERE name ILIKE '%fechado%' 
        OR name ILIKE '%vendido%' 
        OR name ILIKE '%ganho%' 
        OR name ILIKE '%bolso%'
    ) THEN 1 END) as leads_fechados
FROM leads
GROUP BY tenant_id;

-- 10. Verificar se há orçamentos nos leads
SELECT 
    'ORÇAMENTOS EM LEADS:' as info,
    COUNT(*) as leads_com_orcamento,
    SUM(CAST(fields->>'budget_amount' AS DECIMAL)) as valor_total_orcamentos
FROM leads 
WHERE fields->>'budget_amount' IS NOT NULL 
   AND CAST(fields->>'budget_amount' AS DECIMAL) > 0;
