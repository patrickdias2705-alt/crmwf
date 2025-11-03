# 🔗 Como Configurar o CRM como App no Chatwoot

## ⚠️ **PROBLEMA:**
Você tentou adicionar o CRM do Vercel como "aplicativo" no Chatwoot mas deu recusado.

## ✅ **SOLUÇÃO:**

### **PASSO 1: Obter Token de API (Não App, mas TOKEN)**

O Chatwoot não precisa de "apps" externos. Ele usa **API Tokens** para integração.

1. Acesse: https://chatwoot-chatwoot.l0vghu.easypanel.host/
2. Login: `patrickdias2705@gmail.com` / `Polo2015`
3. Vá em: **Configurações** → **API Tokens**
4. Clique em: **"+ Adicionar novo"** ou **"Create New Token"**
5. Preencha:
   - **Nome**: "CRM Integration"
   - **Tipo**: Deixe como está (Access Token)
6. Clique em: **"Salvar"**
7. **COPIE O TOKEN** (ele aparece uma única vez!)

### **PASSO 2: Usar o Token no CRM**

O token que já está configurado no CRM é:
```
HUYUHnVUAunUeAWpcUS8VWeK
```

Este token já está funcionando perfeitamente.

### **PASSO 3: URL do CRM no Chatwoot**

Se você quer que o Chatwoot "conheça" seu CRM:

#### **Não use "Apps" no Chatwoot** - Use **CALLBACK URLs**

1. No Chatwoot, vá em: **Configurações** → **Integrações**
2. Role até **"OAuth Apps"** ou **"Connected Apps"**
3. Adicione a URL do CRM:
   ```
   https://crmwf.vercel.app
   ```
4. **Domínios permitidos:**
   ```
   crmwf.vercel.app
   ```

### **PASSO 4: Verificar se o Token Está Funcionando**

Para testar se o token está funcionando:

```bash
curl -X GET "https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/1/inboxes" \
  -H "api_access_token: HUYUHnVUAunUeAWpcUS8VWeK"
```

Se retornar JSON, está funcionando! ✅

## 🎯 **RESUMO:**

- ❌ **NÃO** configure como "App" no Chatwoot
- ✅ **JÁ está** usando API Token (HUYUHnVUAunUeAWpcUS8VWeK)
- ✅ O token **JÁ funciona** perfeitamente
- ✅ O CRM do Vercel **JÁ está** configurado

## 🔧 **O QUE FAZER SE AINDA DAR ERRO:**

1. Veja o erro completo no console do navegador (F12)
2. Verifique se a URL do Chatwoot está correta
3. Confirme que o token ainda está ativo no Chatwoot

## 📝 **NOTA:**

O Chatwoot **NÃO bloqueia requisições** baseado na origem. Ele verifica apenas:
1. ✅ Token válido
2. ✅ Account ID correto
3. ✅ Permissões adequadas

Se você está vendo mensagens em tempo real, significa que **ESTÁ FUNCIONANDO PERFEITAMENTE**! 🎉

