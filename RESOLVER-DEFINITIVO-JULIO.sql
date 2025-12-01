-- ========================================
-- RESOLVER DEFINITIVO - JÚLIO VER MESMO VALOR DA MARIA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar tenant_ids atuais
SELECT 
    'ANTES' as status,
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

-- PASSO 2: Pegar o tenant_id da Maria
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email LIKE '%maria%'
    ORDER BY created_at ASC
    LIMIT 1
)
SELECT 
    'TENANT_MARIA' as tipo,
    tenant_id
FROM maria_tenant;

-- PASSO 3: FORÇAR Júlio para o mesmo tenant da Maria
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

-- PASSO 4: FORÇAR Taiguara para o mesmo tenant da Maria
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

-- PASSO 5: Verificar se funcionou
SELECT 
    'DEPOIS' as status,
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

-- PASSO 6: Verificar se agora há apenas 1 tenant_id
SELECT 
    'CONFIRMACAO' as tipo,
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

-- PASSO 7: Verificar vendas por tenant (deve mostrar apenas 1 linha)
SELECT 
    'VENDAS_FINAIS' as tipo,
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

-- PASSO 8: Verificar leads fechados por tenant (deve mostrar apenas 1 linha)
SELECT 
    'LEADS_FINAIS' as tipo,
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

-- PASSO 9: Verificar se há vendas em leads.fields
SELECT 
    'VENDAS_EM_FIELDS' as tipo,
    tenant_id,
    COUNT(*) AS leads_com_vendas_em_fields,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor_em_fields
FROM 
    public.leads
WHERE 
    status = 'closed' 
    AND fields ? 'sale_value'
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != ''
GROUP BY 
    tenant_id
ORDER BY 
    total_valor_em_fields DESC;

-- PASSO 10: Calcular total real (sales + fields)
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
    'TOTAL_REAL_FINAL' as tipo,
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
-- 2. Verifique que o PASSO 6 retorna "1"
-- 3. Júlio DEVE fazer LOGOUT e LOGIN
-- 4. Taiguara DEVE fazer LOGOUT e LOGIN
-- 5. Recarregue a página no Chrome (F5)
-- 6. Agora todos devem ver o MESMO valor!
-- ========================================
