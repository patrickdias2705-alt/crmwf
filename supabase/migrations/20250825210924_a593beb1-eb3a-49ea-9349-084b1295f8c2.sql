-- Fix security warnings for functions by setting proper search_path
CREATE OR REPLACE FUNCTION public.has_role(required_role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
 SET search_path TO 'public'
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