-- Script simples para verificar vendas reais

-- 1. Verificar leads vendidos com valores
SELECT 
  id,
  created_at::date as data,
  status,
  fields->>'sold' as sold,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'price' as price,
  fields
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01'
AND (
  status = 'closed' 
  OR fields->>'sold' = 'true'
  OR fields::text LIKE '%"sold":true%'
)
ORDER BY created_at DESC;

-- 2. Resumo de vendas por dia
SELECT 
  created_at::date as dia,
  COUNT(*) as vendas,
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
AND (
  status = 'closed' 
  OR fields->>'sold' = 'true'
  OR fields::text LIKE '%"sold":true%'
)
GROUP BY created_at::date
ORDER BY dia DESC;

-- 3. Verificar se existe tabela sales
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'sales'
) as tabela_sales_existe;

-- 4. Se existir tabela sales, buscar dados
SELECT * FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01'
ORDER BY created_at DESC
LIMIT 20;