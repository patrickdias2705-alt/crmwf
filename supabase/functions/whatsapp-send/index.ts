import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../_shared/auth-middleware.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sendMessageSchema = z.object({
  lead_id: z.string().uuid(),
  text: z.string().optional(),
  media_url: z.string().url().optional(),
}).refine(data => data.text || data.media_url, {
  message: "Either text or media_url must be provided"
});

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // messages per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

function checkRateLimit(tenantId: string): boolean {
  const now = Date.now();
  const key = tenantId;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (current.count >= RATE_LIMIT) {
    return false;
  }

  current.count++;
  return true;
}

async function decryptToken(encryptedToken: string, key: string): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedToken).split('').map(char => char.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

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

    // Check rate limit
    if (!checkRateLimit(tenantId)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Maximum 30 messages per minute.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const body = await req.json();
    const { lead_id, text, media_url } = sendMessageSchema.parse(body);

    // Get lead
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

    if (!lead.phone) {
      return new Response(JSON.stringify({ error: 'Lead has no phone number' }), {
        status: 400,
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

    if (connection.status !== 'connected') {
      return new Response(JSON.stringify({ 
        error: 'WhatsApp connection is not active',
        status: connection.status 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Decrypt token and send message
    const encryptionKey = Deno.env.get('WHATSAPP_ENCRYPTION_KEY') || 'default-key-change-in-production';
    const decryptedToken = await decryptToken(connection.api_token_encrypted, encryptionKey);

    let endpoint = `${connection.api_url}/message/sendText/${connection.instance_name}`;
    let payload: any = {
      number: lead.phone.replace(/\D/g, ''), // Remove non-digits
      textMessage: {
        text: text || ''
      }
    };

    if (media_url) {
      endpoint = `${connection.api_url}/message/sendMedia/${connection.instance_name}`;
      payload = {
        number: lead.phone.replace(/\D/g, ''),
        mediaMessage: {
          mediaUrl: media_url,
          caption: text || ''
        }
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${decryptedToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const evolutionResponse = await response.json();

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

    // Create message record
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
    console.error('WhatsApp send error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});