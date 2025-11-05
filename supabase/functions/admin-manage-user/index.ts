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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é admin
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado - apenas admins' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, userId, email, password, name, role, tenantId } = await req.json();

    if (action === 'create') {
      // Criar novo usuário no Auth
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Criar registro na tabela users
      const { error: insertError } = await supabaseClient
        .from('users')
        .insert({
          id: newUser.user.id,
          email,
          name,
          role,
          tenant_id: tenantId,
          active: true
        });

      if (insertError) {
        console.error('Erro ao criar registro de usuário:', insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Criar role na tabela user_roles
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          tenant_id: tenantId,
          role
        });

      if (roleError) {
        console.error('Erro ao criar role:', roleError);
      }

      return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'updateRole') {
      // Atualizar role na tabela users
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao atualizar role na tabela users:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Atualizar role na tabela user_roles
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (roleError) {
        console.error('Erro ao atualizar role na tabela user_roles:', roleError);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'resetPassword') {
      // Resetar senha do usuário
      if (!userId || !password) {
        return new Response(JSON.stringify({ error: 'userId e password são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        {
          password: password,
          email_confirm: true
        }
      );

      if (updateError) {
        console.error('Erro ao resetar senha:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Senha resetada com sucesso',
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'resetPasswordByEmail') {
      // Resetar senha pelo email
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'email e password são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar usuário pelo email
      const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
      
      if (listError) {
        return new Response(JSON.stringify({ error: 'Erro ao buscar usuários', details: listError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const user = users.find(u => u.email === email);

      if (!user) {
        return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Resetar senha
      const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
        user.id,
        {
          password: password,
          email_confirm: true
        }
      );

      if (updateError) {
        console.error('Erro ao resetar senha:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Senha resetada com sucesso',
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});