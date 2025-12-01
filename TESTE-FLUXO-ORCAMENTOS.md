# 🧪 TESTE: Fluxo de Orçamentos em Aberto

## ✅ **O QUE FOI IMPLEMENTADO:**

### 1. **Enviar Orçamento → Salva Direto no Banco**
- ✅ Quando você envia um orçamento, ele vai **direto** para a tabela `budget_documents`
- ✅ Status inicial: `'aberto'` (temporário)
- ✅ Arquivo preservado em `file_base64`

### 2. **Transformar em Venda → Sai do Temporário**
- ✅ Quando marca como vendido, cria registro na tabela `sales`
- ✅ **Trigger automático** atualiza `budget_documents`:
  - Status muda de `'aberto'` → `'vendido'`
  - Vincula à venda através do `sale_id`

### 3. **Orçamentos em Aberto = Apenas Status 'aberto'**
- ✅ Métricas buscam apenas orçamentos com `status = 'aberto'`
- ✅ Orçamentos vendidos ficam com `status = 'vendido'` (histórico)

---

## 🧪 **COMO TESTAR:**

### **Teste 1: Enviar Orçamento**
1. Abra um lead
2. Clique em "Enviar Orçamento"
3. Preencha: descrição, valor, anexe arquivo
4. Clique em "Enviar Orçamento"

**✅ Resultado esperado:**
- Orçamento aparece na lista
- Verificar no Supabase: tabela `budget_documents` deve ter 1 registro com `status = 'aberto'`

**Query para verificar:**
```sql
SELECT * FROM budget_documents 
WHERE lead_id = 'ID_DO_LEAD' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### **Teste 2: Marcar como Vendido**
1. Com o orçamento enviado, clique em "Marcar como Vendido"

**✅ Resultado esperado:**
- Mensagem de sucesso
- Verificar no Supabase:
  - Tabela `sales`: deve ter 1 registro
  - Tabela `budget_documents`: status deve mudar para `'vendido'`

**Query para verificar:**
```sql
-- Verificar venda criada
SELECT * FROM sales 
WHERE lead_id = 'ID_DO_LEAD' 
ORDER BY created_at DESC 
LIMIT 1;

-- Verificar status do orçamento
SELECT id, status, sale_id, amount 
FROM budget_documents 
WHERE lead_id = 'ID_DO_LEAD';
```

---

### **Teste 3: Orçamentos em Aberto nas Métricas**
1. Vá para a página de Métricas
2. Veja o card "Orçamentos em Aberto"

**✅ Resultado esperado:**
- Deve mostrar apenas orçamentos com `status = 'aberto'`
- Orçamentos vendidos NÃO devem aparecer

**Query para verificar:**
```sql
SELECT 
  COUNT(*) as total_abertos,
  SUM(amount) as valor_total
FROM budget_documents 
WHERE status = 'aberto'
AND tenant_id = 'SEU_TENANT_ID';
```

---

### **Teste 4: Recompra (Múltiplos Orçamentos)**
1. Lead já vendido
2. Adicione um novo orçamento
3. Marque como vendido novamente

**✅ Resultado esperado:**
- Primeiro orçamento: `status = 'vendido'`
- Segundo orçamento: `status = 'vendido'` (após marcar)
- Lead origem muda para `'carteirizado'`

**Query para verificar:**
```sql
SELECT 
  id,
  status,
  amount,
  created_at,
  sale_id
FROM budget_documents 
WHERE lead_id = 'ID_DO_LEAD'
ORDER BY created_at DESC;
```

---

## 📊 **QUERIES ÚTEIS PARA DEBUG:**

### Ver todos os orçamentos de um lead:
```sql
SELECT 
  bd.*,
  l.name as lead_name,
  s.id as sale_id,
  s.amount as sale_amount
FROM budget_documents bd
JOIN leads l ON l.id = bd.lead_id
LEFT JOIN sales s ON s.id = bd.sale_id
WHERE bd.lead_id = 'ID_DO_LEAD'
ORDER BY bd.created_at DESC;
```

### Ver orçamentos em aberto por tenant:
```sql
SELECT 
  COUNT(*) as total_abertos,
  SUM(amount) as valor_total,
  COUNT(DISTINCT lead_id) as leads_com_orcamento_aberto
FROM budget_documents 
WHERE status = 'aberto'
AND tenant_id = 'SEU_TENANT_ID';
```

### Ver orçamentos vendidos:
```sql
SELECT 
  COUNT(*) as total_vendidos,
  SUM(amount) as valor_total
FROM budget_documents 
WHERE status = 'vendido'
AND tenant_id = 'SEU_TENANT_ID';
```

---

## 🎯 **FLUXO COMPLETO:**

```
1. Enviar Orçamento
   ↓
   budget_documents (status: 'aberto') ✅

2. Marcar como Vendido
   ↓
   sales (novo registro) ✅
   ↓
   budget_documents (status: 'aberto' → 'vendido') ✅

3. Orçamentos em Aberto
   ↓
   Apenas status = 'aberto' ✅
```

---

## ⚠️ **SE ALGO NÃO FUNCIONAR:**

1. **Orçamento não aparece:**
   - Verificar se salvou na tabela `budget_documents`
   - Verificar RLS (Row Level Security)

2. **Status não muda para 'vendido':**
   - Verificar se o trigger está criado
   - Verificar se a venda foi criada na tabela `sales`

3. **Métricas não atualizam:**
   - Verificar se está buscando da tabela `budget_documents`
   - Verificar filtro `status = 'aberto'`

