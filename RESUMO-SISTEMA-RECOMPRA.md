# 🔄 SISTEMA DE RECOMPRA - Implementação Completa

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Botão "Marcar como Vendido" → "Nova Recompra"**
- ✅ Quando marca como vendido, o botão muda para "Nova Recompra"
- ✅ Botão de recompra abre um dialog totalmente novo para cadastrar novo orçamento
- ✅ O novo orçamento é independente do anterior

### 2. **Apagar Orçamento Após Venda**
- ✅ Quando marca como vendido:
  1. **PRIMEIRO**: Passa dados para tabela `sales`
  2. **DEPOIS**: Apaga o orçamento da tabela `budget_documents`
  3. **VALIDAÇÃO**: Se não conseguir passar para sales, NÃO apaga (dá erro)

### 3. **Cliente Carteirizado Automático**
- ✅ Quando é recompra, o lead é automaticamente marcado como `origin = 'carteirizado'`
- ✅ Acontece tanto quando marca como vendido (primeira vez) quanto quando cadastra nova recompra

## 🔄 FLUXO COMPLETO

### **Primeira Venda:**
```
1. Lead tem orçamento em aberto
2. Clica "Marcar como Vendido"
   ↓
3. Cria venda na tabela sales
4. APAGA orçamento da tabela budget_documents
5. Lead vira "carteirizado" (se já tinha venda anterior)
6. Botão muda para "Nova Recompra"
```

### **Recompra:**
```
1. Lead já foi vendido (tem venda em sales)
2. Clica "Nova Recompra"
   ↓
3. Abre dialog para novo orçamento
4. Cadastra novo orçamento (totalmente independente)
5. Lead é marcado como "carteirizado"
6. Botão volta para "Marcar como Vendido"
```

## 📊 ESTRUTURA DE DADOS

### **Tabela `budget_documents`:**
- ✅ Armazena apenas orçamentos **em aberto**
- ✅ Quando vira venda, é **APAGADO** (não apenas muda status)
- ✅ Dados são preservados na tabela `sales`

### **Tabela `sales`:**
- ✅ Armazena todas as vendas realizadas
- ✅ Contém dados do orçamento (description, file_name, amount)
- ✅ Histórico completo de vendas

### **Tabela `leads`:**
- ✅ Campo `origin` muda para `'carteirizado'` quando há recompra
- ✅ Permite múltiplas vendas do mesmo lead

## 🔍 VALIDAÇÕES IMPLEMENTADAS

### **Ao Marcar como Vendido:**
1. ✅ Verifica se tem orçamento em aberto
2. ✅ Cria venda na tabela `sales`
3. ✅ **SÓ APAGA** se a venda foi criada com sucesso
4. ✅ Se der erro ao criar venda, **NÃO APAGA** o orçamento
5. ✅ Se der erro ao apagar, **REVERTE** a venda criada

### **Ao Cadastrar Recompra:**
1. ✅ Verifica se o lead já foi vendido
2. ✅ Cria novo orçamento (independente)
3. ✅ Marca lead como `'carteirizado'`
4. ✅ Permite marcar como vendido novamente

## 🧪 COMO TESTAR

### **Teste 1: Primeira Venda**
1. Cadastre um lead
2. Envie um orçamento
3. Marque como vendido
4. **Verifique:**
   - ✅ Orçamento foi apagado de `budget_documents`
   - ✅ Venda foi criada em `sales`
   - ✅ Botão mudou para "Nova Recompra"

### **Teste 2: Recompra**
1. Com lead já vendido, clique "Nova Recompra"
2. Cadastre novo orçamento (valor diferente)
3. **Verifique:**
   - ✅ Novo orçamento foi criado
   - ✅ Lead está como `origin = 'carteirizado'`
   - ✅ Botão voltou para "Marcar como Vendido"

### **Teste 3: Validação de Erro**
1. Tente marcar como vendido sem orçamento
2. **Verifique:**
   - ✅ Dá erro e não apaga nada
   - ✅ Orçamento permanece intacto

## 📝 QUERIES ÚTEIS

### **Ver orçamentos em aberto:**
```sql
SELECT * FROM budget_documents 
WHERE status = 'aberto';
```

### **Ver vendas realizadas:**
```sql
SELECT * FROM sales 
ORDER BY sold_at DESC;
```

### **Ver leads carteirizados:**
```sql
SELECT * FROM leads 
WHERE origin = 'carteirizado';
```

### **Ver histórico completo de um lead:**
```sql
-- Vendas
SELECT * FROM sales WHERE lead_id = 'ID_DO_LEAD';

-- Orçamentos em aberto (se houver)
SELECT * FROM budget_documents WHERE lead_id = 'ID_DO_LEAD';
```

## ✅ CONCLUSÃO

O sistema está completo e funcionando:
- ✅ Orçamentos são apagados após venda
- ✅ Dados são preservados em sales
- ✅ Recompra funciona corretamente
- ✅ Lead vira carteirizado automaticamente
- ✅ Validações garantem integridade dos dados

