-- =====================================================
-- ADICIONAR ROLE SUPERVISOR
-- =====================================================

-- 1. Adicionar role de supervisor (sem ON CONFLICT)
INSERT INTO user_roles (id, user_id, role, tenant_id, created_at)
SELECT 
    gen_random_uuid() as id,
    u.id as user_id,
    'supervisor' as role,
    u.tenant_id as tenant_id,
    NOW() as created_at
FROM users u
WHERE u.email = 'supervisorportaporta@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id 
    AND ur.role = 'supervisor'
);

-- 2. Verificar se foi adicionado
SELECT 
    'ROLE ADICIONADA' as info,
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
