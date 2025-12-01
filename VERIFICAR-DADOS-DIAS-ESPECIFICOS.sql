-- ========================================
-- VERIFICAR DADOS DOS DIAS ESPECÍFICOS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar leads dos dias específicos (outubro 2024)
SELECT 
    'LEADS_DIAS_ESPECIFICOS' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) IN ('2024-10-07', '2024-10-10', '2024-10-13', '2024-10-14', '2024-10-15')
GROUP BY DATE(created_at)
ORDER BY data;

-- PASSO 2: Verificar vendas dos dias específicos
SELECT 
    'VENDAS_DIAS_ESPECIFICOS' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) IN ('2024-10-07', '2024-10-10', '2024-10-13', '2024-10-14', '2024-10-15')
GROUP BY DATE(created_at)
ORDER BY data;

-- PASSO 3: Verificar leads com detalhes dos dias específicos
SELECT 
    'DETALHES_LEADS_DIAS_ESPECIFICOS' as tipo,
    DATE(created_at) as data,
    id,
    name,
    email,
    status,
    fields->>'sold' as sold,
    fields->>'sold_amount' as sold_amount,
    fields->>'sale_value' as sale_value
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) IN ('2024-10-07', '2024-10-10', '2024-10-13', '2024-10-14', '2024-10-15')
ORDER BY created_at;

-- PASSO 4: Verificar se há dados na metrics_daily para esses dias
SELECT 
    'METRICS_DAILY_DIAS_ESPECIFICOS' as tipo,
    date,
    leads_in,
    closed,
    total_revenue,
    avg_ticket
FROM metrics_daily
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND date IN ('2024-10-07', '2024-10-10', '2024-10-13', '2024-10-14', '2024-10-15')
ORDER BY date;

-- PASSO 5: Verificar todos os leads dos últimos 30 dias para ver o padrão
SELECT 
    'LEADS_ULTIMOS_30_DIAS_DETALHADO' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos,
    SUM(CASE WHEN fields->>'sold_amount' IS NOT NULL THEN CAST(fields->>'sold_amount' AS NUMERIC) ELSE 0 END) as valor_vendas_fields
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;
