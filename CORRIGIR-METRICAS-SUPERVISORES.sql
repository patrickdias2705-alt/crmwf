-- ========================================
-- CORRIGIR MÉTRICAS PARA SUPERVISORES - VERSÃO DEFINITIVA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar tenant_ids atuais
SELECT 
    'ANTES' as status,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
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

-- PASSO 2: Identificar o tenant_id da Maria (referência)
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email LIKE '%maria%'
    LIMIT 1
)
SELECT 
    'TENANT_REFERENCIA' as tipo,
    tenant_id
FROM maria_tenant;

-- PASSO 3: Unificar TODOS os usuários para o mesmo tenant_id da Maria
WITH maria_tenant AS (
    SELECT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email LIKE '%maria%'
    LIMIT 1
)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(tenant_id) FROM maria_tenant)
)
WHERE email IN (
    'recebimento.fto@gmail.com',
    'taicaracho@varejo.com'
);

-- PASSO 4: Verificar se a unificação funcionou
SELECT 
    'DEPOIS' as status,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
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

-- PASSO 5: Verificar se agora há apenas 1 tenant_id
SELECT 
    'CONFIRMACAO' as tipo,
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants_diferentes
FROM 
    auth.users
WHERE 
    email IN (
        'maria@varejo.com', 
        'mariavitoria@varejo.com',
        'recebimento.fto@gmail.com',
        'taicaracho@varejo.com'
    );
-- DEVE retornar 1!

-- PASSO 6: Verificar vendas por tenant (deve mostrar apenas 1 linha agora)
SELECT 
    'VENDAS_FINAIS' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    AVG(amount) AS ticket_medio
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 7: Verificar leads por tenant (deve mostrar apenas 1 linha agora)
SELECT 
    'LEADS_FINAIS' as tipo,
    tenant_id,
    COUNT(*) AS total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS leads_fechados
FROM 
    public.leads
GROUP BY 
    tenant_id
ORDER BY 
    total_leads DESC;

-- PASSO 8: Limpar métricas diárias e recalcular
DELETE FROM public.metrics_daily;

-- PASSO 9: Recalcular métricas diárias para o tenant unificado
WITH tenant_unificado AS (
    SELECT DISTINCT raw_user_meta_data->>'tenant_id' AS tenant_id
    FROM auth.users
    WHERE email LIKE '%maria%'
    LIMIT 1
),
dias_vendas AS (
    SELECT DISTINCT 
        tu.tenant_id,
        s.created_at::DATE as data_venda
    FROM tenant_unificado tu
    CROSS JOIN public.sales s
    WHERE s.tenant_id = tu.tenant_id
),
dias_leads AS (
    SELECT DISTINCT 
        tu.tenant_id,
        l.created_at::DATE as data_lead
    FROM tenant_unificado tu
    CROSS JOIN public.leads l
    WHERE l.tenant_id = tu.tenant_id
),
todas_datas AS (
    SELECT DISTINCT data_venda as data FROM dias_vendas
    UNION
    SELECT DISTINCT data_lead as data FROM dias_leads
)
INSERT INTO public.metrics_daily (
    date,
    tenant_id,
    total_leads,
    total_sold,
    avg_ticket,
    leads_in,
    closed
)
SELECT 
    td.data,
    tu.tenant_id,
    COALESCE(COUNT(l.id), 0) as total_leads,
    COALESCE(SUM(s.amount), 0) as total_sold,
    COALESCE(AVG(s.amount), 0) as avg_ticket,
    COALESCE(COUNT(l.id), 0) as leads_in,
    COALESCE(COUNT(CASE WHEN l.status = 'closed' THEN 1 END), 0) as closed
FROM 
    todas_datas td
CROSS JOIN 
    tenant_unificado tu
LEFT JOIN 
    public.leads l ON l.tenant_id = tu.tenant_id AND l.created_at::DATE = td.data
LEFT JOIN 
    public.sales s ON s.tenant_id = tu.tenant_id AND s.created_at::DATE = td.data
GROUP BY 
    td.data, tu.tenant_id
ORDER BY 
    td.data DESC;

-- PASSO 10: Verificar métricas diárias recalculadas
SELECT 
    'METRICAS_RECALCULADAS' as tipo,
    date,
    total_leads,
    total_sold,
    avg_ticket,
    leads_in,
    closed
FROM 
    public.metrics_daily
ORDER BY 
    date DESC
LIMIT 10;

-- ========================================
-- INSTRUÇÕES FINAIS:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 5 retorna "1"
-- 3. Júlio e Taiguara devem fazer LOGOUT e LOGIN
-- 4. Agora TODOS os supervisores verão as MESMAS métricas!
-- ========================================
