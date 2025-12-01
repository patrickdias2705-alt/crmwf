-- Promover Patrick Dias (patrickdias2705@gmail.com) para admin
DO $$
DECLARE
  patrick_user_id UUID;
BEGIN
  -- Buscar o user_id do Patrick pelo email
  SELECT id INTO patrick_user_id 
  FROM auth.users 
  WHERE email = 'patrickdias2705@gmail.com' 
  LIMIT 1;
  
  IF patrick_user_id IS NOT NULL THEN
    -- Atualizar role na tabela users
    UPDATE users 
    SET role = 'admin'::app_role 
    WHERE id = patrick_user_id;
    
    -- Atualizar ou inserir role na tabela user_roles
    INSERT INTO user_roles (user_id, tenant_id, role)
    SELECT patrick_user_id, tenant_id, 'admin'::app_role
    FROM users WHERE id = patrick_user_id
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET role = 'admin'::app_role;
    
    RAISE NOTICE 'Patrick Dias promovido para admin com sucesso!';
  ELSE
    RAISE NOTICE 'Patrick Dias não encontrado. Faça signup em /auth primeiro com patrickdias2705@gmail.com';
  END IF;
END $$;

-- Limpar usuário incompleto mariabrebal26@gmail.com
DO $$
DECLARE
  maria_user_id UUID;
BEGIN
  SELECT id INTO maria_user_id 
  FROM auth.users 
  WHERE email = 'mariabrebal26@gmail.com';
  
  IF maria_user_id IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = maria_user_id;
    DELETE FROM users WHERE id = maria_user_id;
    RAISE NOTICE 'Usuário mariabrebal26@gmail.com removido das tabelas públicas';
  END IF;
END $$;