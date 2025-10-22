-- =====================================================
-- CRIAR SUPERVISOR PARA ELAINE (PORTA A PORTA)
-- =====================================================

-- 1. Atualizar usuário supervisor existente com tenant_id
UPDATE users 
SET 
    name = 'Supervisor Porta a Porta',
    tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    updated_at = NOW()
WHERE email = 'supervisorportaporta@gmail.com';

-- 2. Criar role de supervisor para o usuário
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
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Verificar se foi criado corretamente
SELECT 
    'SUPERVISOR CRIADO' as info,
    u.id as user_id,
    u.email as email,
    u.name as name,
    u.tenant_id as tenant_id,
    t.name as tenant_name,
    ur.role as role
FROM users u
JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'supervisorportaporta@gmail.com';
