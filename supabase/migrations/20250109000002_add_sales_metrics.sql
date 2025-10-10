-- Add sales metrics to metrics_daily table
ALTER TABLE public.metrics_daily 
ADD COLUMN IF NOT EXISTS total_sold DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_ticket DECIMAL(15,2) DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_metrics_daily_sales ON public.metrics_daily(tenant_id, date) WHERE total_sold > 0;

-- Update the trigger to calculate sales metrics properly
CREATE OR REPLACE FUNCTION public.update_metrics_on_lead_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stage_name TEXT;
  old_stage_name TEXT;
  budget_value DECIMAL(15,2) := 0;
  closed_count INTEGER := 0;
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
      
    ELSIF stage_name ILIKE '%fechado%' OR stage_name ILIKE '%vendido%' OR stage_name ILIKE '%ganho%' OR stage_name ILIKE '%bolso%' THEN
      -- Buscar valor do orçamento do lead (primeiro do fields, depois da tabela budgets)
      SELECT COALESCE(
        (NEW.fields->>'budget_amount')::DECIMAL,
        (SELECT COALESCE(SUM(value), 0) FROM budgets WHERE lead_id = NEW.id)
      ) INTO budget_value;
      
      INSERT INTO metrics_daily (tenant_id, date, closed, total_revenue, total_sold)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1, budget_value, budget_value)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET 
        closed = metrics_daily.closed + 1,
        total_revenue = metrics_daily.total_revenue + budget_value,
        total_sold = metrics_daily.total_sold + budget_value;
      
      -- Recalcular ticket médio
      UPDATE metrics_daily 
      SET avg_ticket = CASE 
        WHEN closed > 0 THEN total_revenue / closed 
        ELSE 0 
      END
      WHERE tenant_id = NEW.tenant_id AND date = CURRENT_DATE;
      
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

-- Create function to recalculate all metrics
CREATE OR REPLACE FUNCTION public.recalculate_metrics(tenant_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  total_sold DECIMAL(15,2) := 0;
  total_closed INTEGER := 0;
  avg_ticket DECIMAL(15,2) := 0;
BEGIN
  -- Recalculate total_sold and avg_ticket for all dates
  WITH daily_calculations AS (
    SELECT 
      date,
      SUM(total_revenue) as daily_total_sold,
      SUM(closed) as daily_closed,
      CASE 
        WHEN SUM(closed) > 0 THEN SUM(total_revenue) / SUM(closed)
        ELSE 0
      END as daily_avg_ticket
    FROM metrics_daily 
    WHERE tenant_id = tenant_uuid
    GROUP BY date
  )
  UPDATE metrics_daily 
  SET 
    total_sold = dc.daily_total_sold,
    avg_ticket = dc.daily_avg_ticket
  FROM daily_calculations dc
  WHERE metrics_daily.tenant_id = tenant_uuid 
    AND metrics_daily.date = dc.date;
  
  -- Get totals
  SELECT 
    COALESCE(SUM(total_sold), 0),
    COALESCE(SUM(closed), 0),
    CASE 
      WHEN SUM(closed) > 0 THEN SUM(total_sold) / SUM(closed)
      ELSE 0
    END
  INTO total_sold, total_closed, avg_ticket
  FROM metrics_daily 
  WHERE tenant_id = tenant_uuid;
  
  result := jsonb_build_object(
    'success', true,
    'total_sold', total_sold,
    'total_closed', total_closed,
    'avg_ticket', avg_ticket,
    'message', 'Métricas recalculadas com sucesso'
  );
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.recalculate_metrics(UUID) TO authenticated;

-- Add comments
COMMENT ON COLUMN public.metrics_daily.total_sold IS 'Total vendido em R$ (soma dos valores dos leads fechados)';
COMMENT ON COLUMN public.metrics_daily.avg_ticket IS 'Ticket médio em R$ (total_sold / closed)';
