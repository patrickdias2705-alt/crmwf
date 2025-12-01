-- ========================================
-- CORRIGIR VENDAS DA MARIA NO BANCO DE DADOS
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
    email = 'maria@varejo.com';

-- PASSO 2: Verificar leads fechados da Maria que NÃO têm venda na tabela sales
SELECT 
    'LEADS_MARIA_SEM_VENDA' as tipo,
    l.id AS lead_id,
    l.name,
    l.email,
    l.phone,
    l.status,
    l.fields->>'sale_value' AS valor_em_fields,
    l.fields->>'sale_date' AS data_venda_em_fields,
    l.created_at,
    l.updated_at
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'maria@varejo.com')
    AND l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
ORDER BY 
    l.updated_at DESC;

-- PASSO 3: Migrar TODAS as vendas da Maria para a tabela sales
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email = 'maria@varejo.com'
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
    l.tenant_id = mt.tenant_id
    AND l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND (l.fields->>'sale_value')::NUMERIC > 0
ON CONFLICT (lead_id) DO UPDATE SET
    amount = EXCLUDED.amount,
    created_at = EXCLUDED.created_at,
    tenant_id = EXCLUDED.tenant_id;

-- PASSO 4: Verificar quantas vendas foram migradas
SELECT 
    'VENDAS_MIGRADAS_MARIA' as tipo,
    COUNT(*) AS total_migradas
FROM public.sales
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- PASSO 5: Verificar total de vendas da Maria após migração
SELECT 
    'TOTAL_VENDAS_MARIA' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
WHERE 
    tenant_id = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'maria@varejo.com')
GROUP BY 
    tenant_id;

-- PASSO 6: Verificar leads fechados da Maria
SELECT 
    'LEADS_FECHADOS_MARIA' as tipo,
    COUNT(*) AS total_leads_fechados
FROM 
    public.leads
WHERE 
    tenant_id = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'maria@varejo.com')
    AND status = 'closed';

-- PASSO 7: Verificar se Júlio tem o mesmo tenant_id da Maria
SELECT 
    'TENANT_IDS_COMPARACAO' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN ('maria@varejo.com', 'recebimento.fto@gmail.com')
ORDER BY 
    email;

-- PASSO 8: Se Júlio não tiver o mesmo tenant_id, corrigir
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email = 'maria@varejo.com'
)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(tenant_id) FROM maria_tenant)
)
WHERE email = 'recebimento.fto@gmail.com';

-- PASSO 9: Verificar se agora ambos têm o mesmo tenant_id
SELECT 
    'TENANT_IDS_FINAIS' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN ('maria@varejo.com', 'recebimento.fto@gmail.com')
ORDER BY 
    email;

-- PASSO 10: Verificar vendas por tenant após correção
SELECT 
    'VENDAS_POR_TENANT_FINAL' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 11: Calcular total real final
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
    'TOTAL_REAL_FINAL_CORRIGIDO' as tipo,
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
-- 2. Verifique que o PASSO 9 mostra o MESMO tenant_id para ambos
-- 3. Júlio deve fazer LOGOUT e LOGIN
-- 4. Recarregue a página no Chrome (F5)
-- 5. Agora ambos devem ver o MESMO valor!
-- ========================================
