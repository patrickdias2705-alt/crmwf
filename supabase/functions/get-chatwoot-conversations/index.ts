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

serve(async (req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API token from environment variable
    const token = Deno.env.get('CHATWOOT_API_TOKEN')
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'CHATWOOT_API_TOKEN not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Get inbox_id from query parameters
    const url = new URL(req.url)
    const inboxId = url.searchParams.get('inbox_id')
    
    if (!inboxId) {
      return new Response(
        JSON.stringify({ error: 'inbox_id parameter is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Build the Chatwoot API URL
    const chatwootUrl = `https://chatwoot-chatwoot.l0vghu.easypanel.host/api/v1/accounts/1/conversations?inbox_id=${inboxId}`
    
    console.log('📡 Fetching conversations from Chatwoot...')
    console.log('URL:', chatwootUrl)
    console.log('Inbox ID:', inboxId)

    // Call Chatwoot API with the correct header
    const response = await fetch(chatwootUrl, {
      headers: {
        'api_access_token': token, // Chatwoot uses api_access_token, not Authorization Bearer
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Chatwoot API error:', response.status, errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'Chatwoot API error',
          status: response.status,
          message: errorText 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      )
    }

    const data = await response.json()
    console.log('✅ Successfully fetched conversations:', data.data?.length || 0)

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error fetching Chatwoot conversations:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
