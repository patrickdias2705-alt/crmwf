-- =====================================================
-- VERIFICAR ISOLAMENTO APÓS CORREÇÕES
-- =====================================================

-- 1. Verificar leads por tenant (deve estar isolado)
SELECT 
    'LEADS POR TENANT - ISOLAMENTO' as info,
    t.name as tenant_name,
    COUNT(l.id) as total_leads,
    STRING_AGG(DISTINCT l.origin, ', ') as origens
FROM tenants t
LEFT JOIN leads l ON t.id = l.tenant_id
GROUP BY t.id, t.name
ORDER BY total_leads DESC;

-- 2. Verificar sales por tenant (deve estar isolado)
SELECT 
    'SALES POR TENANT - ISOLAMENTO' as info,
    t.name as tenant_name,
    COUNT(s.id) as total_sales,
    COALESCE(SUM(s.amount), 0) as total_valor
FROM tenants t
LEFT JOIN sales s ON t.id = s.tenant_id
GROUP BY t.id, t.name
ORDER BY total_sales DESC;

-- 3. Verificar usuários e seus tenants
SELECT 
    'USUÁRIOS E TENANTS' as info,
    u.name as usuario,
    u.email,
    t.name as tenant,
    u.role
FROM users u
JOIN tenants t ON u.tenant_id = t.id
ORDER BY t.name, u.name;

-- 4. Verificar se há dados misturados (NÃO deve haver)
SELECT 
    'VERIFICAÇÃO ISOLAMENTO' as info,
    'Cada usuário deve ter apenas dados do seu tenant' as status
WHERE NOT EXISTS (
    SELECT 1 FROM users u1, users u2, leads l
    WHERE u1.tenant_id != u2.tenant_id
    AND l.tenant_id = u1.tenant_id
    AND u2.email IN ('mariabrebal26@gmail.com', 'elaineportaporta@gmail.com', 'julia@wfcirurgicos.com.br')
    AND u1.email IN ('mariabrebal26@gmail.com', 'elaineportaporta@gmail.com', 'julia@wfcirurgicos.com.br')
    AND u1.email != u2.email
);
