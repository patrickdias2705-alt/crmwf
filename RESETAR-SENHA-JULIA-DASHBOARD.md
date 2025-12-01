# 🔐 Como Resetar Senha da Julia - Guia Rápido

## ✅ Informações do Usuário
- **Email**: `julia@wfcirurgicos.com.br`
- **UID**: `a0cc209f-4c08-49a9-ba14-7f0c5f3e850e`
- **Criado em**: 06 Oct, 2025 14:29
- **Email confirmado**: ✅ Sim (06 Oct, 2025 14:29)
- **Último login**: ❌ Nunca fez login

## 🚀 Opção 1: Resetar Senha via Dashboard (MAIS FÁCIL)

Você já está na tela certa! Siga estes passos:

1. **No painel direito**, você já vê o usuário `julia@wfcirurgicos.com.br` selecionado
2. **Role até a seção "Reset password"**
3. **Clique em "Send password recovery"**
4. **OU** clique em "Edit user" (se disponível) e defina a senha manualmente

### Se houver opção "Edit user":
1. Clique em "Edit user"
2. Role até o campo "Password"
3. Digite a nova senha: `Test@1234`
4. Salve

## 🌐 Opção 2: Resetar Senha via API (Programático)

Use este comando curl diretamente no terminal:

```bash
curl -X PUT 'https://xqeqaagnnkilihlfjbrm.supabase.co/auth/v1/admin/users/a0cc209f-4c08-49a9-ba14-7f0c5f3e850e' \
  -H "apikey: SEU_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "Test@1234",
    "email_confirm": true
  }'
```

**Substitua `SEU_SERVICE_ROLE_KEY`** pela sua Service Role Key:
- No Supabase Dashboard, vá em: **Settings > API**
- Copie a **"service_role key"** (secret)

## 📧 Opção 3: Enviar Magic Link (Sem Senha)

Se preferir, você pode enviar um magic link:

1. **No painel direito**, role até "Send magic link"
2. **Clique em "Send magic link"**
3. O usuário receberá um email com link de acesso
4. Ao clicar no link, poderá definir a senha

## ✅ Após Resetar

Teste o login com:
- **Email**: `julia@wfcirurgicos.com.br`
- **Senha**: `Test@1234` (ou a senha que você definiu)

## 🔍 Verificar se Funcionou

Execute este SQL no Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '⚠️ Ainda não fez login'
    ELSE '✅ Já fez login com sucesso'
  END as status
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';
```

## 📝 Senhas Sugeridas

- **Senha padrão**: `Test@1234`
- **Senha forte**: `Julia@2024!`
- **Senha simples**: `senha123`

**IMPORTANTE**: Avise o usuário para mudar a senha após o primeiro login!

