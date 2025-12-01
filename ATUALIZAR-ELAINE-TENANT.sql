-- =====================================================
-- ATUALIZAR ELAINE PARA TENANT "PORTA A PORTA"
-- =====================================================

-- 1. Verificar Elaine atual
SELECT 
    'ELAINE ATUAL' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant_atual
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'elaineportaporta@gmail.com';

-- 2. Verificar tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name
FROM tenants
WHERE name = 'Porta a Porta';

-- 3. Atualizar Elaine para o tenant "Porta a Porta"
UPDATE users 
SET 
    tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    name = 'Elaine',
    role = 'agent',
    active = true,
    updated_at = NOW()
WHERE email = 'elaineportaporta@gmail.com';

-- 4. Verificar se foi atualizada
SELECT 
    'ELAINE ATUALIZADA!' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'elaineportaporta@gmail.com';

-- 5. Criar/atualizar user_role
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE email = 'elaineportaporta@gmail.com'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    role = EXCLUDED.role;

-- 6. Verificar user_role
SELECT 
    'USER ROLE CRIADO/ATUALIZADO!' as info,
    ur.user_id,
    ur.role,
    u.name as user_name,
    t.name as tenant_name
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN tenants t ON ur.tenant_id = t.id
WHERE u.email = 'elaineportaporta@gmail.com';

-- 7. Verificar isolamento final
SELECT 
    'ISOLAMENTO CONFIRMADO!' as info,
    'Elaine está no tenant Porta a Porta' as status
WHERE EXISTS (
    SELECT 1 FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.email = 'elaineportaporta@gmail.com' 
    AND t.name = 'Porta a Porta'
);
