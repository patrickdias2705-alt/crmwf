-- =====================================================
-- VERIFICAR DADOS REAIS POR TENANT
-- =====================================================

-- 1. Verificar leads por tenant
SELECT 
    'LEADS POR TENANT' as info,
    t.name as tenant_name,
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
    COUNT(s.id) as total_sales,
    COALESCE(SUM(s.amount), 0) as total_valor
FROM tenants t
LEFT JOIN sales s ON t.id = s.tenant_id
GROUP BY t.id, t.name
ORDER BY total_sales DESC;

-- 3. Verificar conversas por tenant
SELECT 
    'CONVERSAS POR TENANT' as info,
    t.name as tenant_name,
    COUNT(c.id) as total_conversas,
    COUNT(CASE WHEN c.status = 'open' THEN 1 END) as conversas_abertas
FROM tenants t
LEFT JOIN conversations c ON t.id = c.tenant_id
GROUP BY t.id, t.name
ORDER BY total_conversas DESC;
