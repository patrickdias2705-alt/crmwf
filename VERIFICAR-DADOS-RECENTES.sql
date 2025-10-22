-- ========================================
-- VERIFICAR DADOS RECENTES NO BANCO
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar leads dos últimos 30 dias
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

-- PASSO 2: Verificar se há dados em dezembro 2024
SELECT 
    'LEADS_DEZEMBRO_2024' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2024-12-01'
AND created_at < '2025-01-01'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- PASSO 3: Verificar se há dados em janeiro 2025
SELECT 
    'LEADS_JANEIRO_2025' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-01-01'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- PASSO 4: Verificar os leads mais recentes (últimos 10)
SELECT 
    'LEADS_MAIS_RECENTES' as tipo,
    id,
    name,
    email,
    created_at,
    status,
    fields->>'sold' as sold,
    fields->>'sold_amount' as sold_amount
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 10;

-- PASSO 5: Verificar se há dados nos dias específicos que o usuário mencionou
-- (assumindo que podem ser de 2024 ou 2025)
SELECT 
    'LEADS_DIAS_ESPECIFICOS_2024' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (
    (EXTRACT(DAY FROM created_at) = 7 AND EXTRACT(MONTH FROM created_at) = 10) OR
    (EXTRACT(DAY FROM created_at) = 10 AND EXTRACT(MONTH FROM created_at) = 10) OR
    (EXTRACT(DAY FROM created_at) = 13 AND EXTRACT(MONTH FROM created_at) = 10) OR
    (EXTRACT(DAY FROM created_at) = 14 AND EXTRACT(MONTH FROM created_at) = 10) OR
    (EXTRACT(DAY FROM created_at) = 15 AND EXTRACT(MONTH FROM created_at) = 10)
)
GROUP BY DATE(created_at)
ORDER BY data;

-- PASSO 6: Verificar se há dados nos dias específicos de 2025
SELECT 
    'LEADS_DIAS_ESPECIFICOS_2025' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (
    (EXTRACT(DAY FROM created_at) = 7 AND EXTRACT(MONTH FROM created_at) = 1) OR
    (EXTRACT(DAY FROM created_at) = 10 AND EXTRACT(MONTH FROM created_at) = 1) OR
    (EXTRACT(DAY FROM created_at) = 13 AND EXTRACT(MONTH FROM created_at) = 1) OR
    (EXTRACT(DAY FROM created_at) = 14 AND EXTRACT(MONTH FROM created_at) = 1) OR
    (EXTRACT(DAY FROM created_at) = 15 AND EXTRACT(MONTH FROM created_at) = 1)
)
GROUP BY DATE(created_at)
ORDER BY data;
