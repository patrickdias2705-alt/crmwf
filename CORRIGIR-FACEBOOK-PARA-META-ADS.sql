-- =====================================================
-- CORRIGIR FACEBOOK PARA META ADS
-- =====================================================
-- Script para mover todos os leads do Facebook para Meta Ads
-- e remover Facebook como categoria separada

-- 1. Verificar leads com origem 'facebook' antes da correção
SELECT 
    'ANTES DA CORREÇÃO' as status,
    origin,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND origin = 'facebook'
GROUP BY origin;

-- 2. Atualizar todos os leads do Facebook para Meta Ads
UPDATE leads 
SET origin = 'meta_ads'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND origin = 'facebook';

-- 3. Verificar se a atualização foi bem-sucedida
SELECT 
    'APÓS A CORREÇÃO' as status,
    origin,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND origin IN ('facebook', 'meta_ads')
GROUP BY origin
ORDER BY origin;

-- 4. Verificar se ainda existem leads com origem 'facebook'
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    COUNT(*) as leads_facebook_restantes
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND origin = 'facebook';

-- 5. Mostrar distribuição final das origens
SELECT 
    'DISTRIBUIÇÃO FINAL' as status,
    origin,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY origin
ORDER BY total_leads DESC;

-- 6. Atualizar métricas diárias se necessário
-- (As métricas serão recalculadas automaticamente pelo trigger)

COMMIT;
