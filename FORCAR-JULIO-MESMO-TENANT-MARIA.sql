-- ========================================
-- FORÇAR JÚLIO USAR MESMO TENANT DA MARIA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar tenant_ids atuais de todos os usuários
SELECT 
    'ANTES' as status,
    email,
    id as user_id,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role,
    LENGTH(raw_user_meta_data->>'tenant_id') AS tamanho_tenant_id
FROM 
    auth.users
WHERE 
    email IN (
        'maria@varejo.com', 
        'mariavitoria@varejo.com',
        'mariabrebal26@gmail.com',
        'recebimento.fto@gmail.com',
        'julio@varejo.com',
        'taicaracho@varejo.com'
    )
ORDER BY 
    email;

-- PASSO 2: Pegar o tenant_id da Maria (o correto)
WITH maria_tenant AS (
    SELECT 
        email,
        raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email LIKE '%maria%'
    ORDER BY created_at ASC
    LIMIT 1
)
SELECT 
    'TENANT_MARIA_CORRETO' as tipo,
    email,
    tenant_id
FROM maria_tenant;

-- PASSO 3: FORÇAR TODOS os usuários para o EXATO tenant_id da Maria
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email LIKE '%maria%'
    ORDER BY created_at ASC
    LIMIT 1
)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(tenant_id) FROM maria_tenant)
)
WHERE email IN (
    'maria@varejo.com', 
    'mariavitoria@varejo.com',
    'mariabrebal26@gmail.com',
    'recebimento.fto@gmail.com',
    'julio@varejo.com',
    'taicaracho@varejo.com'
);

-- PASSO 4: Verificar se funcionou
SELECT 
    'DEPOIS' as status,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    LENGTH(raw_user_meta_data->>'tenant_id') AS tamanho_tenant_id
FROM 
    auth.users
WHERE 
    email IN (
        'maria@varejo.com', 
        'mariavitoria@varejo.com',
        'mariabrebal26@gmail.com',
        'recebimento.fto@gmail.com',
        'julio@varejo.com',
        'taicaracho@varejo.com'
    )
ORDER BY 
    email;

-- PASSO 5: Verificar se agora há apenas 1 tenant_id único
SELECT 
    'CONFIRMACAO' as tipo,
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants_diferentes
FROM 
    auth.users
WHERE 
    email IN (
        'maria@varejo.com', 
        'mariavitoria@varejo.com',
        'mariabrebal26@gmail.com',
        'recebimento.fto@gmail.com',
        'julio@varejo.com',
        'taicaracho@varejo.com'
    );

-- PASSO 6: Verificar quantos leads cada usuário tem
SELECT 
    'LEADS_POR_USUARIO' as tipo,
    u.email,
    u.raw_user_meta_data->>'tenant_id' AS tenant_id,
    COUNT(l.id) as total_leads
FROM auth.users u
LEFT JOIN leads l ON l.tenant_id::text = u.raw_user_meta_data->>'tenant_id'
WHERE u.email IN (
    'maria@varejo.com', 
    'mariavitoria@varejo.com',
    'mariabrebal26@gmail.com',
    'recebimento.fto@gmail.com',
    'julio@varejo.com',
    'taicaracho@varejo.com'
)
GROUP BY u.email, u.raw_user_meta_data->>'tenant_id'
ORDER BY u.email;

-- PASSO 7: Verificar se todos os leads estão no tenant correto
SELECT 
    'LEADS_TENANT_VERIFICACAO' as tipo,
    tenant_id,
    COUNT(*) as total_leads
FROM leads
GROUP BY tenant_id
ORDER BY tenant_id;
