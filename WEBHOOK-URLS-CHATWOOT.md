# 🔗 URLs do Webhook - Chatwoot

## 🎯 **URLs PRONTAS PARA USAR:**

### **Opção 1: Servidor Local (DESENVOLVIMENTO)**
```
http://localhost:3001/webhook/chatwoot
```

### **Opção 2: Servidor Local com IP da Rede**
```
http://192.168.1.4:3001/webhook/chatwoot
```

### **Opção 3: Servidor Público (PRODUÇÃO)**
```
https://seu-dominio.com/webhook/chatwoot
```

## 🚀 **Como Iniciar o Servidor de Webhook:**

### **Método 1: Iniciar Manualmente**
```bash
node webhook-server.js
```

### **Método 2: Usar o Script**
```bash
node start-webhook-server.js
```

### **Método 3: Adicionar ao package.json**
```json
{
  "scripts": {
    "webhook": "node webhook-server.js",
    "webhook:start": "node start-webhook-server.js"
  }
}
```

## 📋 **Configuração no Chatwoot:**

### **Passo 1: Acessar o Chatwoot**
1. Vá para: https://chatwoot-chatwoot.l0vghu.easypanel.host/
2. Login: `patrickdias2705@gmail.com` / `Polo2015`

### **Passo 2: Configurar Webhook**
1. Vá em: **Configurações** → **Integrações** → **Webhooks**
2. Clique em: **"Configurar"**
3. **URL do Webhook:** Cole uma das URLs acima
4. **Eventos para selecionar:**
   - ✅ `conversation.created`
   - ✅ `conversation.updated`
   - ✅ `message.created`
   - ✅ `message.updated`
   - ✅ `conversation.status_changed`
   - ✅ `conversation.assignee_changed`
5. Clique em: **"Salvar"**

## 🧪 **Testar o Webhook:**

### **Teste 1: Verificar se o servidor está rodando**
```bash
curl http://localhost:3001/health
```

### **Teste 2: Enviar webhook de teste**
```bash
curl -X POST "http://localhost:3001/webhook/chatwoot" \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"message": "Teste de webhook"}}'
```

### **Teste 3: Verificar logs**
O servidor mostrará logs no console quando receber webhooks.

## 🌐 **Para Usar em Produção:**

### **Opção 1: Deploy no Vercel**
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### **Opção 2: Deploy no Railway**
1. Conecte seu repositório ao Railway
2. Configure as variáveis de ambiente
3. Deploy automático

### **Opção 3: Deploy no Heroku**
1. Conecte seu repositório ao Heroku
2. Configure as variáveis de ambiente
3. Deploy automático

### **Opção 4: Servidor Próprio**
1. Configure um servidor VPS
2. Instale Node.js
3. Execute o servidor de webhook
4. Configure um domínio

## 🔧 **Variáveis de Ambiente:**

Crie um arquivo `.env` com:
```env
SUPABASE_URL=https://xqeqaagnnkilihlfjbrm.supabase.co
SUPABASE_ANON_KEY=sua_chave_aqui
PORT=3001
```

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

## 🎉 **Resultado Final:**

Com o webhook configurado, você terá:
- ✅ **Sincronização em tempo real** - Tudo atualiza automaticamente
- ✅ **Experiência profissional** - Como um sistema comercial
- ✅ **Sem perda de mensagens** - Tudo fica salvo
- ✅ **Interface responsiva** - Atualiza sozinha

## 🚀 **Próximos Passos:**

1. **Inicie o servidor de webhook** (use um dos métodos acima)
2. **Configure o webhook no Chatwoot** (use uma das URLs)
3. **Teste enviando mensagens no WhatsApp**
4. **Verifique se está sincronizando no CRM**

**Agora você tem URLs prontas para colar no Chatwoot!** 🚀
