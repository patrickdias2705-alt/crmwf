-- ========================================
-- VERIFICAR DADOS REAIS NO BANCO
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar total de leads no banco
SELECT 
    'TOTAL_LEADS_BANCO' as tipo,
    COUNT(*) as total_leads,
    MIN(created_at) as primeiro_lead,
    MAX(created_at) as ultimo_lead
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 2: Verificar leads dos últimos 7 dias
SELECT 
    'LEADS_ULTIMOS_7_DIAS' as tipo,
    COUNT(*) as total_leads,
    DATE(created_at) as data,
    COUNT(*) as leads_por_dia
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- PASSO 3: Verificar leads dos últimos 30 dias
SELECT 
    'LEADS_ULTIMOS_30_DIAS' as tipo,
    COUNT(*) as total_leads,
    DATE(created_at) as data,
    COUNT(*) as leads_por_dia
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- PASSO 4: Verificar vendas no banco
SELECT 
    'TOTAL_VENDAS_BANCO' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 5: Verificar vendas dos últimos 7 dias
SELECT 
    'VENDAS_ULTIMOS_7_DIAS' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    DATE(created_at) as data
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- PASSO 6: Verificar mensagens no banco
SELECT 
    'TOTAL_MENSAGENS_BANCO' as tipo,
    COUNT(*) as total_mensagens,
    MIN(created_at) as primeira_mensagem,
    MAX(created_at) as ultima_mensagem
FROM messages
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 7: Verificar métricas diárias
SELECT 
    'METRICAS_DIARIAS' as tipo,
    COUNT(*) as total_registros,
    MIN(date) as primeira_data,
    MAX(date) as ultima_data,
    SUM(leads_in) as total_leads_in,
    SUM(closed) as total_closed,
    SUM(total_revenue) as total_revenue
FROM metrics_daily
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 8: Verificar leads por origem
SELECT 
    'LEADS_POR_ORIGEM' as tipo,
    origin,
    COUNT(*) as total_leads
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY origin
ORDER BY total_leads DESC;

-- PASSO 9: Verificar leads por estágio
SELECT 
    'LEADS_POR_ESTAGIO' as tipo,
    s.name as estagio,
    COUNT(l.id) as total_leads
FROM leads l
LEFT JOIN stages s ON l.stage_id = s.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY s.name
ORDER BY total_leads DESC;

-- PASSO 10: Verificar se há leads duplicados
SELECT 
    'LEADS_DUPLICADOS' as tipo,
    name,
    email,
    phone,
    COUNT(*) as duplicatas
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY name, email, phone
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;
