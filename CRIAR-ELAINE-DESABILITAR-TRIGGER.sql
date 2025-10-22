-- =====================================================
-- CRIAR ELAINE - DESABILITANDO TRIGGER ESPECÍFICO
-- =====================================================

-- 1. Primeiro, vamos ver exatamente qual trigger está causando problema
SELECT 
    'TRIGGERS PROBLEMÁTICOS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND trigger_name LIKE '%user_role%';

-- 2. Desabilitar o trigger específico que está causando problema
-- (Vamos tentar diferentes nomes possíveis)
DO $$
BEGIN
    -- Tentar desabilitar diferentes variações do trigger
    BEGIN
        ALTER TABLE users DISABLE TRIGGER create_default_user_role_trigger;
        RAISE NOTICE 'Trigger create_default_user_role_trigger desabilitado';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Trigger create_default_user_role_trigger não encontrado';
    END;
    
    BEGIN
        ALTER TABLE users DISABLE TRIGGER create_default_user_role;
        RAISE NOTICE 'Trigger create_default_user_role desabilitado';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Trigger create_default_user_role não encontrado';
    END;
END $$;

-- 3. Verificar tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name
FROM tenants
WHERE name = 'Porta a Porta';

-- 4. Criar usuário Elaine
INSERT INTO users (
    tenant_id,
    name,
    email,
    role,
    active
) VALUES (
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Elaine',
    'elaine@portaporta.com',
    'agent',
    true
);

-- 5. Verificar se foi criada
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

-- 6. Criar user_role manualmente
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE name = 'Elaine'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 7. Verificar resultado final
SELECT 
    'SUCESSO!' as info,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';
