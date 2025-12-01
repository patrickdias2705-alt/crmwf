# 🔧 Corrigir Login da Julia (juliawf@gmail.com)

## 🚨 Problema
Ao tentar acessar com `juliawf@gmail.com`, aparece o erro:
> **"Erro ao carregar dados do usuário"**
> 
> "Sua sessão está ativa, mas não foi possível carregar seus dados. Isso pode acontecer se seu usuário não estiver ativo ou não tiver um tenant associado."

## ✅ Solução
Execute o script SQL `CORRIGIR-JULIA-LOGIN-COMPLETO.sql` no Supabase.

## 📋 O que o script faz:

1. **Verifica situação atual** da Julia em `auth.users` e `public.users`
2. **Identifica o tenant_id** de Maria ou Elaine (para copiar)
3. **Cria/atualiza Julia** em `public.users` se não existir
4. **Garante que está ativa** (`active = true`)
5. **Associa ao mesmo tenant** de Maria/Elaine
6. **Configura user_role** corretamente
7. **Mostra resultado final** com status

## 🚀 Como aplicar:

### **Passo 1: Acessar Supabase**
1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**

### **Passo 2: Executar o script**
1. Abra o arquivo `CORRIGIR-JULIA-LOGIN-COMPLETO.sql`
2. Cole todo o conteúdo no **SQL Editor**
3. Clique em **Run** ou pressione **Cmd/Ctrl + Enter**

### **Passo 3: Verificar resultado**
O script mostrará:
- ✅ Situação atual da Julia
- ✅ Tenant de Maria/Elaine (para copiar)
- ✅ Resultado final com status
- ✅ Comparação entre Julia, Maria e Elaine

## 🔍 O que será corrigido:

### **Se Julia não existe em `public.users`:**
- ✅ Criará registro com mesmo `tenant_id` de Maria/Elaine
- ✅ Definirá `role` igual ao de Maria/Elaine
- ✅ Ativará usuário (`active = true`)

### **Se Julia já existe mas está incorreta:**
- ✅ Atualizará `tenant_id` para o mesmo de Maria/Elaine
- ✅ Garantirá que está `active = true`
- ✅ Atualizará `role` se necessário
- ✅ Criará/atualizará `user_role`

## ✅ Resultado esperado:

Após executar o script, você verá:
```
✅ TUDO OK - Login deve funcionar!
```

E Julia terá:
- ✅ Registro em `public.users`
- ✅ `tenant_id` igual ao de Maria/Elaine
- ✅ `active = true`
- ✅ `user_role` configurado
- ✅ Mesmas permissões de Maria/Elaine

## 🔄 Após executar:

1. **Faça logout** da Julia (se estiver logada)
2. **Faça login novamente** com `juliawf@gmail.com`
3. **Verifique** se o erro desapareceu

## ⚠️ Se ainda não funcionar:

1. Verifique se o email está correto: `juliawf@gmail.com`
2. Verifique se o email está confirmado em `auth.users`
3. Execute o script novamente
4. Verifique os logs do script para ver o status

## 📊 Verificação manual:

Execute no SQL Editor:
```sql
SELECT 
    u.email,
    u.name,
    u.active,
    u.role,
    u.tenant_id,
    t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'juliawf@gmail.com';
```

Deve retornar:
- `active = true`
- `tenant_id` não nulo
- `role` definido (ex: 'agent')

