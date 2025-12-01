import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function materializeDailyMetrics(supabase: any, date: string) {
  console.log(`Materializing metrics for date: ${date}`);

  // Get all tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id');

  if (!tenants) return;

  for (const tenant of tenants) {
    try {
      // Calculate metrics for this tenant and date
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      // Leads created on this day
      const { data: leadsIn } = await supabase
        .from('leads')
        .select('id')
        .eq('tenant_id', tenant.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Messages sent on this day (outbound)
      const { data: messagesOut } = await supabase
        .from('messages')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('direction', 'out')
        .gte('sent_at', startOfDay)
        .lte('sent_at', endOfDay);

      // Messages received on this day (inbound)
      const { data: messagesIn } = await supabase
        .from('messages')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('direction', 'in')
        .gte('sent_at', startOfDay)
        .lte('sent_at', endOfDay);

      // Lead events on this day
      const { data: leadEvents } = await supabase
        .from('lead_events')
        .select('type')
        .eq('tenant_id', tenant.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Count different event types
      const eventCounts = {
        attended: 0,
        stage_moved: 0,
        message_in: 0,
        message_out: 0,
      };

      leadEvents?.forEach((event: any) => {
        if (eventCounts.hasOwnProperty(event.type)) {
          eventCounts[event.type as keyof typeof eventCounts]++;
        }
      });

      // Get leads in final stages (for conversion calculation)
      const { data: convertedLeads } = await supabase
        .from('leads')
        .select(`
          id,
          stage:stages(name)
        `)
        .eq('tenant_id', tenant.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      let conversions = 0;
      convertedLeads?.forEach((lead: any) => {
        const stageName = lead.stage?.name?.toLowerCase() || '';
        if (stageName.includes('vendid') || stageName.includes('closed') || stageName.includes('won')) {
          conversions++;
        }
      });

      // Upsert metrics for this date and tenant
      const { error: upsertError } = await supabase
        .from('metrics_daily')
        .upsert({
          tenant_id: tenant.id,
          date: date,
          leads_in: leadsIn?.length || 0,
          messages_out: messagesOut?.length || 0,
          messages_in: messagesIn?.length || 0,
          attended: eventCounts.attended,
          stage_moves: eventCounts.stage_moved,
          conversions: conversions,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id,date'
        });

      if (upsertError) {
        console.error(`Error upserting metrics for tenant ${tenant.id}:`, upsertError);
      } else {
        console.log(`✅ Metrics materialized for tenant ${tenant.id}, date ${date}`);
      }

    } catch (error) {
      console.error(`Error processing tenant ${tenant.id}:`, error);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const url = new URL(req.url);
    let targetDate = url.searchParams.get('date');
    
    // If no date provided, use yesterday (for cron jobs)
    if (!targetDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday.toISOString().split('T')[0];
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return new Response(JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await materializeDailyMetrics(supabaseClient, targetDate);

    return new Response(JSON.stringify({ 
      success: true, 
      date: targetDate,
      message: `Metrics materialized for ${targetDate}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Metrics materialization error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});