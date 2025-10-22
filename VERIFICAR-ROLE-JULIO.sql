-- Verificar role do Julio
SELECT 
    id,
    email,
    name,
    role,
    tenant_id,
    active
FROM users 
WHERE email ILIKE '%julio%' OR email ILIKE '%julio%';

-- Verificar todos os usuários e seus roles
SELECT 
    email,
    name,
    role,
    tenant_id,
    active
FROM users 
ORDER BY email;

