import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const tenantId = userData?.tenant_id;
    if (!tenantId) throw new Error('Tenant not found');

    const { event_type, lead_id, budget_value } = await req.json();

    // Get current metrics
    const today = new Date().toISOString().split('T')[0];
    const { data: currentMetrics } = await supabase
      .from('metrics_daily')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('date', today)
      .single();

    // Get lead data
    const { data: lead } = await supabase
      .from('leads')
      .select(`
        *,
        stages(name),
        budgets(value, status)
      `)
      .eq('id', lead_id)
      .single();

    // Call AI to analyze and suggest metrics updates
    const aiPrompt = `Você é um assistente de análise de métricas de negócio.

Contexto atual:
- Evento: ${event_type}
- Lead: ${lead?.name || 'N/A'}
- Stage atual: ${lead?.stages?.name || 'N/A'}
- Valor do orçamento: R$ ${budget_value || 0}
- Métricas atuais do dia: ${JSON.stringify(currentMetrics || {})}

Com base neste evento e contexto, determine:
1. Quais métricas devem ser atualizadas?
2. Qual deve ser o novo valor de cada métrica?
3. Qual a taxa de conversão atualizada?

Responda APENAS com um JSON válido no formato:
{
  "leads_in": número,
  "leads_attended": número,
  "booked": número,
  "closed": número,
  "refused": número,
  "lost": número,
  "reasoning": "breve explicação da análise"
}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a business metrics analyst. Always respond with valid JSON.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiSuggestion = JSON.parse(aiData.choices[0].message.content);

    console.log('AI Suggestion:', aiSuggestion);

    // Update or create metrics for today
    const { error: metricsError } = await supabase
      .from('metrics_daily')
      .upsert({
        tenant_id: tenantId,
        date: today,
        leads_in: aiSuggestion.leads_in,
        leads_attended: aiSuggestion.leads_attended,
        booked: aiSuggestion.booked,
        closed: aiSuggestion.closed,
        refused: aiSuggestion.refused,
        lost: aiSuggestion.lost
      }, {
        onConflict: 'tenant_id,date'
      });

    if (metricsError) throw metricsError;

    return new Response(JSON.stringify({ 
      success: true, 
      metrics: aiSuggestion,
      reasoning: aiSuggestion.reasoning 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in metrics-ai-update:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
