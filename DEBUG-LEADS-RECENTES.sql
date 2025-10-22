-- ========================================
-- DEBUG: Verificar leads mais recentes
-- ========================================
-- Execute este script no Supabase SQL Editor

-- Verificar os 20 leads mais recentes
SELECT 
    'LEADS_MAIS_RECENTES' as tipo,
    id,
    name,
    email,
    created_at,
    DATE(created_at) as data_criacao,
    status,
    fields->>'sold' as sold,
    fields->>'sold_amount' as sold_amount,
    fields->>'sale_value' as sale_value
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 20;

-- Verificar leads dos últimos 7 dias
SELECT 
    'LEADS_ULTIMOS_7_DIAS' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- Verificar leads dos últimos 30 dias
SELECT 
    'LEADS_ULTIMOS_30_DIAS' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;
