-- EXECUTAR ESTE CÓDIGO COMPLETO NO SUPABASE AGORA

-- 1. VERIFICAR TODOS OS EVENTOS DE CRIAÇÃO DA MARIA POR DIA
SELECT 
  'TODOS_EVENTOS_CRIACAO' as tipo,
  DATE(created_at) as dia,
  COUNT(*) as total_leads_criados,
  MIN(created_at) as primeiro_lead,
  MAX(created_at) as ultimo_lead
FROM lead_events 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND type = 'created'
GROUP BY DATE(created_at)
ORDER BY dia DESC
LIMIT 20;

-- 2. VERIFICAR ESPECIFICAMENTE OS DIAS PROBLEMÁTICOS
SELECT 
  'DIAS_PROBLEMATICOS' as tipo,
  DATE(created_at) as dia,
  COUNT(*) as total_eventos,
  type as tipo_evento,
  MIN(created_at) as primeiro_evento,
  MAX(created_at) as ultimo_evento
FROM lead_events 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND DATE(created_at) IN ('2025-10-09', '2025-10-06', '2025-10-12', '2025-10-13', '2025-10-14')
GROUP BY DATE(created_at), type
ORDER BY dia;

-- 3. VERIFICAR APENAS EVENTOS DE CRIAÇÃO NOS DIAS PROBLEMÁTICOS
SELECT 
  'EVENTOS_CRIACAO_PROBLEMATICOS' as tipo,
  DATE(created_at) as dia,
  COUNT(*) as total_leads_criados,
  MIN(created_at) as primeiro_lead,
  MAX(created_at) as ultimo_lead
FROM lead_events 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND type = 'created'
  AND DATE(created_at) IN ('2025-10-09', '2025-10-06', '2025-10-12', '2025-10-13', '2025-10-14')
GROUP BY DATE(created_at)
ORDER BY dia;
