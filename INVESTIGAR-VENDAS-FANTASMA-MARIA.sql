-- ========================================
-- INVESTIGAR VENDAS FANTASMA DA MARIA
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

-- PASSO 2: Verificar TODAS as vendas na tabela sales para o tenant da Maria
SELECT 
    'VENDAS_TABELA_SALES' as tipo,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    MIN(amount) AS menor_venda,
    MAX(amount) AS maior_venda,
    AVG(amount) AS media_vendas
FROM 
    public.sales
WHERE 
    tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com');

-- PASSO 3: Verificar leads fechados da Maria com valores em fields
SELECT 
    'LEADS_FECHADOS_COM_VALORES_FIELDS' as tipo,
    COUNT(*) AS total_leads,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor_fields,
    MIN(CAST(fields->>'sale_value' AS NUMERIC)) AS menor_venda_fields,
    MAX(CAST(fields->>'sale_value' AS NUMERIC)) AS maior_venda_fields
FROM 
    public.leads
WHERE 
    tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND status = 'closed'
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != '';

-- PASSO 4: Verificar leads que têm venda em fields mas NÃO têm na tabela sales
SELECT 
    'LEADS_COM_VENDA_FIELDS_SEM_SALES' as tipo,
    l.id AS lead_id,
    l.name,
    l.email,
    l.phone,
    l.status,
    l.fields->>'sale_value' AS valor_em_fields,
    l.fields->>'sale_date' AS data_venda_em_fields,
    l.created_at,
    l.updated_at,
    s.id AS sales_id,
    s.amount AS valor_em_sales
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND l.status = 'closed'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND s.id IS NULL
ORDER BY 
    CAST(l.fields->>'sale_value' AS NUMERIC) DESC;

-- PASSO 5: Calcular diferença entre fields e sales
WITH vendas_sales AS (
    SELECT 
        COUNT(*) AS total_vendas_sales,
        SUM(amount) AS total_valor_sales
    FROM public.sales
    WHERE tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
),
vendas_fields AS (
    SELECT 
        COUNT(*) AS total_vendas_fields,
        SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor_fields
    FROM public.leads
    WHERE 
        tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
        AND status = 'closed'
        AND fields->>'sale_value' IS NOT NULL
        AND fields->>'sale_value' != '0'
        AND fields->>'sale_value' != ''
)
SELECT 
    'COMPARACAO_FIELDS_VS_SALES' as tipo,
    s.total_vendas_sales,
    s.total_valor_sales,
    f.total_vendas_fields,
    f.total_valor_fields,
    (f.total_vendas_fields - s.total_vendas_sales) AS diferenca_quantidade,
    (f.total_valor_fields - s.total_valor_sales) AS diferenca_valor
FROM 
    vendas_sales s
CROSS JOIN 
    vendas_fields f;

-- PASSO 6: Verificar se há leads com valores diferentes entre fields e sales
SELECT 
    'LEADS_VALORES_DIFERENTES' as tipo,
    l.id AS lead_id,
    l.name,
    l.fields->>'sale_value' AS valor_em_fields,
    s.amount AS valor_em_sales,
    (CAST(l.fields->>'sale_value' AS NUMERIC) - s.amount) AS diferenca
FROM 
    public.leads l
JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND l.status = 'closed'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND ABS(CAST(l.fields->>'sale_value' AS NUMERIC) - s.amount) > 0.01
ORDER BY 
    diferenca DESC;

-- PASSO 7: Verificar se há leads duplicados ou com problemas
SELECT 
    'LEADS_PROBLEMAS' as tipo,
    l.id AS lead_id,
    l.name,
    l.status,
    l.fields->>'sale_value' AS valor_em_fields,
    l.fields->>'sale_date' AS data_venda_em_fields,
    l.created_at,
    l.updated_at,
    COUNT(s.id) AS quantidade_vendas_sales
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND l.status = 'closed'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
GROUP BY 
    l.id, l.name, l.status, l.fields, l.created_at, l.updated_at
HAVING 
    COUNT(s.id) > 1
ORDER BY 
    l.updated_at DESC;

-- PASSO 8: Verificar métricas diárias
SELECT 
    'METRICAS_DIARIAS' as tipo,
    date,
    total_sold,
    avg_ticket
FROM 
    public.metrics_daily
WHERE 
    tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
ORDER BY 
    date DESC
LIMIT 10;

-- ========================================
-- ANÁLISE:
-- ========================================
-- 1. Se PASSO 4 retornar leads, são vendas que estão só em fields
-- 2. Se PASSO 5 mostrar diferença, há inconsistência entre fields e sales
-- 3. Se PASSO 6 retornar leads, há valores diferentes entre fields e sales
-- 4. Se PASSO 7 retornar leads, há leads duplicados ou com problemas
-- ========================================
