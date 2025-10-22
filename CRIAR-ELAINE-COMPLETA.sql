-- =====================================================
-- CRIAR ELAINE COMPLETA - VERIFICAR E CRIAR
-- =====================================================

-- 1. Verificar se Elaine existe na tabela users
SELECT 
    'VERIFICANDO ELAINE NA TABELA USERS' as info,
    u.id,
    u.name,
    u.email,
    t.name as tenant_atual
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'elaineportaporta@gmail.com';

-- 2. Se não existir, vamos criar ela na tabela users
-- Primeiro, vamos ver o ID do tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name
FROM tenants
WHERE name = 'Porta a Porta';

-- 3. Criar Elaine na tabela users (se não existir)
INSERT INTO users (
    tenant_id,
    name,
    email,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Elaine',
    'elaineportaporta@gmail.com',
    'agent',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = NOW();

-- 4. Verificar se foi criada/atualizada
SELECT 
    'ELAINE CRIADA/ATUALIZADA!' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'elaineportaporta@gmail.com';

-- 5. Agora criar user_role (deve funcionar agora)
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

-- 6. Verificar user_role criado
SELECT 
    'USER ROLE CRIADO!' as info,
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
