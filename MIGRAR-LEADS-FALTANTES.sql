-- ========================================
-- MIGRAR LEADS FALTANTES - MARIA vs JÚLIO
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar leads fechados que NÃO têm venda na tabela sales
WITH leads_sem_venda AS (
    SELECT 
        l.id,
        l.tenant_id,
        l.name,
        l.email,
        l.fields->>'sale_value' AS sale_value,
        l.fields->>'sale_date' AS sale_date,
        l.created_at,
        l.updated_at
    FROM 
        public.leads l
    LEFT JOIN 
        public.sales s ON l.id = s.lead_id
    WHERE 
        l.status = 'closed'
        AND s.id IS NULL
        AND l.fields->>'sale_value' IS NOT NULL
        AND l.fields->>'sale_value' != '0'
        AND l.fields->>'sale_value' != ''
)
SELECT 
    'LEADS_SEM_VENDA_REGISTRADA' as tipo,
    COUNT(*) AS total_leads_faltantes,
    tenant_id,
    COUNT(*) AS leads_por_tenant
FROM 
    leads_sem_venda
GROUP BY 
    tenant_id
ORDER BY 
    leads_por_tenant DESC;

-- PASSO 2: Migrar leads faltantes para a tabela sales
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
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND (l.fields->>'sale_value')::NUMERIC > 0
ON CONFLICT (lead_id) DO UPDATE SET
    amount = EXCLUDED.amount,
    created_at = EXCLUDED.created_at,
    tenant_id = EXCLUDED.tenant_id;

-- PASSO 3: Verificar quantos leads foram migrados
SELECT 
    'LEADS_MIGRADOS' as tipo,
    COUNT(*) AS total_migrados
FROM public.sales
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- PASSO 4: Verificar leads fechados por tenant após migração
SELECT 
    'LEADS_FECHADOS_APOS_MIGRACAO' as tipo,
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

-- PASSO 5: Verificar vendas por tenant após migração
SELECT 
    'VENDAS_APOS_MIGRACAO' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 6: Verificar se ainda há leads fechados sem venda
SELECT 
    'LEADS_AINDA_SEM_VENDA' as tipo,
    COUNT(*) AS leads_ainda_sem_venda
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != '';

-- PASSO 7: Calcular total real final
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
    'TOTAL_REAL_FINAL_APOS_MIGRACAO' as tipo,
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

-- PASSO 8: Verificar se todos os usuários têm o mesmo tenant_id
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

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 6 retorna 0 (zero)
-- 3. Júlio deve fazer LOGOUT e LOGIN
-- 4. Recarregue a página no Chrome (F5)
-- 5. Agora ambos devem ver o MESMO valor!
-- ========================================
