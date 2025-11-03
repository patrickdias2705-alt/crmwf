-- =====================================================
-- REMOVER ESTÁGIO "CONTATO REALIZADO" DAS PIPELINES
-- =====================================================

-- Remover estágio "Contato Realizado" e mover leads para o próximo estágio
DO $$
DECLARE
  contato_realizado_record RECORD;
  next_stage_id UUID;
  leads_count INTEGER;
BEGIN
  FOR contato_realizado_record IN 
    SELECT id, pipeline_id, tenant_id, "order"
    FROM public.stages 
    WHERE LOWER(name) LIKE '%contato realizado%' 
       OR name = 'Contato Realizado'
       OR name = 'contato realizado'
  LOOP
    -- Encontrar o próximo stage (com order maior)
    SELECT id INTO next_stage_id
    FROM public.stages
    WHERE pipeline_id = contato_realizado_record.pipeline_id
      AND "order" > contato_realizado_record."order"
    ORDER BY "order" ASC
    LIMIT 1;
    
    -- Se não encontrar próximo, usar o anterior (com order menor)
    IF next_stage_id IS NULL THEN
      SELECT id INTO next_stage_id
      FROM public.stages
      WHERE pipeline_id = contato_realizado_record.pipeline_id
        AND "order" < contato_realizado_record."order"
        AND id != contato_realizado_record.id
      ORDER BY "order" DESC
      LIMIT 1;
    END IF;
    
    -- Mover leads para o próximo stage encontrado
    IF next_stage_id IS NOT NULL THEN
      -- Contar leads antes de mover
      SELECT COUNT(*) INTO leads_count
      FROM public.leads
      WHERE stage_id = contato_realizado_record.id;
      
      -- Mover os leads
      UPDATE public.leads
      SET stage_id = next_stage_id,
          updated_at = NOW()
      WHERE stage_id = contato_realizado_record.id;
      
      RAISE NOTICE 'Moved % leads from "Contato Realizado" to next stage for pipeline: %', 
        leads_count,
        contato_realizado_record.pipeline_id;
    ELSE
      RAISE WARNING 'No other stage found for pipeline %, cannot move leads', 
        contato_realizado_record.pipeline_id;
    END IF;
    
    -- Deletar o stage "Contato Realizado"
    DELETE FROM public.stages 
    WHERE id = contato_realizado_record.id;
    
    RAISE NOTICE 'Stage "Contato Realizado" removido para pipeline: %', 
      contato_realizado_record.pipeline_id;
  END LOOP;
END;
$$;

-- Verificar se ainda há estágios "Contato Realizado" restantes
SELECT 
  'VERIFICAÇÃO FINAL' as info,
  COUNT(*) as contato_realizado_restantes
FROM public.stages 
WHERE LOWER(name) LIKE '%contato realizado%';

