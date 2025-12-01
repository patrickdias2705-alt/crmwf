-- ========================================
-- LIMPAR DADOS DUPLICADOS DO FUNIL
-- ========================================
-- Este script limpa dados duplicados que podem estar causando problemas no funil

-- PASSO 1: Verificar leads duplicados ou com problemas
SELECT 
    'LEADS_DUPLICADOS' as tipo,
    COUNT(*) as total_leads,
    COUNT(DISTINCT id) as leads_unicos,
    (COUNT(*) - COUNT(DISTINCT id)) as duplicados
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 2: Verificar vendas duplicadas
SELECT 
    'VENDAS_DUPLICADAS' as tipo,
    COUNT(*) as total_vendas,
    COUNT(DISTINCT lead_id) as leads_unicos_com_venda,
    (COUNT(*) - COUNT(DISTINCT lead_id)) as vendas_duplicadas
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 3: Verificar leads com status inconsistente
SELECT 
    'LEADS_STATUS_INCONSISTENTE' as tipo,
    status,
    COUNT(*) as quantidade
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY 
    status
ORDER BY 
    quantidade DESC;

-- PASSO 4: Verificar leads fechados sem stage_id
SELECT 
    'LEADS_FECHADOS_SEM_STAGE' as tipo,
    COUNT(*) as quantidade
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND status = 'closed'
    AND stage_id IS NULL;

-- PASSO 5: Limpar leads fechados sem stage_id (atribuir um stage padrão)
UPDATE public.leads 
SET 
    stage_id = (
        SELECT id 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
        AND name ILIKE '%vendido%' 
        LIMIT 1
    )
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND status = 'closed'
    AND stage_id IS NULL;

-- PASSO 6: Verificar estágios disponíveis
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

-- PASSO 7: Verificar contagem final do funil
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
