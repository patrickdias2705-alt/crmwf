-- ========================================
-- MIGRAR VENDAS FANTASMA DA MARIA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar vendas que estão só em fields (fantasma)
SELECT 
    'VENDAS_FANTASMA_DETECTADAS' as tipo,
    COUNT(*) AS total_leads_fantasma,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor_fantasma
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != '';

-- PASSO 2: Migrar vendas fantasma para a tabela sales
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

-- PASSO 3: Verificar quantas vendas foram migradas
SELECT 
    'VENDAS_MIGRADAS' as tipo,
    COUNT(*) AS total_migradas
FROM public.sales
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- PASSO 4: Verificar total de vendas após migração
SELECT 
    'TOTAL_VENDAS_APOS_MIGRACAO' as tipo,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    MIN(amount) AS menor_venda,
    MAX(amount) AS maior_venda,
    AVG(amount) AS media_vendas
FROM 
    public.sales
WHERE 
    tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com');

-- PASSO 5: Verificar se ainda há vendas fantasma
SELECT 
    'VENDAS_FANTASMA_RESTANTES' as tipo,
    COUNT(*) AS total_leads_fantasma_restantes
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != '';
-- DEVE retornar 0!

-- PASSO 6: Calcular total real final
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

-- PASSO 7: Verificar leads fechados da Maria
SELECT 
    'LEADS_FECHADOS_MARIA' as tipo,
    COUNT(*) AS total_leads_fechados
FROM 
    public.leads
WHERE 
    tenant_id::text = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE email = 'mariabrebal26@gmail.com')
    AND status = 'closed';

-- PASSO 8: Verificar se o trigger está funcionando
SELECT 
    'VERIFICAR_TRIGGER' as tipo,
    tgname AS trigger_name,
    relname AS table_name
FROM 
    pg_trigger t
JOIN 
    pg_class c ON t.tgrelid = c.oid
WHERE 
    c.relname = 'leads' 
    AND tgname = 'trigger_insert_sale_on_lead_close';

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 5 retorna 0 (zero)
-- 3. Verifique que o PASSO 6 mostra o valor correto (R$ 9.854,78)
-- 4. Maria deve fazer LOGOUT e LOGIN
-- 5. Recarregue a página no Chrome (F5)
-- 6. Agora o banco deve mostrar o mesmo valor do frontend!
-- ========================================
