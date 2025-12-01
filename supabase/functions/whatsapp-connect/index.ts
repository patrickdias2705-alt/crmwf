import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../_shared/auth-middleware.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const roleCheck = requireRole(['admin', 'client_owner', 'manager', 'agent'])(authenticatedReq);
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

    // Get WhatsApp connection for this user
    const { data: connection, error } = await supabaseClient
      .from('whatsapp_connections')
      .select('api_url, api_token_encrypted, instance_name')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !connection) {
      return new Response(JSON.stringify({ 
        error: 'No WhatsApp connection found. Please configure first.'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!connection.api_url || !connection.api_token_encrypted || !connection.instance_name) {
      return new Response(JSON.stringify({ 
        error: 'WhatsApp connection is incomplete. Please reconfigure.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Decrypt token for API call
    const encryptionKey = Deno.env.get('WHATSAPP_ENCRYPTION_KEY') || 'default-key-change-in-production';
    const decryptedToken = await decryptToken(connection.api_token_encrypted, encryptionKey);

    // Call Evolution API to connect the instance
    const connectResponse = await fetch(`${connection.api_url}/instance/connect/${connection.instance_name}`, {
      method: 'GET',
      headers: {
        'apikey': decryptedToken,
      },
    });

    if (!connectResponse.ok) {
      const errorText = await connectResponse.text();
      console.error('Evolution API connect error:', errorText);
      return new Response(JSON.stringify({ 
        error: `Evolution API error: ${connectResponse.status} - ${errorText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const connectData = await connectResponse.json();
    
    // Normalize QR code format to Data URI
    let qrCodeUrl = connectData.qrcode || connectData.base64;
    if (qrCodeUrl && !qrCodeUrl.startsWith('data:')) {
      qrCodeUrl = `data:image/png;base64,${qrCodeUrl}`;
    }
    
    // Update database with new QR code if available
    let updateData: any = {
      status: 'connecting',
      last_sync_at: new Date().toISOString(),
    };

    if (qrCodeUrl) {
      updateData.qr_code_url = qrCodeUrl;
    }

    await supabaseClient
      .from('whatsapp_connections')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    return new Response(JSON.stringify({
      status: 'connecting',
      qr_code_url: qrCodeUrl,
      message: 'Instance connection initiated. Scan QR code to complete.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp connect error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Decrypt function (same as in other functions)
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