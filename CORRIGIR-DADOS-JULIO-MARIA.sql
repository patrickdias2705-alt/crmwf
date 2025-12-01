-- Script para corrigir divergência de dados entre Júlio e Maria
-- Garantir que ambos vejam os mesmos dados

-- 1. Verificar se ambos os usuários estão na mesma tenant
UPDATE auth.users 
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com');

-- 2. Verificar se há leads com tenant_id diferente
UPDATE leads 
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE assigned_to IN (
  SELECT id FROM auth.users 
  WHERE email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com')
)
AND tenant_id IS NULL;

-- 3. Verificar se há leads duplicados ou com dados inconsistentes
-- Remover leads duplicados (manter apenas o mais recente)
WITH duplicates AS (
  SELECT 
    name,
    email,
    phone,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
  FROM leads 
  WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  GROUP BY name, email, phone
  HAVING COUNT(*) > 1
)
DELETE FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (name, email, phone, created_at) IN (
  SELECT name, email, phone, first_created FROM duplicates
);

-- 4. Garantir que todas as vendas estejam na tabela sales
INSERT INTO sales (id, lead_id, amount, tenant_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  l.id,
  CAST(l.fields->>'sold_amount' AS NUMERIC),
  '8bd69047-7533-42f3-a2f7-e3a60477f68c',
  NOW(),
  NOW()
FROM leads l
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND l.fields->>'sold' = 'true'
AND l.fields->>'sold_amount' IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM sales s 
  WHERE s.lead_id = l.id
);

-- 5. Verificar resultado final
SELECT 
  'Total de Leads' as metrica,
  COUNT(*) as valor
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
  'Leads Vendidos' as metrica,
  COUNT(*) as valor
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'sold' = 'true'

UNION ALL

SELECT 
  'Total Vendido (R$)' as metrica,
  COALESCE(SUM(CAST(fields->>'sold_amount' AS NUMERIC)), 0) as valor
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'sold' = 'true'

UNION ALL

SELECT 
  'Vendas na tabela sales' as metrica,
  COUNT(*) as valor
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
  'Total na tabela sales (R$)' as metrica,
  COALESCE(SUM(amount), 0) as valor
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
