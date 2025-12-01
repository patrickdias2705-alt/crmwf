# 🔑 Guia para Obter Token do Chatwoot

## 📋 Passo a Passo para Obter o Access Token

### 1. **Acesse seu Chatwoot**
- Vá para: https://chatwoot-chatwoot.l0vghu.easypanel.host/
- Faça login com suas credenciais

### 2. **Navegue para API Tokens**
1. Clique no seu **avatar** (canto superior direito)
2. Selecione **Settings** (Configurações)
3. No menu lateral, clique em **API Tokens**

### 3. **Criar Novo Token**
1. Clique em **Add New Token**
2. Preencha os campos:
   - **Name**: `CRM Integration` (ou qualquer nome)
   - **Description**: `Token para integração com CRM`
3. Clique em **Create Token**

### 4. **Copiar o Token**
- **IMPORTANTE**: Copie o token imediatamente
- Ele só será mostrado uma vez
- Se perder, precisará criar um novo

### 5. **Verificar Account ID**
- O Account ID geralmente é `1` para a primeira conta
- Se não souber, está na URL: `/app/accounts/1/...`
- Ou vá em **Settings** → **Account** → **General**

## 🔧 Configuração no CRM

### 1. **Acessar a Integração**
1. Vá para **WhatsApp** no seu CRM
2. Clique no botão **Chatwoot** (primeiro botão)

### 2. **Inserir Credenciais**
- **URL do Chatwoot**: `https://chatwoot-chatwoot.l0vghu.easypanel.host`
- **Account ID**: `1`
- **Access Token**: Cole o token que você copiou

### 3. **Testar Conexão**
- Clique em **Conectar ao Chatwoot**
- Se der erro, verifique se o token está correto

## 🚨 Solução de Problemas

### **Erro: "Você precisa entrar ou se cadastrar"**
- O token está incorreto ou expirado
- Crie um novo token no Chatwoot
- Verifique se copiou o token completo

### **Erro: "Account not found"**
- Verifique se o Account ID está correto
- Geralmente é `1` para a primeira conta

### **Erro: "Unauthorized"**
- O token não tem permissões suficientes
- Crie um novo token com todas as permissões

## 📱 Configurar WhatsApp no Chatwoot

### 1. **Adicionar Canal WhatsApp**
1. No Chatwoot, vá em **Settings** → **Channels**
2. Clique em **Add Channel** → **WhatsApp**
3. Siga as instruções para conectar

### 2. **Conectar WhatsApp**
1. Escaneie o QR Code com seu WhatsApp
2. Aguarde a conexão ser estabelecida
3. Teste enviando uma mensagem

## ✅ Verificar se Está Funcionando

### 1. **No Chatwoot**
- Vá em **Conversations**
- Deve aparecer as conversas do WhatsApp

### 2. **No CRM**
- Clique em **Chatwoot**
- Deve carregar as conversas
- Deve permitir enviar mensagens

## 🎯 Próximos Passos

1. **Configurar Webhook** (opcional)
   - Para sincronização automática
   - Vá em Settings → Webhooks

2. **Personalizar Interface**
   - Adicionar campos customizados
   - Configurar automações

3. **Treinar Equipe**
   - Como usar a interface
   - Como responder mensagens

## 🆘 Ainda com Problemas?

Se ainda não conseguir conectar:

1. **Verifique o token**:
   - Está completo?
   - Foi criado recentemente?
   - Tem todas as permissões?

2. **Teste a API diretamente**:
   ```bash
   curl -H "Authorization: Bearer SEU_TOKEN" \
        https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/1/conversations
   ```

3. **Verifique o Account ID**:
   - Está na URL do Chatwoot
   - Ou em Settings → Account

4. **Contate o suporte**:
   - Se o problema persistir
   - Forneça os logs de erro

## 🎉 Sucesso!

Quando conseguir conectar, você terá:
- ✅ Todas as conversas do WhatsApp no CRM
- ✅ Interface unificada para responder
- ✅ Histórico completo de mensagens
- ✅ Sincronização em tempo real

**Agora você pode gerenciar todas as conversas do WhatsApp diretamente do seu CRM!** 🚀
