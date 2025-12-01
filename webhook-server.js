const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = process.env.PORT || 3001

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://xqeqaagnnkilihlfjbrm.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdua2lsaWhsZmpicm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDk1NzQ0MCwiZXhwIjoyMDUwNTMzNDQwfQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q'
)

// Middleware
app.use(cors())
app.use(express.json())

// Webhook endpoint
app.post('/webhook/chatwoot', async (req, res) => {
  try {
    const payload = req.body
    console.log('📨 Webhook recebido do Chatwoot:', JSON.stringify(payload, null, 2))

    // Handle different webhook events
    switch (payload.event) {
      case 'conversation.created':
        await handleConversationCreated(payload)
        break
      
      case 'conversation.updated':
        await handleConversationUpdated(payload)
        break
      
      case 'message.created':
        await handleMessageCreated(payload)
        break
      
      case 'message.updated':
        await handleMessageUpdated(payload)
        break
      
      default:
        console.log('⚠️ Evento não tratado:', payload.event)
    }

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    })
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    })
  }
})

// Handle conversation created
async function handleConversationCreated(payload) {
  const conversation = payload.data
  console.log('💬 Nova conversa criada:', conversation.id)

  try {
    const { error } = await supabase
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
async function handleConversationUpdated(payload) {
  const conversation = payload.data
  console.log('🔄 Conversa atualizada:', conversation.id)

  try {
    const { error } = await supabase
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
async function handleMessageCreated(payload) {
  const message = payload.data
  console.log('💬 Nova mensagem criada:', message.id)

  try {
    const { error } = await supabase
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
      await supabase
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
async function handleMessageUpdated(payload) {
  const message = payload.data
  console.log('🔄 Mensagem atualizada:', message.id)

  try {
    const { error } = await supabase
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Webhook server is running',
    timestamp: new Date().toISOString()
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`)
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook/chatwoot`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
})

module.exports = app
