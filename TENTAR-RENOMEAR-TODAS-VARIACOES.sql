-- =====================================================
-- TENTAR RENOMEAR TODAS AS POSSÍVEIS VARIAÇÕES
-- =====================================================

-- Primeiro, vamos ver qual é o nome exato
SELECT 
    'NOME EXATO DO TENANT' as info,
    id,
    name,
    LENGTH(name) as tamanho_nome,
    plan
FROM tenants
WHERE name ILIKE '%wf%' 
   OR name ILIKE '%dist%'
ORDER BY name;

-- Agora vamos tentar renomear com diferentes variações
-- (Execute uma por vez e veja qual funciona)

-- Opção 1: "wf distruibuidor" (com 'u')
UPDATE tenants 
SET name = 'Varejo', updated_at = NOW()
WHERE name = 'wf distruibuidor';

-- Opção 2: "wf distribuidor" (com 'i')
UPDATE tenants 
SET name = 'Varejo', updated_at = NOW()
WHERE name = 'wf distribuidor';

-- Opção 3: "wf distruibidor" (sem 'u' no final)
UPDATE tenants 
SET name = 'Varejo', updated_at = NOW()
WHERE name = 'wf distruibidor';

-- Opção 4: Buscar por ID específico (se soubermos o ID)
-- UPDATE tenants 
-- SET name = 'Varejo', updated_at = NOW()
-- WHERE id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Verificar resultado
SELECT 
    'RESULTADO FINAL' as info,
    id,
    name,
    plan,
    updated_at
FROM tenants
ORDER BY updated_at DESC;
