# 🔧 CORREÇÃO: Orçamento não atualiza quando marca como vendido

## ❌ PROBLEMA
Quando marca um lead como vendido, o orçamento:
- ❌ Não muda de status (continua como 'aberto')
- ❌ Não sai da lista de "orçamentos em aberto"
- ❌ Não é vinculado à venda

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. **Código Corrigido (`MarkAsSoldButton.tsx`)**
- ✅ Agora busca o orçamento da tabela `budget_documents` (não mais dos `fields`)
- ✅ Busca especificamente orçamentos com `status = 'aberto'`
- ✅ Após criar a venda, atualiza manualmente o status do orçamento para 'vendido'
- ✅ Vincula o orçamento à venda através do campo `sale_id`

### 2. **Trigger Melhorado**
- ✅ Função `update_budget_on_sale()` melhorada para garantir atualização
- ✅ Trigger recriado para funcionar corretamente

## 🔍 COMO VERIFICAR

### 1. Verificar se o trigger está funcionando:
Execute `VERIFICAR-TRIGGER-ORCAMENTO.sql` no SQL Editor do Supabase para:
- Ver se o trigger existe
- Ver orçamentos que deveriam ter sido atualizados
- Ver últimas vendas e seus orçamentos

### 2. Se o trigger não estiver funcionando:
Execute `CORRIGIR-TRIGGER-ORCAMENTO.sql` para:
- Recriar a função com lógica melhorada
- Recriar o trigger

## 📊 COMO FUNCIONA AGORA

### Quando marca como vendido:
1. ✅ Busca o orçamento mais recente com `status = 'aberto'` da tabela `budget_documents`
2. ✅ Cria a venda na tabela `sales`
3. ✅ **Atualiza manualmente** o status do orçamento para `'vendido'`
4. ✅ Vincula o orçamento à venda (`sale_id`)
5. ✅ O trigger também tenta atualizar (backup)

### Resultado:
- ✅ Orçamento muda de status: `'aberto'` → `'vendido'`
- ✅ Orçamento sai da lista de "orçamentos em aberto"
- ✅ Orçamento fica vinculado à venda
- ✅ Orçamento permanece no banco (histórico), mas com status 'vendido'

## 🧪 TESTAR

1. **Envie um orçamento** para um lead
2. **Marque como vendido**
3. **Verifique no banco:**
```sql
SELECT 
  id,
  lead_id,
  status,
  sale_id,
  amount
FROM budget_documents
WHERE lead_id = 'ID_DO_LEAD'
ORDER BY created_at DESC;
```

O orçamento deve ter:
- `status = 'vendido'`
- `sale_id` preenchido com o ID da venda

## ✅ CONCLUSÃO

O problema foi corrigido! Agora quando marca como vendido:
- ✅ O orçamento é atualizado para `status = 'vendido'`
- ✅ O orçamento sai da lista de "orçamentos em aberto"
- ✅ O orçamento fica vinculado à venda
- ✅ O orçamento permanece no banco para histórico

**Próximos passos:**
1. Teste marcando um lead como vendido
2. Execute `VERIFICAR-TRIGGER-ORCAMENTO.sql` para verificar se está funcionando
3. Se necessário, execute `CORRIGIR-TRIGGER-ORCAMENTO.sql` para garantir que o trigger está correto

