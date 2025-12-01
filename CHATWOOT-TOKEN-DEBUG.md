# 🔧 Debug do Token Chatwoot

## 🚨 Problema Atual
O token `HUYUHnVUAunUeAWpcUS8VWeK` está retornando erro 401 (Unauthorized).

## 🔍 Análise do Problema

### **Possíveis Causas:**
1. **Token Expirado** - Tokens do Chatwoot podem expirar
2. **Token Incorreto** - Pode ter sido copiado incorretamente
3. **Permissões Insuficientes** - Token pode não ter as permissões necessárias
4. **Configuração do Servidor** - Problema na configuração do Chatwoot
5. **Account ID Incorreto** - O Account ID pode não ser 1

## 🛠️ Solução Passo a Passo

### **Passo 1: Acessar o Chatwoot**
1. Vá para: https://chatwoot-chatwoot.l0vghu.easypanel.host/
2. Faça login com:
   - **Email**: `patrickdias2705@gmail.com`
   - **Senha**: `Polo2015`

### **Passo 2: Verificar Account ID**
1. Após fazer login, verifique a URL
2. Deve ser algo como: `/app/accounts/X/...`
3. O número X é o Account ID correto
4. Pode ser 1, 2, 3, etc.

### **Passo 3: Criar Novo Token**
1. No Chatwoot, clique no seu **avatar** (canto superior direito)
2. Selecione **Settings**
3. No menu lateral, clique em **API Tokens**
4. Clique em **Add New Token**
5. Preencha:
   - **Name**: `CRM Integration`
   - **Description**: `Token para integração com CRM`
6. Clique em **Create Token**

### **Passo 4: Copiar o Token**
1. **IMPORTANTE**: O token só aparece uma vez
2. Copie o token completo
3. Cole em um local seguro (notepad, etc.)

### **Passo 5: Testar no CRM**
1. Vá para **WhatsApp** → **Chatwoot**
2. Cole o novo token no campo "Access Token"
3. **ATUALIZE O ACCOUNT ID** se necessário
4. Clique em **Conectar ao Chatwoot**

## 🔍 Teste Manual

### **Teste 1: Verificar Token**
```bash
curl -H "Authorization: Bearer SEU_NOVO_TOKEN" \
     https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/1
```

### **Teste 2: Verificar com Account ID Diferente**
```bash
curl -H "Authorization: Bearer SEU_NOVO_TOKEN" \
     https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/2
```

### **Resposta Esperada:**
- **200**: Sucesso - dados da conta
- **401**: Token inválido - crie um novo
- **404**: Account ID incorreto

## 🚨 Se Ainda Não Funcionar

### **1. Verificar Account ID**
- O Account ID pode não ser `1`
- Verifique na URL: `/app/accounts/X/...`
- Ou em Settings → Account → General

### **2. Verificar Permissões**
- O token deve ter permissões de leitura e escrita
- Verifique se não há restrições de IP

### **3. Verificar URL**
- Certifique-se de que a URL está correta
- Deve ser: `https://chatwoot-chatwoot.l0vghu.easypanel.host`
- Sem barra no final

### **4. Verificar Configuração do Servidor**
Com base nas variáveis de ambiente:
- **FORCE_SSL=false** - SSL desabilitado
- **ENABLE_ACCOUNT_SIGNUP=true** - Cadastro habilitado
- **DEFAULT_LOCALE=pt_BR** - Português brasileiro

## 📱 Configurar WhatsApp no Chatwoot

### **Após Conectar com Sucesso:**
1. No Chatwoot, vá em **Settings** → **Channels**
2. Clique em **Add Channel** → **WhatsApp**
3. Siga as instruções para conectar
4. Escaneie o QR Code com seu WhatsApp

## ✅ Verificar se Está Funcionando

### **No Chatwoot:**
- Vá em **Conversations**
- Deve aparecer as conversas do WhatsApp

### **No CRM:**
- Clique em **Chatwoot**
- Deve carregar as conversas
- Deve permitir enviar mensagens

## 🆘 Ainda com Problemas?

### **1. Verificar Console do Navegador:**
- Pressione F12
- Vá na aba Console
- Procure por erros relacionados ao Chatwoot

### **2. Testar API Diretamente:**
- Use o botão "🔍 Diagnóstico Completo" no CRM
- Verifique o status da resposta

### **3. Verificar Logs do Servidor:**
- Acesse o painel do EasyPanel
- Verifique os logs do Chatwoot
- Procure por erros de autenticação

## 🎯 Próximos Passos

### **1. Conectar WhatsApp:**
- Adicionar canal WhatsApp no Chatwoot
- Escanear QR Code
- Testar envio de mensagens

### **2. Configurar Webhooks:**
- Para sincronização automática
- Vá em Settings → Webhooks

### **3. Personalizar Interface:**
- Adicionar campos customizados
- Configurar automações

## 🎉 Sucesso!

Quando conseguir conectar, você terá:
- ✅ Todas as conversas do WhatsApp no CRM
- ✅ Interface unificada para responder
- ✅ Histórico completo de mensagens
- ✅ Sincronização em tempo real

**Agora você pode gerenciar todas as conversas do WhatsApp diretamente do seu CRM!** 🚀

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique se o Chatwoot está funcionando corretamente
2. Teste o login no navegador
3. Verifique se o token foi criado corretamente
4. Entre em contato com o suporte do EasyPanel se necessário
