-- =====================================================
-- RENOMEAR TENANTS CONFORME SOLICITADO
-- =====================================================
-- Baseado nos resultados da query anterior:
-- - wf distruibuidor (29 vendas) → Varejo
-- - DentecChia (0 vendas) → Porta a Porta
-- - supervisores (0 vendas) → Distribuidor

-- 1. Renomear "wf distruibuidor" para "Varejo"
UPDATE tenants 
SET name = 'Varejo', updated_at = NOW()
WHERE name = 'wf distruibuidor';

-- 2. Renomear "DentecChia" para "Porta a Porta"
UPDATE tenants 
SET name = 'Porta a Porta', updated_at = NOW()
WHERE name = 'DentecChia';

-- 3. Renomear "supervisores" para "Distribuidor"
UPDATE tenants 
SET name = 'Distribuidor', updated_at = NOW()
WHERE name = 'supervisores';

-- 4. Verificar resultado final
SELECT 
    'TENANTS APÓS ALTERAÇÃO' as info,
    id,
    name,
    plan,
    updated_at
FROM tenants
ORDER BY updated_at DESC;
