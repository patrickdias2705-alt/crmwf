import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../_shared/auth-middleware.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createLeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  source: z.string().optional(),
  pipeline_id: z.string().uuid().optional(),
  stage_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  fields: z.record(z.any()).optional(),
});

const updateLeadSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  owner_user_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  fields: z.record(z.any()).optional(),
});

const leadsQuerySchema = z.object({
  stage_id: z.string().uuid().optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  page_size: z.coerce.number().min(1).max(100).default(20),
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

  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return authResult.response!;
    }

    const authenticatedReq = authResult.request!;
    const tenantId = authenticatedReq.context!.tenant_id;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);

    if (req.method === 'POST') {
      // Create lead
      const roleCheck = requireRole(['admin', 'client_owner', 'manager', 'agent'])(authenticatedReq);
      if (roleCheck) return roleCheck;

      const body = await req.json();
      const leadData = createLeadSchema.parse(body);

      // Get default pipeline/stage if not provided
      let { pipeline_id, stage_id } = leadData;
      if (!pipeline_id || !stage_id) {
        const { data: defaultPipeline } = await supabaseClient
          .from('pipelines')
          .select('id, stages(id)')
          .eq('tenant_id', tenantId)
          .eq('is_default', true)
          .single();

        if (defaultPipeline) {
          pipeline_id = defaultPipeline.id;
          stage_id = stage_id || defaultPipeline.stages[0]?.id;
        }
      }

      // Create lead
      const { data: lead, error } = await supabaseClient
        .from('leads')
        .insert({
          ...leadData,
          pipeline_id,
          stage_id,
          tenant_id: tenantId,
          owner_user_id: authenticatedReq.context!.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log lead event
      await supabaseClient.from('lead_events').insert({
        lead_id: lead.id,
        tenant_id: tenantId,
        type: 'created',
        user_id: authenticatedReq.context!.user.id,
        data: { lead_data: leadData },
      });

      // Trigger webhook
      await triggerWebhook(supabaseClient, tenantId, 'lead.created', lead);

      return new Response(JSON.stringify({ lead }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'PATCH') {
      // Update lead
      const roleCheck = requireRole(['admin', 'client_owner', 'manager', 'agent'])(authenticatedReq);
      if (roleCheck) return roleCheck;

      const leadId = url.pathname.split('/').pop();
      if (!leadId) throw new Error('Lead ID required');

      const body = await req.json();
      const updateData = updateLeadSchema.parse(body);

      // Get existing lead
      const { data: existingLead } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('tenant_id', tenantId)
        .single();

      if (!existingLead) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update lead
      const { data: lead, error } = await supabaseClient
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      // Log lead event
      await supabaseClient.from('lead_events').insert({
        lead_id: leadId,
        tenant_id: tenantId,
        type: 'field_updated',
        user_id: authenticatedReq.context!.user.id,
        data: { 
          changes: updateData,
          previous: existingLead 
        },
      });

      return new Response(JSON.stringify({ lead }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'GET') {
      // List leads
      const roleCheck = requireRole(['admin', 'client_owner', 'manager', 'agent'])(authenticatedReq);
      if (roleCheck) return roleCheck;

      const searchParams = Object.fromEntries(url.searchParams);
      const { stage_id, q, page, page_size } = leadsQuerySchema.parse(searchParams);

      let query = supabaseClient
        .from('leads')
        .select('*, stage:stages(*), pipeline:pipelines(*), owner:users(name, email)', { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (stage_id) {
        query = query.eq('stage_id', stage_id);
      }

      if (q) {
        query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
      }

      const { data: leads, error, count } = await query
        .range((page - 1) * page_size, page * page_size - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ 
        leads, 
        pagination: {
          page,
          page_size,
          total: count,
          pages: Math.ceil((count || 0) / page_size)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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