# 🏢 Mover Julia para Tenant "Distribuidor"

## 🎯 Objetivo
Mover a Julia (`juliawf@gmail.com`) para a tenant **"Distribuidor"** que já existe, separando-a do Varejo.

## 🚨 Problema Atual
A Julia está compartilhando a tenant do **Varejo** com outras pessoas (Maria, Elaine, etc.), causando:
- ❌ Mistura de dados no painel
- ❌ Leads aparecendo para todos
- ❌ Orçamentos visíveis para todos
- ❌ Vendas compartilhadas

## ✅ Solução
O script `MOVER-JULIA-PARA-DISTRIBUIDOR.sql` move a Julia para a tenant **"Distribuidor"** existente.

## 📋 O que o script faz:

1. **Verifica situação atual** da Julia
2. **Verifica tenant "Distribuidor"** (cria se não existir)
3. **Move a Julia** para a tenant "Distribuidor"
4. **Move dados da Julia** (leads, orçamentos, vendas) para a tenant "Distribuidor"
5. **Configura user_role** corretamente
6. **Verifica isolamento** completo
7. **Confirma que Julia não está mais no Varejo**

## 🚀 Como aplicar:

### **Passo 1: Acessar Supabase**
1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**

### **Passo 2: Executar o script**
1. Abra o arquivo `MOVER-JULIA-PARA-DISTRIBUIDOR.sql`
2. Cole todo o conteúdo no **SQL Editor**
3. Clique em **Run** ou pressione **Cmd/Ctrl + Enter**

### **Passo 3: Verificar resultado**
O script mostrará:
- ✅ Situação atual da Julia
- ✅ Tenant "Distribuidor" verificada
- ✅ Julia movida para "Distribuidor"
- ✅ Dados movidos (leads, orçamentos, vendas)
- ✅ Status de isolamento
- ✅ Confirmação que Julia não está mais no Varejo

## 🔍 O que será feito:

### **Tenant "Distribuidor":**
- ✅ Verificada (criada se não existir)
- ✅ Julia será movida para ela
- ✅ Dados da Julia serão movidos

### **Dados Movidos:**
- ✅ Leads da Julia
- ✅ Orçamentos da Julia
- ✅ Vendas da Julia

## ✅ Resultado esperado:

Após executar o script, você verá:
```
✅ JULIA MOVIDA PARA DISTRIBUIDOR
✅ SUCESSO: Julia está no Distribuidor e isolada do Varejo!
```

E a Julia terá:
- ✅ Tenant "Distribuidor" (separada do Varejo)
- ✅ Dados isolados
- ✅ Painel separado

## 🔒 Isolamento Garantido:

Após executar o script:
- ✅ Julia **NÃO** verá dados do Varejo (Maria/Elaine)
- ✅ Maria/Elaine **NÃO** verão dados da Julia
- ✅ Cada uma terá seu próprio painel
- ✅ Dados completamente separados

## 📊 Verificação:

O script mostra:
- Total de usuários na tenant "Distribuidor"
- Total de leads, orçamentos e vendas da Julia
- Comparação entre tenants (Varejo vs Distribuidor)
- Confirmação que Julia não está mais no Varejo

## ⚠️ Importante:

- O script **move** os dados da Julia para a tenant "Distribuidor"
- Se a Julia já tiver dados no Varejo, eles serão movidos
- A Julia precisará fazer **logout e login** após executar o script
- A tenant "Distribuidor" será usada (não cria nova)

## 🔄 Após executar:

1. **Faça logout** da Julia (se estiver logada)
2. **Faça login novamente** com `juliawf@gmail.com`
3. **Verifique** que o painel está separado
4. **Confirme** que não vê dados do Varejo

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
- `tenant_name` = "Distribuidor"
- `total_usuarios` = número de usuários na tenant "Distribuidor"

