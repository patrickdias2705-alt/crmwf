# Corrigir Orçamentos no Vercel

## Problema
Os orçamentos não estão aparecendo no CRM após o deploy no Vercel.

## Possíveis Causas

1. **Coluna `status` não existe na tabela `budget_documents`**
   - A migration `20250115000000_add_budget_status_and_open_budgets.sql` pode não ter sido aplicada no Supabase de produção

2. **RLS (Row Level Security) bloqueando queries**
   - As políticas RLS podem estar muito restritivas ou a função `get_user_tenant_id()` pode não estar funcionando corretamente

3. **Queries usando filtro explícito de `tenant_id`**
   - As queries estão usando `.eq('tenant_id', user?.tenant_id)` mas a RLS já filtra automaticamente, o que pode causar conflitos

## Solução

### Passo 1: Aplicar Migration no Supabase

Execute o script `VERIFICAR-ORCAMENTOS-VERCEL.sql` no **Supabase SQL Editor**:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `VERIFICAR-ORCAMENTOS-VERCEL.sql`
4. Execute o script

Este script irá:
- Verificar se as colunas `status`, `file_base64` e `sale_id` existem
- Criar as colunas se não existirem
- Atualizar orçamentos sem status para 'aberto'
- Criar índices necessários
- Verificar as políticas RLS

### Passo 2: Verificar RLS Policies

Execute esta query no Supabase SQL Editor para verificar as políticas:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'budget_documents';
```

Certifique-se de que existe uma política de SELECT que permite:
```sql
tenant_id = public.get_user_tenant_id()
```

### Passo 3: Testar Query Manualmente

Execute esta query no Supabase SQL Editor para testar se os orçamentos estão sendo retornados:

```sql
SELECT 
  id,
  lead_id,
  amount,
  status,
  created_at,
  tenant_id
FROM public.budget_documents
WHERE status = 'aberto'
ORDER BY created_at DESC
LIMIT 10;
```

### Passo 4: Verificar Logs no Vercel

1. Acesse o Vercel Dashboard
2. Vá em **Deployments** → Seu deployment mais recente
3. Clique em **Functions** → **View Function Logs**
4. Procure por erros relacionados a `budget_documents` ou RLS

### Passo 5: Verificar Console do Navegador

1. Abra o CRM no navegador
2. Abra o **Console do Desenvolvedor** (F12)
3. Procure por mensagens de erro ou logs que começam com:
   - `🔍 Buscando orçamentos`
   - `❌ Erro ao buscar`
   - `📊 Orçamentos encontrados`

## Mudanças Feitas no Código

1. **Removido filtro explícito de `tenant_id` em Metrics.tsx**
   - A RLS já filtra por tenant automaticamente
   - Query agora usa apenas `.eq('status', 'aberto')`

2. **Adicionados logs de debug em BudgetDocumentUpload.tsx**
   - Logs mostram quantos orçamentos foram encontrados
   - Logs mostram detalhes de erros se houver

## Verificação Final

Após aplicar as correções, verifique:

1. ✅ Orçamentos aparecem na lista de leads (badge "Tem Orçamento")
2. ✅ Orçamentos aparecem na página de Métricas (card "Orçamentos em Aberto")
3. ✅ Orçamentos aparecem no modal de detalhes do lead
4. ✅ Novos orçamentos são salvos corretamente

## Se Ainda Não Funcionar

1. Verifique se o usuário tem `tenant_id` correto:
   ```sql
   SELECT id, email, tenant_id FROM auth.users WHERE email = 'seu-email@exemplo.com';
   ```

2. Verifique se os orçamentos existem no banco:
   ```sql
   SELECT COUNT(*) FROM public.budget_documents WHERE status = 'aberto';
   ```

3. Teste a função RLS manualmente:
   ```sql
   SELECT public.get_user_tenant_id();
   ```

4. Verifique se há erros de permissão:
   ```sql
   SELECT * FROM public.budget_documents LIMIT 1;
   ```

