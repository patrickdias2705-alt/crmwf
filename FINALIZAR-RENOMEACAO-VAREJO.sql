-- =====================================================
-- FINALIZAR RENOMEAÇÃO - MUDAR "wf distruibuidor" PARA "Varejo"
-- =====================================================

-- Renomear "wf distruibuidor" para "Varejo" (tenant da Maria)
UPDATE tenants 
SET name = 'Varejo', updated_at = NOW()
WHERE name = 'wf distruibuidor';

-- Verificar resultado final
SELECT 
    'TENANTS FINAIS' as info,
    id,
    name,
    plan,
    updated_at
FROM tenants
ORDER BY updated_at DESC;
