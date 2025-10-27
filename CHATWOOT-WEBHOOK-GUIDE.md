# 🔗 Guia Visual - Configurar Webhook no Chatwoot

## 🎯 **URL do Webhook (COLE ESTA URL):**

```
https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-webhook
```

## 📋 **Passo a Passo Visual:**

### **Passo 1: Acessar o Chatwoot**
1. Vá para: https://chatwoot-chatwoot.l0vghu.easypanel.host/
2. Faça login com:
   - **Email**: `patrickdias2705@gmail.com`
   - **Senha**: `Polo2015`

### **Passo 2: Ir para Integrações**
1. No menu lateral esquerdo, clique em **"Configurações"**
2. Clique em **"Integrações"**
3. Você verá uma lista de integrações disponíveis

### **Passo 3: Configurar Webhooks**
1. Clique no card **"Webhooks"** (primeiro da lista)
2. Clique no botão **"Configurar"**

### **Passo 4: Preencher o Formulário**
1. **URL do Webhook:**
   ```
   https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-webhook
   ```

2. **Eventos para se inscrever:**
   - ✅ `conversation.created` - Nova conversa criada
   - ✅ `conversation.updated` - Conversa atualizada
   - ✅ `message.created` - Nova mensagem criada
   - ✅ `message.updated` - Mensagem atualizada
   - ✅ `conversation.status_changed` - Status da conversa mudou
   - ✅ `conversation.assignee_changed` - Atribuição mudou

3. **Configurações adicionais:**
   - **Método HTTP**: `POST`
   - **Tipo de conteúdo**: `application/json`
   - **Ativo**: ✅ Sim

### **Passo 5: Salvar e Testar**
1. Clique em **"Salvar"** ou **"Criar"**
2. O Chatwoot deve mostrar uma mensagem de sucesso
3. O webhook deve aparecer na lista como "Ativo"

## 🧪 **Como Testar:**

### **Teste 1: Enviar Mensagem no WhatsApp**
1. Envie uma mensagem no WhatsApp
2. Deve aparecer automaticamente no CRM
3. Não precisa clicar em nada para atualizar

### **Teste 2: Responder do CRM**
1. Responda uma mensagem do CRM
2. Deve chegar no WhatsApp
3. Deve aparecer no Chatwoot

### **Teste 3: Verificar Sincronização**
1. Abra o CRM e o Chatwoot
2. Envie mensagens de ambos os lados
3. Deve sincronizar automaticamente

## ✅ **Verificar se Está Funcionando:**

### **No Chatwoot:**
1. Vá em **"Configurações"** → **"Integrações"**
2. Clique em **"Webhooks"**
3. Deve mostrar o webhook configurado
4. Deve ter status "Ativo" ou "Funcionando"

### **No CRM:**
1. Vá para **WhatsApp** → **Chatwoot**
2. Conecte com o token
3. Deve carregar as conversas automaticamente
4. Novas mensagens devem aparecer sozinhas

## 🚨 **Solução de Problemas:**

### **Webhook não está funcionando:**
1. Verifique se a URL está correta
2. Verifique se o Supabase está funcionando
3. Verifique os logs do Supabase
4. Teste a URL manualmente

### **Mensagens não aparecem:**
1. Verifique se o webhook está ativo
2. Verifique se os eventos estão selecionados
3. Verifique os logs do Chatwoot
4. Teste enviando uma mensagem

### **Erro 401/403:**
1. Verifique se o token está correto
2. Verifique se o Account ID está correto
3. Crie um novo token se necessário

## 🎉 **Resultado Final:**

Com o webhook configurado, você terá:

- ✅ **Sincronização em tempo real** - Tudo atualiza automaticamente
- ✅ **Experiência profissional** - Como um sistema comercial
- ✅ **Sem perda de mensagens** - Tudo fica salvo
- ✅ **Interface responsiva** - Atualiza sozinha
- ✅ **Todas as conversas do WhatsApp no CRM**
- ✅ **Pode responder mensagens diretamente do CRM**
- ✅ **Histórico completo de conversas**

## 🔗 **URL do Webhook (COPIAR):**

```
https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-webhook
```

**Agora é só colar essa URL no Chatwoot e configurar!** 🚀
