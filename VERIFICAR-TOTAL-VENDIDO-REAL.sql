-- Script para verificar dados reais de vendas no Supabase

-- 1. Verificar estrutura da tabela leads
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se existe tabela sales
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'vendas', 'sells', 'transactions');

-- 3. Buscar todos os leads do tenant (últimos 30 dias)
SELECT 
  id,
  created_at,
  updated_at,
  status,
  fields,
  stage_id,
  origin
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
ORDER BY created_at DESC
LIMIT 50;

-- 4. Verificar leads com status 'closed'
SELECT 
  id,
  created_at,
  updated_at,
  status,
  fields,
  stage_id
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND status = 'closed'
AND created_at >= '2025-10-01T00:00:00.000Z'
ORDER BY created_at DESC;

-- 5. Verificar leads com fields.sold = true
SELECT 
  id,
  created_at,
  updated_at,
  status,
  fields,
  fields->>'sold' as sold_field,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'price' as price
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
AND (
  fields->>'sold' = 'true' 
  OR fields::text LIKE '%"sold":true%'
  OR fields::text LIKE '%"sold":"true"%'
)
ORDER BY created_at DESC;

-- 6. Calcular vendas por dia desde 01/10
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados_status,
  COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_fechados_fields,
  COUNT(CASE WHEN fields::text LIKE '%"sold":true%' THEN 1 END) as leads_fechados_json
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
GROUP BY DATE(created_at)
ORDER BY dia DESC;

-- 7. Extrair valores de orçamentos dos leads vendidos
SELECT 
  id,
  created_at,
  status,
  fields->>'sold' as sold,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'price' as price,
  fields->>'revenue' as revenue,
  CASE 
    WHEN fields->>'orcamento' IS NOT NULL AND fields->>'orcamento' != '' 
      THEN CAST(fields->>'orcamento' AS DECIMAL)
    WHEN fields->>'budget' IS NOT NULL AND fields->>'budget' != '' 
      THEN CAST(fields->>'budget' AS DECIMAL)
    WHEN fields->>'valor' IS NOT NULL AND fields->>'valor' != '' 
      THEN CAST(fields->>'valor' AS DECIMAL)
    WHEN fields->>'price' IS NOT NULL AND fields->>'price' != '' 
      THEN CAST(fields->>'price' AS DECIMAL)
    WHEN fields->>'revenue' IS NOT NULL AND fields->>'revenue' != '' 
      THEN CAST(fields->>'revenue' AS DECIMAL)
    ELSE 0
  END as valor_calculado
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
AND (
  status = 'closed' 
  OR fields->>'sold' = 'true'
  OR fields::text LIKE '%"sold":true%'
  OR fields::text LIKE '%"sold":"true"%'
)
ORDER BY created_at DESC;

-- 8. Calcular total vendido por dia (valores reais)
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_vendas,
  SUM(
    CASE 
      WHEN fields->>'orcamento' IS NOT NULL AND fields->>'orcamento' != '' 
        THEN CAST(fields->>'orcamento' AS DECIMAL)
      WHEN fields->>'budget' IS NOT NULL AND fields->>'budget' != '' 
        THEN CAST(fields->>'budget' AS DECIMAL)
      WHEN fields->>'valor' IS NOT NULL AND fields->>'valor' != '' 
        THEN CAST(fields->>'valor' AS DECIMAL)
      WHEN fields->>'price' IS NOT NULL AND fields->>'price' != '' 
        THEN CAST(fields->>'price' AS DECIMAL)
      WHEN fields->>'revenue' IS NOT NULL AND fields->>'revenue' != '' 
        THEN CAST(fields->>'revenue' AS DECIMAL)
      ELSE 0
    END
  ) as valor_total_dia
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
AND (
  status = 'closed' 
  OR fields->>'sold' = 'true'
  OR fields::text LIKE '%"sold":true%'
  OR fields::text LIKE '%"sold":"true"%'
)
GROUP BY DATE(created_at)
ORDER BY dia DESC;

-- 9. Verificar stages que podem indicar vendas
SELECT 
  s.name as stage_name,
  s.id as stage_id,
  COUNT(l.id) as leads_count
FROM stages s
LEFT JOIN leads l ON l.stage_id = s.id 
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND l.created_at >= '2025-10-01T00:00:00.000Z'
GROUP BY s.id, s.name
ORDER BY leads_count DESC;

-- 10. Verificar leads por stage (últimos 30 dias)
SELECT 
  s.name as stage_name,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.status = 'closed' THEN 1 END) as leads_fechados,
  COUNT(CASE WHEN l.fields->>'sold' = 'true' THEN 1 END) as leads_vendidos
FROM stages s
LEFT JOIN leads l ON l.stage_id = s.id 
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND l.created_at >= '2025-10-01T00:00:00.000Z'
GROUP BY s.id, s.name
ORDER BY total_leads DESC;
