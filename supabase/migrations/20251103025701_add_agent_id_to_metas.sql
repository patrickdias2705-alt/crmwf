-- Add agent_id column to metas_tenants if it doesn't exist
ALTER TABLE IF EXISTS public.metas_tenants 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for agent_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_metas_tenants_agent_id ON public.metas_tenants(agent_id);

-- Drop and recreate unique constraint to include agent_id
ALTER TABLE IF EXISTS public.metas_tenants 
DROP CONSTRAINT IF EXISTS metas_tenants_tenant_id_mes_ano_key;

ALTER TABLE IF EXISTS public.metas_tenants
ADD CONSTRAINT metas_tenants_tenant_id_mes_ano_agent_id_key UNIQUE(tenant_id, mes_ano, agent_id);

-- Update the trigger function to handle agent_id
CREATE OR REPLACE FUNCTION public.update_metas_atual()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sale_date DATE;
  tenant_uuid UUID;
  agent_uuid UUID;
BEGIN
  -- Get sale date, tenant and agent
  IF (TG_OP = 'DELETE') THEN
    sale_date := DATE(COALESCE(OLD.sold_at, OLD.created_at));
    tenant_uuid := OLD.tenant_id;
    agent_uuid := OLD.sold_by;
  ELSE
    sale_date := DATE(COALESCE(NEW.sold_at, NEW.created_at));
    tenant_uuid := NEW.tenant_id;
    agent_uuid := NEW.sold_by;
  END IF;

  -- Update the current month's meta atual for both tenant and agent metas
  -- Update tenant-level meta (agent_id IS NULL)
  UPDATE public.metas_tenants
  SET atual = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.sales
    WHERE tenant_id = tenant_uuid
    AND DATE(COALESCE(sold_at, created_at)) >= DATE_TRUNC('month', sale_date)
    AND DATE(COALESCE(sold_at, created_at)) < DATE_TRUNC('month', sale_date) + INTERVAL '1 month'
  )
  WHERE tenant_id = tenant_uuid
  AND (agent_id IS NULL)
  AND mes_ano = DATE_TRUNC('month', sale_date);
  
  -- Update agent-level meta (if agent_id exists)
  IF agent_uuid IS NOT NULL THEN
    UPDATE public.metas_tenants
    SET atual = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.sales
      WHERE tenant_id = tenant_uuid
      AND sold_by = agent_uuid
      AND DATE(COALESCE(sold_at, created_at)) >= DATE_TRUNC('month', sale_date)
      AND DATE(COALESCE(sold_at, created_at)) < DATE_TRUNC('month', sale_date) + INTERVAL '1 month'
    )
    WHERE tenant_id = tenant_uuid
    AND agent_id = agent_uuid
    AND mes_ano = DATE_TRUNC('month', sale_date);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add comment
COMMENT ON COLUMN public.metas_tenants.agent_id IS 'Agent ID if meta is for specific agent (NULL for tenant-level metas)';

