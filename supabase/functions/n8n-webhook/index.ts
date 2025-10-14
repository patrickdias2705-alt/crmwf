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

async function processLeadStatusUpdate(supabase: any, data: any) {
  try {
    const { lead_id, new_status, old_status, tenant_id, reason, metadata } = data;

    if (!lead_id || !tenant_id) {
      console.error('Missing required fields: lead_id or tenant_id');
      return;
    }

    // Find the new stage by name
    const { data: newStage } = await supabase
      .from('stages')
      .select('*')
      .eq('tenant_id', tenant_id)
      .ilike('name', `%${new_status}%`)
      .single();

    if (!newStage) {
      console.error(`Stage not found for status: ${new_status}`);
      return;
    }

    // Update lead stage
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        stage_id: newStage.id,
        updated_at: new Date().toISOString(),
        ...(metadata?.fields && { fields: metadata.fields })
      })
      .eq('id', lead_id)
      .eq('tenant_id', tenant_id)
      .select('*, stage:stages(*), pipeline:pipelines(*)')
      .single();

    if (updateError) {
      console.error('Error updating lead:', updateError);
      return;
    }

    // Log stage change event
    await supabase.from('lead_events').insert({
      lead_id: lead_id,
      tenant_id: tenant_id,
      type: 'stage_changed',
      actor: 'n8n_automation',
      data: {
        from_stage: old_status,
        to_stage: new_status,
        reason: reason,
        metadata: metadata
      },
    });

    // Update daily metrics based on new status
    await updateDailyMetrics(supabase, tenant_id, new_status);

    // Emit realtime event for stage change
    await emitRealtimeEvent(supabase, tenant_id, 'lead.stage_changed', {
      lead: updatedLead,
      from_stage: { name: old_status },
      to_stage: { name: new_status },
      reason: reason,
      source: 'n8n_automation'
    });

    console.log(`Successfully updated lead ${lead_id} from ${old_status} to ${new_status}`);
    return updatedLead;

  } catch (error) {
    console.error('Error processing lead status update:', error);
    throw error;
  }
}

async function processLeadUpdate(supabase: any, data: any) {
  try {
    const { lead_id, tenant_id, updates, metadata } = data;

    if (!lead_id || !tenant_id || !updates) {
      console.error('Missing required fields for lead update');
      return;
    }

    // Update lead with new information
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead_id)
      .eq('tenant_id', tenant_id)
      .select('*, stage:stages(*), pipeline:pipelines(*)')
      .single();

    if (updateError) {
      console.error('Error updating lead:', updateError);
      return;
    }

    // Log update event
    await supabase.from('lead_events').insert({
      lead_id: lead_id,
      tenant_id: tenant_id,
      type: 'updated',
      actor: 'n8n_automation',
      data: {
        updates: updates,
        metadata: metadata
      },
    });

    // Emit realtime event for lead update
    await emitRealtimeEvent(supabase, tenant_id, 'lead.updated', {
      lead: updatedLead,
      updates: updates,
      source: 'n8n_automation'
    });

    console.log(`Successfully updated lead ${lead_id} with data:`, updates);
    return updatedLead;

  } catch (error) {
    console.error('Error processing lead update:', error);
    throw error;
  }
}

async function processLeadCreation(supabase: any, data: any) {
  try {
    const { tenant_id, lead_data, source = 'n8n', metadata } = data;

    if (!tenant_id || !lead_data) {
      console.error('Missing required fields for lead creation');
      return;
    }

    // Find default pipeline/stage for tenant
    const { data: defaultPipeline } = await supabase
      .from('pipelines')
      .select('id, stages(*)')
      .eq('tenant_id', tenant_id)
      .eq('is_default', true)
      .single();

    if (!defaultPipeline) {
      console.error('No default pipeline found for tenant:', tenant_id);
      return;
    }

    const defaultStage = defaultPipeline.stages.find((s: any) => s.name === 'Lead novo') || 
                        defaultPipeline.stages[0];

    // Create new lead
    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert({
        ...lead_data,
        pipeline_id: defaultPipeline.id,
        stage_id: defaultStage.id,
        source: source,
        tenant_id: tenant_id,
      })
      .select('*, stage:stages(*), pipeline:pipelines(*)')
      .single();

    if (createError) {
      console.error('Error creating lead:', createError);
      return;
    }

    // Log creation event
    await supabase.from('lead_events').insert({
      lead_id: newLead.id,
      tenant_id: tenant_id,
      type: 'created',
      actor: 'n8n_automation',
      data: {
        source: source,
        original_data: lead_data,
        metadata: metadata
      },
    });

    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('metrics_daily')
      .upsert({
        tenant_id: tenant_id,
        date: today,
        leads_in: 1,
      }, {
        onConflict: 'tenant_id,date',
      });

    // Emit realtime event for lead creation
    await emitRealtimeEvent(supabase, tenant_id, 'lead.created', {
      lead: newLead,
      source: 'n8n_automation'
    });

    console.log(`Successfully created new lead ${newLead.id} from n8n`);
    return newLead;

  } catch (error) {
    console.error('Error processing lead creation:', error);
    throw error;
  }
}

async function processLeadScheduling(supabase: any, data: any) {
  try {
    const { lead_id, tenant_id, scheduled_date, appointment_type, metadata } = data;

    if (!lead_id || !tenant_id) {
      console.error('Missing required fields for lead scheduling');
      return;
    }

    // Find "agendado" stage
    const { data: scheduledStage } = await supabase
      .from('stages')
      .select('*')
      .eq('tenant_id', tenant_id)
      .ilike('name', '%agendado%')
      .single();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (scheduledStage) {
      updateData.stage_id = scheduledStage.id;
    }

    if (scheduled_date) {
      updateData.fields = { scheduled_date, appointment_type };
    }

    // Update lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', lead_id)
      .eq('tenant_id', tenant_id)
      .select('*, stage:stages(*), pipeline:pipelines(*)')
      .single();

    if (updateError) {
      console.error('Error updating lead for scheduling:', updateError);
      return;
    }

    // Log scheduling event
    await supabase.from('lead_events').insert({
      lead_id: lead_id,
      tenant_id: tenant_id,
      type: 'scheduled',
      actor: 'n8n_automation',
      data: {
        scheduled_date: scheduled_date,
        appointment_type: appointment_type,
        metadata: metadata
      },
    });

    // Update daily metrics
    await updateDailyMetrics(supabase, tenant_id, 'booked');

    // Emit realtime event for lead scheduling
    await emitRealtimeEvent(supabase, tenant_id, 'lead.scheduled', {
      lead: updatedLead,
      scheduled_date: scheduled_date,
      appointment_type: appointment_type,
      source: 'n8n_automation'
    });

    console.log(`Successfully scheduled lead ${lead_id} for ${scheduled_date}`);
    return updatedLead;

  } catch (error) {
    console.error('Error processing lead scheduling:', error);
    throw error;
  }
}

async function updateDailyMetrics(supabase: any, tenant_id: string, action: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const updateData: any = { tenant_id, date: today };
    
    switch (action.toLowerCase()) {
      case 'atendido':
      case 'attended':
        updateData.leads_attended = 1;
        break;
      case 'agendado':
      case 'booked':
      case 'scheduled':
        updateData.booked = 1;
        break;
      case 'fechado':
      case 'closed':
      case 'won':
        updateData.closed = 1;
        break;
      case 'recusado':
      case 'refused':
        updateData.refused = 1;
        break;
      case 'perdido':
      case 'lost':
        updateData.lost = 1;
        break;
    }

    if (Object.keys(updateData).length > 2) { // More than tenant_id and date
      await supabase
        .from('metrics_daily')
        .upsert(updateData, {
          onConflict: 'tenant_id,date',
        });
    }
  } catch (error) {
    console.error('Error updating daily metrics:', error);
  }
}

async function emitRealtimeEvent(supabase: any, tenant_id: string, eventType: string, payload: any) {
  try {
    const channel = supabase.channel(`tenant_${tenant_id}`);
    
    const eventData = {
      type: eventType,
      payload: payload,
      timestamp: new Date().toISOString(),
      tenant_id: tenant_id,
      user_id: null, // n8n automation
    };

    await channel.send({
      type: 'broadcast',
      event: eventType,
      payload: eventData,
    });

    console.log(`✅ Emitted realtime event: ${eventType} for tenant ${tenant_id}`);
  } catch (error) {
    console.error('❌ Failed to emit realtime event:', error);
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
    const bodyText = await req.text();
    const signature = req.headers.get('x-signature') || req.headers.get('X-Signature');
    
    // Get webhook secret for validation
    const webhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
      console.error('Invalid JSON in n8n webhook:', error);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Received n8n webhook:', JSON.stringify(webhookData, null, 2));

    let result;
    
    // Process different n8n webhook types
    switch (webhookData.action || webhookData.type) {
      case 'lead_status_update':
      case 'status_update':
        result = await processLeadStatusUpdate(supabaseClient, webhookData.data || webhookData);
        break;
        
      case 'lead_update':
      case 'update_lead':
        result = await processLeadUpdate(supabaseClient, webhookData.data || webhookData);
        break;
        
      case 'lead_create':
      case 'create_lead':
      case 'new_lead':
        result = await processLeadCreation(supabaseClient, webhookData.data || webhookData);
        break;
        
      case 'lead_schedule':
      case 'schedule_lead':
      case 'appointment_booked':
        result = await processLeadScheduling(supabaseClient, webhookData.data || webhookData);
        break;
        
      default:
        console.log(`Unhandled n8n webhook action: ${webhookData.action || webhookData.type}`);
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Webhook received but no handler for this action type' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      result: result,
      processed_action: webhookData.action || webhookData.type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('n8n webhook processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});