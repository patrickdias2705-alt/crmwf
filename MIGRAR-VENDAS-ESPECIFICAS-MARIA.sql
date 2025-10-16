-- ========================================
-- MIGRAR VENDAS ESPECÍFICAS DA MARIA
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

-- PASSO 2: Encontrar os leads específicos da Maria com essas vendas
SELECT 
    'LEADS_ESPECIFICOS_MARIA' as tipo,
    l.id AS lead_id,
    l.name,
    l.email,
    l.phone,
    l.status,
    l.tenant_id,
    l.fields->>'sale_value' AS valor_em_fields,
    l.fields->>'sale_date' AS data_venda_em_fields,
    l.created_at,
    l.updated_at
FROM 
    public.leads l
WHERE 
    l.tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND l.status = 'closed'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND (
        l.name ILIKE '%dra renata%' OR
        l.name ILIKE '%amador bueno%' OR
        l.name ILIKE '%life sorrisos%' OR
        l.name ILIKE '%implants odonto%' OR
        l.name ILIKE '%dr leandro lana%'
    )
ORDER BY 
    CAST(l.fields->>'sale_value' AS NUMERIC) DESC;

-- PASSO 3: Migrar essas vendas específicas para a tabela sales
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email = 'mariabrebal26@gmail.com'
)
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
SELECT 
    l.id,
    (l.fields->>'sale_value')::NUMERIC,
    COALESCE(
        (l.fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, 
        l.updated_at, 
        l.created_at, 
        NOW()
    ),
    l.tenant_id
FROM 
    public.leads l
CROSS JOIN 
    maria_tenant mt
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id::text = mt.tenant_id
    AND l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND (l.fields->>'sale_value')::NUMERIC > 0
    AND (
        l.name ILIKE '%dra renata%' OR
        l.name ILIKE '%amador bueno%' OR
        l.name ILIKE '%life sorrisos%' OR
        l.name ILIKE '%implants odonto%' OR
        l.name ILIKE '%dr leandro lana%'
    )
ON CONFLICT (lead_id) DO UPDATE SET
    amount = EXCLUDED.amount,
    created_at = EXCLUDED.created_at,
    tenant_id = EXCLUDED.tenant_id;

-- PASSO 4: Verificar quantas vendas foram migradas
SELECT 
    'VENDAS_MIGRADAS' as tipo,
    COUNT(*) AS total_migradas,
    SUM(amount) AS total_valor_migrado
FROM public.sales
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- PASSO 5: Verificar total de vendas da Maria após migração
SELECT 
    'TOTAL_VENDAS_MARIA_APOS_MIGRACAO' as tipo,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
WHERE 
    tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com');

-- PASSO 6: Verificar se as vendas específicas foram migradas
SELECT 
    'VENDAS_ESPECIFICAS_MIGRADAS' as tipo,
    s.id AS sale_id,
    l.name AS lead_name,
    s.amount AS valor_sales,
    s.created_at AS data_sales
FROM 
    public.sales s
JOIN 
    public.leads l ON s.lead_id = l.id
WHERE 
    l.tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND (
        l.name ILIKE '%dra renata%' OR
        l.name ILIKE '%amador bueno%' OR
        l.name ILIKE '%life sorrisos%' OR
        l.name ILIKE '%implants odonto%' OR
        l.name ILIKE '%dr leandro lana%'
    )
ORDER BY 
    s.amount DESC;

-- PASSO 7: Calcular total real final
WITH vendas_sales AS (
    SELECT 
        tenant_id,
        SUM(amount) as total_sales
    FROM public.sales
    WHERE tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    GROUP BY tenant_id
),
vendas_fields AS (
    SELECT 
        tenant_id,
        SUM(CAST(fields->>'sale_value' AS NUMERIC)) as total_fields
    FROM public.leads
    WHERE 
        tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
        AND status = 'closed'
        AND fields ? 'sale_value'
        AND fields->>'sale_value' IS NOT NULL
        AND fields->>'sale_value' != '0'
        AND fields->>'sale_value' != ''
    GROUP BY tenant_id
)
SELECT 
    'TOTAL_REAL_FINAL_MARIA' as tipo,
    COALESCE(s.tenant_id, f.tenant_id) as tenant_id,
    COALESCE(s.total_sales, 0) as vendas_sales,
    COALESCE(f.total_fields, 0) as vendas_fields,
    (COALESCE(s.total_sales, 0) + COALESCE(f.total_fields, 0)) as total_real
FROM 
    vendas_sales s
FULL OUTER JOIN 
    vendas_fields f ON s.tenant_id = f.tenant_id;

-- PASSO 8: Verificar se Júlio e Taiguara têm o mesmo tenant_id
SELECT 
    'TENANT_IDS_FINAIS' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY 
    email;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 4 mostra 5 vendas migradas
-- 3. Verifique que o PASSO 5 mostra o valor correto (R$ 9.854,78)
-- 4. Júlio e Taiguara devem fazer LOGOUT e LOGIN
-- 5. Recarregue a página no Chrome (F5)
-- 6. Agora todos devem ver o MESMO valor da Maria!
-- ========================================
