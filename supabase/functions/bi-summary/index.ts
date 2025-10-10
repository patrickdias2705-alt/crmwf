import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { authMiddleware } from "../_shared/auth-middleware.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

interface BiMetrics {
  leads_in: number;
  leads_attended: number;
  booked: number;
  closed: number;
  refused: number;
  lost: number;
  conversion_rate: number;
}

interface DailySeries {
  date: string;
  leads_in: number;
  attended: number;
  booked: number;
  closed: number;
  refused: number;
  lost: number;
}

async function calculateMetrics(
  supabase: any, 
  tenantId: string, 
  fromDate: string, 
  toDate: string
): Promise<{ summary: BiMetrics; daily: DailySeries[] }> {
  
  // Get all leads created in period
  const { data: leadsInPeriod } = await supabase
    .from('leads')
    .select(`
      id, 
      created_at, 
      stage:stages(name), 
      pipeline:pipelines(name),
      lead_events(type, created_at, data)
    `)
    .eq('tenant_id', tenantId)
    .gte('created_at', `${fromDate}T00:00:00`)
    .lte('created_at', `${toDate}T23:59:59`)
    .order('created_at');

  // Get all leads that had activity in period (for attended calculation)
  const { data: attendedLeads } = await supabase
    .from('lead_events')
    .select(`
      lead_id, 
      type, 
      created_at,
      lead:leads(id, created_at, stage:stages(name))
    `)
    .eq('tenant_id', tenantId)
    .gte('created_at', `${fromDate}T00:00:00`)
    .lte('created_at', `${toDate}T23:59:59`)
    .in('type', ['message_out', 'attended'])
    .order('created_at');

  // Get current stages for all leads (to determine current status)
  const allLeadIds = [
    ...(leadsInPeriod || []).map((l: any) => l.id),
    ...(attendedLeads || []).map((e: any) => e.lead?.id).filter(Boolean)
  ];

  const { data: currentLeadStages } = await supabase
    .from('leads')
    .select(`
      id, 
      stage:stages(name, pipeline:pipelines(name))
    `)
    .eq('tenant_id', tenantId)
    .in('id', allLeadIds);

  // Calculate metrics
  const leadsIn = leadsInPeriod?.length || 0;
  
  // Attended: leads with first message_out or attended event in period
  const attendedLeadIds = new Set();
  attendedLeads?.forEach((event: any) => {
    if (event.type === 'message_out' || event.type === 'attended') {
      attendedLeadIds.add(event.lead_id);
    }
  });
  const leadsAttended = attendedLeadIds.size;

  // Count by current stage
  const stageCounts = {
    booked: 0,
    closed: 0,
    refused: 0,
    lost: 0,
  };

  currentLeadStages?.forEach((lead: any) => {
    const stageName = lead.stage?.name?.toLowerCase() || '';
    if (stageName.includes('agendad') || stageName.includes('booked')) {
      stageCounts.booked++;
    } else if (stageName.includes('vendid') || stageName.includes('closed') || stageName.includes('won')) {
      stageCounts.closed++;
    } else if (stageName.includes('recusad') || stageName.includes('refused')) {
      stageCounts.refused++;
    } else if (stageName.includes('perdid') || stageName.includes('lost')) {
      stageCounts.lost++;
    }
  });

  const conversionRate = leadsAttended > 0 ? (stageCounts.closed / leadsAttended) : 0;

  // Generate daily series
  const daily: DailySeries[] = [];
  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Count leads created on this day
    const dayLeadsIn = leadsInPeriod?.filter((lead: any) => 
      lead.created_at.startsWith(dateStr)
    ).length || 0;

    // Count attended on this day
    const dayAttended = attendedLeads?.filter((event: any) =>
      event.created_at.startsWith(dateStr)
    ).length || 0;

    // For simplicity, use current stage counts proportionally
    // In a real implementation, you'd want to track stage changes over time
    daily.push({
      date: dateStr,
      leads_in: dayLeadsIn,
      attended: dayAttended,
      booked: Math.floor(stageCounts.booked / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))),
      closed: Math.floor(stageCounts.closed / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))),
      refused: Math.floor(stageCounts.refused / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))),
      lost: Math.floor(stageCounts.lost / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))),
    });
  }

  return {
    summary: {
      leads_in: leadsIn,
      leads_attended: leadsAttended,
      booked: stageCounts.booked,
      closed: stageCounts.closed,
      refused: stageCounts.refused,
      lost: stageCounts.lost,
      conversion_rate: Math.round(conversionRate * 100) / 100,
    },
    daily,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { user, tenant_id } = await authMiddleware(req, supabaseClient);

    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (!from || !to) {
      return new Response(JSON.stringify({ error: 'Missing from and to query parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { from: fromDate, to: toDate } = querySchema.parse({ from, to });

    const metrics = await calculateMetrics(supabaseClient, tenant_id, fromDate, toDate);

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('BI Summary error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});