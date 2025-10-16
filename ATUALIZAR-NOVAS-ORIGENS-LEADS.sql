-- ========================================
-- ATUALIZAR NOVAS ORIGENS DE LEADS
-- ========================================
-- Este script atualiza as origens existentes no banco de dados
-- para incluir as novas fontes: site, loja, tiktok, linkedin

-- PASSO 1: Verificar origens atuais dos leads
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

-- PASSO 2: Atualizar origens existentes para as novas nomenclaturas
-- Instagram -> Instagram (Direct)
UPDATE public.leads 
SET origin = 'instagram'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND origin IN ('instagram_direct', 'instagram_dm', 'instagram_direct_message');

-- Facebook -> Facebook (Messenger FB)
UPDATE public.leads 
SET origin = 'facebook'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND origin IN ('facebook_messenger', 'messenger', 'fb_messenger');

-- Site -> Site
UPDATE public.leads 
SET origin = 'site'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND origin IN ('website', 'site_web', 'landing_page');

-- Adicionar novas origens se não existirem
-- Loja
UPDATE public.leads 
SET origin = 'loja'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND origin IN ('loja_fisica', 'presencial', 'balcao');

-- TikTok
UPDATE public.leads 
SET origin = 'tiktok'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND origin IN ('tiktok_dm', 'tiktok_direct', 'tiktok_message');

-- LinkedIn
UPDATE public.leads 
SET origin = 'linkedin'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND origin IN ('linkedin_dm', 'linkedin_direct', 'linkedin_message');

-- PASSO 3: Verificar origens após atualização
SELECT 
    'ORIGENS_APOS_ATUALIZACAO' as tipo,
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

-- PASSO 4: Verificar se há leads sem origem definida
SELECT 
    'LEADS_SEM_ORIGEM' as tipo,
    COUNT(*) as quantidade
FROM 
    public.leads
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (origin IS NULL OR origin = '');

-- PASSO 5: Atualizar leads sem origem para 'cliente_carteirizado'
UPDATE public.leads 
SET origin = 'cliente_carteirizado'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (origin IS NULL OR origin = '');

-- PASSO 6: Verificação final das origens
SELECT 
    'VERIFICACAO_FINAL' as tipo,
    origin,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual
FROM 
    public.leads
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY 
    origin
ORDER BY 
    quantidade DESC;

-- PASSO 7: Confirmar atualização
SELECT 
    'ATUALIZACAO_CONCLUIDA' as status,
    'Novas origens de leads configuradas com sucesso!' as mensagem;
