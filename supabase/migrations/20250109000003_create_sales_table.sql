-- Create dedicated sales table for better tracking
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  stage_id UUID REFERENCES public.stages(id),
  stage_name TEXT,
  sold_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_by UUID REFERENCES auth.users(id),
  sold_by_name TEXT,
  budget_description TEXT,
  budget_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON public.sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_lead_id ON public.sales(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON public.sales(sold_at);
CREATE INDEX IF NOT EXISTS idx_sales_amount ON public.sales(amount);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view sales from their tenant" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (
    has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
    OR has_role('supervisor'::app_role)
  )
);

CREATE POLICY "Users can insert sales for their tenant" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (
    has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
  )
);

CREATE POLICY "Users can update sales from their tenant" 
ON public.sales 
FOR UPDATE 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (
    has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
  )
);

-- Create function to insert sale when lead is marked as sold
CREATE OR REPLACE FUNCTION public.insert_sale_on_lead_close()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stage_name TEXT;
  budget_amount DECIMAL(15,2) := 0;
  budget_desc TEXT := '';
  budget_file TEXT := '';
  user_name TEXT := '';
BEGIN
  -- Check if lead is being moved to a "sold" stage
  IF (TG_OP = 'UPDATE' AND OLD.stage_id != NEW.stage_id) THEN
    SELECT name INTO stage_name FROM stages WHERE id = NEW.stage_id;
    
    -- Check if this is a "sold" stage
    IF stage_name ILIKE '%fechado%' OR stage_name ILIKE '%vendido%' OR 
       stage_name ILIKE '%ganho%' OR stage_name ILIKE '%bolso%' THEN
      
      -- Get budget information from fields
      SELECT 
        COALESCE((NEW.fields->>'budget_amount')::DECIMAL, 0),
        COALESCE(NEW.fields->>'budget_description', ''),
        COALESCE(NEW.fields->>'budget_file_name', '')
      INTO budget_amount, budget_desc, budget_file;
      
      -- Get user name
      SELECT COALESCE(name, email) INTO user_name 
      FROM auth.users 
      WHERE id = auth.uid();
      
      -- Insert sale record
      INSERT INTO public.sales (
        tenant_id,
        lead_id,
        amount,
        stage_id,
        stage_name,
        sold_by,
        sold_by_name,
        budget_description,
        budget_file_name
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        budget_amount,
        NEW.stage_id,
        stage_name,
        auth.uid(),
        user_name,
        budget_desc,
        budget_file
      );
      
      -- Update metrics_daily
      INSERT INTO metrics_daily (tenant_id, date, closed, total_revenue, total_sold)
      VALUES (NEW.tenant_id, CURRENT_DATE, 1, budget_amount, budget_amount)
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET 
        closed = metrics_daily.closed + 1,
        total_revenue = metrics_daily.total_revenue + budget_amount,
        total_sold = metrics_daily.total_sold + budget_amount;
      
      -- Recalculate average ticket
      UPDATE metrics_daily 
      SET avg_ticket = CASE 
        WHEN closed > 0 THEN total_revenue / closed 
        ELSE 0 
      END
      WHERE tenant_id = NEW.tenant_id AND date = CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic sale insertion
DROP TRIGGER IF EXISTS trigger_insert_sale_on_lead_close ON public.leads;
CREATE TRIGGER trigger_insert_sale_on_lead_close
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.insert_sale_on_lead_close();

-- Create function to get sales summary
CREATE OR REPLACE FUNCTION public.get_sales_summary(tenant_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  total_sales DECIMAL(15,2) := 0;
  total_count INTEGER := 0;
  avg_ticket DECIMAL(15,2) := 0;
  sales_by_day JSONB;
BEGIN
  -- Get total sales in period
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO total_sales, total_count
  FROM sales 
  WHERE tenant_id = tenant_uuid 
    AND sold_at >= NOW() - INTERVAL '1 day' * days_back;
  
  -- Calculate average ticket
  avg_ticket := CASE WHEN total_count > 0 THEN total_sales / total_count ELSE 0 END;
  
  -- Get sales by day
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date_trunc('day', sold_at)::date,
      'amount', SUM(amount),
      'count', COUNT(*)
    )
  )
  INTO sales_by_day
  FROM sales 
  WHERE tenant_id = tenant_uuid 
    AND sold_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY date_trunc('day', sold_at)::date
  ORDER BY date_trunc('day', sold_at)::date DESC;
  
  result := jsonb_build_object(
    'success', true,
    'total_sales', total_sales,
    'total_count', total_count,
    'avg_ticket', avg_ticket,
    'period_days', days_back,
    'sales_by_day', COALESCE(sales_by_day, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_sales_summary(UUID, INTEGER) TO authenticated;

-- Add comments
COMMENT ON TABLE public.sales IS 'Tabela dedicada para armazenar vendas realizadas';
COMMENT ON COLUMN public.sales.amount IS 'Valor da venda em R$';
COMMENT ON COLUMN public.sales.sold_at IS 'Data e hora da venda';
COMMENT ON COLUMN public.sales.sold_by IS 'ID do usuário que marcou como vendido';
COMMENT ON COLUMN public.sales.sold_by_name IS 'Nome do usuário que marcou como vendido';
