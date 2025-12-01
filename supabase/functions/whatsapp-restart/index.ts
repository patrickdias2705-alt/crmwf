import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../_shared/auth-middleware.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function decryptToken(encryptedToken: string, key: string): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedToken).split('').map(char => char.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
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
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return authResult.response!;
    }

    const authenticatedReq = authResult.request!;
    const roleCheck = requireRole(['admin', 'client_owner', 'manager'])(authenticatedReq);
    if (roleCheck) return roleCheck;

    const tenantId = authenticatedReq.context!.tenant_id;
    const userId = authenticatedReq.context!.user.id;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
        auth: { persistSession: false, autoRefreshToken: false }
      }
    );

    // Get active connection for this user
    const { data: connection, error: connError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (connError) throw connError;

    if (!connection) {
      return new Response(JSON.stringify({ error: 'Nenhuma conexão encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const encryptionKey = Deno.env.get('WHATSAPP_ENCRYPTION_KEY') || 'default-key-change-in-production';
    const decryptedToken = await decryptToken(connection.api_token_encrypted, encryptionKey);

    // Restart instance
    const restartResponse = await fetch(`${connection.api_url}/instance/restart/${connection.instance_name}`, {
      method: 'PUT',
      headers: {
        'apikey': decryptedToken,
      },
    });

    if (!restartResponse.ok) {
      const errorText = await restartResponse.text();
      throw new Error(`Evolution API error: ${restartResponse.status} - ${errorText}`);
    }

    // Update status to reinitializing
    const { error: updateError } = await supabaseClient
      .from('whatsapp_connections')
      .update({
        status: 'initializing',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      message: 'Instância reiniciada com sucesso',
      status: 'initializing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp restart error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});