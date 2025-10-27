# 🔧 Solução de Problemas - Chatwoot Integration

## 🚨 Erro 401: "Token inválido ou expirado"

### **Causa:**
O token que você está usando não é válido ou expirou.

### **Solução:**
1. **Acesse seu Chatwoot:**
   - Vá para: https://chatwoot-chatwoot.l0vghu.easypanel.host/
   - Faça login com suas credenciais

2. **Crie um novo token:**
   - Clique no seu **avatar** (canto superior direito)
   - Selecione **Settings**
   - No menu lateral, clique em **API Tokens**
   - Clique em **Add New Token**
   - Preencha:
     - **Name**: `CRM Integration`
     - **Description**: `Token para integração com CRM`
   - Clique em **Create Token**

3. **Copie o token:**
   - **IMPORTANTE**: O token só aparece uma vez
   - Copie o token completo
   - Cole no campo "Access Token" no CRM

4. **Teste a conexão:**
   - Clique em "Conectar ao Chatwoot"
   - Se ainda der erro, verifique se copiou o token completo

## 🔍 Verificar se o Token está Correto

### **Teste manual:**
```bash
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" \
     https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/1/conversations
```

### **Resposta esperada:**
- **Sucesso**: Lista de conversas em JSON
- **Erro 401**: Token inválido
- **Erro 404**: Account ID incorreto

## 📋 Checklist de Verificação

### ✅ **URL do Chatwoot:**
- [ ] Está correta: `https://chatwoot-chatwoot.l0vghu.easypanel.host`
- [ ] Não tem barra no final
- [ ] Usa HTTPS

### ✅ **Account ID:**
- [ ] Geralmente é `1` para a primeira conta
- [ ] Pode ser verificado na URL: `/app/accounts/1/...`
- [ ] Ou em Settings → Account → General

### ✅ **Access Token:**
- [ ] Foi criado recentemente
- [ ] Foi copiado completamente
- [ ] Não tem espaços extras
- [ ] Tem pelo menos 20 caracteres

## 🛠️ Passos Detalhados para Criar Token

### 1. **Login no Chatwoot**
- Acesse: https://chatwoot-chatwoot.l0vghu.easypanel.host/
- Use suas credenciais de login

### 2. **Navegar para API Tokens**
- Clique no seu **avatar** (canto superior direito)
- Selecione **Settings** (Configurações)
- No menu lateral esquerdo, clique em **API Tokens**

### 3. **Criar Novo Token**
- Clique em **Add New Token** (Adicionar Novo Token)
- Preencha os campos:
  - **Name**: `CRM Integration`
  - **Description**: `Token para integração com CRM`
- Clique em **Create Token** (Criar Token)

### 4. **Copiar Token**
- **ATENÇÃO**: O token só aparece uma vez
- Copie o token completo
- Cole em um local seguro (notepad, etc.)
- Cole no campo "Access Token" no CRM

## 🔄 Testando a Conexão

### **No CRM:**
1. Vá para **WhatsApp** → **Chatwoot**
2. Verifique se os campos estão preenchidos:
   - URL: `https://chatwoot-chatwoot.l0vghu.easypanel.host`
   - Account ID: `1`
   - Access Token: (seu token)
3. Clique em **Conectar ao Chatwoot**
4. Aguarde o resultado

### **Possíveis resultados:**
- ✅ **Sucesso**: "Conectado! X conversas encontradas"
- ❌ **Erro 401**: Token inválido - crie um novo
- ❌ **Erro 404**: Account ID incorreto
- ❌ **Erro de rede**: URL incorreta

## 🆘 Ainda com Problemas?

### **1. Verifique o Console do Navegador:**
- Pressione F12
- Vá na aba Console
- Procure por erros relacionados ao Chatwoot

### **2. Teste a API diretamente:**
```bash
# Teste básico
curl -H "Authorization: Bearer SEU_TOKEN" \
     https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/1

# Teste de conversas
curl -H "Authorization: Bearer SEU_TOKEN" \
     https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/1/conversations
```

### **3. Verifique as permissões:**
- O token deve ter permissões de leitura e escrita
- Verifique se não há restrições de IP
- Confirme se a conta tem acesso à API

### **4. Contate o suporte:**
- Se o problema persistir
- Forneça os logs de erro
- Inclua o token (se necessário)

## 🎯 Próximos Passos Após Conectar

### **1. Configurar WhatsApp:**
- No Chatwoot, vá em **Settings** → **Channels**
- Adicione o canal **WhatsApp**
- Escaneie o QR Code

### **2. Testar a integração:**
- Envie uma mensagem no WhatsApp
- Verifique se aparece no Chatwoot
- Teste responder do CRM

### **3. Configurar webhooks (opcional):**
- Para sincronização automática
- Vá em Settings → Webhooks
- Adicione a URL do webhook

## ✅ Sucesso!

Quando conseguir conectar, você terá:
- ✅ Todas as conversas do WhatsApp no CRM
- ✅ Interface unificada para responder
- ✅ Histórico completo de mensagens
- ✅ Sincronização em tempo real

**Agora você pode gerenciar todas as conversas do WhatsApp diretamente do seu CRM!** 🚀
