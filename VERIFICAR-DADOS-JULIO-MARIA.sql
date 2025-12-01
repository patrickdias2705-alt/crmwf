-- Script para verificar divergência de dados entre Júlio e Maria
-- Ambos devem estar na mesma tenant mas mostram dados diferentes

-- 1. Verificar dados dos usuários
SELECT 
  id,
  email,
  tenant_id,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com')
ORDER BY email;

-- 2. Verificar se há diferenças na tabela leads
SELECT 
  'Maria' as usuario,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos,
  SUM(CASE WHEN fields->>'sold' = 'true' THEN CAST(fields->>'sold_amount' AS NUMERIC) ELSE 0 END) as total_vendido
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 3. Verificar leads por usuário (se houver diferença)
SELECT 
  assigned_to,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos,
  SUM(CASE WHEN fields->>'sold' = 'true' THEN CAST(fields->>'sold_amount' AS NUMERIC) ELSE 0 END) as total_vendido
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY assigned_to
ORDER BY total_leads DESC;

-- 4. Verificar se há leads com tenant_id diferente
SELECT 
  tenant_id,
  COUNT(*) as total_leads
FROM leads 
WHERE assigned_to IN (
  SELECT id FROM auth.users 
  WHERE email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com')
)
GROUP BY tenant_id
ORDER BY total_leads DESC;

-- 5. Verificar leads específicos de vendas
SELECT 
  id,
  name,
  email,
  phone,
  fields->>'sold' as vendido,
  fields->>'sold_amount' as valor_venda,
  created_at,
  assigned_to
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND fields->>'sold' = 'true'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar se há problemas de cache ou dados duplicados
SELECT 
  name,
  email,
  COUNT(*) as duplicatas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY name, email
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;
