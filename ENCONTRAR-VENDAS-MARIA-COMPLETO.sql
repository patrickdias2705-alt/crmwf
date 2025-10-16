-- ========================================
-- ENCONTRAR VENDAS DA MARIA - BUSCA COMPLETA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar tenant_id da Maria
SELECT 
    'TENANT_MARIA' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email = 'mariabrebal26@gmail.com';

-- PASSO 2: Verificar TODAS as vendas na tabela sales (sem filtro de tenant)
SELECT 
    'TODAS_VENDAS_SALES' as tipo,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    tenant_id
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 3: Verificar TODOS os leads fechados (sem filtro de tenant)
SELECT 
    'TODOS_LEADS_FECHADOS' as tipo,
    COUNT(*) AS total_leads,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor,
    tenant_id
FROM 
    public.leads
WHERE 
    status = 'closed'
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != ''
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 4: Verificar leads da Maria por user_id
WITH maria_user AS (
    SELECT id AS user_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
SELECT 
    'LEADS_MARIA_POR_USER_ID' as tipo,
    COUNT(*) AS total_leads,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor
FROM 
    public.leads l
CROSS JOIN 
    maria_user mu
WHERE 
    l.user_id = mu.user_id
    AND l.status = 'closed'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != '';

-- PASSO 5: Verificar leads da Maria por tenant_id (usando o tenant_id correto)
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
SELECT 
    'LEADS_MARIA_POR_TENANT' as tipo,
    COUNT(*) AS total_leads,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor,
    l.tenant_id
FROM 
    public.leads l
CROSS JOIN 
    maria_tenant mt
WHERE 
    l.tenant_id::text = mt.tenant_id
    AND l.status = 'closed'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != '';

-- PASSO 6: Verificar se há leads com valores de venda mas status diferente de 'closed'
WITH maria_user AS (
    SELECT id AS user_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
SELECT 
    'LEADS_COM_VALOR_NAO_FECHADOS' as tipo,
    COUNT(*) AS total_leads,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor,
    status
FROM 
    public.leads l
CROSS JOIN 
    maria_user mu
WHERE 
    l.user_id = mu.user_id
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND l.status != 'closed'
GROUP BY 
    l.status
ORDER BY 
    total_valor DESC;

-- PASSO 7: Verificar leads da Maria com qualquer status
WITH maria_user AS (
    SELECT id AS user_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
SELECT 
    'LEADS_MARIA_TODOS_STATUS' as tipo,
    l.status,
    COUNT(*) AS total_leads,
    SUM(CAST(l.fields->>'sale_value' AS NUMERIC)) AS total_valor
FROM 
    public.leads l
CROSS JOIN 
    maria_user mu
WHERE 
    l.user_id = mu.user_id
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
GROUP BY 
    l.status
ORDER BY 
    total_valor DESC;

-- PASSO 8: Verificar se há leads duplicados ou com problemas
WITH maria_user AS (
    SELECT id AS user_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
SELECT 
    'LEADS_MARIA_DETALHADOS' as tipo,
    l.id,
    l.name,
    l.email,
    l.phone,
    l.status,
    l.user_id,
    l.tenant_id,
    l.fields->>'sale_value' AS valor_em_fields,
    l.fields->>'sale_date' AS data_venda_em_fields,
    l.created_at,
    l.updated_at
FROM 
    public.leads l
CROSS JOIN 
    maria_user mu
WHERE 
    l.user_id = mu.user_id
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
ORDER BY 
    CAST(l.fields->>'sale_value' AS NUMERIC) DESC;

-- PASSO 9: Verificar se há vendas na tabela sales para leads da Maria
WITH maria_user AS (
    SELECT id AS user_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
SELECT 
    'VENDAS_SALES_LEADS_MARIA' as tipo,
    COUNT(*) AS total_vendas,
    SUM(s.amount) AS total_valor
FROM 
    public.sales s
JOIN 
    public.leads l ON s.lead_id = l.id
CROSS JOIN 
    maria_user mu
WHERE 
    l.user_id = mu.user_id;

-- PASSO 10: Verificar métricas diárias para todos os tenants
SELECT 
    'METRICAS_DIARIAS_TODOS' as tipo,
    tenant_id,
    COUNT(*) AS total_dias,
    SUM(total_sold) AS total_vendido,
    AVG(avg_ticket) AS media_ticket
FROM 
    public.metrics_daily
GROUP BY 
    tenant_id
ORDER BY 
    total_vendido DESC;

-- ========================================
-- ANÁLISE:
-- ========================================
-- 1. Se PASSO 4 retornar vendas, estão associadas ao email da Maria
-- 2. Se PASSO 5 retornar vendas, estão associadas ao tenant_id da Maria
-- 3. Se PASSO 6 retornar vendas, há leads com valores mas status diferente de 'closed'
-- 4. Se PASSO 7 retornar vendas, há leads com valores em qualquer status
-- 5. Se PASSO 8 retornar leads, mostra os detalhes de cada lead da Maria
-- 6. Se PASSO 9 retornar vendas, há vendas na tabela sales para leads da Maria
-- ========================================
