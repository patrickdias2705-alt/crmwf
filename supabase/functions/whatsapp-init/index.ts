import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../_shared/auth-middleware.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const initWhatsAppSchema = z.object({
  base_url: z.string().url().optional(),
  api_token: z.string().min(1).optional(),
  instance_name: z.string().min(1).optional(),
});

// Simple encryption using Web Crypto API
async function encryptToken(token: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32)); // Ensure 32 bytes
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

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
  // Add detailed logging
  console.log('WhatsApp Init called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('Starting auth middleware...');
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      console.log('Auth failed:', authResult);
      return authResult.response!;
    }

    const authenticatedReq = authResult.request!;
    const roleCheck = requireRole(['admin', 'client_owner', 'manager', 'agent'])(authenticatedReq);
    if (roleCheck) {
      console.log('Role check failed');
      return roleCheck;
    }

    const tenantId = authenticatedReq.context!.tenant_id;
    const userId = authenticatedReq.context!.user.id;
    console.log('Tenant ID:', tenantId);
    console.log('User ID:', userId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' }
        },
        auth: { persistSession: false, autoRefreshToken: false }
      }
    );

    console.log('Parsing request body...');
    let rawBody: any = {};
    try {
      rawBody = await req.json();
    } catch {}
    console.log('Request body:', rawBody);
    
    const parsed = initWhatsAppSchema.parse(rawBody);

    console.log('Checking existing connections...');
    // Check if connection already exists for this user
    const { data: existingConnection, error: fetchError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing connection:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    const encryptionKey = Deno.env.get('WHATSAPP_ENCRYPTION_KEY') || 'default-key-change-in-production';

    let baseUrl: string | null = parsed.base_url ?? existingConnection?.api_url ?? null;
    let instanceName: string | null = parsed.instance_name ?? existingConnection?.instance_name ?? null;

    let apiTokenToUse: string | null = parsed.api_token ?? null;
    if (!apiTokenToUse && existingConnection?.api_token_encrypted) {
      apiTokenToUse = await decryptToken(existingConnection.api_token_encrypted, encryptionKey);
    }

    // Normalize base URL (remove trailing slashes)
    if (baseUrl) baseUrl = baseUrl.replace(/\/+$/, '');

    if (!baseUrl || !instanceName || !apiTokenToUse) {
      console.error('Missing configuration values', { hasBaseUrl: !!baseUrl, hasInstanceName: !!instanceName, hasToken: !!apiTokenToUse });
      return new Response(JSON.stringify({ 
        error: 'Missing configuration for Evolution API',
        details: { base_url: !!baseUrl, instance_name: !!instanceName, api_token: !!apiTokenToUse }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Existing connection:', existingConnection);

    if (existingConnection && existingConnection.status === 'connected') {
      console.log('Connection already active, returning existing');
      return new Response(JSON.stringify({ 
        error: 'WhatsApp connection already exists and is active',
        connection: {
          status: existingConnection.status,
          phone: existingConnection.phone,
          last_sync_at: existingConnection.last_sync_at
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Creating instance on Evolution API...');
    // Create instance on Evolution API with header fallbacks
    const headerVariants = [
      { 'Content-Type': 'application/json', 'apikey': apiTokenToUse },
      { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiTokenToUse}` },
      { 'Content-Type': 'application/json', 'x-api-key': apiTokenToUse },
    ];

    let createInstanceResponse: Response | null = null;
    let lastErrorText = '';

    for (const headers of headerVariants) {
      const resp = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instanceName: instanceName,
          token: crypto.randomUUID().replace(/-/g, '').slice(0, 24),
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`,
        }),
      });
      console.log('Evolution API create try status:', resp.status, 'using headers:', Object.keys(headers).join(','));
      if (resp.ok || resp.status === 409) { // 409: already exists
        createInstanceResponse = resp;
        break;
      } else {
        lastErrorText = await resp.text();
      }
    }

    if (!createInstanceResponse) {
      throw new Error(`Evolution API error: no valid auth header. Last error: ${lastErrorText}`);
    }

    console.log('Evolution API create response status:', createInstanceResponse.status);

    if (!createInstanceResponse.ok && createInstanceResponse.status !== 409) {
      const errorText = lastErrorText || (await createInstanceResponse.text());
      console.error('Evolution API create error:', errorText);
      throw new Error(`Evolution API error: ${createInstanceResponse.status} - ${errorText}`);
    }

    let createResult: any = {};
    try {
      createResult = await createInstanceResponse.json();
    } catch (_) {
      createResult = { status: createInstanceResponse.status };
    }
    console.log('Evolution API create result:', createResult);

    console.log('Getting QR code...');
    // Get QR code with header fallbacks
    let qrResponse: Response | null = null;
    let qrLastError = '';
    for (const headers of headerVariants) {
      const resp = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers,
      });
      console.log('QR try status:', resp.status, 'using headers:', Object.keys(headers).join(','));
      if (resp.ok) { qrResponse = resp; break; }
      else { qrLastError = await resp.text(); }
    }

    console.log('QR response status:', qrResponse?.status);

    let qrCodeUrl = null;
    if (qrResponse && qrResponse.ok) {
      try {
        const qrData = await qrResponse.json();
        console.log('QR data received keys:', Object.keys(qrData));
        let rawQrCode = qrData.qrcode || qrData.base64 || qrData.code || null;
        
        // Normalize QR code format to Data URI
        if (rawQrCode && !rawQrCode.startsWith('data:')) {
          qrCodeUrl = `data:image/png;base64,${rawQrCode}`;
        } else {
          qrCodeUrl = rawQrCode;
        }
      } catch (e) {
        console.error('QR JSON parse error:', e);
      }
    } else if (qrLastError) {
      console.error('QR code fetch error:', qrLastError);
    }

    console.log('Encrypting token...');
    // Encrypt the API token
    const encryptedToken = await encryptToken(apiTokenToUse, encryptionKey);

    console.log('Saving connection to database...');
    // Save/update connection
    const connectionData = {
      tenant_id: tenantId,
      user_id: userId,
      api_url: baseUrl,
      api_token_encrypted: encryptedToken,
      instance_name: instanceName,
      status: 'initializing',
      qr_code_url: qrCodeUrl,
      is_active: true,
      last_sync_at: new Date().toISOString(),
    };

    let connection;
    if (existingConnection) {
      console.log('Updating existing connection...');
      const { data: updatedConnection, error } = await supabaseClient
        .from('whatsapp_connections')
        .update(connectionData)
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      connection = updatedConnection;
    } else {
      console.log('Creating new connection...');
      const { data: newConnection, error } = await supabaseClient
        .from('whatsapp_connections')
        .insert(connectionData)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      connection = newConnection;
    }

    console.log('Success! Returning connection data...');
    return new Response(JSON.stringify({
      connection: {
        id: connection.id,
        status: connection.status,
        qr_code_url: connection.qr_code_url,
        instance_name: connection.instance_name,
        last_sync_at: connection.last_sync_at,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp init error:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Erro interno do servidor';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});