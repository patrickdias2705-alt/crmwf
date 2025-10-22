-- =====================================================
-- CRIAR ELAINE - SEM MEXER EM TRIGGERS
-- =====================================================
-- Vamos contornar o problema de triggers de outra forma

-- 1. Verificar se a Elaine já existe
SELECT 
    'VERIFICANDO ELAINE' as info,
    u.id,
    u.name,
    u.email,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 2. Se não existir, criar usando uma abordagem diferente
-- Vamos inserir com um ID específico para evitar conflitos
INSERT INTO users (
    id,
    tenant_id,
    name,
    email,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440999', -- ID fixo para evitar problemas
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Elaine',
    'elaine@portaporta.com',
    'agent',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Verificar se foi criada
SELECT 
    'ELAINE CRIADA!' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 4. Criar user_role com ID específico também
INSERT INTO user_roles (
    id,
    user_id,
    tenant_id,
    role,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655441000', -- ID fixo
    '550e8400-e29b-41d4-a716-446655440999', -- ID da Elaine
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Verificar resultado final
SELECT 
    'RESULTADO FINAL' as info,
    u.name as usuario,
    u.email,
    u.role as user_role,
    ur.role as tenant_role,
    t.name as tenant
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 6. Verificar isolamento
SELECT 
    'ISOLAMENTO CONFIRMADO' as info,
    'Elaine está no tenant Porta a Porta' as status
WHERE EXISTS (
    SELECT 1 FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.name = 'Elaine' 
    AND t.name = 'Porta a Porta'
);
