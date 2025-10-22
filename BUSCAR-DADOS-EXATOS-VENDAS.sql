-- Script para buscar dados exatos de vendas

-- 1. Verificar todos os leads do período com detalhes
SELECT 
  id,
  created_at,
  created_at::date as data_simples,
  status,
  fields->>'sold' as sold_field,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'price' as price,
  fields->>'revenue' as revenue,
  fields as fields_completo
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01'
AND created_at <= '2025-10-31'
ORDER BY created_at;

-- 2. Buscar apenas leads que podem ser vendas
SELECT 
  id,
  created_at::date as data,
  status,
  fields->>'sold' as sold,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01'
AND created_at <= '2025-10-31'
AND (
  status = 'closed' 
  OR status = 'sold'
  OR status = 'vendido'
  OR fields->>'sold' = 'true'
  OR fields->>'sold' = true
  OR fields::text LIKE '%"sold":true%'
  OR fields::text LIKE '%"sold":"true"%'
  OR fields::text LIKE '%"status":"closed"%'
  OR fields::text LIKE '%"status":"sold"%'
)
ORDER BY created_at;

-- 3. Verificar stages que podem indicar vendas
SELECT DISTINCT
  s.name as stage_name,
  s.id as stage_id,
  COUNT(l.id) as total_leads
FROM stages s
LEFT JOIN leads l ON l.stage_id = s.id 
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND l.created_at >= '2025-10-01'
GROUP BY s.id, s.name
ORDER BY total_leads DESC;

-- 4. Buscar leads em stages que podem ser vendas
SELECT 
  l.id,
  l.created_at::date as data,
  l.status,
  s.name as stage_name,
  l.fields->>'orcamento' as orcamento,
  l.fields->>'budget' as budget,
  l.fields->>'valor' as valor
FROM leads l
JOIN stages s ON l.stage_id = s.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND l.created_at >= '2025-10-01'
AND l.created_at <= '2025-10-31'
AND (
  s.name ILIKE '%vendido%'
  OR s.name ILIKE '%sold%'
  OR s.name ILIKE '%closed%'
  OR s.name ILIKE '%fechado%'
  OR s.name ILIKE '%dinheiro no bolso%'
  OR s.name ILIKE '%ganho%'
)
ORDER BY l.created_at;

-- 5. Resumo final - vendas por dia (todos os critérios)
SELECT 
  created_at::date as dia,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechados_status,
  COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos_fields,
  COUNT(CASE WHEN fields::text LIKE '%"sold":true%' THEN 1 END) as vendidos_json,
  SUM(
    CASE 
      WHEN fields->>'orcamento' IS NOT NULL AND fields->>'orcamento' != '' 
        THEN CAST(fields->>'orcamento' AS DECIMAL)
      WHEN fields->>'budget' IS NOT NULL AND fields->>'budget' != '' 
        THEN CAST(fields->>'budget' AS DECIMAL)
      WHEN fields->>'valor' IS NOT NULL AND fields->>'valor' != '' 
        THEN CAST(fields->>'valor' AS DECIMAL)
      ELSE 0
    END
  ) as valor_total
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01'
AND created_at <= '2025-10-31'
GROUP BY created_at::date
ORDER BY dia;
