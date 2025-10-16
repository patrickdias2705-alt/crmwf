-- =====================================================
-- VERIFICAR DADOS INSERIDOS - CONFIRMAR SUCESSO
-- =====================================================
-- Script para verificar se todos os dados foram inseridos corretamente

-- 1. Verificar leads inseridos
SELECT 
    'LEADS INSERIDOS' as tipo,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days';

-- 2. Verificar leads por dia
SELECT 
    DATE(created_at) as data,
    COUNT(*) as leads_por_dia,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos_por_dia,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as vendas_por_dia
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 3. Verificar leads por origem
SELECT 
    origin as origem,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY origin
ORDER BY total_leads DESC;

-- 4. Verificar métricas diárias inseridas
SELECT 
    'METRICS_DAILY INSERIDAS' as tipo,
    COUNT(*) as total_registros,
    MIN(date) as data_mais_antiga,
    MAX(date) as data_mais_recente
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND date >= CURRENT_DATE - INTERVAL '7 days';

-- 5. Verificar se existem triggers para cálculo automático
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'leads'
    AND event_object_schema = 'public';

-- 6. Verificar estrutura da tabela metrics_daily
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'metrics_daily'
ORDER BY ordinal_position;
