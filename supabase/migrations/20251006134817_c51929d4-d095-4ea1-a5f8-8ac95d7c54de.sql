-- Corrigir warnings de segurança do linter

-- 1. Corrigir search_path na função update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;

-- 2. Corrigir search_path na função create_default_user_role
CREATE OR REPLACE FUNCTION create_default_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, tenant_id, role)
    VALUES (NEW.id, NEW.tenant_id, COALESCE(NEW.role, 'agent'::app_role))
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;