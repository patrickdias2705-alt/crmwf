-- =====================================================
-- MOVER JULIA PARA TENANT "DISTRIBUIDOR"
-- =====================================================

-- 1. Verificar Julia atual
SELECT 
    'JULIA ATUAL' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant_atual
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'julia@wfcirurgicos.com.br';

-- 2. Verificar tenant "Distribuidor"
SELECT 
    'TENANT DISTRIBUIDOR' as info,
    id,
    name
FROM tenants
WHERE name = 'Distribuidor';

-- 3. Atualizar Julia para o tenant "Distribuidor"
UPDATE users 
SET 
    tenant_id = (SELECT id FROM tenants WHERE name = 'Distribuidor'),
    name = 'Julia',
    role = 'agent',
    active = true,
    updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br';

-- 4. Verificar se foi atualizada
SELECT 
    'JULIA ATUALIZADA!' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'julia@wfcirurgicos.com.br';

-- 5. Criar/atualizar user_role para Julia
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE email = 'julia@wfcirurgicos.com.br'),
    (SELECT id FROM tenants WHERE name = 'Distribuidor'),
    'agent'
) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    role = EXCLUDED.role;

-- 6. Verificar user_role da Julia
SELECT 
    'USER ROLE JULIA CRIADO/ATUALIZADO!' as info,
    ur.user_id,
    ur.role,
    u.name as user_name,
    t.name as tenant_name
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN tenants t ON ur.tenant_id = t.id
WHERE u.email = 'julia@wfcirurgicos.com.br';

-- 7. Verificar isolamento da Julia
SELECT 
    'ISOLAMENTO JULIA CONFIRMADO!' as info,
    'Julia está no tenant Distribuidor' as status
WHERE EXISTS (
    SELECT 1 FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.email = 'julia@wfcirurgicos.com.br' 
    AND t.name = 'Distribuidor'
);

-- 8. Verificar que Julia NÃO vê dados da Maria
SELECT 
    'VERIFICAÇÃO ISOLAMENTO' as info,
    'Julia NÃO vê dados da Maria' as status
WHERE NOT EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.email = 'julia@wfcirurgicos.com.br' 
    AND u2.email = 'mariabrebal26@gmail.com'
    AND u1.tenant_id = u2.tenant_id
);

-- 9. Verificar que Julia NÃO vê dados da Elaine
SELECT 
    'VERIFICAÇÃO ISOLAMENTO' as info,
    'Julia NÃO vê dados da Elaine' as status
WHERE NOT EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.email = 'julia@wfcirurgicos.com.br' 
    AND u2.email = 'elaineportaporta@gmail.com'
    AND u1.tenant_id = u2.tenant_id
);
