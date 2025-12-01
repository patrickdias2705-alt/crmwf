-- Fix get_user_tenant_id to not rely on JWT custom claims
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
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
$$;