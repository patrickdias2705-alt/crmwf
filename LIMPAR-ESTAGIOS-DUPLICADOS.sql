-- ========================================
-- LIMPAR ESTÁGIOS DUPLICADOS
-- ========================================
-- Este script remove estágios duplicados e mantém apenas os corretos

-- PASSO 1: Verificar estágios duplicados por nome
SELECT 
    'ESTAGIOS_DUPLICADOS' as tipo,
    name,
    COUNT(*) as quantidade,
    array_agg(id) as ids,
    array_agg("order") as orders
FROM 
    public.stages 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY 
    name
HAVING 
    COUNT(*) > 1
ORDER BY 
    name;

-- PASSO 2: Verificar leads associados aos estágios duplicados
SELECT 
    'LEADS_POR_ESTAGIO_DUPLICADO' as tipo,
    s.name,
    s.id as stage_id,
    s."order",
    COUNT(l.id) as total_leads
FROM 
    public.stages s
LEFT JOIN 
    public.leads l ON s.id = l.stage_id
WHERE 
    s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND s.name IN (
        SELECT name 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        GROUP BY name 
        HAVING COUNT(*) > 1
    )
GROUP BY 
    s.id, s.name, s."order"
ORDER BY 
    s.name, s."order";

-- PASSO 3: Mover leads dos estágios duplicados para o estágio principal
-- (Manter o estágio com mais leads ou menor ID)

-- Para "Novo Lead" - manter o que tem mais leads
UPDATE public.leads 
SET stage_id = (
    SELECT id 
    FROM public.stages 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Novo Lead'
    ORDER BY (
        SELECT COUNT(*) FROM public.leads l2 
        WHERE l2.stage_id = stages.id
    ) DESC, id ASC
    LIMIT 1
)
WHERE 
    stage_id IN (
        SELECT id 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND name = 'Novo Lead'
    );

-- Para "Contato Realizado" - manter o que tem mais leads
UPDATE public.leads 
SET stage_id = (
    SELECT id 
    FROM public.stages 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Contato Realizado'
    ORDER BY (
        SELECT COUNT(*) FROM public.leads l2 
        WHERE l2.stage_id = stages.id
    ) DESC, id ASC
    LIMIT 1
)
WHERE 
    stage_id IN (
        SELECT id 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND name = 'Contato Realizado'
    );

-- Para "Dinheiro no bolso" - manter o que tem mais leads
UPDATE public.leads 
SET stage_id = (
    SELECT id 
    FROM public.stages 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Dinheiro no bolso'
    ORDER BY (
        SELECT COUNT(*) FROM public.leads l2 
        WHERE l2.stage_id = stages.id
    ) DESC, id ASC
    LIMIT 1
)
WHERE 
    stage_id IN (
        SELECT id 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND name = 'Dinheiro no bolso'
    );

-- Para "Recusado" - manter o que tem mais leads
UPDATE public.leads 
SET stage_id = (
    SELECT id 
    FROM public.stages 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Recusado'
    ORDER BY (
        SELECT COUNT(*) FROM public.leads l2 
        WHERE l2.stage_id = stages.id
    ) DESC, id ASC
    LIMIT 1
)
WHERE 
    stage_id IN (
        SELECT id 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND name = 'Recusado'
    );

-- PASSO 4: Remover estágios duplicados (manter apenas o principal)
DELETE FROM public.stages 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name IN (
        SELECT name 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        GROUP BY name 
        HAVING COUNT(*) > 1
    )
    AND id NOT IN (
        SELECT DISTINCT ON (name) id
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        ORDER BY name, (
            SELECT COUNT(*) FROM public.leads l2 
            WHERE l2.stage_id = stages.id
        ) DESC, id ASC
    );

-- PASSO 5: Verificar resultado final
SELECT 
    'FUNIL_FINAL_CORRIGIDO' as tipo,
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
