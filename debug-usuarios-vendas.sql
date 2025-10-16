-- Debug: Verificar vendas por usuário/tenant
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuários e seus tenant_ids
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role
FROM 
    auth.users
WHERE 
    email IN ('maria@varejo.com', 'julio@varejo.com', 'admin@demo.com')
ORDER BY 
    email;

-- 2. Verificar vendas na tabela 'sales' por tenant
SELECT 
    s.tenant_id,
    COUNT(*) AS total_vendas,
    SUM(s.amount) AS total_valor,
    AVG(s.amount) AS ticket_medio,
    MIN(s.created_at) AS primeira_venda,
    MAX(s.created_at) AS ultima_venda
FROM 
    public.sales s
GROUP BY 
    s.tenant_id
ORDER BY 
    s.tenant_id;

-- 3. Verificar leads fechados (status = 'closed') por tenant
SELECT 
    l.tenant_id,
    COUNT(*) AS total_leads_fechados,
    COUNT(DISTINCT l.id) AS leads_unicos
FROM 
    public.leads l
WHERE 
    l.status = 'closed'
GROUP BY 
    l.tenant_id
ORDER BY 
    l.tenant_id;

-- 4. Verificar vendas recentes (últimas 10) com detalhes
SELECT 
    s.id,
    s.tenant_id,
    s.lead_id,
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

-- 5. Verificar se há vendas em 'leads.fields' que não migraram para 'sales'
SELECT 
    l.id,
    l.tenant_id,
    l.name,
    l.fields->>'sale_value' AS sale_value_fields,
    l.fields->>'sale_date' AS sale_date_fields,
    s.id AS sale_id,
    s.amount AS sale_amount
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed' 
    AND l.fields ? 'sale_value'
    AND s.id IS NULL
ORDER BY 
    l.created_at DESC
LIMIT 20;

-- 6. Verificar métricas diárias por tenant (últimos 7 dias)
SELECT 
    m.tenant_id,
    m.date,
    m.total_leads,
    m.total_sold,
    m.avg_ticket
FROM 
    public.metrics_daily m
WHERE 
    m.date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY 
    m.tenant_id, m.date DESC;

