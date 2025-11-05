# 🗑️ Apagar Julia e Criar Novo Usuário

## Opção 1: Via Dashboard (MAIS FÁCIL)

### Passo 1: Apagar Usuário Atual

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://app.supabase.com
   - Selecione o projeto: **CRM Pro**

2. **Apagar de auth.users**
   - Vá em: **Authentication > Users**
   - Procure: `julia@wfcirurgicos.com.br`
   - Clique no email
   - Role até a seção **"Danger zone"**
   - Clique em **"Delete user"**
   - Confirme a exclusão

3. **Apagar de public.users**
   - Execute este SQL no Supabase SQL Editor:
   ```sql
   DELETE FROM user_roles
   WHERE user_id IN (
     SELECT id FROM auth.users WHERE email = 'julia@wfcirurgicos.com.br'
   );
   
   DELETE FROM public.users
   WHERE email = 'julia@wfcirurgicos.com.br';
   ```

### Passo 2: Criar Novo Usuário

1. **No Dashboard do Supabase**
   - Vá em: **Authentication > Users**
   - Clique em **"Add user"** ou **"Create user"**

2. **Preencher dados**
   - **Email**: (seu novo email, ex: `julia.nova@wfcirurgicos.com.br`)
   - **Password**: `Test@1234`
   - **Email confirm**: ✅ (marcar como confirmado)
   - Clique em **"Create user"**

3. **Associar ao tenant**
   - Execute este SQL (substitua o email):
   ```sql
   -- Associar ao tenant Distribuidor
   UPDATE public.users
   SET 
     tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
     name = 'Julia',
     role = 'agent',
     active = true,
     updated_at = NOW()
   WHERE email = 'SEU_NOVO_EMAIL@wfcirurgicos.com.br';
   
   -- Criar user_role
   INSERT INTO user_roles (user_id, tenant_id, role)
   SELECT 
     u.id,
     u.tenant_id,
     'agent'
   FROM public.users u
   WHERE u.email = 'SEU_NOVO_EMAIL@wfcirurgicos.com.br'
   ON CONFLICT (user_id, tenant_id) DO UPDATE SET
     role = EXCLUDED.role;
   ```

## Opção 2: Via SQL Completo

Execute o arquivo `APAGAR-JULIA-E-CRIAR-NOVO-USUARIO.sql`:

1. Abra o arquivo no Supabase SQL Editor
2. **Configure o novo email** na linha:
   ```sql
   v_novo_email TEXT := 'NOVO_EMAIL@exemplo.com';  -- SUBSTITUA AQUI!
   ```
3. Substitua `'NOVO_EMAIL@exemplo.com'` pelo email que você quer usar
4. Execute o SQL completo

## 📝 Emails Sugeridos

- `julia.nova@wfcirurgicos.com.br`
- `julia2@wfcirurgicos.com.br`
- `julia@wfcirurgicos.com` (sem .br)
- `julia@novoemail.com.br`

## ✅ Após Criar

1. Teste o login com:
   - **Email**: (seu novo email)
   - **Senha**: `Test@1234`

2. Verifique se funcionou:
   ```sql
   SELECT 
     id,
     email,
     email_confirmed_at,
     last_sign_in_at
   FROM auth.users
   WHERE email = 'SEU_NOVO_EMAIL@wfcirurgicos.com.br';
   ```

## ⚠️ Importante

- O email antigo (`julia@wfcirurgicos.com.br`) será completamente removido
- Todos os dados associados ao usuário antigo serão perdidos
- Certifique-se de que realmente quer apagar antes de executar
- O novo usuário começará do zero (sem histórico)

