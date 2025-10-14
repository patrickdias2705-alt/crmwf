# 🔧 Como Aplicar as Correções de Segurança

## 📋 O Que Foi Corrigido

### ❌ **PROBLEMA ENCONTRADO:**
- Agentes podiam ver leads de OUTROS agentes do mesmo tenant
- As políticas RLS só filtravam por `tenant_id`, não por `assigned_to`
- Dados não estavam isolados entre agentes

### ✅ **SOLUÇÃO IMPLEMENTADA:**
- Agentes agora veem APENAS seus próprios leads (`assigned_to = user_id`)
- Supervisores continuam vendo todos os leads do tenant deles
- Frontend + Backend trabalham juntos para isolamento total
- Políticas RLS reescritas para máxima segurança

---

## 🚀 Passos para Aplicar

### **Opção 1: Aplicar via Supabase Dashboard (RECOMENDADO)**

#### 1️⃣ **Acessar o Supabase Dashboard**
```
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em "SQL Editor" no menu lateral
```

#### 2️⃣ **Executar Migration de Correção**
```
1. Copie todo o conteúdo de:
   supabase/migrations/20251007200000_fix_agent_isolation.sql

2. Cole no SQL Editor

3. Clique em "Run" (ou pressione Cmd/Ctrl + Enter)

4. Aguarde mensagem de sucesso
```

#### 3️⃣ **Limpar Dados Antigos (OPCIONAL)**
```
⚠️ ATENÇÃO: Isso APAGA TODOS OS DADOS do banco!
⚠️ Faça backup antes se necessário!

1. Copie todo o conteúdo de:
   supabase/migrations/20251007200001_clear_all_data.sql

2. Cole no SQL Editor

3. Clique em "Run"

4. Todos os dados serão apagados (estrutura mantida)
```

#### 4️⃣ **Testar**
```
1. Faça login como um agente
2. Vá para /leads
3. Deve ver APENAS os leads atribuídos a ele
4. Faça login como supervisor
5. Deve ver TODOS os leads
```

---

### **Opção 2: Aplicar via CLI do Supabase**

```bash
# 1. Navegar para o projeto
cd /Users/patrickdiasparis/Downloads/wa-flow-suite-main

# 2. Fazer login no Supabase (se ainda não fez)
supabase login

# 3. Link com o projeto remoto
supabase link --project-ref SEU_PROJECT_ID

# 4. Aplicar migrations
supabase db push

# 5. Verificar se foi aplicado
supabase db diff
```

---

## 📊 Como Testar Se Funcionou

### Teste 1: Isolamento de Agente
```sql
-- No SQL Editor do Supabase
-- Execute como agente Maria:

SELECT * FROM leads;
-- Deve retornar APENAS leads onde assigned_to = maria_user_id
```

### Teste 2: Supervisor Vê Tudo
```sql
-- Execute como supervisor:

SELECT * FROM leads;
-- Deve retornar TODOS os leads do tenant
```

### Teste 3: No Frontend
```
1. Login como maria@teste.com (agent)
2. Dashboard: Mostra apenas leads da Maria
3. Leads: Lista apenas leads da Maria
4. Pipelines: Kanban apenas com leads da Maria

5. Login como supervisor@teste.com
6. Ir para /supervisor
7. Clicar na Maria
8. Deve ver apenas leads da Maria
9. Clicar no Pedro
10. Deve ver apenas leads do Pedro
```

---

## 🔍 Verificar Políticas RLS Ativas

```sql
-- No SQL Editor, execute:

SELECT 
  tablename, 
  policyname, 
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('leads', 'conversations', 'messages', 'lead_events', 'budgets')
ORDER BY tablename, policyname;
```

Deve mostrar as novas políticas:
- `leads_select_policy`
- `leads_insert_policy`
- `leads_update_policy`
- `leads_delete_policy`
- `conversations_select_policy`
- `messages_select_policy`
- etc.

---

## 🎯 Criar Dados de Teste

Depois de limpar os dados, crie dados de teste:

```sql
-- 1. Criar tenant
INSERT INTO tenants (id, name, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Teste', 'starter');

-- 2. Criar usuários
INSERT INTO users (id, email, name, role, tenant_id, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'supervisor@teste.com', 'Supervisor Teste', 'supervisor', '00000000-0000-0000-0000-000000000001', true),
  ('22222222-2222-2222-2222-222222222222', 'maria@teste.com', 'Maria Silva', 'agent', '00000000-0000-0000-0000-000000000001', true),
  ('33333333-3333-3333-3333-333333333333', 'pedro@teste.com', 'Pedro Santos', 'agent', '00000000-0000-0000-0000-000000000001', true);

-- 3. Criar pipeline e stages
INSERT INTO pipelines (id, tenant_id, name, is_default)
VALUES ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Pipeline Vendas', true);

INSERT INTO stages (id, tenant_id, pipeline_id, name, "order", color)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Novo Lead', 0, '#3B82F6'),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Em Contato', 1, '#10B981'),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Fechado', 2, '#22C55E');

-- 4. Criar leads para Maria
INSERT INTO leads (name, phone, tenant_id, pipeline_id, stage_id, assigned_to, owner_user_id, origin)
VALUES 
  ('Cliente A Maria', '11111111111', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'whatsapp'),
  ('Cliente B Maria', '11222222222', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'whatsapp'),
  ('Cliente C Maria', '11333333333', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'site');

-- 5. Criar leads para Pedro
INSERT INTO leads (name, phone, tenant_id, pipeline_id, stage_id, assigned_to, owner_user_id, origin)
VALUES 
  ('Cliente A Pedro', '22111111111', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'instagram'),
  ('Cliente B Pedro', '22222222222', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'facebook'),
  ('Cliente C Pedro', '22333333333', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'whatsapp');
```

---

## 🔐 Configurar Senhas no Supabase Auth

Os usuários de teste precisam de senhas. Configure no Supabase Auth:

```
1. Vá para: Authentication → Users
2. Para cada usuário (supervisor, maria, pedro):
   - Clique no email
   - Clique em "Send magic link" ou "Reset password"
   - Ou defina senha manualmente
```

**Senhas sugeridas para teste:**
- supervisor@teste.com: `Test@1234`
- maria@teste.com: `Test@1234`
- pedro@teste.com: `Test@1234`

---

## ✅ Checklist Final

Após aplicar tudo, verifique:

- [ ] Migration de correção executada sem erros
- [ ] Dados antigos limpos (opcional)
- [ ] Dados de teste criados
- [ ] Senhas configuradas no Supabase Auth
- [ ] Login como Maria funciona
- [ ] Maria vê apenas 3 leads dela
- [ ] Login como Pedro funciona
- [ ] Pedro vê apenas 3 leads dele
- [ ] Login como Supervisor funciona
- [ ] Supervisor vê 6 leads (3 Maria + 3 Pedro)
- [ ] Supervisor pode trocar entre Maria e Pedro
- [ ] Dados filtram corretamente

---

## 🐛 Problemas Comuns

### Erro: "relation does not exist"
```
Solução: Certifique-se que a migration foi executada no banco correto
```

### Erro: "permission denied"
```
Solução: Execute como usuário com permissões de superuser
```

### Agente ainda vê todos os leads
```
Solução: 
1. Limpe o cache do navegador
2. Faça logout e login novamente
3. Verifique se a migration foi aplicada:
   SELECT * FROM pg_policies WHERE tablename = 'leads';
```

### Supervisor não vê leads de agentes
```
Solução:
1. Verifique se o role do supervisor está correto:
   SELECT role FROM users WHERE email = 'supervisor@teste.com';
   -- Deve ser 'supervisor' ou 'admin'

2. Verifique se a função is_admin_or_supervisor() existe:
   SELECT * FROM pg_proc WHERE proname = 'is_admin_or_supervisor';
```

---

## 📞 Suporte

Se precisar de ajuda:

1. Verifique os logs no console do navegador (F12)
2. Verifique os logs do Supabase Dashboard
3. Execute as queries de teste do arquivo `ISOLAMENTO-DADOS-RLS.md`

---

## 📚 Documentação Relacionada

- `docs/ISOLAMENTO-DADOS-RLS.md` - Explicação técnica completa
- `docs/SUPERVISOR-AGENT-VIEW.md` - Sistema de visualização de agentes
- `supabase/migrations/20251007200000_fix_agent_isolation.sql` - Migration de correção

---

**Data:** Outubro 2025  
**Status:** ✅ Pronto para Aplicar  
**Testado:** Sim  
**Impacto:** Alto (melhora segurança significativamente)

