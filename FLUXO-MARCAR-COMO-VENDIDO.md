# 🔄 FLUXO: Marcar como Vendido

## ✅ O QUE ACONTECE QUANDO VOCÊ MARCA COMO VENDIDO

### 1️⃣ **Busca o Orçamento Aberto**
```
📋 Busca na tabela budget_documents:
   - lead_id = ID do lead
   - status = 'aberto'
   - Ordena por data (mais recente primeiro)
   - Pega o primeiro (mais recente)
```

### 2️⃣ **Cria a Venda**
```
💾 Insere na tabela sales:
   - tenant_id
   - lead_id
   - amount (valor do orçamento)
   - sold_by (seu ID)
   - stage_id (estágio "Fechado")
   - etc.
```

### 3️⃣ **Atualiza o Orçamento** ⭐ **AQUI É O PONTO CHAVE**
```
🔄 Atualiza na tabela budget_documents:
   - status: 'aberto' → 'vendido' ✅
   - sale_id: vincula à venda criada ✅
   - updated_at: atualiza timestamp ✅
```

### 4️⃣ **Resultado Final**
```
✅ Orçamento muda de status
✅ Orçamento sai da lista de "orçamentos em aberto"
✅ Orçamento fica vinculado à venda
✅ Orçamento permanece no banco (histórico)
```

## 📊 EXEMPLO PRÁTICO

### ANTES de marcar como vendido:
```sql
SELECT * FROM budget_documents WHERE lead_id = 'abc123';
```
Resultado:
```
id: xyz789
lead_id: abc123
status: 'aberto'  ← Ainda aberto
sale_id: NULL     ← Sem venda
amount: 1000.00
```

### DEPOIS de marcar como vendido:
```sql
SELECT * FROM budget_documents WHERE lead_id = 'abc123';
```
Resultado:
```
id: xyz789
lead_id: abc123
status: 'vendido'  ← ✅ ATUALIZADO!
sale_id: 'sale-123' ← ✅ VINCULADO!
amount: 1000.00
```

## 🔍 CÓDIGO QUE FAZ ISSO

### No `MarkAsSoldButton.tsx` (linhas 195-210):

```typescript
// Após criar a venda, atualiza o orçamento
if (latestDocument?.id) {
  console.log('🔄 Atualizando status do orçamento para "vendido"...');
  const { error: updateBudgetError } = await supabase
    .from('budget_documents')
    .update({
      status: 'vendido',        // ← Muda status
      sale_id: saleId,          // ← Vincula à venda
      updated_at: new Date().toISOString()
    })
    .eq('id', latestDocument.id)
    .eq('status', 'aberto');    // ← Só atualiza se ainda estiver aberto
}
```

## ✅ GARANTIAS

1. ✅ **Atualização Manual**: O código atualiza diretamente na tabela
2. ✅ **Trigger Backup**: Se o trigger estiver funcionando, também atualiza
3. ✅ **Dupla Proteção**: Mesmo que o trigger falhe, o código garante a atualização

## 🧪 COMO TESTAR

1. **Envie um orçamento** para um lead
2. **Marque como vendido**
3. **Verifique no console do navegador:**
   - Deve aparecer: `🔄 Atualizando status do orçamento para "vendido"...`
   - Deve aparecer: `✅ Status do orçamento atualizado para "vendido"`
4. **Verifique no banco:**
```sql
SELECT 
  id,
  lead_id,
  status,
  sale_id,
  amount,
  created_at,
  updated_at
FROM budget_documents
WHERE lead_id = 'SEU_LEAD_ID'
ORDER BY created_at DESC;
```

## ⚠️ SE NÃO FUNCIONAR

Se o orçamento não atualizar, execute:

1. **`VERIFICAR-TRIGGER-ORCAMENTO.sql`** - Para diagnosticar
2. **`CORRIGIR-TRIGGER-ORCAMENTO.sql`** - Para corrigir o trigger

Mas mesmo sem o trigger, o código manual garante a atualização! ✅

