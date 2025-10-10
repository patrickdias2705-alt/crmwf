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

  if (req.method !== 'GET') {
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
      .select('status, phone, last_sync_at, qr_code_url, instance_name, api_url, api_token_encrypted')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !connection) {
      return new Response(JSON.stringify({ 
        status: 'not_configured',
        message: 'No WhatsApp connection found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If we have connection details, try to get fresh status from Evolution API
    if (connection.api_url && connection.api_token_encrypted && connection.instance_name) {
      try {
        // Decrypt token for API call
        const encryptionKey = Deno.env.get('WHATSAPP_ENCRYPTION_KEY') || 'default-key-change-in-production';
        const decryptedToken = await decryptToken(connection.api_token_encrypted, encryptionKey);

        const statusResponse = await fetch(`${connection.api_url}/instance/connectionState/${connection.instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': decryptedToken,
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          // Update our database with fresh status
          let newStatus = 'disconnected';
          let phone = connection.phone;
          let qrCodeUrl = connection.qr_code_url;

          if (statusData.state === 'open' || statusData.instance?.state === 'open') {
            newStatus = 'connected';
            phone = statusData.instance?.owner || statusData.owner || phone;
          } else if (statusData.state === 'connecting' || statusData.instance?.state === 'connecting') {
            newStatus = 'connecting';
            
            // Try to get fresh QR code if not connected
            try {
              const qrResponse = await fetch(`${connection.api_url}/instance/connect/${connection.instance_name}`, {
                method: 'GET',
                headers: {
                  'apikey': decryptedToken,
                },
              });
              
              if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                let rawQrCode = qrData.qrcode || qrData.base64;
                
                // Normalize QR code format to Data URI
                if (rawQrCode && !rawQrCode.startsWith('data:')) {
                  qrCodeUrl = `data:image/png;base64,${rawQrCode}`;
                } else if (rawQrCode) {
                  qrCodeUrl = rawQrCode;
                }
              }
            } catch (qrError) {
              console.log('Could not fetch QR code:', qrError);
            }
          }

          // Update database
          await supabaseClient
            .from('whatsapp_connections')
            .update({
              status: newStatus,
              phone: phone,
              qr_code_url: qrCodeUrl,
              last_sync_at: new Date().toISOString(),
            })
            .eq('tenant_id', tenantId)
            .eq('user_id', userId);

          return new Response(JSON.stringify({
            status: newStatus,
            phone: phone,
            last_sync_at: new Date().toISOString(),
            qr_code_url: newStatus !== 'connected' ? qrCodeUrl : null,
            instance_name: connection.instance_name,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (apiError) {
        console.error('Evolution API status check failed:', apiError);
        // Fall through to return database status
      }
    }

    // Return status from database
    return new Response(JSON.stringify({
      status: connection.status,
      phone: connection.phone,
      last_sync_at: connection.last_sync_at,
      qr_code_url: connection.status === 'connecting' ? connection.qr_code_url : null,
      instance_name: connection.instance_name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp status error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Decrypt function (same as in init)
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