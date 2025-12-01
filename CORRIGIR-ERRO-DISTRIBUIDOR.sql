-- =====================================================
-- CORREÇÃO: "distruibidor" → "distribuidor"
-- =====================================================

-- Verificar se existem registros com erro de escrita
SELECT 'Verificando erros de escrita...' as status;

-- Verificar na tabela leads se há "distruibidor"
SELECT 
  id, 
  name, 
  category,
  fields
FROM leads 
WHERE 
  category ILIKE '%distruibidor%' 
  OR fields::text ILIKE '%distruibidor%'
  OR name ILIKE '%distruibidor%';

-- Verificar na tabela tenants se há "distruibidor"
SELECT 
  id, 
  name, 
  slug
FROM tenants 
WHERE 
  name ILIKE '%distruibidor%' 
  OR slug ILIKE '%distruibidor%';

-- Verificar na tabela users se há "distruibidor"
SELECT 
  id, 
  email, 
  name
FROM users 
WHERE 
  email ILIKE '%distruibidor%' 
  OR name ILIKE '%distruibidor%';

-- =====================================================
-- CORREÇÕES (se necessário)
-- =====================================================

-- Corrigir na tabela leads
UPDATE leads 
SET category = 'distribuidor'
WHERE category = 'distruibidor';

UPDATE leads 
SET fields = jsonb_set(fields, '{categoria}', '"distribuidor"')
WHERE fields->>'categoria' = 'distruibidor';

UPDATE leads 
SET fields = jsonb_set(fields, '{segmento}', '"distribuidor"')
WHERE fields->>'segmento' = 'distruibidor';

-- Corrigir na tabela tenants
UPDATE tenants 
SET name = 'Distribuidores'
WHERE name = 'Distruibidores';

UPDATE tenants 
SET slug = 'distribuidores'
WHERE slug = 'distruibidores';

-- Corrigir na tabela users
UPDATE users 
SET email = REPLACE(email, 'distruibidor', 'distribuidor')
WHERE email ILIKE '%distruibidor%';

UPDATE users 
SET name = REPLACE(name, 'Distruibidor', 'Distribuidor')
WHERE name ILIKE '%distruibidor%';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'Verificação final - não deve haver mais "distruibidor"...' as status;

-- Verificar se ainda existem registros com erro
SELECT 
  'leads' as tabela,
  COUNT(*) as registros_com_erro
FROM leads 
WHERE 
  category ILIKE '%distruibidor%' 
  OR fields::text ILIKE '%distruibidor%'
  OR name ILIKE '%distruibidor%'

UNION ALL

SELECT 
  'tenants' as tabela,
  COUNT(*) as registros_com_erro
FROM tenants 
WHERE 
  name ILIKE '%distruibidor%' 
  OR slug ILIKE '%distruibidor%'

UNION ALL

SELECT 
  'users' as tabela,
  COUNT(*) as registros_com_erro
FROM users 
WHERE 
  email ILIKE '%distruibidor%' 
  OR name ILIKE '%distruibidor%';

-- =====================================================
-- CONFIRMAÇÃO DAS CONTAS
-- =====================================================

SELECT 'Verificando contas Maria e Julia...' as status;

-- Verificar Maria (deve ser varejo)
SELECT 
  u.email,
  u.name,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'maria@varejo.com';

-- Verificar Julia (deve ser distribuidores)
SELECT 
  u.email,
  u.name,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'julia@distribuidores.com';

SELECT 'Correção concluída!' as status;
