-- Script para buscar dados específicos de dentista e boutys

-- 1. Buscar leads que mencionam "dentista" ou "boutys"
SELECT 
  id,
  created_at,
  updated_at,
  status,
  fields,
  fields->>'name' as nome,
  fields->>'email' as email,
  fields->>'phone' as telefone,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'price' as price,
  fields->>'sold' as sold,
  fields::text as fields_completo
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (
  fields::text ILIKE '%dentista%'
  OR fields::text ILIKE '%boutys%'
  OR fields::text ILIKE '%clínica%'
  OR fields::text ILIKE '%odontologia%'
  OR fields::text ILIKE '%dental%'
)
ORDER BY created_at DESC;

-- 2. Buscar em todas as tabelas que podem ter dados de vendas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name ILIKE '%sale%'
  OR table_name ILIKE '%venda%'
  OR table_name ILIKE '%transaction%'
  OR table_name ILIKE '%payment%'
  OR table_name ILIKE '%order%'
  OR table_name ILIKE '%boutys%'
  OR table_name ILIKE '%dentista%'
);

-- 3. Se existir tabela específica, buscar dados
SELECT * FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (
  customer_name ILIKE '%dentista%'
  OR customer_name ILIKE '%boutys%'
  OR description ILIKE '%dentista%'
  OR description ILIKE '%boutys%'
)
ORDER BY created_at DESC;

-- 4. Buscar leads vendidos com valores por dia
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechados,
  COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos,
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
      ELSE 0
    END
  ) as valor_total
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01'
AND created_at <= '2025-10-31'
AND (
  status = 'closed' 
  OR fields->>'sold' = 'true'
  OR fields::text LIKE '%"sold":true%'
)
GROUP BY DATE(created_at)
ORDER BY dia DESC;

-- 5. Buscar leads específicos com nomes de clientes
SELECT 
  id,
  created_at::date as data,
  fields->>'name' as nome_cliente,
  fields->>'email' as email,
  fields->>'phone' as telefone,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'sold' as vendido,
  status
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01'
AND (
  fields->>'sold' = 'true'
  OR status = 'closed'
  OR fields::text LIKE '%"sold":true%'
)
ORDER BY created_at DESC;
