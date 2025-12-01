-- ========================================
-- VERIFICAR INSERÇÃO EM TEMPO REAL
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar leads inseridos na última hora
SELECT 
    'LEADS_ULTIMA_HORA' as tipo,
    COUNT(*) as total_leads,
    MIN(created_at) as primeiro_lead,
    MAX(created_at) as ultimo_lead
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '1 hour';

-- PASSO 2: Verificar leads inseridos nas últimas 24 horas
SELECT 
    'LEADS_ULTIMAS_24H' as tipo,
    COUNT(*) as total_leads,
    MIN(created_at) as primeiro_lead,
    MAX(created_at) as ultimo_lead
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '24 hours';

-- PASSO 3: Verificar vendas inseridas na última hora
SELECT 
    'VENDAS_ULTIMA_HORA' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '1 hour';

-- PASSO 4: Verificar vendas inseridas nas últimas 24 horas
SELECT 
    'VENDAS_ULTIMAS_24H' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '24 hours';

-- PASSO 5: Verificar mensagens inseridas na última hora
SELECT 
    'MENSAGENS_ULTIMA_HORA' as tipo,
    COUNT(*) as total_mensagens,
    MIN(created_at) as primeira_mensagem,
    MAX(created_at) as ultima_mensagem
FROM messages
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '1 hour';

-- PASSO 6: Verificar mensagens inseridas nas últimas 24 horas
SELECT 
    'MENSAGENS_ULTIMAS_24H' as tipo,
    COUNT(*) as total_mensagens,
    MIN(created_at) as primeira_mensagem,
    MAX(created_at) as ultima_mensagem
FROM messages
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '24 hours';

-- PASSO 7: Verificar leads mais recentes (últimos 10)
SELECT 
    'LEADS_RECENTES' as tipo,
    id,
    name,
    email,
    phone,
    origin,
    created_at
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 10;

-- PASSO 8: Verificar vendas mais recentes (últimas 10)
SELECT 
    'VENDAS_RECENTES' as tipo,
    id,
    lead_id,
    amount,
    created_at
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 10;

-- PASSO 9: Verificar mensagens mais recentes (últimas 10)
SELECT 
    'MENSAGENS_RECENTES' as tipo,
    id,
    lead_id,
    content,
    created_at
FROM messages
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 10;

-- PASSO 10: Verificar se há problemas de sincronização
SELECT 
    'SINCRONIZACAO_DEBUG' as tipo,
    'leads' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultimo_registro,
    NOW() as agora,
    EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) as segundos_desde_ultimo
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'SINCRONIZACAO_DEBUG' as tipo,
    'sales' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultimo_registro,
    NOW() as agora,
    EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) as segundos_desde_ultimo
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'SINCRONIZACAO_DEBUG' as tipo,
    'messages' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultimo_registro,
    NOW() as agora,
    EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) as segundos_desde_ultimo
FROM messages
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
