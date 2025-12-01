-- =====================================================
-- CRIAR ELAINE - VIA SUPABASE AUTH (ALTERNATIVA)
-- =====================================================

-- 1. Verificar se Elaine já existe
SELECT 
    'VERIFICANDO ELAINE' as info,
    u.id,
    u.name,
    u.email,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 2. Se não existir, vamos tentar uma abordagem diferente
-- Primeiro, vamos ver se conseguimos inserir diretamente na tabela auth.users
-- (Isso pode não funcionar dependendo das permissões)

-- 3. Alternativa: Criar usuário com ID específico para evitar conflitos
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
    '00000000-0000-0000-0000-000000000001', -- ID fixo específico
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Elaine',
    'elaine@portaporta.com',
    'agent',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
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
WHERE u.name = 'Elaine';

-- 5. Criar user_role com ID específico também
INSERT INTO user_roles (
    id,
    user_id,
    tenant_id,
    role,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000002', -- ID fixo específico
    '00000000-0000-0000-0000-000000000001', -- ID da Elaine
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    created_at = EXCLUDED.created_at;

-- 6. Verificar resultado final
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
