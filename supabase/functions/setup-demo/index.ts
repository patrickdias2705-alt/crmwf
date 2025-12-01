
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create demo tenant first
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .upsert({
        id: 'demo-tenant-001',
        name: 'Zaptro Demo',
        plan: 'premium',
        active: true
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      return new Response(
        JSON.stringify({ error: 'Failed to create demo tenant' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create demo user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: 'demo@zaptro.com',
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        name: 'Demo User'
      }
    });

    if (authError && !authError.message.includes('already been registered')) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create demo auth user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = authUser?.user?.id || 'demo-user-001';

    // Create or update user in users table
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .upsert({
        id: userId,
        name: 'Demo User',
        email: 'demo@zaptro.com',
        role: 'admin',
        tenant_id: 'demo-tenant-001',
        active: true
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to create demo user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create some sample data for testing
    
    // Sample leads
    const sampleLeads = [
      {
        id: 'lead-001',
        tenant_id: 'demo-tenant-001',
        name: 'João Silva',
        phone: '+5511999999001',
        email: 'joao@email.com',
        source: 'WhatsApp',
        stage: 'new',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      },
      {
        id: 'lead-002',
        tenant_id: 'demo-tenant-001',
        name: 'Maria Santos',
        phone: '+5511999999002',
        email: 'maria@email.com',
        source: 'Website',
        stage: 'attending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        id: 'lead-003',
        tenant_id: 'demo-tenant-001',
        name: 'Pedro Costa',
        phone: '+5511999999003',
        email: 'pedro@email.com',
        source: 'Facebook',
        stage: 'closed',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      }
    ];

    await supabaseClient
      .from('leads')
      .upsert(sampleLeads, { onConflict: 'id' });

    // Sample conversations
    const sampleConversations = [
      {
        id: 'conv-001',
        tenant_id: 'demo-tenant-001',
        lead_id: 'lead-001',
        channel: 'whatsapp',
        status: 'active',
        last_message_at: new Date().toISOString(),
      },
      {
        id: 'conv-002',
        tenant_id: 'demo-tenant-001',
        lead_id: 'lead-002',
        channel: 'email',
        status: 'active',
        last_message_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      }
    ];

    await supabaseClient
      .from('conversations')
      .upsert(sampleConversations, { onConflict: 'id' });

    // Sample messages
    const sampleMessages = [
      {
        id: 'msg-001',
        tenant_id: 'demo-tenant-001',
        conversation_id: 'conv-001',
        lead_id: 'lead-001',
        direction: 'inbound',
        content: 'Olá, gostaria de saber mais sobre seus produtos',
        channel: 'whatsapp',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      },
      {
        id: 'msg-002',
        tenant_id: 'demo-tenant-001',
        conversation_id: 'conv-001',
        lead_id: 'lead-001',
        direction: 'outbound',
        content: 'Olá João! Claro, vou te ajudar. Que tipo de produto você tem interesse?',
        channel: 'whatsapp',
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
      }
    ];

    await supabaseClient
      .from('messages')
      .upsert(sampleMessages, { onConflict: 'id' });

    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          email: 'demo@zaptro.com',
          password: 'demo123'
        },
        tenant: tenant,
        user: user,
        sample_data_created: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Setup demo error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
