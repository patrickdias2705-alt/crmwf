# 🔧 PASSO A PASSO: Corrigir Orçamento Não Salvando

## 1️⃣ VERIFICAR NO CONSOLE DO NAVEGADOR

1. Abra o navegador (F12 ou Cmd+Option+I)
2. Vá na aba **Console**
3. Tente enviar um orçamento novamente
4. Procure por mensagens que começam com:
   - `❌ ERRO ao salvar na tabela budget_documents`
   - `⚠️ Erro ao buscar da tabela budget_documents`
   - `✅ Orçamento salvo na tabela budget_documents`

## 2️⃣ VERIFICAR NO SUPABASE SQL EDITOR

Execute o arquivo `VERIFICAR-TABELA-BUDGET-DOCUMENTS.sql` no SQL Editor do Supabase:

```sql
-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'budget_documents'
) as tabela_existe;

-- Verificar se a coluna status existe
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'budget_documents'
    AND column_name = 'status'
) as coluna_status_existe;
```

### Se `tabela_existe` = `false`:
- A tabela não existe. Execute a migration `20250115000000_add_budget_status_and_open_budgets.sql`

### Se `coluna_status_existe` = `false`:
- A migration não foi aplicada completamente. Execute a migration novamente.

## 3️⃣ APLICAR AS MIGRATIONS

Se a tabela não existe ou está incompleta:

1. Vá no Supabase Dashboard
2. SQL Editor
3. Execute na ordem:
   - `supabase/migrations/20250115000000_add_budget_status_and_open_budgets.sql`
   - `supabase/migrations/20250115000001_migrate_existing_budgets_to_table.sql` (opcional, só para migrar dados antigos)

## 4️⃣ VERIFICAR RLS (Row Level Security)

Execute no SQL Editor:

```sql
-- Verificar políticas RLS
SELECT 
  policyname,
  cmd as operacao,
  roles
FROM pg_policies
WHERE tablename = 'budget_documents';
```

Se não houver políticas, crie uma política básica:

```sql
-- Permitir INSERT para usuários autenticados do mesmo tenant
CREATE POLICY "Users can insert budget_documents for their tenant"
ON budget_documents
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Permitir SELECT para usuários autenticados do mesmo tenant
CREATE POLICY "Users can select budget_documents for their tenant"
ON budget_documents
FOR SELECT
TO authenticated
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);
```

## 5️⃣ TESTAR NOVAMENTE

1. Recarregue a página (F5)
2. Tente enviar um orçamento
3. Verifique:
   - Se aparece mensagem de sucesso: `✅ Orçamento salvo no banco de dados!`
   - Se aparece erro: copie a mensagem completa do console

## 6️⃣ VERIFICAR SE SALVOU

Execute no SQL Editor:

```sql
-- Ver últimos orçamentos inseridos
SELECT 
  id,
  lead_id,
  file_name,
  amount,
  status,
  created_at
FROM budget_documents
ORDER BY created_at DESC
LIMIT 5;
```

Se aparecer o orçamento que você enviou, está funcionando! ✅

## 7️⃣ VERIFICAR ORÇAMENTOS EM ABERTO

Execute no SQL Editor:

```sql
-- Ver orçamentos em aberto
SELECT 
  id,
  lead_id,
  file_name,
  amount,
  status,
  created_at
FROM budget_documents
WHERE status = 'aberto'
ORDER BY created_at DESC;
```

Se aparecer o orçamento, ele deve aparecer na página de Métricas também.

