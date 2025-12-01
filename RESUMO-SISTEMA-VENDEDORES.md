# 📋 RESUMO: Sistema de Vendedores

## ✅ O QUE JÁ EXISTE

### 1. **Tabela de Vendedores (users)**
- Cada vendedor tem um **ID único** (`id` UUID)
- Cada vendedor pertence a um **tenant** (`tenant_id`)
- Cada vendedor tem um **role** (agent, admin, manager, supervisor, etc.)

### 2. **Leads com Vendedor**
- Campo `assigned_to` na tabela `leads` → referencia `users.id`
- Campo `owner_user_id` na tabela `leads` → referencia `users.id`
- Quando um lead é criado, automaticamente é atribuído ao vendedor que criou (`assigned_to: user.id`)

### 3. **Orçamentos com Vendedor**
- Campo `uploaded_by` na tabela `budget_documents` → referencia `users.id`
- Quando um orçamento é enviado, automaticamente é atribuído ao vendedor que enviou (`uploaded_by: user.id`)

### 4. **Isolamento por Vendedor**
- Políticas RLS garantem que cada vendedor vê apenas seus próprios leads
- Supervisores/Managers veem todos os leads do tenant

## 🔍 COMO VERIFICAR

Execute o arquivo `VERIFICAR-SISTEMA-VENDEDORES.sql` no SQL Editor do Supabase para:
- Ver a estrutura das tabelas
- Verificar se há leads/orçamentos sem vendedor
- Ver exemplos de leads e orçamentos com seus vendedores

## 🛠️ COMO CORRIGIR (SE NECESSÁRIO)

Execute o arquivo `CRIAR-SISTEMA-VENDEDORES.sql` no SQL Editor do Supabase para:
- Garantir que as colunas existem
- Criar foreign keys se não existirem
- Atribuir vendedores a leads/orçamentos que não têm
- Criar índices para performance

## 📊 COMO FUNCIONA

### Quando um Lead é Cadastrado:
```typescript
// CreateLeadDialog.tsx linha 80
assigned_to: user.id  // Vendedor que cadastrou
```

### Quando um Orçamento é Enviado:
```typescript
// BudgetDocumentUpload.tsx linha 124
uploaded_by: user?.id  // Vendedor que enviou
```

### Consultas para Ver Dados por Vendedor:

**Leads de um vendedor:**
```sql
SELECT * FROM leads 
WHERE assigned_to = 'ID_DO_VENDEDOR';
```

**Orçamentos de um vendedor:**
```sql
SELECT * FROM budget_documents 
WHERE uploaded_by = 'ID_DO_VENDEDOR';
```

**Leads e orçamentos de um vendedor (com join):**
```sql
SELECT 
  l.id,
  l.name,
  l.assigned_to,
  u.name as vendedor_nome,
  COUNT(bd.id) as total_orcamentos
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
LEFT JOIN budget_documents bd ON bd.lead_id = l.id AND bd.uploaded_by = u.id
WHERE l.assigned_to = 'ID_DO_VENDEDOR'
GROUP BY l.id, l.name, l.assigned_to, u.name;
```

## ✅ CONCLUSÃO

O sistema **JÁ ESTÁ IMPLEMENTADO** e funcionando! Cada lead e orçamento está vinculado ao vendedor que o criou/enviou através dos campos:
- `leads.assigned_to` → ID do vendedor
- `budget_documents.uploaded_by` → ID do vendedor

Cada vendedor tem um ID único por tenant, garantindo diferenciação completa.

