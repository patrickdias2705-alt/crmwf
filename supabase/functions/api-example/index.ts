import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../_shared/auth-middleware.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Apply authentication middleware
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return authResult.response!;
    }

    const authenticatedReq = authResult.request!;

    // Example: Require admin or manager role for this endpoint
    const roleCheck = requireRole(['admin', 'client_owner', 'manager'])(authenticatedReq);
    if (roleCheck) {
      return roleCheck;
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Example: Get leads filtered by tenant
    const { data: leads, error } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('tenant_id', authenticatedReq.context!.tenant_id)
      .limit(10);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        message: 'API endpoint working with authentication',
        user: authenticatedReq.context!.user,
        tenant_id: authenticatedReq.context!.tenant_id,
        role: authenticatedReq.context!.role,
        leads: leads
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});