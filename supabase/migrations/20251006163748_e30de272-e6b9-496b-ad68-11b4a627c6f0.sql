-- Corrigir lógica de métricas para acumular jornada dos leads e não zerar

-- Primeiro, vamos adicionar colunas para rastrear a jornada completa
ALTER TABLE public.metrics_daily 
ADD COLUMN IF NOT EXISTS qualified INTEGER DEFAULT 0;

-- Remover o trigger e função antiga com CASCADE
DROP TRIGGER IF EXISTS trigger_update_metrics_on_lead_change ON public.leads;
DROP FUNCTION IF EXISTS update_metrics_on_lead_change() CASCADE;

-- Criar nova função que acumula métricas baseado em eventos, não em mudanças de stage
CREATE OR REPLACE FUNCTION public.track_lead_journey()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  stage_name TEXT;
  old_stage_name TEXT;
BEGIN
  -- INSERT: novo lead
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO metrics_daily (tenant_id, date, leads_in)
    VALUES (NEW.tenant_id, CURRENT_DATE, 1)
    ON CONFLICT (tenant_id, date) 
    DO UPDATE SET leads_in = metrics_daily.leads_in + 1;
    
    RETURN NEW;
  END IF;
  
  -- DELETE: lead removido (não decrementar, apenas registrar)
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  
  -- UPDATE de stage: incrementar métricas da jornada (não decrementar anterior)
  IF (TG_OP = 'UPDATE' AND OLD.stage_id != NEW.stage_id) THEN
    SELECT name INTO stage_name FROM stages WHERE id = NEW.stage_id;
    SELECT name INTO old_stage_name FROM stages WHERE id = OLD.stage_id;
    
    -- Incrementar contador baseado no novo stage (sem decrementar o anterior)
    IF stage_name ILIKE '%qualificado%' THEN
      INSERT INTO metrics_daily (tenant_id, date, qualified)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET qualified = metrics_daily.qualified + 1;
      
    ELSIF stage_name ILIKE '%atend%' THEN
      INSERT INTO metrics_daily (tenant_id, date, leads_attended)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET leads_attended = metrics_daily.leads_attended + 1;
      
    ELSIF stage_name ILIKE '%fechado%' OR stage_name ILIKE '%vendido%' OR stage_name ILIKE '%ganho%' THEN
      INSERT INTO metrics_daily (tenant_id, date, closed)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET closed = metrics_daily.closed + 1;
      
    ELSIF stage_name ILIKE '%perdido%' OR stage_name ILIKE '%lost%' THEN
      INSERT INTO metrics_daily (tenant_id, date, lost)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET lost = metrics_daily.lost + 1;
      
    ELSIF stage_name ILIKE '%recusado%' OR stage_name ILIKE '%refused%' THEN
      INSERT INTO metrics_daily (tenant_id, date, refused)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET refused = metrics_daily.refused + 1;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER track_lead_journey_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.track_lead_journey();