-- Adicionar colunas monetárias à tabela metrics_daily
ALTER TABLE public.metrics_daily 
ADD COLUMN IF NOT EXISTS total_budget_value DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_ticket DECIMAL(15,2) DEFAULT 0;

-- Atualizar trigger para rastrear valores monetários
CREATE OR REPLACE FUNCTION public.track_lead_journey()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  stage_name TEXT;
  old_stage_name TEXT;
  budget_value DECIMAL(15,2);
BEGIN
  -- INSERT: novo lead
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO metrics_daily (tenant_id, date, leads_in)
    VALUES (NEW.tenant_id, CURRENT_DATE, 1)
    ON CONFLICT (tenant_id, date) 
    DO UPDATE SET leads_in = metrics_daily.leads_in + 1;
    
    RETURN NEW;
  END IF;
  
  -- DELETE: lead removido
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  
  -- UPDATE de stage: incrementar métricas da jornada
  IF (TG_OP = 'UPDATE' AND OLD.stage_id != NEW.stage_id) THEN
    SELECT name INTO stage_name FROM stages WHERE id = NEW.stage_id;
    SELECT name INTO old_stage_name FROM stages WHERE id = OLD.stage_id;
    
    -- Incrementar contador baseado no novo stage
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
      -- Buscar valor do orçamento do lead
      SELECT COALESCE(SUM(value), 0) INTO budget_value 
      FROM budgets 
      WHERE lead_id = NEW.id;
      
      INSERT INTO metrics_daily (tenant_id, date, closed, total_revenue)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1, budget_value)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET 
        closed = metrics_daily.closed + 1,
        total_revenue = metrics_daily.total_revenue + budget_value;
      
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
$function$;

-- Criar trigger para rastrear criação de orçamentos
CREATE OR REPLACE FUNCTION public.track_budget_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lead_tenant_id UUID;
BEGIN
  -- Buscar tenant_id do lead
  SELECT tenant_id INTO lead_tenant_id FROM leads WHERE id = NEW.lead_id;
  
  -- Adicionar valor do orçamento às métricas diárias
  INSERT INTO metrics_daily (tenant_id, date, total_budget_value)
  VALUES (lead_tenant_id, CURRENT_DATE, COALESCE(NEW.value, 0))
  ON CONFLICT (tenant_id, date) 
  DO UPDATE SET total_budget_value = metrics_daily.total_budget_value + COALESCE(NEW.value, 0);
  
  RETURN NEW;
END;
$function$;

-- Criar trigger na tabela budgets
DROP TRIGGER IF EXISTS track_budget_creation_trigger ON public.budgets;
CREATE TRIGGER track_budget_creation_trigger
AFTER INSERT ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.track_budget_creation();

-- Função para recalcular métricas históricas
CREATE OR REPLACE FUNCTION public.recalculate_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Atualizar total_budget_value baseado em orçamentos existentes
  UPDATE metrics_daily m
  SET total_budget_value = COALESCE(
    (SELECT SUM(b.value)
     FROM budgets b
     JOIN leads l ON l.id = b.lead_id
     WHERE l.tenant_id = m.tenant_id
       AND DATE(b.created_at) = m.date), 
    0
  );
  
  -- Atualizar total_revenue baseado em leads fechados
  UPDATE metrics_daily m
  SET total_revenue = COALESCE(
    (SELECT SUM(b.value)
     FROM budgets b
     JOIN leads l ON l.id = b.lead_id
     JOIN stages s ON s.id = l.stage_id
     WHERE l.tenant_id = m.tenant_id
       AND (s.name ILIKE '%fechado%' OR s.name ILIKE '%vendido%' OR s.name ILIKE '%ganho%')), 
    0
  );
  
  -- Calcular ticket médio
  UPDATE metrics_daily
  SET average_ticket = CASE 
    WHEN closed > 0 THEN total_revenue / closed 
    ELSE 0 
  END;
END;
$function$;