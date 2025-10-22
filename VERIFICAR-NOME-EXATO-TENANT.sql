-- =====================================================
-- VERIFICAR NOME EXATO DO TENANT DA MARIA
-- =====================================================

-- 1. Verificar todos os tenants com nomes que contenham "wf" ou "distribuidor"
SELECT 
    'TENANTS COM WF OU DISTRIBUIDOR' as info,
    id,
    name,
    plan,
    created_at
FROM tenants
WHERE name ILIKE '%wf%' 
   OR name ILIKE '%distribuidor%'
   OR name ILIKE '%distruibuidor%'
ORDER BY created_at;

-- 2. Verificar todos os tenants para ver o nome exato
SELECT 
    'TODOS OS TENANTS' as info,
    id,
    name,
    plan,
    created_at
FROM tenants
ORDER BY created_at;

-- 3. Buscar por variações do nome
SELECT 
    'BUSCA POR VARIAÇÕES' as info,
    id,
    name,
    plan
FROM tenants
WHERE name ILIKE '%dist%'
   OR name ILIKE '%wf%'
   OR name ILIKE '%varejo%'
ORDER BY name;
