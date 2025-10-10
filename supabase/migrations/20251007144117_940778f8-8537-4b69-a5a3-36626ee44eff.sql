-- Atualizar nomes dos stages padrão para todos os tenants
UPDATE public.stages 
SET name = 'Proposta Comercial' 
WHERE name = 'Proposta Enviada';

UPDATE public.stages 
SET name = 'Dinheiro no bolso' 
WHERE name IN ('Fechado/Ganho', 'Fechado', 'Ganho');

UPDATE public.stages 
SET name = 'Dinheiro na mesa' 
WHERE name = 'Perdido';

-- Deletar stage de Negociação e mover leads para o próximo stage
DO $$
DECLARE
  negociacao_record RECORD;
  next_stage_id UUID;
BEGIN
  FOR negociacao_record IN 
    SELECT id, pipeline_id, tenant_id, "order"
    FROM public.stages 
    WHERE name = 'Negociação'
  LOOP
    -- Encontrar o próximo stage
    SELECT id INTO next_stage_id
    FROM public.stages
    WHERE pipeline_id = negociacao_record.pipeline_id
      AND "order" > negociacao_record."order"
    ORDER BY "order"
    LIMIT 1;
    
    -- Se não encontrar próximo, usa o anterior
    IF next_stage_id IS NULL THEN
      SELECT id INTO next_stage_id
      FROM public.stages
      WHERE pipeline_id = negociacao_record.pipeline_id
        AND "order" < negociacao_record."order"
      ORDER BY "order" DESC
      LIMIT 1;
    END IF;
    
    -- Mover leads para o próximo stage
    IF next_stage_id IS NOT NULL THEN
      UPDATE public.leads
      SET stage_id = next_stage_id
      WHERE stage_id = negociacao_record.id;
    END IF;
    
    -- Deletar o stage de Negociação
    DELETE FROM public.stages WHERE id = negociacao_record.id;
    
    RAISE NOTICE 'Stage Negociação removido para pipeline: %', negociacao_record.pipeline_id;
  END LOOP;
END;
$$;

-- Atualizar a função de criar pipeline padrão com os novos nomes
CREATE OR REPLACE FUNCTION public.create_default_pipeline_for_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pipeline_id UUID;
BEGIN
  -- Criar pipeline padrão
  INSERT INTO public.pipelines (tenant_id, name, is_default)
  VALUES (NEW.id, 'Pipeline Padrão', true)
  RETURNING id INTO new_pipeline_id;
  
  -- Criar stages padrão com novos nomes
  INSERT INTO public.stages (tenant_id, pipeline_id, name, "order", color) VALUES
    (NEW.id, new_pipeline_id, 'Novo Lead', 0, '#3B82F6'),
    (NEW.id, new_pipeline_id, 'Contato Realizado', 1, '#8B5CF6'),
    (NEW.id, new_pipeline_id, 'Qualificado', 2, '#06B6D4'),
    (NEW.id, new_pipeline_id, 'Proposta Comercial', 3, '#F59E0B'),
    (NEW.id, new_pipeline_id, 'Dinheiro no bolso', 4, '#22C55E'),
    (NEW.id, new_pipeline_id, 'Dinheiro na mesa', 5, '#EF4444'),
    (NEW.id, new_pipeline_id, 'Recusado', 6, '#64748B');
  
  RETURN NEW;
END;
$$;