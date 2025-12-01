import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const inboundMessageSchema = z.object({
  lead_phone: z.string().min(1),
  text: z.string().optional(),
  media_url: z.string().url().optional(),
  wa_message_id: z.string().optional(),
  provider: z.literal("evolution"),
  // Tracking parameters
  tracking: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
    referrer_url: z.string().url().optional(),
    ad_id: z.string().optional(),
    ad_name: z.string().optional(),
  }).optional(),
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
    // For inbound messages, we don't require auth - they come from external systems
    const body = await req.json();
    const messageData = inboundMessageSchema.parse(body);

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

    // Find or create lead by phone number
    let { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*, stage:stages(*), pipeline:pipelines(*)')
      .eq('phone', messageData.lead_phone)
      .single();

    let isNewLead = false;

    if (leadError || !lead) {
      // Create new lead - need to find default pipeline/stage
      const { data: defaultPipeline } = await supabaseClient
        .from('pipelines')
        .select('id, tenant_id, stages(*)')
        .eq('is_default', true)
        .single();

      if (!defaultPipeline) {
        throw new Error('No default pipeline found');
      }

      const newLeadStage = defaultPipeline.stages.find((s: any) => s.name === 'Lead novo') || defaultPipeline.stages[0];

      // Extract tracking data
      const tracking = messageData.tracking || {};
      const utmSource = tracking.utm_source || 'whatsapp';
      
      // Determine origin from tracking
      let origin = 'whatsapp';
      if (utmSource === 'instagram' || utmSource === 'ig') {
        origin = 'instagram';
      } else if (utmSource === 'facebook' || utmSource === 'fb') {
        origin = 'facebook';
      }

      const { data: newLead, error: createError } = await supabaseClient
        .from('leads')
        .insert({
          name: messageData.lead_phone, // Use phone as name initially
          phone: messageData.lead_phone,
          pipeline_id: defaultPipeline.id,
          stage_id: newLeadStage.id,
          origin: origin,
          tenant_id: defaultPipeline.tenant_id,
          // Add tracking fields
          utm_source: tracking.utm_source,
          utm_medium: tracking.utm_medium,
          utm_campaign: tracking.utm_campaign,
          utm_term: tracking.utm_term,
          utm_content: tracking.utm_content,
          referrer_url: tracking.referrer_url,
          ad_id: tracking.ad_id,
          ad_name: tracking.ad_name,
          platform_data: {
            channel: 'whatsapp',
            first_message: messageData.text,
            captured_at: new Date().toISOString(),
          },
        })
        .select('*, stage:stages(*), pipeline:pipelines(*)')
        .single();

      if (createError) throw createError;
      
      lead = newLead;
      isNewLead = true;

      // Log lead creation event with tracking
      await supabaseClient.from('lead_events').insert({
        lead_id: lead.id,
        tenant_id: lead.tenant_id,
        type: 'created',
        data: { 
          source: 'inbound_message', 
          phone: messageData.lead_phone,
          origin: origin,
          tracking: tracking,
        },
      });
    }

    // Find or create conversation
    let { data: conversation } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('channel', 'whatsapp')
      .single();

    if (!conversation) {
      const { data: newConversation, error: convError } = await supabaseClient
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

      if (convError) throw convError;
      conversation = newConversation;
    }

    // Create inbound message
    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        tenant_id: lead.tenant_id,
        direction: 'in',
        content: messageData.text,
        media_url: messageData.media_url,
        wa_message_id: messageData.wa_message_id,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Update conversation last activity
    await supabaseClient
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'open'
      })
      .eq('id', conversation.id);

    // Log message event
    await supabaseClient.from('lead_events').insert({
      lead_id: lead.id,
      tenant_id: lead.tenant_id,
      type: 'message_in',
      data: { 
        message_id: message.id,
        content: messageData.text,
        media_url: messageData.media_url 
      },
    });

    // Update daily metrics if new lead
    if (isNewLead) {
      const today = new Date().toISOString().split('T')[0];
      
      await supabaseClient
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
    await triggerWebhook(supabaseClient, lead.tenant_id, 'message.in', lead, { 
      message, 
      conversation,
      is_new_lead: isNewLead 
    });

    if (isNewLead) {
      await triggerWebhook(supabaseClient, lead.tenant_id, 'lead.created', lead, { 
        source: 'inbound_message' 
      });
    }

    return new Response(JSON.stringify({ 
      message,
      lead,
      conversation,
      is_new_lead: isNewLead
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Inbound message error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});