-- =====================================================
-- CORRIGIR ISOLAMENTO DE TENANTS - VERIFICAR DADOS
-- =====================================================

-- 1. Verificar leads por tenant
SELECT 
    'LEADS POR TENANT' as info,
    t.name as tenant_name,
    COUNT(l.id) as total_leads
FROM tenants t
LEFT JOIN leads l ON t.id = l.tenant_id
GROUP BY t.id, t.name
ORDER BY total_leads DESC;

-- 2. Verificar sales por tenant
SELECT 
    'SALES POR TENANT' as info,
    t.name as tenant_name,
    COUNT(s.id) as total_sales
FROM tenants t
LEFT JOIN sales s ON t.id = s.tenant_id
GROUP BY t.id, t.name
ORDER BY total_sales DESC;

-- 3. Verificar usuários por tenant
SELECT 
    'USUÁRIOS POR TENANT' as info,
    t.name as tenant_name,
    COUNT(u.id) as total_usuarios,
    STRING_AGG(u.name, ', ') as usuarios
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- 4. Verificar se há leads sem tenant_id
SELECT 
    'LEADS SEM TENANT_ID' as info,
    COUNT(*) as total
FROM leads
WHERE tenant_id IS NULL;

-- 5. Verificar se há sales sem tenant_id
SELECT 
    'SALES SEM TENANT_ID' as info,
    COUNT(*) as total
FROM sales
WHERE tenant_id IS NULL;
