# 🔒 Isolamento de Dados e Row Level Security (RLS)

## 📋 Resumo

Este documento explica como os dados são isolados no sistema CRM para garantir que:
- ✅ **Agentes** veem APENAS seus próprios leads
- ✅ **Supervisores** veem todos os leads do tenant (empresa) deles
- ✅ **Admins** veem tudo do tenant deles
- ✅ Dados **NÃO misturam** entre empresas (tenants)
- ✅ Dados **NÃO misturam** entre agentes

---

## 🔐 Como Funciona o RLS (Row Level Security)

O **RLS** é um recurso do PostgreSQL/Supabase que **filtra automaticamente** as queries no banco de dados. Mesmo que o código tente buscar todos os registros, o banco só retorna o que o usuário tem permissão de ver.

### Hierarquia de Permissões

```
┌─────────────────────────────────────────┐
│  ADMIN / SUPERVISOR / MANAGER           │
│  ✅ Vê TODOS os leads do tenant         │
│  ✅ Pode criar/editar/deletar           │
│  ✅ Vê métricas consolidadas            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  AGENT (Agente)                         │
│  ✅ Vê APENAS leads onde:               │
│     - assigned_to = seu user_id         │
│     - owner_user_id = seu user_id       │
│  ✅ Pode criar leads                    │
│  ✅ Pode editar seus leads              │
│  ❌ NÃO vê leads de outros agentes      │
│  ❌ NÃO pode deletar leads              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  VIEWER (Visualizador)                  │
│  ✅ Vê APENAS dados do tenant           │
│  ❌ NÃO pode editar nada                │
└─────────────────────────────────────────┘
```

---

## 🎯 Políticas RLS Implementadas

### 1. **LEADS** (Tabela Principal)

#### SELECT (Ver leads)
```sql
Agentes veem:
- Leads onde assigned_to = seu user_id
- Leads onde owner_user_id = seu user_id

Supervisores/Managers/Admins veem:
- TODOS os leads do tenant_id deles
```

#### INSERT (Criar leads)
```sql
Qualquer usuário autenticado pode criar leads no seu tenant
```

#### UPDATE (Editar leads)
```sql
Agentes podem editar:
- Apenas seus próprios leads (assigned_to ou owner_user_id)

Supervisores/Managers podem editar:
- Todos os leads do tenant
```

#### DELETE (Deletar leads)
```sql
Apenas Supervisores/Managers/Admins podem deletar
```

---

### 2. **CONVERSATIONS** (Conversas)

```sql
Agentes veem:
- Apenas conversas de leads que pertencem a eles

Supervisores veem:
- Todas as conversas do tenant
```

---

### 3. **MESSAGES** (Mensagens)

```sql
Agentes veem:
- Apenas mensagens de conversas de leads que pertencem a eles

Supervisores veem:
- Todas as mensagens do tenant
```

---

### 4. **LEAD_EVENTS** (Histórico)

```sql
Agentes veem:
- Apenas eventos de leads que pertencem a eles

Supervisores veem:
- Todos os eventos do tenant
```

---

### 5. **BUDGETS** (Orçamentos)

```sql
Agentes veem:
- Apenas orçamentos de leads que pertencem a eles

Supervisores veem:
- Todos os orçamentos do tenant
```

---

### 6. **METRICS_DAILY** (Métricas)

```sql
Apenas Supervisores/Managers/Admins podem ver métricas

Agentes NÃO veem métricas agregadas
(mas podem ver suas próprias estatísticas através dos leads)
```

---

## 🔍 Exemplos Práticos

### Cenário 1: Agente Maria cria um lead

```sql
-- Maria (agent) cria lead
INSERT INTO leads (name, phone, tenant_id, assigned_to)
VALUES ('João Silva', '11999999999', 'tenant-abc', 'maria-user-id');

-- ✅ Maria VÊ este lead (assigned_to = maria-user-id)
-- ❌ Pedro (outro agent) NÃO VÊ este lead
-- ✅ Supervisor VÊ este lead (mesmo tenant)
```

### Cenário 2: Supervisor transfere lead entre agentes

```sql
-- Supervisor move lead da Maria para o Pedro
UPDATE leads 
SET assigned_to = 'pedro-user-id' 
WHERE id = 'lead-123';

-- ❌ Maria não vê mais este lead
-- ✅ Pedro agora vê este lead
-- ✅ Supervisor continua vendo
```

### Cenário 3: Agente Pedro tenta ver leads da Maria

```sql
-- Pedro tenta buscar todos os leads
SELECT * FROM leads;

-- Resultado: Banco retorna APENAS leads onde assigned_to = 'pedro-user-id'
-- Mesmo que o código tente buscar tudo, RLS filtra automaticamente
```

### Cenário 4: Supervisor visualiza painel de um agente

```javascript
// Frontend aplica filtro adicional
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('assigned_to', viewingAgentId); // Filtro do frontend

// Backend (RLS) já garante que:
// - Se usuário é supervisor: vê todos do tenant
// - Se usuário é agent: vê apenas os dele
// O filtro do frontend é adicional para UX
```

---

## 🛡️ Garantias de Segurança

### 1. **Isolamento por Tenant**
```sql
-- SEMPRE filtrado automaticamente
WHERE tenant_id = public.get_user_tenant_id()
```
Impossível ver dados de outra empresa.

### 2. **Isolamento por Agente**
```sql
-- Para agentes, filtrado automaticamente
AND (assigned_to = auth.uid() OR owner_user_id = auth.uid())
```
Impossível ver leads de outro agente.

### 3. **Função Helper**
```sql
CREATE FUNCTION is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor', 'client_owner', 'manager')
  );
END;
$$;
```
Verifica permissões de forma segura.

---

## 📊 Testando o Isolamento

### Teste 1: Login como Agente
```
1. Login como Maria (agent)
2. Ir para /leads
3. Deve ver APENAS leads atribuídos a ela
4. Tentar acessar lead de outro agente via URL
   → Banco retorna vazio (RLS bloqueia)
```

### Teste 2: Login como Supervisor
```
1. Login como Supervisor
2. Ir para /supervisor
3. Selecionar agente Maria
4. Deve ver todos os leads da Maria
5. Selecionar agente Pedro
6. Deve ver todos os leads do Pedro
7. Dados mudam instantaneamente
```

### Teste 3: Tentativa de Hack
```sql
-- Agente tenta hackear via SQL injection ou API direta
-- Mesmo que consiga executar:
SELECT * FROM leads WHERE id = 'lead-de-outro-agente';

-- RLS retorna: 0 rows
-- Porque: assigned_to != auth.uid()
```

---

## 🔧 Manutenção e Troubleshooting

### Verificar se RLS está ativo
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- rowsecurity deve ser TRUE para todas as tabelas
```

### Verificar políticas ativas
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Testar como outro usuário
```sql
-- No Supabase SQL Editor, você pode simular outro usuário
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-id-aqui';

-- Agora execute queries e veja o que retorna
SELECT * FROM leads;
```

---

## 📝 Checklist de Segurança

- [x] RLS ativado em todas as tabelas
- [x] Políticas de SELECT por tenant_id
- [x] Políticas de SELECT por assigned_to para agentes
- [x] Função is_admin_or_supervisor() implementada
- [x] Índices em assigned_to e owner_user_id
- [x] Políticas de INSERT verificam tenant_id
- [x] Políticas de UPDATE verificam assigned_to
- [x] Políticas de DELETE apenas para supervisores
- [x] Mensagens e conversas filtradas por lead
- [x] Orçamentos filtrados por lead
- [x] Eventos filtrados por lead
- [x] Métricas apenas para supervisores

---

## 🚀 Como Aplicar as Correções

### 1. Aplicar Migration de Correção
```bash
# As migrations são aplicadas automaticamente pelo Supabase
# Ou manualmente no Supabase Dashboard → SQL Editor:

-- Executar: 20251007200000_fix_agent_isolation.sql
```

### 2. Limpar Dados Existentes (Opcional)
```sql
-- Executar: 20251007200001_clear_all_data.sql
-- ATENÇÃO: Apaga TODOS os dados!
```

### 3. Criar Dados de Teste
```sql
-- Criar tenant
INSERT INTO tenants (id, name, plan)
VALUES ('tenant-1', 'Empresa Teste', 'starter');

-- Criar supervisor
INSERT INTO users (id, email, name, role, tenant_id)
VALUES 
  ('supervisor-1', 'supervisor@teste.com', 'Supervisor', 'supervisor', 'tenant-1');

-- Criar agentes
INSERT INTO users (id, email, name, role, tenant_id)
VALUES 
  ('agent-maria', 'maria@teste.com', 'Maria', 'agent', 'tenant-1'),
  ('agent-pedro', 'pedro@teste.com', 'Pedro', 'agent', 'tenant-1');

-- Criar pipeline
INSERT INTO pipelines (id, tenant_id, name, is_default)
VALUES ('pipeline-1', 'tenant-1', 'Pipeline Vendas', true);

-- Criar stages
INSERT INTO stages (id, tenant_id, pipeline_id, name, "order")
VALUES 
  ('stage-1', 'tenant-1', 'pipeline-1', 'Novo Lead', 0),
  ('stage-2', 'tenant-1', 'pipeline-1', 'Em Contato', 1),
  ('stage-3', 'tenant-1', 'pipeline-1', 'Fechado', 2);

-- Criar leads para Maria
INSERT INTO leads (name, phone, tenant_id, pipeline_id, stage_id, assigned_to)
VALUES 
  ('Cliente A', '11111111111', 'tenant-1', 'pipeline-1', 'stage-1', 'agent-maria'),
  ('Cliente B', '22222222222', 'tenant-1', 'pipeline-1', 'stage-2', 'agent-maria');

-- Criar leads para Pedro
INSERT INTO leads (name, phone, tenant_id, pipeline_id, stage_id, assigned_to)
VALUES 
  ('Cliente C', '33333333333', 'tenant-1', 'pipeline-1', 'stage-1', 'agent-pedro'),
  ('Cliente D', '44444444444', 'tenant-1', 'pipeline-1', 'stage-2', 'agent-pedro');
```

### 4. Testar Isolamento
```
✅ Login como Maria → Deve ver apenas Cliente A e B
✅ Login como Pedro → Deve ver apenas Cliente C e D
✅ Login como Supervisor → Deve ver A, B, C e D
✅ Supervisor seleciona Maria → Filtra para A e B
✅ Supervisor seleciona Pedro → Filtra para C e D
```

---

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Security Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

**Data de Implementação:** Outubro 2025  
**Status:** ✅ Implementado e Testado  
**Próximas Revisões:** Trimestral





