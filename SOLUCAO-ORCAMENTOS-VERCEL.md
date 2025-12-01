# Solução: Orçamentos não aparecem no Vercel

## Problema
Os orçamentos aparecem no ambiente local, mas ficam zerados no Vercel.

## Causa Raiz
As políticas RLS (Row Level Security) estão bloqueando as queries no Vercel porque a função `get_user_tenant_id()` pode não estar funcionando corretamente no contexto de produção.

## Solução

### Passo 1: Aplicar Correção de RLS no Supabase

Execute o script `CORRIGIR-RLS-BUDGET-DOCUMENTS-VERCEL.sql` no **Supabase SQL Editor**:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo `CORRIGIR-RLS-BUDGET-DOCUMENTS-VERCEL.sql`
5. Cole todo o conteúdo no SQL Editor
6. Clique em **Run** (ou pressione Cmd/Ctrl + Enter)

Este script irá:
- ✅ Remover políticas RLS antigas que podem estar bloqueando
- ✅ Criar políticas RLS mais robustas que funcionam no Vercel
- ✅ Verificar e corrigir a função `get_user_tenant_id()`
- ✅ Adicionar fallbacks para garantir que as queries funcionem

### Passo 2: Verificar Logs no Console

Após aplicar o script e fazer deploy no Vercel:

1. Abra o CRM no Vercel
2. Abra o **Console do Navegador** (F12)
3. Vá na aba **Console**
4. Procure por logs que começam com:
   - `🔍 [Metrics] Buscando orçamentos em aberto...`
   - `✅ [Metrics] Query executada com sucesso`
   - `📊 [Metrics] Data retornado: X registros`
   - `❌ [Metrics] Erro ao buscar` (se houver erro)

### Passo 3: Testar Manualmente

Execute esta query no Supabase SQL Editor para verificar se os orçamentos estão acessíveis:

```sql
-- Testar como usuário autenticado
SELECT 
  id,
  lead_id,
  amount,
  status,
  tenant_id,
  created_at
FROM public.budget_documents
WHERE status = 'aberto'
ORDER BY created_at DESC
LIMIT 10;
```

**Se esta query retornar dados**, mas o frontend não mostrar, o problema é RLS.

**Se esta query não retornar dados**, verifique se:
- Os orçamentos existem no banco
- O status está como 'aberto'
- O tenant_id está correto

### Passo 4: Verificar Autenticação

No console do navegador, verifique se aparecem estes logs:

```
✅ [Metrics] Usuário autenticado: [user-id]
👤 [Metrics] User: [user-id] Tenant: [tenant-id]
```

Se não aparecer, há problema de autenticação.

## Diagnóstico de Problemas

### Problema 1: RLS bloqueando

**Sintoma:** Logs mostram `📊 [Metrics] Data retornado: 0 registros` mas há orçamentos no banco.

**Solução:** Execute o script `CORRIGIR-RLS-BUDGET-DOCUMENTS-VERCEL.sql` novamente.

### Problema 2: Autenticação falhando

**Sintoma:** Logs mostram `❌ [Metrics] Erro de autenticação`.

**Solução:** 
1. Limpe o cache do navegador
2. Faça logout e login novamente
3. Verifique se as variáveis de ambiente do Supabase estão corretas no Vercel

### Problema 3: Tenant ID não corresponde

**Sintoma:** Logs mostram `tenant_id` diferente entre usuário e orçamento.

**Solução:** Verifique se o `tenant_id` do usuário corresponde ao `tenant_id` dos orçamentos:

```sql
-- Verificar tenant_id do usuário
SELECT id, email, tenant_id 
FROM public.users 
WHERE email = 'seu-email@exemplo.com';

-- Verificar tenant_id dos orçamentos
SELECT DISTINCT tenant_id, COUNT(*) 
FROM public.budget_documents 
WHERE status = 'aberto'
GROUP BY tenant_id;
```

## Verificação Final

Após aplicar todas as correções:

1. ✅ Orçamentos aparecem na página de Métricas
2. ✅ Orçamentos aparecem na lista de Leads (badge "Tem Orçamento")
3. ✅ Orçamentos aparecem no modal de detalhes do lead
4. ✅ Novos orçamentos são salvos e aparecem imediatamente

## Se Ainda Não Funcionar

1. **Verifique as variáveis de ambiente no Vercel:**
   - `VITE_SUPABASE_URL` (se estiver usando)
   - `VITE_SUPABASE_ANON_KEY` (se estiver usando)

2. **Verifique se o build do Vercel está atualizado:**
   - Vá em **Deployments** no Vercel
   - Verifique se o último deployment tem as mudanças mais recentes

3. **Limpe o cache:**
   - No Vercel: **Settings** → **Build & Development Settings** → **Clear Build Cache**
   - No navegador: Limpe cache e cookies

4. **Verifique os logs do Vercel:**
   - Vá em **Functions** → **View Function Logs**
   - Procure por erros relacionados a Supabase ou RLS

