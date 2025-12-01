-- Fix security definer view issue and other security warnings

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.leads_public;

-- Instead, create a security invoker function for data masking
CREATE OR REPLACE FUNCTION public.get_masked_lead_data()
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  external_id text,
  name text,
  email text,
  phone text,
  source lead_source,
  owner_user_id uuid,
  pipeline_id uuid,
  stage_id uuid,
  tags jsonb,
  fields jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    l.id,
    l.tenant_id,
    l.external_id,
    l.name,
    -- Mask email and phone for non-privileged users
    CASE 
      WHEN has_role('admin'::app_role) OR has_role('client_owner'::app_role) OR has_role('manager'::app_role) 
      THEN l.email 
      ELSE CASE 
        WHEN l.email IS NOT NULL THEN '***@' || split_part(l.email, '@', 2)
        ELSE NULL 
      END
    END as email,
    CASE 
      WHEN has_role('admin'::app_role) OR has_role('client_owner'::app_role) OR has_role('manager'::app_role) 
      THEN l.phone 
      ELSE CASE 
        WHEN l.phone IS NOT NULL THEN '***' || right(l.phone, 4)
        ELSE NULL 
      END
    END as phone,
    l.source,
    l.owner_user_id,
    l.pipeline_id,
    l.stage_id,
    l.tags,
    l.fields,
    l.created_at,
    l.updated_at
  FROM public.leads l
  WHERE l.tenant_id = get_user_tenant_id()
  AND (
    -- User is assigned as owner of the lead
    l.owner_user_id = auth.uid()
    -- OR user has manager/admin role (can see all)
    OR has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
  );
$$;

-- Fix function search path issues for existing functions
CREATE OR REPLACE FUNCTION public.has_role(required_role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = required_role 
    AND active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  tid uuid;
BEGIN
  -- Derive tenant_id directly from the users table using the authenticated user id
  SELECT tenant_id INTO tid
  FROM public.users
  WHERE id = auth.uid() AND active = true
  LIMIT 1;

  RETURN tid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Get or create a default tenant
  SELECT id INTO default_tenant_id 
  FROM public.tenants 
  WHERE name = 'Default Company' 
  LIMIT 1;
  
  -- If no default tenant exists, create one
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, plan)
    VALUES ('Default Company', 'starter')
    RETURNING id INTO default_tenant_id;
  END IF;
  
  -- Insert the new user into the users table
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    tenant_id,
    active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'admin'::app_role,  -- First user is admin
    default_tenant_id,
    true
  );
  
  RETURN NEW;
END;
$function$;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.get_masked_lead_data() TO authenticated;