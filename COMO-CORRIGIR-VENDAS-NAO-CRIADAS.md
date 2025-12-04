# 🔧 Como Corrigir: Vendas Não Sendo Criadas no Banco de Dados

## ❌ Problema

As vendas não estão sendo criadas na tabela `sales` mesmo após marcar leads como vendidos.

## 🔍 Possíveis Causas

1. **Função `get_user_tenant_id()` não está funcionando**
2. **Políticas RLS não foram aplicadas corretamente**
3. **Tenant ID do usuário não está correto na tabela `users`**
4. **Políticas RLS conflitantes bloqueando inserção**

## ✅ Solução Passo a Passo

### PASSO 1: Executar Script de Diagnóstico

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o script: `DIAGNOSTICAR-E-CORRIGIR-VENDAS.sql`
4. Este script irá:
   - Verificar a função `get_user_tenant_id()`
   - Recriar a função de forma robusta
   - Remover todas as políticas RLS conflitantes
   - Criar políticas RLS uniformes e permissivas
   - Verificar a estrutura da tabela
   - Mostrar estatísticas de vendas

### PASSO 2: Verificar Resultados do Script

Após executar o script, verifique:

1. **Função get_user_tenant_id():**
   - Deve retornar o `tenant_id` correto do usuário
   - Se retornar NULL, o problema está na tabela `users`

2. **Políticas RLS:**
   - Deve haver 4 políticas: SELECT, INSERT, UPDATE, DELETE
   - Todas devem usar `tenant_id = get_user_tenant_id()`
   - SEM restrições de role

3. **Estrutura da Tabela:**
   - Deve ter as colunas: `id`, `tenant_id`, `lead_id`, `amount`, etc.

### PASSO 3: Verificar Tenant ID do Usuário

Execute esta query no SQL Editor:

```sql
SELECT 
  u.id as user_id,
  u.email,
  u.tenant_id,
  u.active,
  t.id as tenant_exists,
  CASE 
    WHEN u.tenant_id IS NULL THEN '❌ ERRO: tenant_id é NULL'
    WHEN t.id IS NULL THEN '❌ ERRO: tenant não existe'
    WHEN u.active = false THEN '⚠️ AVISO: usuário inativo'
    ELSE '✅ OK'
  END as status
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'SEU_EMAIL_AQUI@exemplo.com';
```

**Se o `tenant_id` for NULL ou o tenant não existir:**
- Corrija o `tenant_id` na tabela `users`
- Ou crie o tenant se não existir

### PASSO 4: Testar Inserção Manual

Execute esta query como usuário autenticado (substitua os valores):

```sql
-- Teste de inserção manual
INSERT INTO public.sales (
  tenant_id,
  lead_id,
  amount,
  stage_id,
  sold_by,
  sold_by_name
) VALUES (
  (SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1),
  'LEAD_ID_AQUI',
  1000.00,
  'STAGE_ID_AQUI',
  auth.uid(),
  'Teste Manual'
)
RETURNING id, tenant_id, amount;
```

**Se der erro:**
- Verifique a mensagem de erro
- Pode ser problema de RLS ou dados inválidos

### PASSO 5: Verificar Logs no Console

1. Abra o **Console do Navegador** (F12)
2. Marque um lead como vendido
3. Verifique os logs:
   - `🔍 Tentando inserir venda na tabela sales...`
   - `📋 Dados da venda: {...}`
   - `👤 User ID: ...`
   - `🏢 Tenant ID: ...`
   - `🧪 Teste de tenant_id: {...}`

**Se aparecer erro:**
- Copie a mensagem de erro completa
- Verifique o código do erro (ex: `42501` = erro de permissão)

### PASSO 6: Aplicar Correção RLS (Se Necessário)

Se o problema for RLS, execute:

```sql
-- Remover todas as políticas
DROP POLICY IF EXISTS "Users can view sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can insert sales for their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can update sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can delete sales for their tenant" ON public.sales;
DROP POLICY IF EXISTS "uniform_sales_select_policy" ON public.sales;
DROP POLICY IF EXISTS "uniform_sales_insert_policy" ON public.sales;
DROP POLICY IF EXISTS "uniform_sales_update_policy" ON public.sales;
DROP POLICY IF EXISTS "uniform_sales_delete_policy" ON public.sales;

-- Criar políticas uniformes
CREATE POLICY "uniform_sales_select_policy" 
ON public.sales FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "uniform_sales_insert_policy" 
ON public.sales FOR INSERT TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "uniform_sales_update_policy" 
ON public.sales FOR UPDATE TO authenticated
USING (tenant_id = public.get_user_tenant_id())
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "uniform_sales_delete_policy" 
ON public.sales FOR DELETE TO authenticated
USING (tenant_id = public.get_user_tenant_id());
```

### PASSO 7: Verificar Vendas Criadas

Execute esta query para verificar se as vendas estão sendo criadas:

```sql
SELECT 
  s.id,
  s.lead_id,
  l.name as lead_name,
  s.amount,
  s.tenant_id,
  s.sold_at,
  s.sold_by_name,
  u.email as user_email
FROM public.sales s
LEFT JOIN public.leads l ON s.lead_id = l.id
LEFT JOIN public.users u ON s.sold_by = u.id
ORDER BY s.sold_at DESC
LIMIT 10;
```

## 🚨 Erros Comuns e Soluções

### Erro: "new row violates row-level security policy"
**Causa:** Política RLS bloqueando inserção
**Solução:** Execute o PASSO 6 para recriar as políticas

### Erro: "get_user_tenant_id() returns NULL"
**Causa:** Usuário não tem `tenant_id` na tabela `users`
**Solução:** Execute o PASSO 3 para verificar e corrigir

### Erro: "permission denied for table sales"
**Causa:** RLS não está configurado corretamente
**Solução:** Execute o PASSO 6 para recriar as políticas

### Venda não aparece após criar
**Causa:** Pode ser problema de cache ou verificação
**Solução:** 
1. Aguarde alguns segundos
2. Recarregue a página
3. Verifique diretamente no banco (PASSO 7)

## 📋 Checklist Final

- [ ] Script de diagnóstico executado
- [ ] Função `get_user_tenant_id()` retorna valor correto
- [ ] Políticas RLS criadas corretamente (4 políticas)
- [ ] Tenant ID do usuário está correto
- [ ] Teste de inserção manual funcionou
- [ ] Logs no console mostram dados corretos
- [ ] Vendas aparecem na tabela `sales`

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs completos no console**
2. **Execute o script de diagnóstico novamente**
3. **Verifique se o usuário está autenticado corretamente**
4. **Verifique se o tenant_id está correto na tabela users**
5. **Entre em contato com suporte técnico com:**
   - Mensagem de erro completa
   - Logs do console
   - Resultado do script de diagnóstico

## 📝 Arquivos Relacionados

- `DIAGNOSTICAR-E-CORRIGIR-VENDAS.sql` - Script completo de diagnóstico
- `APLICAR-CORRECAO-RLS-SALES-TODOS-TENANTS.sql` - Correção RLS
- `src/components/MarkAsSoldButton.tsx` - Componente com validações

