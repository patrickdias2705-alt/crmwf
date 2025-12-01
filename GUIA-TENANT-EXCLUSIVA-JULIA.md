# 🏢 Criar Tenant Exclusiva para Julia

## 🎯 Objetivo
Criar uma tenant **exclusiva** para a Julia para que ela não compartilhe o painel com outras pessoas (Maria, Elaine, etc.).

## 🚨 Problema Atual
A Julia está compartilhando a mesma tenant do **Varejo** com outras pessoas, causando:
- ❌ Mistura de dados no painel
- ❌ Leads aparecendo para todos
- ❌ Orçamentos visíveis para todos
- ❌ Vendas compartilhadas

## ✅ Solução
O script `CRIAR-TENANT-EXCLUSIVA-JULIA.sql` cria uma tenant **exclusiva** para a Julia.

## 📋 O que o script faz:

1. **Verifica situação atual** da Julia
2. **Cria nova tenant** exclusiva chamada "Julia - Exclusiva"
3. **Move a Julia** para a nova tenant
4. **Move dados da Julia** (leads, orçamentos, vendas) para a nova tenant
5. **Cria pipeline padrão** com stages para a nova tenant
6. **Configura user_role** corretamente
7. **Verifica isolamento** completo

## 🚀 Como aplicar:

### **Passo 1: Acessar Supabase**
1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**

### **Passo 2: Executar o script**
1. Abra o arquivo `CRIAR-TENANT-EXCLUSIVA-JULIA.sql`
2. Cole todo o conteúdo no **SQL Editor**
3. Clique em **Run** ou pressione **Cmd/Ctrl + Enter**

### **Passo 3: Verificar resultado**
O script mostrará:
- ✅ Situação atual da Julia
- ✅ Nova tenant criada
- ✅ Julia movida para nova tenant
- ✅ Dados movidos (leads, orçamentos, vendas)
- ✅ Pipeline criado
- ✅ Status de isolamento

## 🔍 O que será criado:

### **Nova Tenant:**
- **Nome**: "Julia - Exclusiva"
- **Plan**: "free"
- **Usuários**: Apenas Julia

### **Pipeline Padrão:**
- Pipeline com 6 stages:
  - Lead novo
  - Atendido
  - Agendado
  - Fechado
  - Recusado
  - Perdido

### **Dados Movidos:**
- ✅ Leads da Julia
- ✅ Orçamentos da Julia
- ✅ Vendas da Julia

## ✅ Resultado esperado:

Após executar o script, você verá:
```
✅ TENANT EXCLUSIVA - Apenas Julia
```

E a Julia terá:
- ✅ Tenant própria e exclusiva
- ✅ Apenas ela na tenant
- ✅ Dados isolados
- ✅ Pipeline próprio
- ✅ Painel separado

## 🔒 Isolamento Garantido:

Após executar o script:
- ✅ Julia **NÃO** verá dados de Maria/Elaine
- ✅ Maria/Elaine **NÃO** verão dados da Julia
- ✅ Cada uma terá seu próprio painel
- ✅ Dados completamente separados

## 📊 Verificação:

O script mostra:
- Total de usuários na tenant da Julia (deve ser 1)
- Total de leads, orçamentos e vendas
- Comparação com outras tenants

## ⚠️ Importante:

- O script **move** os dados da Julia para a nova tenant
- Se a Julia já tiver dados no Varejo, eles serão movidos
- A Julia precisará fazer **logout e login** após executar o script
- A nova tenant será completamente isolada

## 🔄 Após executar:

1. **Faça logout** da Julia (se estiver logada)
2. **Faça login novamente** com `juliawf@gmail.com`
3. **Verifique** que o painel está separado
4. **Confirme** que não vê dados de outras pessoas

## 📊 Verificação manual:

Execute no SQL Editor:
```sql
SELECT 
    u.name,
    u.email,
    t.name as tenant_name,
    (SELECT COUNT(*) FROM public.users WHERE tenant_id = u.tenant_id) as total_usuarios
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'juliawf@gmail.com';
```

Deve retornar:
- `tenant_name` = "Julia - Exclusiva"
- `total_usuarios` = 1 (apenas Julia)

