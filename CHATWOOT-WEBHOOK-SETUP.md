# 🔗 Configuração de Webhooks - Chatwoot

## 🎯 **Por que Webhooks são importantes?**

### **Sem Webhooks (API apenas):**
- ❌ Precisa ficar clicando para ver novas mensagens
- ❌ Não atualiza automaticamente
- ❌ Pode perder mensagens importantes
- ❌ Experiência ruim para o usuário

### **Com Webhooks:**
- ✅ Atualiza automaticamente em tempo real
- ✅ Recebe novas mensagens instantaneamente
- ✅ Sincroniza tudo automaticamente
- ✅ Experiência profissional

## 🛠️ **Configuração Passo a Passo**

### **Passo 1: Acessar o Chatwoot**
1. Vá para: https://chatwoot-chatwoot.l0vghu.easypanel.host/
2. Faça login com:
   - **Email**: `patrickdias2705@gmail.com`
   - **Senha**: `Polo2015`

### **Passo 2: Ir para Integrações**
1. No menu lateral, clique em **"Configurações"**
2. Clique em **"Integrações"**
3. Você verá uma lista de integrações disponíveis

### **Passo 3: Configurar Webhooks**
1. Clique em **"Webhooks"** (primeiro card da lista)
2. Clique em **"Configurar"**
3. Preencha os campos:

#### **URL do Webhook:**
```
https://seu-projeto.supabase.co/functions/v1/chatwoot-webhook
```

#### **Eventos para se inscrever:**
- ✅ `conversation.created` - Nova conversa criada
- ✅ `conversation.updated` - Conversa atualizada
- ✅ `message.created` - Nova mensagem criada
- ✅ `message.updated` - Mensagem atualizada

#### **Configurações adicionais:**
- **Método HTTP**: `POST`
- **Tipo de conteúdo**: `application/json`
- **Ativo**: ✅ Sim

### **Passo 4: Testar o Webhook**
1. Clique em **"Salvar"** ou **"Criar"**
2. O Chatwoot deve mostrar uma mensagem de sucesso
3. Teste enviando uma mensagem no WhatsApp

## 🔧 **Configuração Técnica**

### **URL do Webhook:**
```
https://seu-projeto.supabase.co/functions/v1/chatwoot-webhook
```

**Substitua `seu-projeto` pela URL do seu projeto Supabase.**

### **Eventos Suportados:**
- `conversation.created` - Nova conversa
- `conversation.updated` - Conversa atualizada
- `message.created` - Nova mensagem
- `message.updated` - Mensagem atualizada
- `conversation.status_changed` - Status da conversa mudou
- `conversation.assignee_changed` - Atribuição mudou

### **Estrutura do Payload:**
```json
{
  "event": "message.created",
  "data": {
    "id": 123,
    "conversation_id": 456,
    "content": "Olá, como posso ajudar?",
    "message_type": "incoming",
    "sender": {
      "id": 789,
      "name": "João Silva"
    },
    "created_at": "2024-12-24T10:30:00Z"
  }
}
```

## 🚀 **Como Funciona**

### **1. Nova Mensagem Chega:**
1. Cliente envia mensagem no WhatsApp
2. Chatwoot recebe a mensagem
3. Chatwoot envia webhook para o CRM
4. CRM salva a mensagem no banco
5. Interface atualiza automaticamente

### **2. Agente Responde:**
1. Agente responde no CRM
2. CRM envia mensagem via API do Chatwoot
3. Chatwoot envia para o WhatsApp
4. Cliente recebe a mensagem

### **3. Sincronização:**
1. Tudo fica sincronizado automaticamente
2. Não precisa ficar clicando para atualizar
3. Experiência em tempo real

## ✅ **Verificar se Está Funcionando**

### **No Chatwoot:**
1. Vá em **"Configurações"** → **"Integrações"**
2. Clique em **"Webhooks"**
3. Deve mostrar o webhook configurado
4. Deve ter um status "Ativo" ou "Funcionando"

### **No CRM:**
1. Vá para **WhatsApp** → **Chatwoot**
2. Conecte com o token
3. Envie uma mensagem de teste
4. Deve aparecer automaticamente

### **Teste Manual:**
1. Envie uma mensagem no WhatsApp
2. Deve aparecer no CRM automaticamente
3. Responda do CRM
4. Deve chegar no WhatsApp

## 🆘 **Solução de Problemas**

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

## 🎉 **Resultado Final**

Com os webhooks configurados, você terá:

- ✅ **Sincronização em tempo real** - Tudo atualiza automaticamente
- ✅ **Experiência profissional** - Como um sistema comercial
- ✅ **Sem perda de mensagens** - Tudo fica salvo
- ✅ **Interface responsiva** - Atualiza sozinha

## 📱 **Próximos Passos**

1. **Configurar webhooks** (este guia)
2. **Conectar WhatsApp** no Chatwoot
3. **Testar integração** completa
4. **Personalizar interface** se necessário

**Agora você terá uma integração completa e profissional!** 🚀
