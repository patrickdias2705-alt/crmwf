-- ========================================
-- CORRIGIR TENANT_ID - VERSÃO FINAL
-- ========================================
-- Execute este script passo a passo no Supabase SQL Editor

-- PASSO 1: Ver TODOS os usuários e seus tenant_ids atuais
SELECT 
    email,
    id as user_id,
    raw_user_meta_data->>'tenant_id' AS tenant_id_atual,
    raw_user_meta_data->>'role' AS role
FROM 
    auth.users
ORDER BY 
    email;

-- PASSO 2: Contar quantos tenant_ids diferentes existem
SELECT 
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
-- Se retornar > 1, os usuários estão em tenants diferentes (PROBLEMA!)

-- PASSO 3: Identificar o tenant_id da Maria (ou Maria Vitória)
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email LIKE '%maria%'
ORDER BY 
    email;

-- PASSO 4: Atualizar Júlio (recebimento.fto@gmail.com) para o mesmo tenant da Maria
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (
        SELECT to_jsonb(raw_user_meta_data->>'tenant_id') 
        FROM auth.users 
        WHERE email LIKE '%maria%' 
        LIMIT 1
    )
)
WHERE email = 'recebimento.fto@gmail.com';

-- PASSO 5: Atualizar Taiguara para o mesmo tenant da Maria
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (
        SELECT to_jsonb(raw_user_meta_data->>'tenant_id') 
        FROM auth.users 
        WHERE email LIKE '%maria%' 
        LIMIT 1
    )
)
WHERE email LIKE '%taicaracho%' OR email LIKE '%taiguara%';

-- PASSO 6: Verificar se a atualização funcionou
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id_atualizado,
    raw_user_meta_data->>'role' AS role
FROM 
    auth.users
WHERE 
    email IN (
        'recebimento.fto@gmail.com'
    ) OR email LIKE '%maria%' OR email LIKE '%taicaracho%' OR email LIKE '%taiguara%'
ORDER BY 
    email;

-- PASSO 7: Contar novamente para confirmar
SELECT 
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants_diferentes
FROM 
    auth.users
WHERE 
    email IN (
        'recebimento.fto@gmail.com'
    ) OR email LIKE '%maria%' OR email LIKE '%taicaracho%' OR email LIKE '%taiguara%';
-- Agora DEVE retornar 1 (todos no mesmo tenant)

-- PASSO 8: Verificar leads por tenant
SELECT 
    tenant_id,
    COUNT(*) AS total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS leads_fechados
FROM 
    public.leads
GROUP BY 
    tenant_id
ORDER BY 
    total_leads DESC;

-- PASSO 9: Verificar vendas por tenant
SELECT 
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    AVG(amount) AS ticket_medio
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
-- 2. Verifique que o PASSO 7 retorna "1" (todos no mesmo tenant)
-- 3. Júlio e Taiguara devem fazer LOGOUT e LOGIN novamente
-- 4. Agora todos verão os mesmos dados!
-- ========================================

