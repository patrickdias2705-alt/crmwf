-- Nenhuma alteração de schema necessária, apenas ajustes nas policies

-- Já existe policy de DELETE para leads, mas vamos garantir que está correta
-- A policy atual já permite: (tenant_id = get_user_tenant_id())

-- Criar trigger para atualizar métricas quando lead é criado
CREATE OR REPLACE FUNCTION update_metrics_on_lead_change()
RETURNS TRIGGER AS $$
DECLARE
  stage_name TEXT;
BEGIN
  -- Se é INSERT
  IF (TG_OP = 'INSERT') THEN
    -- Buscar nome do stage
    SELECT name INTO stage_name FROM stages WHERE id = NEW.stage_id;
    
    -- Atualizar ou inserir métrica diária
    INSERT INTO metrics_daily (tenant_id, date, leads_in)
    VALUES (NEW.tenant_id, CURRENT_DATE, 1)
    ON CONFLICT (tenant_id, date) 
    DO UPDATE SET leads_in = metrics_daily.leads_in + 1;
    
    RETURN NEW;
  END IF;
  
  -- Se é DELETE
  IF (TG_OP = 'DELETE') THEN
    -- Decrementar leads_in
    UPDATE metrics_daily 
    SET leads_in = GREATEST(0, leads_in - 1)
    WHERE tenant_id = OLD.tenant_id AND date = DATE(OLD.created_at);
    
    RETURN OLD;
  END IF;
  
  -- Se é UPDATE de stage
  IF (TG_OP = 'UPDATE' AND OLD.stage_id != NEW.stage_id) THEN
    -- Buscar nome do novo stage
    SELECT name INTO stage_name FROM stages WHERE id = NEW.stage_id;
    
    -- Atualizar métricas baseado no nome do stage
    IF stage_name ILIKE '%qualificado%' THEN
      INSERT INTO metrics_daily (tenant_id, date, leads_attended)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET leads_attended = metrics_daily.leads_attended + 1;
    ELSIF stage_name ILIKE '%agendado%' OR stage_name ILIKE '%agend%' THEN
      INSERT INTO metrics_daily (tenant_id, date, booked)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET booked = metrics_daily.booked + 1;
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger na tabela leads
DROP TRIGGER IF EXISTS trigger_update_metrics_on_lead_change ON leads;
CREATE TRIGGER trigger_update_metrics_on_lead_change
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_metrics_on_lead_change();