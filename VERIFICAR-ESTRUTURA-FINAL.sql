-- =====================================================
-- VERIFICAR ESTRUTURA FINAL DOS TENANTS
-- =====================================================

-- 1. Verificar todos os tenants
SELECT 
    'TENANTS FINAIS' as info,
    id,
    name,
    plan,
    created_at
FROM tenants
ORDER BY name;

-- 2. Verificar todos os usuários e seus tenants
SELECT 
    'USUÁRIOS E TENANTS' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
ORDER BY t.name, u.name;

-- 3. Contar usuários por tenant
SELECT 
    'CONTAGEM POR TENANT' as info,
    t.name as tenant_name,
    COUNT(u.id) as total_usuarios,
    STRING_AGG(u.name, ', ') as usuarios
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- 4. Verificar isolamento - cada usuário deve estar em tenant diferente
SELECT 
    'VERIFICAÇÃO ISOLAMENTO' as info,
    'Todos os usuários em tenants diferentes' as status
WHERE (
    SELECT COUNT(DISTINCT u.tenant_id) 
    FROM users u 
    WHERE u.email IN ('mariabrebal26@gmail.com', 'elaineportaporta@gmail.com', 'julia@wfcirurgicos.com.br')
) = 3;

-- 5. Verificar dados por tenant (leads, sales, etc)
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
