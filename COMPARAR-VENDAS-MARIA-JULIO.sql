-- ========================================
-- COMPARAR VENDAS MARIA vs JÚLIO - INVESTIGAÇÃO DETALHADA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar tenant_ids exatos
SELECT 
    'TENANT_IDS' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    LENGTH(raw_user_meta_data->>'tenant_id') AS tamanho_tenant_id
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

-- PASSO 2: Verificar se há múltiplos tenant_ids
SELECT 
    'TENANT_DIFERENTES' as tipo,
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants,
    STRING_AGG(DISTINCT email, ', ') AS usuarios_por_tenant
FROM 
    auth.users
WHERE 
    email IN (
        'maria@varejo.com', 
        'mariavitoria@varejo.com',
        'recebimento.fto@gmail.com',
        'taicaracho@varejo.com'
    );

-- PASSO 3: Verificar vendas por tenant_id (DETALHADO)
SELECT 
    'VENDAS_POR_TENANT' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    MIN(amount) AS menor_venda,
    MAX(amount) AS maior_venda,
    STRING_AGG(DISTINCT lead_id::text, ', ') AS lead_ids
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 4: Verificar leads fechados por tenant_id
SELECT 
    'LEADS_FECHADOS_POR_TENANT' as tipo,
    tenant_id,
    COUNT(*) AS total_leads_fechados,
    STRING_AGG(DISTINCT id::text, ', ') AS lead_ids_fechados
FROM 
    public.leads
WHERE 
    status = 'closed'
GROUP BY 
    tenant_id
ORDER BY 
    total_leads_fechados DESC;

-- PASSO 5: Verificar vendas em leads.fields por tenant_id
SELECT 
    'VENDAS_EM_FIELDS_POR_TENANT' as tipo,
    tenant_id,
    COUNT(*) AS leads_com_vendas_em_fields,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor_em_fields,
    STRING_AGG(DISTINCT id::text, ', ') AS lead_ids_com_fields
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

-- PASSO 6: Verificar se há leads com vendas em fields mas sem sales
SELECT 
    'LEADS_SEM_SALES' as tipo,
    l.tenant_id,
    l.id as lead_id,
    l.name as lead_name,
    l.fields->>'sale_value' as sale_value_fields,
    s.id as sale_id,
    s.amount as sale_amount
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed' 
    AND l.fields ? 'sale_value'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND s.id IS NULL
ORDER BY 
    l.tenant_id, l.created_at DESC;

-- PASSO 7: Verificar se há sales sem leads fechados
SELECT 
    'SALES_SEM_LEADS_FECHADOS' as tipo,
    s.tenant_id,
    s.id as sale_id,
    s.amount as sale_amount,
    s.lead_id,
    l.status as lead_status
FROM 
    public.sales s
LEFT JOIN 
    public.leads l ON s.lead_id = l.id
WHERE 
    l.status != 'closed' OR l.id IS NULL
ORDER BY 
    s.tenant_id, s.created_at DESC;

-- PASSO 8: Calcular total real de vendas por tenant (sales + fields)
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
    'TOTAL_REAL_VENDAS' as tipo,
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
-- ANÁLISE:
-- ========================================
-- 1. Se PASSO 2 mostrar > 1: Usuários estão em tenants diferentes
-- 2. Se PASSO 6 mostrar leads: Há vendas em fields não migradas para sales
-- 3. Se PASSO 8 mostrar valores diferentes: O problema está na migração
-- ========================================
