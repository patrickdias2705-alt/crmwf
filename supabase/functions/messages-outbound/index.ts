import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../_shared/auth-middleware.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const outboundMessageSchema = z.object({
  lead_id: z.string().uuid(),
  text: z.string().optional(),
  media_url: z.string().url().optional(),
}).refine(data => data.text || data.media_url, {
  message: "Either text or media_url must be provided"
});

async function triggerWebhook(supabase: any, tenantId: string, type: string, lead: any, data: any = {}) {
  try {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('url_webhook, webhook_secret')
      .eq('id', tenantId)
      .single();

    if (!tenant?.url_webhook) return;

    const payload = {
      tenant_id: tenantId,
      type,
      lead,
      data,
      timestamp: new Date().toISOString()
    };

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(tenant.webhook_secret || ""),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(JSON.stringify(payload))
    );
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    await fetch(tenant.url_webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signatureHex}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Webhook error:', error);
  }
}

async function sendEvolutionMessage(connection: any, phone: string, text?: string, mediaUrl?: string) {
  try {
    const baseUrl = connection.api_url;
    const instance = connection.instance_name;
    const token = connection.api_token;

    if (!baseUrl || !instance || !token) {
      throw new Error('WhatsApp connection not properly configured');
    }

    let endpoint = `${baseUrl}/message/sendText/${instance}`;
    let payload: any = {
      number: phone.replace(/\D/g, ''), // Remove non-digits
      textMessage: {
        text: text || ''
      }
    };

    if (mediaUrl) {
      endpoint = `${baseUrl}/message/sendMedia/${instance}`;
      payload = {
        number: phone.replace(/\D/g, ''),
        mediaMessage: {
          mediaUrl,
          caption: text || ''
        }
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Evolution send error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return authResult.response!;
    }

    const authenticatedReq = authResult.request!;
    const roleCheck = requireRole(['admin', 'client_owner', 'manager', 'agent'])(authenticatedReq);
    if (roleCheck) return roleCheck;

    const tenantId = authenticatedReq.context!.tenant_id;
    const userId = authenticatedReq.context!.user.id;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const body = await req.json();
    const { lead_id, text, media_url } = outboundMessageSchema.parse(body);

    // Get lead info
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .eq('tenant_id', tenantId)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get WhatsApp connection
    const { data: connection, error: connError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'No active WhatsApp connection found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find or create conversation
    let { data: conversation } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('lead_id', lead_id)
      .eq('channel', 'whatsapp')
      .single();

    if (!conversation) {
      const { data: newConversation, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          lead_id: lead_id,
          tenant_id: tenantId,
          channel: 'whatsapp',
          status: 'open',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;
      conversation = newConversation;
    }

    // Send message via Evolution API
    let evolutionResponse;
    try {
      evolutionResponse = await sendEvolutionMessage(connection, lead.phone, text, media_url);
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Failed to send message via WhatsApp',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create outbound message record
    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        tenant_id: tenantId,
        direction: 'out',
        content: text,
        media_url,
        wa_message_id: evolutionResponse?.key?.id,
        sent_at: new Date().toISOString(),
        sent_by_user_id: userId,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Update conversation
    await supabaseClient
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'open'
      })
      .eq('id', conversation.id);

    // Log lead event
    await supabaseClient.from('lead_events').insert({
      lead_id: lead_id,
      tenant_id: tenantId,
      type: 'message_out',
      user_id: userId,
      data: { 
        message_id: message.id,
        content: text,
        media_url 
      },
    });

    // Trigger webhook
    await triggerWebhook(supabaseClient, tenantId, 'message.out', lead, { 
      message,
      conversation
    });

    return new Response(JSON.stringify({ 
      message,
      lead,
      conversation,
      evolution_response: evolutionResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Outbound message error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});