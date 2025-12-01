-- ========================================
-- CORRIGIR VALORES DIFERENTES NA MESMA TENANT
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se todos os usuários estão no mesmo tenant_id
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role
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

-- PASSO 2: Verificar vendas por tenant_id
SELECT 
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    AVG(amount) AS ticket_medio,
    MIN(created_at) AS primeira_venda,
    MAX(created_at) AS ultima_venda
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 3: Verificar leads por tenant_id
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

-- PASSO 4: Se houver múltiplos tenant_ids, unificar todos para o da Maria
-- IMPORTANTE: Execute apenas se o PASSO 1 mostrar tenant_ids diferentes!

-- Primeiro, identificar o tenant_id da Maria
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email LIKE '%maria%'
    LIMIT 1
)
-- Atualizar Júlio para o mesmo tenant da Maria
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(tenant_id) FROM maria_tenant)
)
WHERE email = 'recebimento.fto@gmail.com';

-- Atualizar Taiguara para o mesmo tenant da Maria
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(tenant_id) FROM maria_tenant)
)
WHERE email LIKE '%taicaracho%' OR email LIKE '%taiguara%';

-- PASSO 5: Verificar se a unificação funcionou
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id_unificado
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

-- PASSO 6: Verificar se agora há apenas um tenant_id
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
-- DEVE retornar 1 (todos no mesmo tenant)

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 6 retorna "1"
-- 3. Júlio e Taiguara devem fazer LOGOUT e LOGIN
-- 4. Agora todos verão os mesmos valores!
-- ========================================
