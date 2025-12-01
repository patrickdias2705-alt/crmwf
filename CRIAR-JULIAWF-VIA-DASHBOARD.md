# ✅ Criar juliawf@gmail.com via Dashboard

## 🎯 Status Atual

✅ Usuário antigo (`julia@wfcirurgicos.com.br`) foi apagado com sucesso!

Agora vamos criar o novo usuário `juliawf@gmail.com`.

## 🚀 Passo a Passo

### Passo 1: Criar Usuário no Supabase Auth

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://app.supabase.com
   - Selecione o projeto: **CRM Pro**

2. **Vá em Authentication > Users**
   - No menu lateral esquerdo, clique em **Authentication**
   - Depois clique em **Users**

3. **Criar Novo Usuário**
   - Clique no botão **"Add user"** ou **"Create user"**

4. **Preencher Dados**
   - **Email**: `juliawf@gmail.com`
   - **Password**: `Test@1234`
   - **Email confirm**: ✅ (marcar como confirmado)
   - Clique em **"Create user"** ou **"Save"**

### Passo 2: Associar ao Tenant

Após criar o usuário, execute este SQL no Supabase SQL Editor:

```sql
-- Garantir que o tenant existe
INSERT INTO public.tenants (id, name, plan, created_at, updated_at)
SELECT 
  'a961a599-65ab-408c-b39e-bc2109a07bff'::UUID,
  'Distribuidor',
  'free',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE name = 'Distribuidor'
);

-- Associar usuário ao tenant
UPDATE public.users
SET 
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  name = 'Julia',
  role = 'agent',
  active = true,
  updated_at = NOW()
WHERE email = 'juliawf@gmail.com';

-- Criar user_role
INSERT INTO user_roles (user_id, tenant_id, role)
SELECT 
  u.id,
  u.tenant_id,
  'agent'
FROM public.users u
WHERE u.email = 'juliawf@gmail.com'
  AND u.tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = EXCLUDED.role;
```

### Passo 3: Verificar se Funcionou

Execute este SQL para verificar:

```sql
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.active,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN au.id IS NULL THEN '❌ Não existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ Não existe em public.users'
    WHEN au.id != pu.id THEN '❌ IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    ELSE '✅ TUDO OK - Login deve funcionar!'
  END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'juliawf@gmail.com' 
   OR pu.email = 'juliawf@gmail.com';
```

### Passo 4: Testar Login

Após criar e associar, teste o login com:

- **Email**: `juliawf@gmail.com`
- **Senha**: `Test@1234`

## ✅ Checklist

- [ ] Usuário criado via Dashboard (Authentication > Users)
- [ ] SQL executado para associar ao tenant
- [ ] Verificação executada (PASSO 3)
- [ ] Login testado com `juliawf@gmail.com` e `Test@1234`

## 🐛 Se Não Funcionar

Se o usuário não aparecer em `public.users` após criar via Dashboard:

1. Execute o `VERIFICAR-JULIAWF.sql` para ver o que está faltando
2. Execute o PASSO 4 do SQL para criar em `public.users`
3. Execute o PASSO 5 do SQL para associar ao tenant

## 📝 Notas

- O usuário antigo (`julia@wfcirurgicos.com.br`) já foi apagado ✅
- Agora só falta criar o novo usuário (`juliawf@gmail.com`)
- Use o Dashboard para criar em `auth.users` (mais confiável)
- Depois execute o SQL para associar ao tenant

