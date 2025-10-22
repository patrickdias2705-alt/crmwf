-- =====================================================
-- VERIFICAR TENANTS ATUAIS E USUÁRIOS
-- =====================================================

-- 1. Verificar todos os tenants existentes
SELECT 
    'TENANTS EXISTENTES' as info,
    id,
    name,
    plan,
    created_at
FROM tenants
ORDER BY created_at;

-- 2. Verificar usuários e seus tenants
SELECT 
    'USUÁRIOS E TENANTS' as info,
    u.id as user_id,
    u.name as user_name,
    u.email,
    u.role,
    t.id as tenant_id,
    t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
ORDER BY t.name, u.name;

-- 3. Contar usuários por tenant
SELECT 
    'CONTAGEM POR TENANT' as info,
    t.name as tenant_name,
    COUNT(u.id) as total_usuarios
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name
ORDER BY total_usuarios DESC;

-- 4. Verificar dados por tenant (leads, sales, etc)
SELECT 
    'DADOS POR TENANT - LEADS' as info,
    t.name as tenant_name,
    COUNT(l.id) as total_leads
FROM tenants t
LEFT JOIN leads l ON t.id = l.tenant_id
GROUP BY t.id, t.name
ORDER BY total_leads DESC;

SELECT 
    'DADOS POR TENANT - SALES' as info,
    t.name as tenant_name,
    COUNT(s.id) as total_sales
FROM tenants t
LEFT JOIN sales s ON t.id = s.tenant_id
GROUP BY t.id, t.name
ORDER BY total_sales DESC;
