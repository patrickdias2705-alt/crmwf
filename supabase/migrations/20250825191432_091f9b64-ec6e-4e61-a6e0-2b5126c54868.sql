-- Create a trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();