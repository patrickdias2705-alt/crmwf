import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../_shared/auth-middleware.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const moveLeadSchema = z.object({
  stage_id: z.string().uuid(),
  reason: z.string().optional(),
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
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return authResult.response!;
    }

    const authenticatedReq = authResult.request!;
    const roleCheck = requireRole(['admin', 'client_owner', 'manager', 'agent'])(authenticatedReq);
    if (roleCheck) return roleCheck;

    const tenantId = authenticatedReq.context!.tenant_id;
    const url = new URL(req.url);
    const leadId = url.pathname.split('/')[4]; // /api/v1/leads/:id/move

    if (!leadId) {
      return new Response(JSON.stringify({ error: 'Lead ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const body = await req.json();
    const { stage_id, reason } = moveLeadSchema.parse(body);

    // Get current lead with stage info
    const { data: currentLead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*, stage:stages(*), pipeline:pipelines(*)')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .single();

    if (leadError || !currentLead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate that new stage belongs to same pipeline
    const { data: newStage, error: stageError } = await supabaseClient
      .from('stages')
      .select('*, pipeline:pipelines(*)')
      .eq('id', stage_id)
      .eq('tenant_id', tenantId)
      .single();

    if (stageError || !newStage) {
      return new Response(JSON.stringify({ error: 'Stage not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (newStage.pipeline_id !== currentLead.pipeline_id) {
      return new Response(JSON.stringify({ error: 'Stage must belong to the same pipeline' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update lead stage
    const { data: updatedLead, error: updateError } = await supabaseClient
      .from('leads')
      .update({ stage_id })
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .select('*, stage:stages(*), pipeline:pipelines(*)')
      .single();

    if (updateError) throw updateError;

    // Log lead event
    await supabaseClient.from('lead_events').insert({
      lead_id: leadId,
      tenant_id: tenantId,
      type: 'stage_moved',
      user_id: authenticatedReq.context!.user.id,
      data: {
        from: {
          stage_id: currentLead.stage_id,
          stage_name: currentLead.stage?.name
        },
        to: {
          stage_id,
          stage_name: newStage.name
        },
        reason
      },
    });

    // Trigger webhook
    await triggerWebhook(supabaseClient, tenantId, 'lead.stage_moved', updatedLead, {
      from: currentLead.stage,
      to: newStage,
      reason
    });

    return new Response(JSON.stringify({ 
      lead: updatedLead,
      stage_change: {
        from: currentLead.stage,
        to: newStage,
        reason
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});