import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

async function validateHMAC(body: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return true; // Skip validation if no signature/secret

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const computedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const computedHex = Array.from(new Uint8Array(computedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expectedSignature = signature.replace('sha256=', '');
    return computedHex === expectedSignature;
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

async function processInboundMessage(supabase: any, messageData: any) {
  try {
    // Extract phone number from Evolution webhook data
    let phone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') || 
                messageData.pushName ||
                messageData.from;

    if (!phone) {
      console.error('No phone number found in webhook data:', messageData);
      return;
    }

    // Normalize phone number
    phone = phone.replace(/\D/g, '');

    const text = messageData.message?.conversation || 
                 messageData.message?.extendedTextMessage?.text ||
                 messageData.text;

    const mediaUrl = messageData.message?.imageMessage?.url ||
                     messageData.message?.videoMessage?.url ||
                     messageData.message?.documentMessage?.url ||
                     messageData.media_url;

    // Extract tracking parameters from message metadata if available
    const trackingData = messageData.tracking || {};
    const utmSource = trackingData.utm_source || 'whatsapp';
    const utmMedium = trackingData.utm_medium;
    const utmCampaign = trackingData.utm_campaign;
    const referrerUrl = trackingData.referrer_url;
    const adId = trackingData.ad_id;

    // Determine origin from tracking data or default to whatsapp
    let origin = 'whatsapp';
    if (utmSource === 'instagram' || utmSource === 'ig') {
      origin = 'instagram';
    } else if (utmSource === 'facebook' || utmSource === 'fb') {
      origin = 'facebook';
    }

    // Find or create lead by phone number
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, stage:stages(*), pipeline:pipelines(*)')
      .eq('phone', phone)
      .single();

    let isNewLead = false;

    if (leadError || !lead) {
      // Create new lead - find default pipeline/stage
      const { data: defaultPipeline } = await supabase
        .from('pipelines')
        .select('id, tenant_id, stages(*)')
        .eq('is_default', true)
        .single();

      if (!defaultPipeline) {
        console.error('No default pipeline found');
        return;
      }

      const newLeadStage = defaultPipeline.stages.find((s: any) => s.name === 'Lead novo') || 
                          defaultPipeline.stages[0];

      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          name: phone, // Use phone as name initially
          phone: phone,
          pipeline_id: defaultPipeline.id,
          stage_id: newLeadStage.id,
          origin: origin,
          tenant_id: defaultPipeline.tenant_id,
          // Add tracking fields
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          referrer_url: referrerUrl,
          ad_id: adId,
          platform_data: {
            channel: 'whatsapp',
            first_message: text,
            captured_at: new Date().toISOString(),
          },
        })
        .select('*, stage:stages(*), pipeline:pipelines(*)')
        .single();

      if (createError) {
        console.error('Error creating lead:', createError);
        return;
      }
      
      lead = newLead;
      isNewLead = true;

      // Log lead creation event with tracking info
      await supabase.from('lead_events').insert({
        lead_id: lead.id,
        tenant_id: lead.tenant_id,
        type: 'created',
        data: { 
          source: 'inbound_whatsapp_webhook', 
          phone: phone,
          origin: origin,
          tracking: {
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
          }
        },
      });
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('channel', 'whatsapp')
      .single();

    if (!conversation) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          lead_id: lead.id,
          tenant_id: lead.tenant_id,
          channel: 'whatsapp',
          status: 'open',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return;
      }
      conversation = newConversation;
    }

    // Create inbound message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        tenant_id: lead.tenant_id,
        direction: 'in',
        content: text,
        media_url: mediaUrl,
        wa_message_id: messageData.key?.id || messageData.id,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return;
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'open'
      })
      .eq('id', conversation.id);

    // Log message event
    await supabase.from('lead_events').insert({
      lead_id: lead.id,
      tenant_id: lead.tenant_id,
      type: 'message_in',
      data: { 
        message_id: message.id,
        content: text,
        media_url: mediaUrl 
      },
    });

    // Update daily metrics if new lead
    if (isNewLead) {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('metrics_daily')
        .upsert({
          tenant_id: lead.tenant_id,
          date: today,
          leads_in: 1,
        }, {
          onConflict: 'tenant_id,date',
        });
    }

    // Trigger webhooks
    await triggerWebhook(supabase, lead.tenant_id, 'message.in', lead, { 
      message, 
      conversation,
      is_new_lead: isNewLead 
    });

    if (isNewLead) {
      await triggerWebhook(supabase, lead.tenant_id, 'lead.created', lead, { 
        source: 'inbound_whatsapp_webhook' 
      });
    }

    console.log('Successfully processed inbound message:', { leadId: lead.id, messageId: message.id });

  } catch (error) {
    console.error('Error processing inbound message:', error);
  }
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
  if (req.method === 'OPTIONS' || req.method === 'GET' || req.method === 'HEAD') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-signature') || req.headers.get('X-Signature');
    
    // Get webhook secret for validation (we'll determine tenant later)
    const webhookSecret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      const isValid = await validateHMAC(bodyText, signature, webhookSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let webhookData;
    try {
      webhookData = JSON.parse(bodyText);
    } catch (error) {
      console.error('Invalid JSON in webhook:', error);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Received Evolution webhook:', JSON.stringify(webhookData, null, 2));

    // Handle different Evolution webhook event types
    if (webhookData.event === 'messages.upsert' && webhookData.data) {
      const messageData = webhookData.data;
      
      // Only process incoming messages (not our own)
      if (messageData.key?.fromMe === false || messageData.fromMe === false) {
        await processInboundMessage(supabaseClient, messageData);
      }
    } else if (webhookData.event === 'connection.update') {
      // Handle connection status updates
      const instance = webhookData.instance;
      const state = webhookData.data?.state;
      
      if (instance && state) {
        console.log(`Connection update for ${instance}: ${state}`);
        
        // Update connection status in database
        const newStatus = state === 'open' ? 'connected' : 
                         state === 'connecting' ? 'connecting' : 
                         'disconnected';
        
        await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: newStatus,
            last_sync_at: new Date().toISOString(),
          })
          .eq('instance_name', instance);
      }
    } else if (webhookData.event === 'qrcode.updated' || webhookData.event === 'qrcode.generate') {
      // Handle QR code updates
      const instance = webhookData.instance;
      const qrCode = webhookData.data?.qrcode;
      
      if (instance && qrCode) {
        console.log(`QR code updated for ${instance}`);
        
        await supabaseClient
          .from('whatsapp_connections')
          .update({
            qr_code_url: qrCode,
            status: 'connecting',
            last_sync_at: new Date().toISOString(),
          })
          .eq('instance_name', instance);
      }
    } else if (webhookData.pairingCode || webhookData.code) {
      // Handle pairing code data
      console.log('Processing pairing code data:', webhookData);
      
      // Extract instance name from context or find by tenant
      let instanceName = webhookData.instance;
      
      if (!instanceName) {
        // Try to find the most recent connection that's initializing/connecting
        const { data: connection } = await supabaseClient
          .from('whatsapp_connections')
          .select('*')
          .in('status', ['initializing', 'connecting'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (connection) {
          instanceName = connection.instance_name;
        }
      }
      
      if (instanceName) {
        const updateData: any = {
          status: 'connecting',
          last_sync_at: new Date().toISOString(),
        };
        
        // Handle pairing code
        if (webhookData.pairingCode) {
          updateData.pairing_code = webhookData.pairingCode;
        }
        
        // Handle QR code
        if (webhookData.code) {
          updateData.qr_code_url = webhookData.code;
        }
        
        await supabaseClient
          .from('whatsapp_connections')
          .update(updateData)
          .eq('instance_name', instanceName);
          
        console.log(`Updated connection ${instanceName} with pairing data`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});