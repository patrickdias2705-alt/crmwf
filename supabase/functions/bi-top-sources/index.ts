import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware } from "../_shared/auth-middleware.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SourceMetrics {
  source: string;
  count: number;
  percentage: number;
  conversion_rate: number;
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

    // Get leads grouped by source
    const { data: leadsBySource, error } = await supabaseClient
      .from('leads')
      .select(`
        source,
        stage:stages(name)
      `)
      .eq('tenant_id', tenant_id);

    if (error) throw error;

    // Calculate metrics by source
    const sourceStats: Record<string, { total: number; converted: number }> = {};
    
    leadsBySource?.forEach((lead: any) => {
      const source = lead.source || 'unknown';
      if (!sourceStats[source]) {
        sourceStats[source] = { total: 0, converted: 0 };
      }
      
      sourceStats[source].total++;
      
      // Consider "closed" or "won" as converted
      const stageName = lead.stage?.name?.toLowerCase() || '';
      if (stageName.includes('vendid') || stageName.includes('closed') || stageName.includes('won')) {
        sourceStats[source].converted++;
      }
    });

    // Calculate total for percentages
    const totalLeads = Object.values(sourceStats).reduce((sum, stats) => sum + stats.total, 0);

    // Transform to response format
    const topSources: SourceMetrics[] = Object.entries(sourceStats)
      .map(([source, stats]) => ({
        source,
        count: stats.total,
        percentage: totalLeads > 0 ? Math.round((stats.total / totalLeads) * 100) : 0,
        conversion_rate: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .slice(0, 10); // Top 10 sources

    return new Response(JSON.stringify({ sources: topSources }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('BI Top Sources error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});