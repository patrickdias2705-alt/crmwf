-- =====================================================
-- INVESTIGAÇÃO: Por que o funil está zerado?
-- =====================================================

-- 1. Verificar se há estágios configurados
SELECT 
  'ESTÁGIOS CONFIGURADOS:' as info,
  COUNT(*) as total_estagios,
  STRING_AGG(name, ', ') as lista_estagios
FROM stages;

-- 2. Verificar leads por estágio atual
SELECT 
  'LEADS POR ESTÁGIO ATUAL:' as info,
  s.name as estagio,
  COUNT(l.id) as quantidade_leads
FROM leads l
JOIN stages s ON l.stage_id = s.id
GROUP BY s.id, s.name, s.order
ORDER BY s.order;

-- 3. Verificar se há eventos de mudança de estágio
SELECT 
  'EVENTOS DE MUDANÇA DE ESTÁGIO:' as info,
  COUNT(*) as total_eventos,
  COUNT(DISTINCT lead_id) as leads_unicos,
  MIN(created_at) as primeiro_evento,
  MAX(created_at) as ultimo_evento
FROM lead_events 
WHERE type = 'stage_moved';

-- 4. Verificar eventos de mudança de estágio por tenant
SELECT 
  'EVENTOS POR TENANT:' as info,
  tenant_id,
  COUNT(*) as total_eventos,
  COUNT(DISTINCT lead_id) as leads_unicos
FROM lead_events 
WHERE type = 'stage_moved'
GROUP BY tenant_id;

-- 5. Verificar estrutura dos eventos de mudança de estágio
SELECT 
  'ESTRUTURA DOS EVENTOS:' as info,
  id,
  lead_id,
  type,
  data->'from'->>'stage_id' as from_stage_id,
  data->'to'->>'stage_id' as to_stage_id,
  created_at
FROM lead_events 
WHERE type = 'stage_moved'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar se há leads em estágios finais
SELECT 
  'LEADS EM ESTÁGIOS FINAIS:' as info,
  s.name as estagio,
  COUNT(l.id) as quantidade
FROM leads l
JOIN stages s ON l.stage_id = s.id
WHERE s.name ILIKE '%fechado%' 
   OR s.name ILIKE '%vendido%' 
   OR s.name ILIKE '%ganho%' 
   OR s.name ILIKE '%bolso%'
   OR s.name ILIKE '%perdido%'
   OR s.name ILIKE '%recusado%'
GROUP BY s.name;

-- 7. Verificar leads vendidos (com base nas vendas que acabamos de migrar)
SELECT 
  'LEADS VENDIDOS (TABELA SALES):' as info,
  COUNT(*) as total_vendas,
  STRING_AGG(DISTINCT stage_name, ', ') as estagios_vendidos
FROM sales;

-- 8. Verificar se os leads vendidos estão nos estágios corretos
SELECT 
  'LEADS VENDIDOS vs ESTÁGIO ATUAL:' as info,
  l.id as lead_id,
  s.name as estagio_atual,
  sa.stage_name as estagio_venda,
  CASE 
    WHEN s.name ILIKE '%fechado%' OR s.name ILIKE '%vendido%' OR s.name ILIKE '%ganho%' 
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END as status
FROM leads l
JOIN stages s ON l.stage_id = s.id
JOIN sales sa ON l.id = sa.lead_id
LIMIT 10;

-- 9. Verificar total de leads no sistema
SELECT 
  'TOTAL DE LEADS:' as info,
  COUNT(*) as total_leads,
  COUNT(DISTINCT stage_id) as estagios_distintos,
  MIN(created_at) as primeiro_lead,
  MAX(created_at) as ultimo_lead
FROM leads;

-- 10. Verificar se há problemas de tenant_id
SELECT 
  'PROBLEMA TENANT_ID:' as info,
  'leads' as tabela,
  COUNT(DISTINCT tenant_id) as tenants_distintos,
  ARRAY_AGG(DISTINCT tenant_id) as lista_tenants
FROM leads
UNION ALL
SELECT 
  'PROBLEMA TENANT_ID:' as info,
  'stages' as tabela,
  COUNT(DISTINCT tenant_id) as tenants_distintos,
  ARRAY_AGG(DISTINCT tenant_id) as lista_tenants
FROM stages
UNION ALL
SELECT 
  'PROBLEMA TENANT_ID:' as info,
  'lead_events' as tabela,
  COUNT(DISTINCT tenant_id) as tenants_distintos,
  ARRAY_AGG(DISTINCT tenant_id) as lista_tenants
FROM lead_events;
