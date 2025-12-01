-- ====================================================
-- UNIFICAR TENANT_ID PARA MARIA_BREBAL26@GMAIL.COM
-- ====================================================
-- Execute este script no Supabase SQL Editor para garantir
-- que os usuários recebimento.fto@gmail.com e taicaracho@gmail.com
-- estejam no mesmo tenant_id que mariabrebal26@gmail.com.

-- PASSO 1: Verificar os tenant_ids ATUAIS dos usuários envolvidos
SELECT
    'ANTES' as status,
    email,
    raw_user_meta_data->>'tenant_id' AS current_tenant_id
FROM
    auth.users
WHERE
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY email;

-- PASSO 2: Obter o tenant_id da mariabrebal26@gmail.com
WITH maria_tenant AS (
    SELECT 
        raw_user_meta_data->>'tenant_id' AS tenant_id,
        email
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
SELECT 
    'TENANT_MARIA_BREBAL' as tipo,
    tenant_id,
    email
FROM maria_tenant;

-- PASSO 3: Atualizar o tenant_id para recebimento.fto@gmail.com
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(tenant_id) FROM maria_tenant)
)
WHERE email = 'recebimento.fto@gmail.com';

-- PASSO 4: Atualizar o tenant_id para taicaracho@gmail.com
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(tenant_id) FROM maria_tenant)
)
WHERE email = 'taicaracho@gmail.com';

-- PASSO 5: Verificar os tenant_ids APÓS a atualização
SELECT
    'DEPOIS' as status,
    email,
    raw_user_meta_data->>'tenant_id' AS new_tenant_id
FROM
    auth.users
WHERE
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY email;

-- PASSO 6: Verificar se agora todos têm o mesmo tenant_id
SELECT 
    'CONFIRMACAO_UNIFICACAO' as tipo,
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants_diferentes
FROM 
    auth.users
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com');
-- DEVE retornar 1!

-- PASSO 7: Verificar vendas por tenant após unificação
SELECT 
    'VENDAS_POR_TENANT_UNIFICADO' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 8: Verificar leads fechados por tenant após unificação
SELECT 
    'LEADS_FECHADOS_POR_TENANT_UNIFICADO' as tipo,
    tenant_id,
    COUNT(*) AS total_leads_fechados
FROM 
    public.leads
WHERE 
    status = 'closed'
GROUP BY 
    tenant_id
ORDER BY 
    total_leads_fechados DESC;

-- PASSO 9: Calcular total real final após unificação
WITH vendas_sales AS (
    SELECT 
        tenant_id,
        SUM(amount) as total_sales
    FROM public.sales
    GROUP BY tenant_id
),
vendas_fields AS (
    SELECT 
        tenant_id,
        SUM(CAST(fields->>'sale_value' AS NUMERIC)) as total_fields
    FROM public.leads
    WHERE 
        status = 'closed' 
        AND fields ? 'sale_value'
        AND fields->>'sale_value' IS NOT NULL
        AND fields->>'sale_value' != '0'
        AND fields->>'sale_value' != ''
    GROUP BY tenant_id
)
SELECT 
    'TOTAL_REAL_FINAL_UNIFICADO' as tipo,
    COALESCE(s.tenant_id, f.tenant_id) as tenant_id,
    COALESCE(s.total_sales, 0) as vendas_sales,
    COALESCE(f.total_fields, 0) as vendas_fields,
    (COALESCE(s.total_sales, 0) + COALESCE(f.total_fields, 0)) as total_real
FROM 
    vendas_sales s
FULL OUTER JOIN 
    vendas_fields f ON s.tenant_id = f.tenant_id
ORDER BY 
    total_real DESC;

-- ========================================
-- INSTRUÇÕES CRÍTICAS:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 6 retorna "1" (um tenant só)
-- 3. Júlio (recebimento.fto@gmail.com) deve fazer LOGOUT e LOGIN
-- 4. Taiguara (taicaracho@gmail.com) deve fazer LOGOUT e LOGIN
-- 5. Recarregue a página no Chrome (F5)
-- 6. Agora todos devem ver o MESMO valor da Maria!
-- ========================================
