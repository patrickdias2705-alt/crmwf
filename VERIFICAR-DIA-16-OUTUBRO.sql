-- Verificar especificamente dados do dia 16/10/2025

-- 1. Verificar leads do dia 16/10
SELECT 
  id,
  created_at,
  status,
  fields,
  updated_at,
  CASE 
    WHEN status = 'closed' THEN 'VENDIDO_STATUS'
    WHEN fields::text LIKE '%"sold":true%' THEN 'VENDIDO_FIELDS'
    WHEN fields::text LIKE '%"sold":"true"%' THEN 'VENDIDO_FIELDS_STRING'
    ELSE 'NAO_VENDIDO'
  END as vendido_indicador
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-16'
ORDER BY created_at;

-- 2. Contar leads e vendas do dia 16/10
SELECT 
  '16/10' as dia,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas,
  ROUND(
    (COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END)::decimal / COUNT(*)) * 100, 
    1
  ) as taxa_conversao
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-16';

-- 3. Verificar se há leads vendidos que foram atualizados no dia 16/10 (mesmo tendo sido criados em outro dia)
SELECT 
  id,
  created_at,
  updated_at,
  status,
  fields,
  'VENDIDO_ATUALIZADO_16/10' as tipo
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(updated_at) = '2025-10-16'
AND (status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%')
AND DATE(created_at) != '2025-10-16';

-- 4. Resumo completo do dia 16/10
SELECT 
  'RESUMO_16/10' as tipo,
  COUNT(*) as total_leads_criados,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas_criadas_dia,
  (SELECT COUNT(*) FROM leads 
   WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
   AND DATE(updated_at) = '2025-10-16'
   AND (status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%')
   AND DATE(created_at) != '2025-10-16'
  ) as vendas_atualizadas_dia
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-16';
