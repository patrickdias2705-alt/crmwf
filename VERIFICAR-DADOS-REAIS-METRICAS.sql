-- =====================================================
-- VERIFICAR DADOS REAIS PARA MÉTRICAS
-- =====================================================
-- Script para verificar se há dados reais no banco para as métricas

-- 1. Verificar leads nos últimos 7 dias
SELECT 
    'LEADS ÚLTIMOS 7 DIAS' as tipo,
    COUNT(*) as total_leads,
    DATE(created_at) as data,
    COUNT(*) as leads_por_dia
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 2. Verificar leads vendidos
SELECT 
    'LEADS VENDIDOS' as tipo,
    COUNT(*) as total_vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND fields->>'sold' = 'true'
    AND created_at >= NOW() - INTERVAL '7 days';

-- 3. Verificar metrics_daily
SELECT 
    'METRICS_DAILY' as tipo,
    date,
    leads_in,
    closed,
    total_revenue,
    average_ticket
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

-- 4. Verificar leads por origem
SELECT 
    'LEADS POR ORIGEM' as tipo,
    origin,
    COUNT(*) as total
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY origin
ORDER BY total DESC;

-- 5. Verificar leads por status
SELECT 
    'LEADS POR STATUS' as tipo,
    CASE 
        WHEN fields->>'sold' = 'true' THEN 'Vendido'
        WHEN fields->>'qualified' = 'true' THEN 'Qualificado'
        WHEN fields->>'budget' IS NOT NULL THEN 'Com Orçamento'
        ELSE 'Novo'
    END as status,
    COUNT(*) as total
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY 
    CASE 
        WHEN fields->>'sold' = 'true' THEN 'Vendido'
        WHEN fields->>'qualified' = 'true' THEN 'Qualificado'
        WHEN fields->>'budget' IS NOT NULL THEN 'Com Orçamento'
        ELSE 'Novo'
    END
ORDER BY total DESC;

-- 6. Verificar se há dados em qualquer período
SELECT 
    'DADOS HISTÓRICOS' as tipo,
    MIN(created_at) as primeiro_lead,
    MAX(created_at) as ultimo_lead,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 7. Verificar tenant_id dos usuários
SELECT 
    'USUÁRIOS' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' as tenant_id_meta,
    raw_user_meta_data
FROM auth.users 
WHERE email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com');
