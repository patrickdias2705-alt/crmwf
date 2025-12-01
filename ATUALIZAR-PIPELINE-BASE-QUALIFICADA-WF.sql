-- Atualizar pipeline "Atendido" para "Base Qualificada WF"
-- 1. Primeiro, vamos verificar qual é o ID da pipeline "Atendido"
SELECT id, name, "order", color
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND (name ILIKE '%atendido%' OR name ILIKE '%attended%');

-- 2. Atualizar o nome da pipeline (sem coluna description que não existe)
UPDATE stages 
SET 
    name = 'Base Qualificada WF',
    updated_at = NOW()
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND (name ILIKE '%atendido%' OR name ILIKE '%attended%');

-- 3. Verificar se a atualização foi feita
SELECT id, name, "order", color, updated_at
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Base Qualificada WF';

-- 4. Verificar quantos leads estão nesta pipeline
SELECT 
    COUNT(*) as total_leads,
    s.name as pipeline_name
FROM leads l
JOIN stages s ON l.stage_id = s.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND s.name = 'Base Qualificada WF'
GROUP BY s.name;
