-- Script corrigido para atualizar pipeline "Atendido" para "Base Qualificada WF"
-- Sem usar coluna "description" que não existe

-- 1. Verificar pipelines atuais
SELECT id, name, "order", color
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY "order";

-- 2. Atualizar nome da pipeline "Atendido" para "Base Qualificada WF"
UPDATE stages 
SET name = 'Base Qualificada WF'
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name ILIKE '%atendido%';

-- 3. Verificar resultado
SELECT id, name, "order", color
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY "order";

-- 4. Verificar leads na nova pipeline
SELECT 
    s.name as pipeline_name,
    COUNT(l.id) as total_leads
FROM stages s
LEFT JOIN leads l ON s.id = l.stage_id AND l.tenant_id = s.tenant_id
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY s.id, s.name
ORDER BY s."order";
