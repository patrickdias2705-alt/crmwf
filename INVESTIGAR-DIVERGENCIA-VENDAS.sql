-- ========================================
-- INVESTIGAR DIVERGÊNCIA DE VENDAS - ANÁLISE COMPLETA
-- ========================================
-- Execute este script no Supabase SQL Editor para descobrir exatamente onde está o problema

-- PASSO 1: Verificar tenant_ids de todos os usuários
SELECT 
    'USUÁRIOS' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role
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
    'TENANT_IDS_DIFERENTES' as tipo,
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants,
    STRING_AGG(DISTINCT raw_user_meta_data->>'tenant_id', ', ') AS tenant_ids
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
    AVG(amount) AS ticket_medio,
    MIN(amount) AS menor_venda,
    MAX(amount) AS maior_venda,
    MIN(created_at) AS primeira_venda,
    MAX(created_at) AS ultima_venda
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 4: Verificar leads por tenant_id (DETALHADO)
SELECT 
    'LEADS_POR_TENANT' as tipo,
    tenant_id,
    COUNT(*) AS total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS leads_fechados,
    COUNT(CASE WHEN status = 'attended' THEN 1 END) AS leads_atendidos,
    COUNT(CASE WHEN status = 'qualified' THEN 1 END) AS leads_qualificados,
    COUNT(CASE WHEN status = 'refused' THEN 1 END) AS leads_recusados,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) AS leads_perdidos
FROM 
    public.leads
GROUP BY 
    tenant_id
ORDER BY 
    total_leads DESC;

-- PASSO 5: Verificar se há vendas em leads.fields que não migraram para sales
SELECT 
    'VENDAS_EM_LEADS_FIELDS' as tipo,
    l.tenant_id,
    COUNT(*) AS leads_com_vendas_em_fields,
    SUM(CAST(l.fields->>'sale_value' AS NUMERIC)) AS total_valor_em_fields,
    AVG(CAST(l.fields->>'sale_value' AS NUMERIC)) AS ticket_medio_em_fields
FROM 
    public.leads l
WHERE 
    l.status = 'closed' 
    AND l.fields ? 'sale_value'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
GROUP BY 
    l.tenant_id
ORDER BY 
    total_valor_em_fields DESC;

-- PASSO 6: Verificar se há vendas duplicadas (mesmo lead_id em sales e fields)
SELECT 
    'VENDAS_DUPLICADAS' as tipo,
    s.tenant_id,
    COUNT(*) AS vendas_duplicadas,
    SUM(s.amount) AS valor_duplicado
FROM 
    public.sales s
INNER JOIN 
    public.leads l ON s.lead_id = l.id
WHERE 
    l.fields ? 'sale_value'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
GROUP BY 
    s.tenant_id;

-- PASSO 7: Verificar métricas diárias por tenant
SELECT 
    'METRICAS_DIARIAS' as tipo,
    tenant_id,
    COUNT(*) AS dias_com_metricas,
    SUM(total_sold) AS total_vendido_metricas,
    AVG(total_sold) AS media_vendas_por_dia,
    MAX(total_sold) AS maior_venda_dia,
    MIN(date) AS primeira_metrica,
    MAX(date) AS ultima_metrica
FROM 
    public.metrics_daily
GROUP BY 
    tenant_id
ORDER BY 
    total_vendido_metricas DESC;

-- PASSO 8: Verificar vendas recentes (últimas 10) com detalhes
SELECT 
    'VENDAS_RECENTES' as tipo,
    s.id,
    s.tenant_id,
    s.amount,
    s.created_at,
    l.name AS lead_name,
    l.email AS lead_email,
    l.status AS lead_status
FROM 
    public.sales s
LEFT JOIN 
    public.leads l ON s.lead_id = l.id
ORDER BY 
    s.created_at DESC
LIMIT 10;

-- PASSO 9: Verificar se há inconsistências entre sales e leads
SELECT 
    'INCONSISTENCIAS' as tipo,
    'Leads fechados sem vendas' as problema,
    COUNT(*) as quantidade
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed' 
    AND s.id IS NULL

UNION ALL

SELECT 
    'INCONSISTENCIAS' as tipo,
    'Vendas sem lead fechado' as problema,
    COUNT(*) as quantidade
FROM 
    public.sales s
LEFT JOIN 
    public.leads l ON s.lead_id = l.id
WHERE 
    l.status != 'closed' OR l.id IS NULL;

-- ========================================
-- ANÁLISE DOS RESULTADOS:
-- ========================================
-- 1. Se PASSO 2 mostrar > 1 tenant: Usuários estão em tenants diferentes
-- 2. Se PASSO 5 mostrar valores: Há vendas em leads.fields não migradas
-- 3. Se PASSO 6 mostrar duplicatas: Vendas estão sendo contadas duas vezes
-- 4. Se PASSO 9 mostrar inconsistências: Dados estão desalinhados
-- ========================================
