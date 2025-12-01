# 🔑 Resetar Senha da Julia - Via Dashboard (MAIS CONFIÁVEL)

## ✅ Status Atual

- ✅ Usuário existe em `auth.users`
- ✅ Usuário existe em `public.users`
- ✅ IDs coincidem
- ✅ Usuário está ativo
- ✅ Email confirmado
- ✅ Tenant associado
- ⚠️ **Problema**: Senha não está funcionando

## 🚀 Solução: Resetar Senha via Dashboard

Como todos os requisitos estão atendidos, o problema é a senha. Vamos resetar diretamente no Dashboard:

### Passo 1: Acessar o Dashboard do Supabase

1. Acesse: https://app.supabase.com
2. Faça login com sua conta
3. Selecione o projeto: **CRM Pro**

### Passo 2: Ir para Authentication > Users

1. No menu lateral esquerdo, clique em **Authentication**
2. Clique em **Users** (abaixo de Authentication)

### Passo 3: Encontrar o Usuário

1. Procure pelo email: `julia@wfcirurgicos.com.br`
2. Clique no email do usuário

### Passo 4: Editar o Usuário

1. No painel direito, você verá os detalhes do usuário
2. Clique no botão **"Edit user"** (ou ícone de edição)

### Passo 5: Resetar Senha

1. No formulário de edição, role até a seção **"Password"**
2. Digite a nova senha: `Test@1234`
3. Clique em **"Save"** ou **"Update"**

### Passo 6: Testar o Login

1. Acesse a URL do seu sistema CRM
2. Tente fazer login com:
   - **Email**: `julia@wfcirurgicos.com.br`
   - **Senha**: `Test@1234`

## 🔍 Verificar se Funcionou

Execute este SQL após testar o login:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '⚠️ Ainda não fez login'
    ELSE '✅ Login realizado com sucesso!'
  END as status_login
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';
```

Se o login funcionar, o campo `last_sign_in_at` será preenchido.

## 🐛 Se Ainda Não Funcionar

### Opção 1: Enviar Magic Link

1. No Dashboard do Supabase
2. Authentication > Users
3. Clique em `julia@wfcirurgicos.com.br`
4. Clique em **"Send magic link"**
5. O usuário receberá um email com link de acesso
6. Ao clicar no link, poderá definir a senha

### Opção 2: Reset Password

1. No Dashboard do Supabase
2. Authentication > Users
3. Clique em `julia@wfcirurgicos.com.br`
4. Clique em **"Reset password"**
5. O usuário receberá um email para resetar a senha

### Opção 3: Verificar Erro Específico

Quando tentar fazer login, verifique:
- Qual mensagem de erro aparece?
- Há algum erro no console do navegador?
- O sistema está funcionando para outros usuários?

## 📝 Checklist Final

- [ ] Senha resetada via Dashboard
- [ ] Login testado com email: `julia@wfcirurgicos.com.br`
- [ ] Login testado com senha: `Test@1234`
- [ ] Verificado `last_sign_in_at` após tentativa de login
- [ ] Se não funcionar, enviar magic link

## ⚠️ Importante

- A senha `Test@1234` é temporária
- Avise a Julia para mudar a senha após o primeiro login
- Não compartilhe a senha publicamente

