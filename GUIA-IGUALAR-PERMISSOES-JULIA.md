# 🔐 Igualar Permissões da Julia com Maria e Elaine

## 🎯 Objetivo
Dar todas as permissões para a usuária **Julia** para que ela possa fazer as mesmas coisas que **Maria** e **Elaine**.

## 📋 O que este script faz:

1. **Verifica permissões atuais** de Maria, Elaine e Julia
2. **Identifica o role** de Maria e Elaine
3. **Atualiza Julia** para ter o mesmo role
4. **Garante que `user_roles`** está configurado corretamente
5. **Mostra comparação final** entre as três usuárias

## 🚀 Como aplicar:

### **Passo 1: Acessar Supabase**
1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**

### **Passo 2: Executar o script**
1. Abra o arquivo `IGUALAR-PERMISSOES-JULIA-MARIA-ELAINE.sql`
2. Cole todo o conteúdo no **SQL Editor**
3. Clique em **Run** ou pressione **Cmd/Ctrl + Enter**

### **Passo 3: Verificar resultado**
O script mostrará:
- ✅ Permissões atuais de cada usuária
- ✅ Role de Maria e Elaine (para copiar)
- ✅ Atualização aplicada em Julia
- ✅ Comparação final entre as três

## 🔍 O que será atualizado:

### **Tabela `users`:**
- `role`: Atualizado para o mesmo role de Maria/Elaine
- `active`: Garantido como `true`
- `updated_at`: Atualizado para agora

### **Tabela `user_roles`:**
- `role`: Criado/atualizado para o mesmo role de Maria/Elaine
- Garante que as políticas RLS funcionem corretamente

## 📊 Roles disponíveis:

- **`agent`**: Agente (pode gerenciar seus próprios leads)
- **`supervisor`**: Supervisor (pode ver todos os leads do tenant)
- **`manager`**: Gerente (pode gerenciar pipelines)
- **`admin`**: Administrador (acesso total)
- **`client_owner`**: Proprietário do cliente
- **`viewer`**: Visualizador (somente leitura)

## ✅ Resultado esperado:

Após executar o script, Julia terá:
- ✅ Mesmo `role` que Maria e Elaine
- ✅ Mesmo `role` na tabela `user_roles`
- ✅ Status `active = true`
- ✅ Mesmas permissões de acesso

## 🔒 Permissões que Julia terá:

Dependendo do role de Maria/Elaine, Julia poderá:
- ✅ Ver leads do seu tenant
- ✅ Criar novos leads
- ✅ Atualizar leads
- ✅ Criar orçamentos
- ✅ Marcar como vendido
- ✅ Ver métricas
- ✅ Ver pipelines e stages
- ✅ (Se supervisor/admin) Ver todos os leads do tenant

## ⚠️ Importante:

- O script procura por emails que contenham "maria", "elaine" ou "julia"
- Se houver múltiplas usuárias com esses nomes, o script pegará a primeira encontrada
- O script é **seguro** e não apaga dados, apenas atualiza permissões

## 🐛 Troubleshooting:

### **Erro: "Julia não encontrada"**
- Verifique se o email da Julia contém "julia" ou se o nome contém "Julia"
- Execute o PASSO 2 do script para verificar qual é o email exato

### **Erro: "Maria/Elaine não encontradas"**
- Verifique se existem usuárias com esses nomes no banco
- Execute o PASSO 1 do script para ver todas as usuárias

### **Permissões ainda diferentes**
- Verifique se o script foi executado completamente
- Execute o PASSO 8 para ver a comparação final
- Verifique se há políticas RLS específicas bloqueando acesso

