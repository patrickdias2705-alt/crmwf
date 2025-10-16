-- ========================================
-- INVESTIGAR PROBLEMA DE SINCRONIZAÇÃO
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar leads mais recentes (últimos 5)
SELECT 
    'LEADS_MAIS_RECENTES' as tipo,
    id,
    name,
    email,
    phone,
    origin,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) as segundos_atras
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 5;

-- PASSO 2: Verificar vendas mais recentes (últimas 5)
SELECT 
    'VENDAS_MAIS_RECENTES' as tipo,
    id,
    lead_id,
    amount,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) as segundos_atras
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 5;

-- PASSO 3: Verificar se há leads criados hoje
SELECT 
    'LEADS_HOJE' as tipo,
    COUNT(*) as total_leads_hoje,
    MIN(created_at) as primeiro_lead_hoje,
    MAX(created_at) as ultimo_lead_hoje
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = CURRENT_DATE;

-- PASSO 4: Verificar se há vendas criadas hoje
SELECT 
    'VENDAS_HOJE' as tipo,
    COUNT(*) as total_vendas_hoje,
    SUM(amount) as valor_total_hoje,
    MIN(created_at) as primeira_venda_hoje,
    MAX(created_at) as ultima_venda_hoje
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = CURRENT_DATE;

-- PASSO 5: Verificar leads por hora (últimas 24 horas)
SELECT 
    'LEADS_POR_HORA' as tipo,
    DATE_TRUNC('hour', created_at) as hora,
    COUNT(*) as total_leads
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hora DESC;

-- PASSO 6: Verificar se há problemas de timezone
SELECT 
    'TIMEZONE_DEBUG' as tipo,
    NOW() as agora_utc,
    NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
    EXTRACT(TIMEZONE FROM NOW()) as timezone_offset;

-- PASSO 7: Verificar se há leads com campos vazios
SELECT 
    'LEADS_CAMPOS_VAZIOS' as tipo,
    COUNT(*) as total_leads,
    COUNT(name) as com_nome,
    COUNT(email) as com_email,
    COUNT(phone) as com_telefone,
    COUNT(origin) as com_origem
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 8: Verificar se há leads com campos NULL
SELECT 
    'LEADS_CAMPOS_NULL' as tipo,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as nome_null,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as email_null,
    COUNT(CASE WHEN phone IS NULL THEN 1 END) as phone_null,
    COUNT(CASE WHEN origin IS NULL THEN 1 END) as origin_null
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
