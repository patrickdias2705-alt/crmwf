import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.tenant_id) {
      throw new Error('User not found or no tenant');
    }

    const tenantId = userData.tenant_id;

    // Delete data in order (respecting foreign keys)
    console.log('Clearing data for tenant:', tenantId);

    // 1. Delete budgets
    await supabase
      .from('budgets')
      .delete()
      .eq('lead_id', supabase.rpc('get_user_tenant_id'));

    // 2. Delete activities
    await supabase
      .from('activities')
      .delete()
      .eq('lead_id', supabase.rpc('get_user_tenant_id'));

    // 3. Delete messages
    await supabase
      .from('messages')
      .delete()
      .eq('tenant_id', tenantId);

    // 4. Delete conversations
    await supabase
      .from('conversations')
      .delete()
      .eq('tenant_id', tenantId);

    // 5. Delete lead_events
    await supabase
      .from('lead_events')
      .delete()
      .eq('tenant_id', tenantId);

    // 6. Delete leads
    await supabase
      .from('leads')
      .delete()
      .eq('tenant_id', tenantId);

    // 7. Delete metrics_daily
    await supabase
      .from('metrics_daily')
      .delete()
      .eq('tenant_id', tenantId);

    console.log('Data cleared successfully for tenant:', tenantId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Todos os dados foram apagados com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error clearing data:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to clear data'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});