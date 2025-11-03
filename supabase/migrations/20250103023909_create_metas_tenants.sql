-- Create metas_tenants table for monthly goals
CREATE TABLE IF NOT EXISTS public.metas_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  meta_valor NUMERIC(15,2) NOT NULL DEFAULT 0,
  atual NUMERIC(15,2) NOT NULL DEFAULT 0,
  mes_ano DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, mes_ano)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_metas_tenants_tenant_id ON public.metas_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metas_tenants_mes_ano ON public.metas_tenants(mes_ano);

-- Enable RLS
ALTER TABLE public.metas_tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view metas from their tenant" 
ON public.metas_tenants 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
);

CREATE POLICY "Supervisors and admins can insert metas for their tenant" 
ON public.metas_tenants 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (
    has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
    OR has_role('supervisor'::app_role)
  )
);

CREATE POLICY "Supervisors and admins can update metas from their tenant" 
ON public.metas_tenants 
FOR UPDATE 
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

-- Create function to update atual automatically from sales
CREATE OR REPLACE FUNCTION public.update_metas_atual()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sale_date DATE;
  tenant_uuid UUID;
BEGIN
  -- Get sale date and tenant
  IF (TG_OP = 'DELETE') THEN
    sale_date := DATE(OLD.sold_at);
    tenant_uuid := OLD.tenant_id;
  ELSE
    sale_date := DATE(NEW.sold_at);
    tenant_uuid := NEW.tenant_id;
  END IF;

  -- Update the current month's meta atual
  UPDATE public.metas_tenants
  SET atual = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.sales
    WHERE tenant_id = tenant_uuid
    AND DATE(sold_at) >= DATE_TRUNC('month', sale_date)
    AND DATE(sold_at) < DATE_TRUNC('month', sale_date) + INTERVAL '1 month'
  )
  WHERE tenant_id = tenant_uuid
  AND mes_ano = DATE_TRUNC('month', sale_date);
  
  RETURN NEW;
END;
$$;

-- Create trigger to update metas when sales change
DROP TRIGGER IF EXISTS trigger_update_metas_atual ON public.sales;
CREATE TRIGGER trigger_update_metas_atual
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_metas_atual();

-- Add comments
COMMENT ON TABLE public.metas_tenants IS 'Monthly goals for each tenant';
COMMENT ON COLUMN public.metas_tenants.meta_valor IS 'Target value for the month';
COMMENT ON COLUMN public.metas_tenants.atual IS 'Current value (auto-calculated from sales)';
COMMENT ON COLUMN public.metas_tenants.mes_ano IS 'Month and year for this goal';

