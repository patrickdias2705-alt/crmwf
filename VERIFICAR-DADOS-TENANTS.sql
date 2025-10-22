-- =====================================================
-- VERIFICAR DADOS POR TENANT - DIAGNÓSTICO
-- =====================================================

-- 1. Verificar leads por tenant
SELECT 
    'LEADS POR TENANT' as info,
    t.name as tenant_name,
    t.id as tenant_id,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.status = 'closed' THEN 1 END) as leads_fechados,
    COUNT(CASE WHEN l.status = 'open' THEN 1 END) as leads_abertos
FROM tenants t
LEFT JOIN leads l ON t.id = l.tenant_id
GROUP BY t.id, t.name
ORDER BY total_leads DESC;

-- 2. Verificar sales por tenant
SELECT 
    'SALES POR TENANT' as info,
    t.name as tenant_name,
    t.id as tenant_id,
    COUNT(s.id) as total_sales,
    COALESCE(SUM(s.amount), 0) as total_valor
FROM tenants t
LEFT JOIN sales s ON t.id = s.tenant_id
GROUP BY t.id, t.name
ORDER BY total_sales DESC;

-- 3. Verificar métricas diárias por tenant
SELECT 
    'METRICS_DAILY POR TENANT' as info,
    t.name as tenant_name,
    t.id as tenant_id,
    COUNT(m.date) as total_metricas,
    COALESCE(SUM(m.leads_in), 0) as total_leads_in,
    COALESCE(SUM(m.closed), 0) as total_closed
FROM tenants t
LEFT JOIN metrics_daily m ON t.id = m.tenant_id
GROUP BY t.id, t.name
ORDER BY total_metricas DESC;

-- 4. Verificar conversas por tenant
SELECT 
    'CONVERSAS POR TENANT' as info,
    t.name as tenant_name,
    t.id as tenant_id,
    COUNT(c.id) as total_conversas,
    COUNT(CASE WHEN c.status = 'open' THEN 1 END) as conversas_abertas
FROM tenants t
LEFT JOIN conversations c ON t.id = c.tenant_id
GROUP BY t.id, t.name
ORDER BY total_conversas DESC;

-- 5. Verificar usuários por tenant
SELECT 
    'USUÁRIOS POR TENANT' as info,
    t.name as tenant_name,
    t.id as tenant_id,
    COUNT(u.id) as total_usuarios,
    STRING_AGG(u.name, ', ') as usuarios
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;
