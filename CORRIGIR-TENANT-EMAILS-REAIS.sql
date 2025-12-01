-- ========================================
-- CORRIGIR TENANT COM EMAILS REAIS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar tenant_ids atuais
SELECT 
    'ANTES' as status,
    email,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'tenant_id' as tenant_id,
    LENGTH(raw_user_meta_data->>'tenant_id') AS tamanho_tenant_id
FROM 
    auth.users
WHERE 
    email IN (
        'taicaracho@gmail.com',
        'patrickdias2705@gmail.com',
        'mariabrebal26@gmail.com',
        'julia@wfcirurgicos.com.br',
        'recebimento.fto@gmail.com'
    )
ORDER BY 
    email;

-- PASSO 2: Pegar o tenant_id da Maria (o correto)
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' as tenant_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
    LIMIT 1
)
SELECT 
    'TENANT_MARIA_CORRETO' as tipo,
    tenant_id
FROM maria_tenant;

-- PASSO 3: FORÇAR TODOS os usuários (EXCETO JULIA) para o EXATO tenant_id da Maria
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' as tenant_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
    LIMIT 1
)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(tenant_id) FROM maria_tenant)
)
WHERE email IN (
    'taicaracho@gmail.com',
    'patrickdias2705@gmail.com',
    'mariabrebal26@gmail.com',
    'recebimento.fto@gmail.com'
);

-- PASSO 4: Verificar se funcionou
SELECT 
    'DEPOIS' as status,
    email,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'tenant_id' as tenant_id,
    LENGTH(raw_user_meta_data->>'tenant_id') AS tamanho_tenant_id
FROM 
    auth.users
WHERE 
    email IN (
        'taicaracho@gmail.com',
        'patrickdias2705@gmail.com',
        'mariabrebal26@gmail.com',
        'recebimento.fto@gmail.com'
    )
ORDER BY 
    email;

-- PASSO 5: Verificar se agora há apenas 1 tenant_id único (exceto Julia)
SELECT 
    'CONFIRMACAO' as tipo,
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants_diferentes
FROM 
    auth.users
WHERE 
    email IN (
        'taicaracho@gmail.com',
        'patrickdias2705@gmail.com',
        'mariabrebal26@gmail.com',
        'recebimento.fto@gmail.com'
    );

-- PASSO 6: Verificar quantos leads cada usuário tem (exceto Julia)
SELECT 
    'LEADS_POR_USUARIO' as tipo,
    u.email,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'tenant_id' as tenant_id,
    COUNT(l.id) as total_leads
FROM auth.users u
LEFT JOIN leads l ON l.tenant_id::text = u.raw_user_meta_data->>'tenant_id'
WHERE u.email IN (
    'taicaracho@gmail.com',
    'patrickdias2705@gmail.com',
    'mariabrebal26@gmail.com',
    'recebimento.fto@gmail.com'
)
GROUP BY u.email, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'tenant_id'
ORDER BY u.email;

-- PASSO 7: Verificar quantas vendas cada usuário tem (exceto Julia)
SELECT 
    'VENDAS_POR_USUARIO' as tipo,
    u.email,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'tenant_id' as tenant_id,
    COUNT(s.id) as total_vendas,
    SUM(s.amount) as valor_total
FROM auth.users u
LEFT JOIN sales s ON s.tenant_id::text = u.raw_user_meta_data->>'tenant_id'
WHERE u.email IN (
    'taicaracho@gmail.com',
    'patrickdias2705@gmail.com',
    'mariabrebal26@gmail.com',
    'recebimento.fto@gmail.com'
)
GROUP BY u.email, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'tenant_id'
ORDER BY u.email;

-- PASSO 8: Verificar se todos os leads estão no tenant correto
SELECT 
    'LEADS_TENANT_VERIFICACAO' as tipo,
    tenant_id,
    COUNT(*) as total_leads
FROM leads
GROUP BY tenant_id
ORDER BY tenant_id;

-- PASSO 9: Verificar se todas as vendas estão no tenant correto
SELECT 
    'VENDAS_TENANT_VERIFICACAO' as tipo,
    tenant_id,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
GROUP BY tenant_id
ORDER BY tenant_id;
