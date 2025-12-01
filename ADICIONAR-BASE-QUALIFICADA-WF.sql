-- Script para renomear uma pipeline existente para "Base Qualificada WF"
-- Esta etapa será posicionada ao lado de "Novo Lead" no funil de conversão

-- 1. Primeiro, vamos verificar as stages existentes e sua ordem
SELECT id, name, color, "order", pipeline_id FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
ORDER BY "order" ASC;

-- 2. Encontrar uma stage que não seja "Novo Lead" para renomear
-- Vamos pegar a segunda stage (order = 2) ou criar uma nova se não existir

-- 3. Verificar se já existe uma stage com order = 2
DO $$
DECLARE
    stage_count INTEGER;
    novo_lead_id UUID;
    pipeline_id UUID;
BEGIN
    -- Buscar o ID da pipeline padrão
    SELECT id INTO pipeline_id FROM pipelines 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
    AND is_default = true LIMIT 1;
    
    -- Buscar o ID do "Novo Lead"
    SELECT id INTO novo_lead_id FROM stages 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
    AND (name ILIKE '%novo%lead%' OR name ILIKE '%lead%novo%')
    ORDER BY "order" ASC LIMIT 1;
    
    -- Contar stages com order = 2
    SELECT COUNT(*) INTO stage_count FROM stages 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
    AND "order" = 2;
    
    IF stage_count = 0 THEN
        -- Criar nova stage "Base Qualificada WF" com order = 2
        INSERT INTO stages (
            id,
            name,
            color,
            "order",
            pipeline_id,
            tenant_id,
            is_final,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Base Qualificada WF',
            '#10B981',
            2,
            pipeline_id,
            '8bd69047-7533-42f3-a2f7-e3a60477f68c',
            false,
            NOW(),
            NOW()
        );
        
        -- Atualizar ordem das stages existentes (aumentar em 1 as que têm order >= 2)
        UPDATE stages 
        SET "order" = "order" + 1, updated_at = NOW()
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
        AND "order" >= 2 
        AND name != 'Base Qualificada WF';
    ELSE
        -- Renomear a stage existente com order = 2
        UPDATE stages 
        SET name = 'Base Qualificada WF', 
            color = '#10B981',
            updated_at = NOW()
        WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
        AND "order" = 2;
    END IF;
END $$;

-- 4. Verificar o resultado final
SELECT id, name, color, "order", pipeline_id FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
ORDER BY "order" ASC;
