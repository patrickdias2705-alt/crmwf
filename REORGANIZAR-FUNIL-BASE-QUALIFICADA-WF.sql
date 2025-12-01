-- Reorganizar funil colocando "Base Qualificada WF" do lado de "Novos Leads"
-- 1. Verificar pipelines atuais e suas ordens
SELECT 
    id,
    name,
    "order",
    color,
    created_at
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY "order";

-- 2. Atualizar ordem das pipelines para reorganizar o funil
-- Colocando "Base Qualificada WF" logo após "Novos Leads"

-- Primeiro, vamos ver qual é a ordem atual de "Novos Leads"
-- Assumindo que "Novos Leads" tem order = 1, vamos reorganizar:
-- Novos Leads = 1
-- Base Qualificada WF = 2 (nova posição)
-- Agendado = 3
-- Fechado = 4
-- Recusado = 5
-- Perdido = 6

UPDATE stages 
SET "order" = 2,
    updated_at = NOW()
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name = 'Base Qualificada WF';

-- Ajustar outras pipelines se necessário
UPDATE stages 
SET "order" = 3,
    updated_at = NOW()
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name ILIKE '%agendado%';

UPDATE stages 
SET "order" = 4,
    updated_at = NOW()
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name ILIKE '%fechado%';

UPDATE stages 
SET "order" = 5,
    updated_at = NOW()
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name ILIKE '%recusado%';

UPDATE stages 
SET "order" = 6,
    updated_at = NOW()
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
AND name ILIKE '%perdido%';

-- 3. Verificar resultado final
SELECT 
    id,
    name,
    "order",
    color,
    updated_at
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY "order";

-- 4. Verificar quantos leads estão em cada pipeline
SELECT 
    s.name as pipeline_name,
    s."order",
    COUNT(l.id) as total_leads,
    s.color
FROM stages s
LEFT JOIN leads l ON s.id = l.stage_id AND l.tenant_id = s.tenant_id
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY s.id, s.name, s."order", s.color
ORDER BY s."order";
