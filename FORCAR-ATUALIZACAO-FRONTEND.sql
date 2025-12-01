-- ========================================
-- FORÇAR ATUALIZAÇÃO DO FRONTEND
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se as vendas foram migradas corretamente
SELECT 
    'VENDAS_MIGRADAS' as tipo,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID;

-- PASSO 2: Verificar se as vendas específicas da Maria estão lá
SELECT 
    'VENDAS_ESPECIFICAS_MARIA' as tipo,
    s.id AS sale_id,
    l.name AS lead_name,
    s.amount AS valor_sales,
    s.created_at AS data_sales
FROM 
    public.sales s
JOIN 
    public.leads l ON s.lead_id = l.id
WHERE 
    l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND (
        l.name ILIKE '%dra renata%' OR
        l.name ILIKE '%amador bueno%' OR
        l.name ILIKE '%life sorrisos%' OR
        l.name ILIKE '%implants odonto%' OR
        l.name ILIKE '%dr leandro lana%'
    )
ORDER BY 
    s.amount DESC;

-- PASSO 3: Verificar tenant_ids dos usuários
SELECT 
    'TENANT_IDS_USUARIOS' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY 
    email;

-- PASSO 4: Forçar atualização das métricas diárias
INSERT INTO public.metrics_daily (date, tenant_id, total_sold, avg_ticket)
SELECT 
    CURRENT_DATE,
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID,
    SUM(amount),
    AVG(amount)
FROM 
    public.sales
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND DATE(created_at) = CURRENT_DATE
ON CONFLICT (date, tenant_id) DO UPDATE SET
    total_sold = EXCLUDED.total_sold,
    avg_ticket = EXCLUDED.avg_ticket;

-- PASSO 5: Verificar métricas diárias atualizadas
SELECT 
    'METRICAS_DIARIAS_ATUALIZADAS' as tipo,
    date,
    total_sold,
    avg_ticket
FROM 
    public.metrics_daily
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND date = CURRENT_DATE;

-- PASSO 6: Verificar se há vendas em leads.fields que não foram migradas
SELECT 
    'LEADS_COM_VENDAS_NAO_MIGRADAS' as tipo,
    l.id AS lead_id,
    l.name,
    l.fields->>'sale_value' AS valor_em_fields,
    s.amount AS valor_em_sales
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND l.status = 'closed'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND s.id IS NULL
ORDER BY 
    CAST(l.fields->>'sale_value' AS NUMERIC) DESC;

-- ========================================
-- INSTRUÇÕES PARA O FRONTEND:
-- ========================================
-- 1. Execute este script primeiro
-- 2. No navegador, pressione Ctrl+Shift+R (hard refresh)
-- 3. Ou abra o DevTools (F12) e clique com botão direito no botão refresh
-- 4. Selecione "Empty Cache and Hard Reload"
-- 5. Faça logout e login novamente
-- 6. Verifique se o valor mudou
-- ========================================
