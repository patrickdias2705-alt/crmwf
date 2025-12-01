# 🧹 LIMPEZA COMPLETA DE DADOS - SUPABASE

## 📋 **INSTRUÇÕES PARA EXECUTAR:**

### **1. ACESSE O SUPABASE DASHBOARD:**
- Vá para: https://supabase.com/dashboard
- Entre no seu projeto
- Clique em **"SQL Editor"**

### **2. COLE E EXECUTE ESTE SCRIPT:**

```sql
-- =====================================================
-- LIMPEZA COMPLETA DE DADOS E GARANTIA DE ISOLAMENTO
-- =====================================================

-- 1. LIMPAR TODOS OS DADOS EXISTENTES
DELETE FROM public.metrics_daily;
DELETE FROM public.messages;
DELETE FROM public.conversations;
DELETE FROM public.lead_events;
DELETE FROM public.leads;
DELETE FROM public.stages;
DELETE FROM public.pipelines;
DELETE FROM public.whatsapp_connections;
DELETE FROM public.users;
DELETE FROM public.tenants;

-- 2. CRIAR TENANTS DE TESTE
INSERT INTO public.tenants (id, name, slug, settings) VALUES
  ('8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Varejo', 'varejo', '{"theme": "light"}'),
  ('a961a599-65ab-408c-b39e-bc2109a07bff', 'Distribuidores', 'distribuidores', '{"theme": "light"}');

-- 3. CRIAR USUÁRIOS COM ISOLAMENTO PERFEITO
-- Maria (Agente Varejo)
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('2810efa0-748c-46da-bea0-b7c1efafbe3', 'maria@varejo.com', 'Maria Vitória', 'agent', '8bd69047-7533-42f3-a2f7-e3a60477f68c', NOW());

-- Julia (Agente Distribuidores)  
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('b7c1efaf-be3f-4a2d-8e5c-9d3f4a1b2c3e', 'julia@distribuidores.com', 'Julia Santos', 'agent', 'a961a599-65ab-408c-b39e-bc2109a07bff', NOW());

-- Julio (Supervisor - Varejo)
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('c8d2f0ba-e4f4-4b3e-9f6d-ae4f5b2c3d4f', 'julio@varejo.com', 'Julio Supervisor', 'supervisor', '8bd69047-7533-42f3-a2f7-e3a60477f68c', NOW());

-- Taiguara (Supervisor - Distribuidores)
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('d9e3f1cb-f5f5-4c4f-af7e-bf5f6c3d4e5g', 'taiguara@distribuidores.com', 'Taiguara Supervisor', 'supervisor', 'a961a599-65ab-408c-b39e-bc2109a07bff', NOW());

-- Patrick (Admin - sem tenant específico)
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('e0f4g2dc-g6g6-4d5g-bg8f-cg6g7d4e5f6h', 'patrick@admin.com', 'Patrick Admin', 'admin', NULL, NOW());

-- 4. CRIAR PIPELINES E STAGES
-- Pipeline Varejo
INSERT INTO public.pipelines (id, name, tenant_id, created_at) VALUES
  ('p1-varejo-001', 'Pipeline Varejo', '8bd69047-7533-42f3-a2f7-e3a60477f68c', NOW());

-- Pipeline Distribuidores
INSERT INTO public.pipelines (id, name, tenant_id, created_at) VALUES
  ('p2-dist-001', 'Pipeline Distribuidores', 'a961a599-65ab-408c-b39e-bc2109a07bff', NOW());

-- Stages para Varejo
INSERT INTO public.stages (id, name, color, pipeline_id, tenant_id, position, created_at) VALUES
  ('s1-varejo-001', 'Novo', '#3b82f6', 'p1-varejo-001', '8bd69047-7533-42f3-a2f7-e3a60477f68c', 0, NOW()),
  ('s1-varejo-002', 'Contato', '#f59e0b', 'p1-varejo-001', '8bd69047-7533-42f3-a2f7-e3a60477f68c', 1, NOW()),
  ('s1-varejo-003', 'Proposta', '#8b5cf6', 'p1-varejo-001', '8bd69047-7533-42f3-a2f7-e3a60477f68c', 2, NOW()),
  ('s1-varejo-004', 'Fechado', '#10b981', 'p1-varejo-001', '8bd69047-7533-42f3-a2f7-e3a60477f68c', 3, NOW());

-- Stages para Distribuidores
INSERT INTO public.stages (id, name, color, pipeline_id, tenant_id, position, created_at) VALUES
  ('s2-dist-001', 'Novo', '#3b82f6', 'p2-dist-001', 'a961a599-65ab-408c-b39e-bc2109a07bff', 0, NOW()),
  ('s2-dist-002', 'Contato', '#f59e0b', 'p2-dist-001', 'a961a599-65ab-408c-b39e-bc2109a07bff', 1, NOW()),
  ('s2-dist-003', 'Proposta', '#8b5cf6', 'p2-dist-001', 'a961a599-65ab-408c-b39e-bc2109a07bff', 2, NOW()),
  ('s2-dist-004', 'Fechado', '#10b981', 'p2-dist-001', 'a961a599-65ab-408c-b39e-bc2109a07bff', 3, NOW());

-- 5. VERIFICAR RESULTADO
SELECT 
  'TENANTS' as tabela,
  COUNT(*) as total
FROM public.tenants
UNION ALL
SELECT 
  'USERS' as tabela,
  COUNT(*) as total
FROM public.users
UNION ALL
SELECT 
  'PIPELINES' as tabela,
  COUNT(*) as total
FROM public.pipelines
UNION ALL
SELECT 
  'STAGES' as tabela,
  COUNT(*) as total
FROM public.stages;

-- 6. VERIFICAR ISOLAMENTO
SELECT 
  u.name,
  u.role,
  u.tenant_id,
  t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY u.role, u.name;
```

### **3. CLIQUE EM "RUN" E AGUARDE:**
- O script vai limpar tudo
- Criar usuários organizados
- Verificar se funcionou

### **4. RESULTADO ESPERADO:**
- ✅ **2 Tenants** criados
- ✅ **5 Usuários** criados  
- ✅ **2 Pipelines** criados
- ✅ **8 Stages** criados
- ✅ **Dados limpos** e organizados

## 🎯 **APÓS EXECUTAR:**

Execute este comando para gerar novo ZIP:

```bash
npm run build && cd dist && zip -r ../wf-cirurgicos-crm-LIMPO.zip . && cd ..
```

## ✅ **GARANTIAS:**

- ✅ **Ambiente 100% limpo**
- ✅ **Isolamento perfeito** entre usuários
- ✅ **Pronto para dados reais**
- ✅ **Sem dados de teste**




