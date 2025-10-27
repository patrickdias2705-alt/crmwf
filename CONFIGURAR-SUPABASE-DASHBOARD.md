# 🎨 Configurar Supabase pelo Dashboard - Guia Visual

## ✅ Configurar Secret pelo Dashboard (Recomendado)

### Passo 1: Acessar o Dashboard
1. Acesse: https://app.supabase.com
2. Faça login na sua conta

### Passo 2: Selecionar Projeto
1. Na lista de projetos, clique em **xqeqaagnnkilihlfjbrm** (ou o nome do seu projeto)

### Passo 3: Configurar Secret
1. No menu lateral esquerdo, clique em **Edge Functions**
2. Clique na aba **Settings** (ou **Secrets**)
3. Procure pela seção **Secrets** ou **Environment Variables**
4. Clique em **Add new secret** ou **New Secret**
5. Preencha:
   - **Name**: `CHATWOOT_API_TOKEN`
   - **Value**: `HUYUHnVUAunUeAWpcUS8VWeK`
6. Clique em **Save** ou **Add**

### Passo 4: Fazer Deploy da Função
Você pode fazer o deploy de duas formas:

#### Opção A: Pelo Dashboard (se disponível)
1. Vá em **Edge Functions**
2. Clique em **Create a new function**
3. Selecione **Upload function** ou **Deploy from file**
4. Upload o arquivo `supabase/functions/chatwoot-conversations/index.ts`

#### Opção B: Pelo Terminal (Recomendado)
```bash
# No terminal, na raiz do projeto
cd /Users/patrickdiasparis/crmwf-main

# Deploy da função
supabase functions deploy chatwoot-conversations
```

### Passo 5: Verificar
1. No Dashboard, vá em **Edge Functions**
2. Você deve ver `chatwoot-conversations` na lista
3. Clique nela para ver os detalhes e logs

## 🎯 Atalho Rápido

**URL direta para secrets:**
```
https://app.supabase.com/project/xqeqaagnnkilihlfjbrm/functions/secrets
```

## 📸 Onde encontrar (Menu lateral)

```
Dashboard
├── Table Editor
├── SQL Editor
├── Edge Functions  ← AQUI
│   ├── Functions
│   ├── Settings    ← SECRETS
│   └── Logs
├── Authentication
└── ...
```

## ⚠️ Nota Importante

O **SQL Editor** não é usado para configurar secrets de Edge Functions. 
Use o menu **Edge Functions** → **Settings** → **Secrets**.

## 🆘 Problemas comuns

### Não encontro a opção "Secrets"
- Use o menu lateral: **Edge Functions** → **Settings**
- Procure por "Environment Variables" ou "Secrets"

### O projeto não aparece
- Verifique se você tem acesso ao projeto
- Entre em contato com o administrador do projeto

### Deploy não funciona pelo Dashboard
- Use o terminal:
  ```bash
  supabase functions deploy chatwoot-conversations
  ```

## 📞 Próximos Passos

Após configurar o secret:
1. ✅ Secret configurado no Dashboard
2. ⏳ Fazer deploy da função
3. ⏳ Testar no navegador
