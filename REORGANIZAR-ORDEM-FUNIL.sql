-- Reorganizar ordem do funil - Base Qualificada WF logo após Novo Lead

-- 1. Verificar ordem atual
SELECT id, name, "order", color
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY "order";

-- 2. Reorganizar ordem das pipelines
-- Novo Lead = 1
-- Base Qualificada WF = 2 (nova posição)
-- Contato Realizado = 3
-- Qualificado = 4
-- Proposta Comercial = 5
-- Dinheiro no bolso = 6
-- Dinheiro na mesa = 7
-- Recusado = 8

UPDATE stages 
SET "order" = 2
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Base Qualificada WF';

UPDATE stages 
SET "order" = 3
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Contato Realizado';

UPDATE stages 
SET "order" = 4
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Qualificado';

UPDATE stages 
SET "order" = 5
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Proposta Comercial';

UPDATE stages 
SET "order" = 6
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Dinheiro no bolso';

UPDATE stages 
SET "order" = 7
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Dinheiro na mesa';

UPDATE stages 
SET "order" = 8
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Recusado';

-- 3. Verificar resultado final
SELECT id, name, "order", color
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY "order";

-- 4. Verificar leads por pipeline na nova ordem
SELECT 
    s."order",
    s.name as pipeline_name,
    COUNT(l.id) as total_leads
FROM stages s
LEFT JOIN leads l ON s.id = l.stage_id AND l.tenant_id = s.tenant_id
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY s.id, s.name, s."order"
ORDER BY s."order";
