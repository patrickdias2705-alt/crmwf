// =====================================================
// EDGE FUNCTION PARA RESETAR SENHA DE USUÁRIO
// =====================================================
// Use esta função para resetar senha programaticamente
// Execute: deno run --allow-net --allow-env RESETAR-SENHA-EDGE-FUNCTION.ts
// Ou copie para: supabase/functions/reset-password/index.ts
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar Service Role Key para ter acesso admin
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

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Email e nova senha são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar usuário pelo email
    const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
    
    if (listError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuários', details: listError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Resetar senha usando admin API
    const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        email_confirm: true // Confirmar email automaticamente
      }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao resetar senha', 
          details: updateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha resetada com sucesso',
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

