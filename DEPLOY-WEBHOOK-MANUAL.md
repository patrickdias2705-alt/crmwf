# 🚀 Deploy Manual do Webhook - Chatwoot

## ⚠️ **IMPORTANTE: O webhook precisa ser deployado no Supabase**

O webhook que você configurou no Chatwoot está apontando para:
```
https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-webhook
```

Mas a função ainda não foi deployada no Supabase. Vou te mostrar como fazer isso.

## 🔧 **Opção 1: Deploy via Supabase Dashboard (MAIS FÁCIL)**

### **Passo 1: Acessar o Supabase Dashboard**
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `xqeqaagnnkilihlfjbrm`

### **Passo 2: Ir para Functions**
1. No menu lateral, clique em **"Functions"**
2. Clique em **"Create a new function"**

### **Passo 3: Configurar a Função**
1. **Function Name**: `chatwoot-webhook`
2. **Template**: `HTTP Request`
3. **Language**: `TypeScript`

### **Passo 4: Colar o Código**
Cole este código na função:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse webhook payload
    const payload = await req.json()
    console.log('📨 Webhook recebido do Chatwoot:', JSON.stringify(payload, null, 2))

    // Handle different webhook events
    switch (payload.event) {
      case 'conversation.created':
        await handleConversationCreated(supabaseClient, payload)
        break
      
      case 'conversation.updated':
        await handleConversationUpdated(supabaseClient, payload)
        break
      
      case 'message.created':
        await handleMessageCreated(supabaseClient, payload)
        break
      
      case 'message.updated':
        await handleMessageUpdated(supabaseClient, payload)
        break
      
      default:
        console.log('⚠️ Evento não tratado:', payload.event)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processado com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Handle conversation created
async function handleConversationCreated(supabaseClient: any, payload: any) {
  const conversation = payload.data
  console.log('💬 Nova conversa criada:', conversation.id)

  try {
    const { error } = await supabaseClient
      .from('chatwoot_conversations')
      .upsert({
        id: conversation.id,
        account_id: conversation.account_id,
        status: conversation.status,
        contact_id: conversation.contact?.id,
        contact_name: conversation.contact?.name,
        contact_phone: conversation.contact?.phone_number,
        channel_type: conversation.meta?.channel,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_activity_at: conversation.last_activity_at,
        unread_count: conversation.unread_count,
        priority: conversation.priority,
        assignee_id: conversation.assignee?.id,
        team_id: conversation.team?.id,
        labels: conversation.labels || [],
        custom_attributes: conversation.custom_attributes || {},
        snoozed_until: conversation.snoozed_until,
        raw_data: conversation
      })

    if (error) {
      console.error('❌ Erro ao salvar conversa:', error)
    } else {
      console.log('✅ Conversa salva com sucesso')
    }
  } catch (error) {
    console.error('❌ Erro ao processar conversa:', error)
  }
}

// Handle conversation updated
async function handleConversationUpdated(supabaseClient: any, payload: any) {
  const conversation = payload.data
  console.log('🔄 Conversa atualizada:', conversation.id)

  try {
    const { error } = await supabaseClient
      .from('chatwoot_conversations')
      .update({
        status: conversation.status,
        updated_at: conversation.updated_at,
        last_activity_at: conversation.last_activity_at,
        unread_count: conversation.unread_count,
        priority: conversation.priority,
        assignee_id: conversation.assignee?.id,
        team_id: conversation.team?.id,
        labels: conversation.labels || [],
        custom_attributes: conversation.custom_attributes || {},
        snoozed_until: conversation.snoozed_until,
        raw_data: conversation
      })
      .eq('id', conversation.id)

    if (error) {
      console.error('❌ Erro ao atualizar conversa:', error)
    } else {
      console.log('✅ Conversa atualizada com sucesso')
    }
  } catch (error) {
    console.error('❌ Erro ao processar atualização de conversa:', error)
  }
}

// Handle message created
async function handleMessageCreated(supabaseClient: any, payload: any) {
  const message = payload.data
  console.log('💬 Nova mensagem criada:', message.id)

  try {
    const { error } = await supabaseClient
      .from('chatwoot_messages')
      .upsert({
        id: message.id,
        conversation_id: message.conversation_id,
        account_id: message.account_id,
        sender_id: message.sender?.id,
        sender_type: message.sender_type,
        message_type: message.message_type,
        content: message.content,
        content_type: message.content_type,
        content_attributes: message.content_attributes || {},
        created_at: message.created_at,
        updated_at: message.updated_at,
        private: message.private || false,
        status: message.status,
        raw_data: message
      })

    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error)
    } else {
      console.log('✅ Mensagem salva com sucesso')
      
      // Update conversation last_activity_at
      await supabaseClient
        .from('chatwoot_conversations')
        .update({ 
          last_activity_at: message.created_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', message.conversation_id)
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error)
  }
}

// Handle message updated
async function handleMessageUpdated(supabaseClient: any, payload: any) {
  const message = payload.data
  console.log('🔄 Mensagem atualizada:', message.id)

  try {
    const { error } = await supabaseClient
      .from('chatwoot_messages')
      .update({
        content: message.content,
        content_type: message.content_type,
        content_attributes: message.content_attributes || {},
        updated_at: message.updated_at,
        status: message.status,
        raw_data: message
      })
      .eq('id', message.id)

    if (error) {
      console.error('❌ Erro ao atualizar mensagem:', error)
    } else {
      console.log('✅ Mensagem atualizada com sucesso')
    }
  } catch (error) {
    console.error('❌ Erro ao processar atualização de mensagem:', error)
  }
}
```

### **Passo 5: Deploy**
1. Clique em **"Deploy function"**
2. Aguarde o deploy terminar
3. A função estará disponível em: `https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-webhook`

## 🔧 **Opção 2: Deploy via CLI (AVANÇADO)**

### **Passo 1: Instalar Supabase CLI**
```bash
npm install -g supabase
```

### **Passo 2: Fazer Login**
```bash
supabase login
```

### **Passo 3: Deploy**
```bash
supabase functions deploy chatwoot-webhook --project-ref xqeqaagnnkilihlfjbrm
```

## ✅ **Verificar se Funcionou**

### **Teste 1: Verificar se a função existe**
```bash
curl https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-webhook
```

### **Teste 2: Enviar webhook de teste**
```bash
curl -X POST "https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-webhook" \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"message": "Teste de webhook"}}'
```

## 🎯 **Próximos Passos**

1. **Deploy a função** (use a Opção 1 - mais fácil)
2. **Teste o webhook** (use os comandos acima)
3. **Configure o webhook no Chatwoot** (já feito)
4. **Teste enviando mensagens no WhatsApp**

## 🚀 **Resultado Final**

Com o webhook deployado, você terá:
- ✅ **Sincronização em tempo real** - Tudo atualiza automaticamente
- ✅ **Experiência profissional** - Como um sistema comercial
- ✅ **Sem perda de mensagens** - Tudo fica salvo
- ✅ **Interface responsiva** - Atualiza sozinha

**Agora é só fazer o deploy da função no Supabase!** 🚀
