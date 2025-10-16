-- ========================================
-- DEBUG: VERIFICAR DADOS EM TEMPO REAL
-- ========================================
-- Execute este script para verificar se os dados estão sincronizados

-- 1. Verificar tenant_id de todos os usuários
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role
FROM 
    auth.users
WHERE 
    email IN ('maria@varejo.com', 'mariavitoria@varejo.com', 'recebimento.fto@gmail.com')
ORDER BY 
    email;

-- 2. Verificar se todos os usuários têm o MESMO tenant_id
SELECT 
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants_diferentes
FROM 
    auth.users
WHERE 
    email IN ('maria@varejo.com', 'mariavitoria@varejo.com', 'recebimento.fto@gmail.com');
-- Se retornar 1, todos estão no mesmo tenant (correto)
-- Se retornar > 1, estão em tenants diferentes (problema!)

-- 3. Verificar leads por tenant_id
SELECT 
    tenant_id,
    COUNT(*) AS total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS leads_fechados,
    MAX(created_at) AS ultimo_lead
FROM 
    public.leads
GROUP BY 
    tenant_id
ORDER BY 
    tenant_id;

-- 4. Verificar vendas por tenant_id na tabela SALES
SELECT 
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    MAX(created_at) AS ultima_venda
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    tenant_id;

-- 5. Verificar vendas recentes (últimas 10)
SELECT 
    s.id,
    s.tenant_id,
    s.amount,
    s.created_at,
    l.name AS lead_name,
    l.email AS lead_email
FROM 
    public.sales s
LEFT JOIN 
    public.leads l ON s.lead_id = l.id
ORDER BY 
    s.created_at DESC
LIMIT 10;

-- 6. Verificar se há vendas em leads.fields que não migraram
SELECT 
    l.id,
    l.tenant_id,
    l.name,
    l.status,
    l.fields->>'sale_value' AS sale_value_fields,
    l.fields->>'sale_date' AS sale_date_fields,
    l.created_at,
    s.id AS sale_id,
    s.amount AS sale_amount
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed'
    AND (l.fields ? 'sale_value' OR l.fields ? 'saleValue')
ORDER BY 
    l.created_at DESC
LIMIT 20;

-- 7. Verificar métricas diárias (últimos 7 dias)
SELECT 
    tenant_id,
    date,
    total_leads,
    total_sold,
    avg_ticket
FROM 
    public.metrics_daily
WHERE 
    date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY 
    tenant_id, date DESC;

-- ========================================
-- ANÁLISE DOS RESULTADOS:
-- ========================================
-- Se o item 2 retornar > 1: Os usuários estão em tenants diferentes
-- Se o item 4 mostrar valores diferentes por tenant: Dados não estão compartilhados
-- Se o item 6 mostrar vendas sem sale_id: Vendas não migraram para tabela sales
-- ========================================

