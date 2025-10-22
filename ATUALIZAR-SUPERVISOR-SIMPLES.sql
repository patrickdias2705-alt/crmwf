-- =====================================================
-- ATUALIZAR SUPERVISOR SIMPLES
-- =====================================================

-- 1. Atualizar usuário supervisor com tenant_id correto
UPDATE users 
SET 
    name = 'Supervisor Porta a Porta',
    tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    updated_at = NOW()
WHERE email = 'supervisorportaporta@gmail.com';

-- 2. Verificar se foi atualizado
SELECT 
    'SUPERVISOR ATUALIZADO' as info,
    u.id as user_id,
    u.email as email,
    u.name as name,
    u.tenant_id as tenant_id,
    t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'supervisorportaporta@gmail.com';
