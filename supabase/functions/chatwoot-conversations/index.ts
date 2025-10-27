import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatwootConversation {
  id: number;
  status: string;
  account_id: number;
  contact: {
    id: number;
    name: string;
    phone_number: string;
    email: string;
  };
  messages?: any[];
  created_at: string;
  updated_at: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API token from environment variables
    const token = Deno.env.get('CHATWOOT_API_TOKEN')
    if (!token) {
      console.error('CHATWOOT_API_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'CHATWOOT_API_TOKEN not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const url = new URL(req.url)
    const accountId = url.searchParams.get('account_id') || '1'

    // POST request - send message or apply tag
    if (req.method === 'POST') {
      const body = await req.json()
      const conversationId = body.conversation_id
      const action = body.action

      // Aplicar tag
      if (action === 'apply_tag') {
        const tagTitle = body.tag_title
        
        if (!conversationId || !tagTitle) {
          return new Response(
            JSON.stringify({ error: 'Missing conversation_id or tag_title' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        const labelsUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/conversations/${conversationId}/labels`
        
        console.log('🏷️ Applying tag:', tagTitle, 'to conversation:', conversationId)
        
        const labelsRes = await fetch(labelsUrl, {
          method: 'POST',
          headers: {
            'api_access_token': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            labels: [tagTitle]
          }),
        })

        if (!labelsRes.ok) {
          console.error('Chatwoot API error:', labelsRes.status, labelsRes.statusText)
          return new Response(
            JSON.stringify({ 
              error: `Chatwoot API error: ${labelsRes.status} ${labelsRes.statusText}` 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: labelsRes.status,
            }
          )
        }

        const labelsData = await labelsRes.json()
        return new Response(
          JSON.stringify(labelsData),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Remover tag
      if (action === 'remove_tag') {
        const tagTitle = body.tag_title
        
        if (!conversationId || !tagTitle) {
          return new Response(
            JSON.stringify({ error: 'Missing conversation_id or tag_title' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        const labelsUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/conversations/${conversationId}/labels`
        
        console.log('🗑️ Removing tag:', tagTitle, 'from conversation:', conversationId)
        
        // Buscar a conversa completa para ter acesso aos labels com ID
        const conversationUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/conversations/${conversationId}`
        
        const conversationRes = await fetch(conversationUrl, {
          headers: {
            'api_access_token': token,
            'Content-Type': 'application/json',
          },
        })

        if (!conversationRes.ok) {
          throw new Error('Failed to fetch conversation')
        }

        const conversationData = await conversationRes.json()
        console.log('📋 Conversation data:', JSON.stringify(conversationData.payload || conversationData).substring(0, 500))
        
        // Buscar labels da conversa (meta.labels são só strings, precisamos buscar os objetos completos)
        const allLabelsUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/labels`
        const allLabelsRes = await fetch(allLabelsUrl, {
          headers: {
            'api_access_token': token,
            'Content-Type': 'application/json',
          },
        })

        if (!allLabelsRes.ok) {
          throw new Error('Failed to fetch labels')
        }

        const allLabelsData = await allLabelsRes.json()
        console.log('🏷️ Available labels:', JSON.stringify(allLabelsData.payload || []).substring(0, 500))
        
        // Encontrar o ID da label pelo título
        const labelObject = (allLabelsData.payload || []).find((l: any) => l.title === tagTitle)
        const labelId = labelObject?.id

        if (!labelId) {
          return new Response(
            JSON.stringify({ error: 'Label not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            }
          )
        }

        // Remover a label usando DELETE no endpoint correto
        const deleteLabelsUrl = `${labelsUrl}/${labelId}`
        
        console.log('🗑️ Deleting label with URL:', deleteLabelsUrl, 'and ID:', labelId)
        
        const labelsRes = await fetch(deleteLabelsUrl, {
          method: 'DELETE',
          headers: {
            'api_access_token': token,
            'Content-Type': 'application/json',
          },
        })

        if (!labelsRes.ok) {
          console.error('Chatwoot API error:', labelsRes.status, labelsRes.statusText)
          return new Response(
            JSON.stringify({ 
              error: `Chatwoot API error: ${labelsRes.status} ${labelsRes.statusText}` 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: labelsRes.status,
            }
          )
        }

        const labelsData = await labelsRes.json()
        return new Response(
          JSON.stringify(labelsData),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Enviar mensagem
      const content = body.content
      const messageType = body.message_type || 'outgoing'

      if (!conversationId || !content) {
        return new Response(
          JSON.stringify({ error: 'Missing conversation_id or content' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      const chatwootUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`

      const chatwootRes = await fetch(chatwootUrl, {
        method: 'POST',
        headers: {
          'api_access_token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          message_type: messageType,
        }),
      })

      if (!chatwootRes.ok) {
        console.error('Chatwoot API error:', chatwootRes.status, chatwootRes.statusText)
        return new Response(
          JSON.stringify({ 
            error: `Chatwoot API error: ${chatwootRes.status} ${chatwootRes.statusText}` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: chatwootRes.status,
          }
        )
      }

      const data = await chatwootRes.json()
      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // GET request - fetch conversations or messages
    const inboxId = url.searchParams.get('inbox_id')
    const conversationId = url.searchParams.get('conversation_id')
    const listInboxes = url.searchParams.get('list_inboxes')
    const listTags = url.searchParams.get('list_tags')

    // Se listTags=true, buscar lista de tags
    if (listTags === 'true') {
      const tagsUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/labels`
      
      console.log('🏷️ Fetching tags from Chatwoot:', tagsUrl)

      const tagsRes = await fetch(tagsUrl, {
        headers: {
          'api_access_token': token,
          'Content-Type': 'application/json',
        },
      })

      if (!tagsRes.ok) {
        console.error('Chatwoot API error:', tagsRes.status, tagsRes.statusText)
        return new Response(
          JSON.stringify({ 
            error: `Chatwoot API error: ${tagsRes.status} ${tagsRes.statusText}` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: tagsRes.status,
          }
        )
      }

      const tagsData = await tagsRes.json()
      console.log('✅ Tags loaded:', tagsData.payload?.length || 0)
      console.log('📋 Estrutura da resposta:', JSON.stringify(tagsData).substring(0, 200))
      
      // IMPORTANTE: tagsData já vem no formato { payload: [...] }
      // Retornar EXATAMENTE como está para o frontend processar
      return new Response(
        JSON.stringify(tagsData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Se listInboxes=true, buscar lista de inboxes
    if (listInboxes === 'true') {
      const inboxesUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/inboxes`
      
      console.log('📋 Fetching inboxes from Chatwoot:', inboxesUrl)

      const inboxesRes = await fetch(inboxesUrl, {
        headers: {
          'api_access_token': token,
          'Content-Type': 'application/json',
        },
      })

      if (!inboxesRes.ok) {
        console.error('Chatwoot API error:', inboxesRes.status, inboxesRes.statusText)
        return new Response(
          JSON.stringify({ 
            error: `Chatwoot API error: ${inboxesRes.status} ${inboxesRes.statusText}` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: inboxesRes.status,
          }
        )
      }

      const inboxesData = await inboxesRes.json()
      
      // Enriquecer inboxes com fotos de perfil do WhatsApp via Evolution API
      if (Array.isArray(inboxesData.payload)) {
        console.log('🔄 Enriquecendo inboxes com fotos de perfil...')
        
        // Tentar buscar foto de perfil do primeiro contato de cada inbox via Evolution
        for (let i = 0; i < inboxesData.payload.length; i++) {
          const inbox = inboxesData.payload[i]
          
          try {
            // Tentar buscar da Evolution API se tiver configuração
            const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')
            const evolutionToken = Deno.env.get('EVOLUTION_API_TOKEN')
            const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME')
            
            if (evolutionUrl && evolutionToken && instanceName && inbox.phone_number) {
              // Buscar foto de perfil do número do inbox
              const phoneNumber = inbox.phone_number.replace(/\D/g, '') + '@s.whatsapp.net'
              
              console.log(`📸 Tentando buscar foto de perfil para: ${phoneNumber}`)
              
              const profilePicUrl = `${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}/${phoneNumber}`
              
              const picResponse = await fetch(profilePicUrl, {
                headers: {
                  'apikey': evolutionToken,
                },
              })
              
              if (picResponse.ok) {
                const picData = await picResponse.json()
                if (picData.profilePictureUrl) {
                  inbox.avatar_url = picData.profilePictureUrl
                  console.log(`✅ Foto de perfil encontrada para inbox ${inbox.id}`)
                }
              }
            }
          } catch (picError) {
            console.log(`⚠️ Erro ao buscar foto de perfil para inbox ${inbox.id}:`, picError)
          }
        }
      }
      
      console.log('✅ Inboxes loaded:', inboxesData.payload?.length || 0)
      console.log('🔍 First inbox structure:', JSON.stringify(inboxesData.payload?.[0] || {}, null, 2))
      
      return new Response(
        JSON.stringify(inboxesData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Se conversation_id existe, buscar mensagens dessa conversa
    if (conversationId) {
      // Parâmetros de paginação
      const before = url.searchParams.get('before') // ID da mensagem para buscar anteriores
      const limit = url.searchParams.get('limit') || '50' // Quantidade de mensagens (padrão: 50)
      
      let messagesUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/conversations/${conversationId}/messages?limit=${limit}`
      
      if (before) {
        messagesUrl += `&before=${before}`
      }
      
      console.log('📨 Fetching messages from Chatwoot:', messagesUrl)

      const messagesRes = await fetch(messagesUrl, {
        headers: {
          'api_access_token': token,
          'Content-Type': 'application/json',
        },
      })

      if (!messagesRes.ok) {
        console.error('❌ Chatwoot API error:', messagesRes.status, messagesRes.statusText)
        return new Response(
          JSON.stringify({ 
            error: `Chatwoot API error: ${messagesRes.status} ${messagesRes.statusText}` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: messagesRes.status,
          }
        )
      }

      const messagesData = await messagesRes.json()
      
      console.log('✅ Chatwoot response structure:', {
        hasPayload: !!messagesData.payload,
        hasData: !!messagesData.data,
        isArray: Array.isArray(messagesData),
        payloadType: typeof messagesData.payload,
        payloadLength: Array.isArray(messagesData.payload) ? messagesData.payload.length : 'not array'
      })
      
      if (Array.isArray(messagesData.payload) && messagesData.payload.length > 0) {
        console.log('📝 First message:', messagesData.payload[0])
        console.log('📝 Last message:', messagesData.payload[messagesData.payload.length - 1])
        console.log('📊 Total messages:', messagesData.payload.length)
      }
      
      return new Response(
        JSON.stringify(messagesData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Caso contrário, buscar lista de conversas
    const chatwootUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/${accountId}/conversations`
    const fullUrl = inboxId ? `${chatwootUrl}?inbox_id=${inboxId}` : chatwootUrl

    console.log('Fetching conversations from Chatwoot:', fullUrl)

    const chatwootRes = await fetch(fullUrl, {
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json',
      },
    })

    if (!chatwootRes.ok) {
      console.error('Chatwoot API error:', chatwootRes.status, chatwootRes.statusText)
      return new Response(
        JSON.stringify({ 
          error: `Chatwoot API error: ${chatwootRes.status} ${chatwootRes.statusText}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: chatwootRes.status,
        }
      )
    }

    const data = await chatwootRes.json()

    // Debug: Log da estrutura das conversas retornadas
    if (data.payload && Array.isArray(data.payload) && data.payload.length > 0) {
      console.log('📊 Estrutura da primeira conversa retornada pelo Chatwoot:', JSON.stringify(data.payload[0], null, 2))
      console.log('📅 Campos de data disponíveis:', {
        created_at: data.payload[0].created_at,
        updated_at: data.payload[0].updated_at,
        last_activity_at: data.payload[0].last_activity_at,
        last_message_at: data.payload[0].last_message_at,
        last_non_activity_at: data.payload[0].last_non_activity_at,
        todasChaves: Object.keys(data.payload[0])
      })
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in chatwoot-conversations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
