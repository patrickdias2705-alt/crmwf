-- ========================================
-- CORRIGIR FUNIL DE CONVERSÃO - VERSÃO SIMPLES
-- ========================================
-- Este script corrige o funil de conversão de forma segura

-- PASSO 1: Verificar estágios disponíveis
SELECT 
    'ESTAGIOS_DISPONIVEIS' as tipo,
    id,
    name,
    color,
    "order"
FROM 
    public.stages 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY 
    "order";

-- PASSO 2: Verificar contagem atual do funil
SELECT 
    'CONTAGEM_ATUAL_FUNIL' as tipo,
    s.name as nome_estagio,
    s.color,
    s."order",
    COUNT(l.id) as total_leads
FROM 
    public.stages s
LEFT JOIN 
    public.leads l ON s.id = l.stage_id 
    AND l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE 
    s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY 
    s.id, s.name, s.color, s."order"
ORDER BY 
    s."order";

-- PASSO 3: Verificar leads sem stage_id
SELECT 
    'LEADS_SEM_STAGE' as tipo,
    COUNT(*) as quantidade,
    status
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND stage_id IS NULL
GROUP BY 
    status;

-- PASSO 4: Atribuir stage padrão para leads fechados sem stage
UPDATE public.leads 
SET 
    stage_id = (
        SELECT id 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
        AND name ILIKE '%vendido%' 
        ORDER BY "order" DESC
        LIMIT 1
    )
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND status = 'closed'
    AND stage_id IS NULL;

-- PASSO 5: Verificar contagem final do funil
SELECT 
    'CONTAGEM_FINAL_FUNIL' as tipo,
    s.name as nome_estagio,
    s.color,
    s."order",
    COUNT(l.id) as total_leads
FROM 
    public.stages s
LEFT JOIN 
    public.leads l ON s.id = l.stage_id 
    AND l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE 
    s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY 
    s.id, s.name, s.color, s."order"
ORDER BY 
    s."order";
