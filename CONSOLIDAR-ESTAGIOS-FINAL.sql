-- ========================================
-- CONSOLIDAR ESTÁGIOS FINAL
-- ========================================
-- Este script consolida estágios duplicados e remove os desnecessários

-- PASSO 1: Mover leads de "Lead novo" para "Novo Lead"
UPDATE public.leads 
SET stage_id = (
    SELECT id 
    FROM public.stages 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Novo Lead'
    LIMIT 1
)
WHERE 
    stage_id IN (
        SELECT id 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND name = 'Lead novo'
    );

-- PASSO 2: Mover leads de "Agendado" para "Proposta Comercial" (ou criar um estágio apropriado)
UPDATE public.leads 
SET stage_id = (
    SELECT id 
    FROM public.stages 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Proposta Comercial'
    LIMIT 1
)
WHERE 
    stage_id IN (
        SELECT id 
        FROM public.stages 
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND name = 'Agendado'
    );

-- PASSO 3: Remover estágios desnecessários
DELETE FROM public.stages 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name IN ('Lead novo', 'Agendado');

-- PASSO 4: Reorganizar a ordem dos estágios para ficar sequencial
UPDATE public.stages 
SET "order" = 0
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Novo Lead';

UPDATE public.stages 
SET "order" = 1
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Contato Realizado';

UPDATE public.stages 
SET "order" = 2
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Atendido';

UPDATE public.stages 
SET "order" = 3
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Qualificado';

UPDATE public.stages 
SET "order" = 4
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Proposta Comercial';

UPDATE public.stages 
SET "order" = 5
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Dinheiro no bolso';

UPDATE public.stages 
SET "order" = 6
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Dinheiro na mesa';

UPDATE public.stages 
SET "order" = 7
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name = 'Recusado';

-- PASSO 5: Verificar resultado final
SELECT 
    'FUNIL_CONSOLIDADO_FINAL' as tipo,
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
