-- Promover Patrick Dias para admin
-- Substitua 'patrick@email.com' pelo email correto do Patrick Dias
DO $$
DECLARE
  patrick_user_id UUID;
  patrick_email TEXT := 'patrick@seuemail.com'; -- ALTERAR PARA O EMAIL CORRETO
BEGIN
  -- Buscar o user_id do Patrick pelo email no auth.users
  SELECT id INTO patrick_user_id 
  FROM auth.users 
  WHERE email = patrick_email 
  LIMIT 1;
  
  IF patrick_user_id IS NOT NULL THEN
    -- Atualizar role na tabela users
    UPDATE users 
    SET role = 'admin'::app_role 
    WHERE id = patrick_user_id;
    
    -- Atualizar role na tabela user_roles
    UPDATE user_roles 
    SET role = 'admin'::app_role 
    WHERE user_id = patrick_user_id;
    
    RAISE NOTICE 'Patrick Dias promovido para admin com sucesso!';
  ELSE
    RAISE NOTICE 'Usuário com email % não encontrado. Faça signup primeiro.', patrick_email;
  END IF;
END $$;

-- Remover usuário incompleto (mariabrebal26@gmail.com) se existir
-- Nota: Isso remove dos dados, mas não remove do Supabase Auth automaticamente
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'mariabrebal26@gmail.com'
);

DELETE FROM users WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'mariabrebal26@gmail.com'
);