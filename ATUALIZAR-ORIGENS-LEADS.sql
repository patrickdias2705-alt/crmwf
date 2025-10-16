-- ========================================
-- ATUALIZAR ORIGENS DOS LEADS
-- ========================================
-- Este script atualiza as origens dos leads no banco de dados

-- PASSO 1: Verificar origens atuais
SELECT 
    'ORIGENS_ATUAIS' as tipo,
    origin,
    COUNT(*) as quantidade
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY 
    origin
ORDER BY 
    quantidade DESC;

-- PASSO 2: Atualizar WhatsApp para Meta Ads
UPDATE public.leads 
SET origin = 'meta_ads'
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND origin = 'whatsapp';

-- PASSO 3: Atualizar "Outro" para "Cliente Carteirizado"
UPDATE public.leads 
SET origin = 'cliente_carteirizado'
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND origin = 'outro';

-- PASSO 4: Verificar origens após atualização
SELECT 
    'ORIGENS_ATUALIZADAS' as tipo,
    origin,
    COUNT(*) as quantidade
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY 
    origin
ORDER BY 
    quantidade DESC;

-- PASSO 5: Verificar total de leads por origem
SELECT 
    'TOTAL_LEADS_POR_ORIGEM' as tipo,
    origin,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
    ROUND(
        (COUNT(CASE WHEN status = 'closed' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as taxa_conversao
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY 
    origin
ORDER BY 
    total_leads DESC;
