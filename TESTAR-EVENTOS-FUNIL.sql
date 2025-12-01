-- ========================================
-- SCRIPT PARA TESTAR EVENTOS DO FUNIL
-- ========================================

-- 1. Ver todos os eventos 'stage_moved' criados
SELECT 
  'EVENTOS STAGE_MOVED' as tipo,
  COUNT(*) as total,
  MIN(created_at) as primeiro_evento,
  MAX(created_at) as ultimo_evento
FROM lead_events 
WHERE type = 'stage_moved';

-- 2. Ver detalhes dos últimos 10 eventos
SELECT 
  id,
  lead_id,
  type,
  data,
  created_at
FROM lead_events 
WHERE type = 'stage_moved'
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Ver estrutura do campo 'data' de um evento
SELECT 
  'ESTRUTURA DO DATA' as info,
  data
FROM lead_events 
WHERE type = 'stage_moved'
LIMIT 1;

-- 4. Contar eventos por estágio (TO)
SELECT 
  data->'to'->>'stage_name' as stage_name,
  data->'to'->>'stage_id' as stage_id,
  COUNT(*) as vezes_movido_para_este_stage
FROM lead_events 
WHERE type = 'stage_moved'
GROUP BY data->'to'->>'stage_name', data->'to'->>'stage_id'
ORDER BY vezes_movido_para_este_stage DESC;

-- 5. Contar eventos por estágio (FROM)
SELECT 
  data->'from'->>'stage_name' as stage_name,
  data->'from'->>'stage_id' as stage_id,
  COUNT(*) as vezes_saiu_deste_stage
FROM lead_events 
WHERE type = 'stage_moved'
GROUP BY data->'from'->>'stage_name', data->'from'->>'stage_id'
ORDER BY vezes_saiu_deste_stage DESC;

-- 6. Ver leads atuais por estágio
SELECT 
  s.name as stage_name,
  s.id as stage_id,
  COUNT(l.id) as leads_atuais
FROM stages s
LEFT JOIN leads l ON l.stage_id = s.id
GROUP BY s.id, s.name
ORDER BY s.order;

-- 7. Comparar eventos vs leads atuais
SELECT 
  s.name as stage_name,
  s.id as stage_id,
  COUNT(DISTINCT l.id) as leads_atuais,
  (
    SELECT COUNT(*) 
    FROM lead_events le 
    WHERE le.type = 'stage_moved' 
      AND le.data->'to'->>'stage_id' = s.id::text
  ) as vezes_movido_para_ca
FROM stages s
LEFT JOIN leads l ON l.stage_id = s.id
GROUP BY s.id, s.name
ORDER BY s.order;

