-- =====================================================
-- VERIFICAR SE SUPERVISOR JÁ EXISTE
-- =====================================================

-- 1. Verificar se o usuário supervisorportaporta@gmail.com já existe
SELECT 
    'VERIFICAR USUÁRIO SUPERVISOR' as info,
    u.id as user_id,
    u.email as email,
    u.name as name,
    u.tenant_id as tenant_id,
    t.name as tenant_name,
    ur.role as role
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'supervisorportaporta@gmail.com';
