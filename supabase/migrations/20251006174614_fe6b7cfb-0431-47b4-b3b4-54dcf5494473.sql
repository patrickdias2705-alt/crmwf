-- Função para criar pipeline e stages padrão para um novo tenant
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
  
  -- Criar stages padrão
  INSERT INTO public.stages (tenant_id, pipeline_id, name, "order", color) VALUES
    (NEW.id, new_pipeline_id, 'Novo Lead', 0, '#3B82F6'),
    (NEW.id, new_pipeline_id, 'Contato Realizado', 1, '#8B5CF6'),
    (NEW.id, new_pipeline_id, 'Qualificado', 2, '#06B6D4'),
    (NEW.id, new_pipeline_id, 'Proposta Enviada', 3, '#F59E0B'),
    (NEW.id, new_pipeline_id, 'Negociação', 4, '#EAB308'),
    (NEW.id, new_pipeline_id, 'Fechado/Ganho', 5, '#22C55E'),
    (NEW.id, new_pipeline_id, 'Perdido', 6, '#EF4444'),
    (NEW.id, new_pipeline_id, 'Recusado', 7, '#64748B');
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função após inserir um tenant
DROP TRIGGER IF EXISTS create_default_pipeline_trigger ON public.tenants;
CREATE TRIGGER create_default_pipeline_trigger
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.create_default_pipeline_for_tenant();

-- Criar pipeline para tenants existentes que não têm pipeline
DO $$
DECLARE
  tenant_record RECORD;
  new_pipeline_id UUID;
BEGIN
  FOR tenant_record IN 
    SELECT t.id, t.name 
    FROM public.tenants t
    LEFT JOIN public.pipelines p ON p.tenant_id = t.id AND p.is_default = true
    WHERE p.id IS NULL
  LOOP
    -- Criar pipeline padrão
    INSERT INTO public.pipelines (tenant_id, name, is_default)
    VALUES (tenant_record.id, 'Pipeline Padrão', true)
    RETURNING id INTO new_pipeline_id;
    
    -- Criar stages padrão
    INSERT INTO public.stages (tenant_id, pipeline_id, name, "order", color) VALUES
      (tenant_record.id, new_pipeline_id, 'Novo Lead', 0, '#3B82F6'),
      (tenant_record.id, new_pipeline_id, 'Contato Realizado', 1, '#8B5CF6'),
      (tenant_record.id, new_pipeline_id, 'Qualificado', 2, '#06B6D4'),
      (tenant_record.id, new_pipeline_id, 'Proposta Enviada', 3, '#F59E0B'),
      (tenant_record.id, new_pipeline_id, 'Negociação', 4, '#EAB308'),
      (tenant_record.id, new_pipeline_id, 'Fechado/Ganho', 5, '#22C55E'),
      (tenant_record.id, new_pipeline_id, 'Perdido', 6, '#EF4444'),
      (tenant_record.id, new_pipeline_id, 'Recusado', 7, '#64748B');
      
    RAISE NOTICE 'Pipeline criado para tenant: %', tenant_record.name;
  END LOOP;
END;
$$;