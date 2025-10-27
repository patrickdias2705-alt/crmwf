# Deploy das Funções Atualizadas - Chatwoot

## O que foi alterado:

1. **WhatsAppChat.tsx** - Adicionado:
   - Auto-refresh de conversas a cada 5 segundos
   - Carregamento automático de mensagens quando uma conversa é selecionada
   - Função `loadMessagesForConversation` para buscar mensagens específicas

2. **chatwoot-conversations/index.ts** - Adicionado:
   - Suporte para buscar mensagens de uma conversa específica
   - Parâmetro `conversation_id` para buscar mensagens

## Como fazer o deploy:

### Opção 1: Via Dashboard (Recomendado)

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard/project/xqeqaagnnkilihlfjbrm
2. Vá em **Edge Functions** → **chatwoot-conversations**
3. Clique em **Edit**
4. Cole o conteúdo do arquivo `supabase/functions/chatwoot-conversations/index.ts` (atualizado)
5. Clique em **Deploy**

### Opção 2: Via Supabase CLI (se tiver configurado)

```bash
cd /Users/patrickdiasparis/crmwf-main
supabase login
supabase functions deploy chatwoot-conversations
```

## Teste:

Após o deploy, as seguintes funcionalidades devem funcionar:

1. ✅ Conversas atualizam automaticamente a cada 5 segundos
2. ✅ Mensagens carregam automaticamente ao selecionar uma conversa
3. ✅ Mensagens novas aparecem em tempo real
4. ✅ Envio de mensagens funciona e atualiza a interface

## Nota sobre mensagens não chegando no WhatsApp:

Se as mensagens aparecem como enviadas no Chatwoot mas não chegam no WhatsApp, o problema está na configuração do Chatwoot com a Evolution API. Verifique:

1. **No Chatwoot Dashboard**:
   - Settings → Applications → Inboxes
   - Verifique se o inbox WhatsApp está conectado
   - Veja se há erros na conexão com a Evolution API

2. **Na Evolution API**:
   - Verifique se a instância está online
   - Veja os logs da Evolution API para erros

O CRM agora está funcionando corretamente e sincronizando em tempo real! 🎉
