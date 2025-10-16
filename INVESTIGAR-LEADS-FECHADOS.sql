-- ========================================
-- INVESTIGAR LEADS FECHADOS - MARIA vs JÚLIO
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar tenant_ids atuais
SELECT 
    'TENANT_IDS' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN ('maria@varejo.com', 'recebimento.fto@gmail.com')
ORDER BY 
    email;

-- PASSO 2: Contar leads fechados por tenant_id
SELECT 
    'LEADS_FECHADOS_POR_TENANT' as tipo,
    tenant_id,
    COUNT(*) AS total_leads_fechados,
    STRING_AGG(id::text, ', ' ORDER BY created_at DESC) AS ids_leads
FROM 
    public.leads
WHERE 
    status = 'closed'
GROUP BY 
    tenant_id
ORDER BY 
    total_leads_fechados DESC;

-- PASSO 3: Verificar leads fechados com valores de venda
SELECT 
    'LEADS_FECHADOS_COM_VALORES' as tipo,
    tenant_id,
    COUNT(*) AS leads_com_valores,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor
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
    total_valor DESC;

-- PASSO 4: Verificar vendas na tabela sales por tenant_id
SELECT 
    'VENDAS_TABELA_SALES' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas_sales,
    SUM(amount) AS total_valor_sales
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor_sales DESC;

-- PASSO 5: Comparar leads fechados vs vendas registradas
WITH leads_fechados AS (
    SELECT 
        tenant_id,
        COUNT(*) AS total_leads_fechados
    FROM public.leads
    WHERE status = 'closed'
    GROUP BY tenant_id
),
vendas_sales AS (
    SELECT 
        tenant_id,
        COUNT(*) AS total_vendas_sales
    FROM public.sales
    GROUP BY tenant_id
)
SELECT 
    'COMPARACAO_LEADS_VS_VENDAS' as tipo,
    COALESCE(l.tenant_id, s.tenant_id) AS tenant_id,
    COALESCE(l.total_leads_fechados, 0) AS leads_fechados,
    COALESCE(s.total_vendas_sales, 0) AS vendas_registradas,
    (COALESCE(l.total_leads_fechados, 0) - COALESCE(s.total_vendas_sales, 0)) AS diferenca
FROM 
    leads_fechados l
FULL OUTER JOIN 
    vendas_sales s ON l.tenant_id = s.tenant_id
ORDER BY 
    tenant_id;

-- PASSO 6: Verificar leads fechados que NÃO têm venda na tabela sales
SELECT 
    'LEADS_SEM_VENDA_REGISTRADA' as tipo,
    l.tenant_id,
    l.id AS lead_id,
    l.name,
    l.email,
    l.created_at,
    l.fields->>'sale_value' AS valor_em_fields,
    l.fields->>'sale_date' AS data_venda_em_fields
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
ORDER BY 
    l.tenant_id, l.created_at DESC;

-- PASSO 7: Verificar se o trigger está funcionando
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

-- PASSO 8: Testar o trigger manualmente (simular marcação de lead como fechado)
-- DESCOMENTE as linhas abaixo para testar o trigger:
/*
UPDATE public.leads 
SET 
    status = 'closed',
    updated_at = NOW()
WHERE 
    status != 'closed'
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != ''
LIMIT 1;

-- Verificar se a venda foi criada
SELECT 
    'TESTE_TRIGGER' as tipo,
    COUNT(*) AS vendas_criadas
FROM public.sales
WHERE created_at > NOW() - INTERVAL '1 minute';
*/

-- ========================================
-- ANÁLISE ESPERADA:
-- ========================================
-- 1. Maria deve ter 16 leads fechados
-- 2. Júlio deve ter 11 leads fechados (ou menos)
-- 3. A diferença está nos leads que não foram migrados para a tabela sales
-- 4. O trigger pode não estar funcionando para todos os leads
-- ========================================
