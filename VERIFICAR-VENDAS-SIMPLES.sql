-- ========================================
-- VERIFICAR VENDAS - VERSÃO SIMPLES
-- ========================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar tenant_ids dos usuários
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN (
        'maria@varejo.com', 
        'recebimento.fto@gmail.com',
        'taicaracho@varejo.com'
    )
ORDER BY 
    email;

-- 2. Verificar vendas por tenant_id
SELECT 
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- 3. Verificar leads fechados por tenant_id
SELECT 
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

-- 4. Verificar se há vendas em leads.fields
SELECT 
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
