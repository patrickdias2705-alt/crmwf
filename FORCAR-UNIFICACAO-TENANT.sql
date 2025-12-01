-- ========================================
-- FORÇAR UNIFICAÇÃO DE TENANT - VERSÃO DEFINITIVA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Identificar o tenant_id da Maria (referência)
WITH maria_tenant AS (
    SELECT 
        raw_user_meta_data->>'tenant_id' AS tenant_id,
        email
    FROM auth.users
    WHERE email LIKE '%maria%'
    ORDER BY created_at ASC
    LIMIT 1
)
SELECT 
    'TENANT_REFERENCIA_MARIA' as tipo,
    tenant_id,
    email
FROM maria_tenant;

-- PASSO 2: Forçar unificação - Júlio
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
WHERE email = 'recebimento.fto@gmail.com';

-- PASSO 3: Forçar unificação - Taiguara
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
WHERE email LIKE '%taicaracho%' OR email LIKE '%taiguara%';

-- PASSO 4: Verificar se a unificação funcionou
SELECT 
    'DEPOIS_UNIFICACAO' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN (
        'maria@varejo.com', 
        'mariavitoria@varejo.com',
        'recebimento.fto@gmail.com',
        'taicaracho@varejo.com'
    )
ORDER BY 
    email;

-- PASSO 5: Verificar se agora há apenas 1 tenant_id
SELECT 
    'CONFIRMACAO_FINAL' as tipo,
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants_diferentes
FROM 
    auth.users
WHERE 
    email IN (
        'maria@varejo.com', 
        'mariavitoria@varejo.com',
        'recebimento.fto@gmail.com',
        'taicaracho@varejo.com'
    );
-- DEVE retornar 1!

-- PASSO 6: Verificar vendas após unificação
SELECT 
    'VENDAS_APOS_UNIFICACAO' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 5 retorna "1"
-- 3. Júlio e Taiguara devem fazer LOGOUT e LOGIN
-- 4. Agora todos devem ver os mesmos valores!
-- ========================================
