-- VERIFICAR ONDE ESTÃO OS DADOS REAIS CORRETOS
-- Dados esperados pelo usuário:
-- 07/10: 1 lead
-- 10/10: 13 leads  
-- 13/10: 9 leads
-- 14/10: 2 leads
-- 15/10: 11 leads

-- 1. Verificar dados na tabela leads
SELECT 
  'LEADS_TABLE' as fonte,
  DATE(created_at) as dia,
  COUNT(*) as total_leads
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND DATE(created_at) BETWEEN '2025-10-07' AND '2025-10-15'
GROUP BY DATE(created_at)
ORDER BY dia;

-- 2. Verificar dados na tabela lead_events (type='created')
SELECT 
  'LEAD_EVENTS_CREATED' as fonte,
  DATE(created_at) as dia,
  COUNT(*) as total_leads
FROM lead_events
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND type = 'created'
  AND DATE(created_at) BETWEEN '2025-10-07' AND '2025-10-15'
GROUP BY DATE(created_at)
ORDER BY dia;

-- 3. Verificar dados na tabela lead_events (type='lead.made_public')
SELECT 
  'LEAD_EVENTS_MADE_PUBLIC' as fonte,
  DATE(created_at) as dia,
  COUNT(*) as total_leads
FROM lead_events
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND type = 'lead.made_public'
  AND DATE(created_at) BETWEEN '2025-10-07' AND '2025-10-15'
GROUP BY DATE(created_at)
ORDER BY dia;

-- 4. Verificar TODOS os tipos de eventos na lead_events
SELECT 
  'TODOS_EVENTOS' as fonte,
  DATE(created_at) as dia,
  type,
  COUNT(*) as total_eventos
FROM lead_events
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND DATE(created_at) BETWEEN '2025-10-07' AND '2025-10-15'
GROUP BY DATE(created_at), type
ORDER BY dia, type;

-- 5. Verificar se há dados em outras tabelas
SELECT 
  'LEADS_DETAILED' as fonte,
  DATE(created_at) as dia,
  COUNT(*) as total_leads,
  STRING_AGG(DISTINCT origin, ', ') as origens
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND DATE(created_at) BETWEEN '2025-10-07' AND '2025-10-15'
GROUP BY DATE(created_at)
ORDER BY dia;
