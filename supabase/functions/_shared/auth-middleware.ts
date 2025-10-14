import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthenticatedRequest extends Request {
  context?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenant_id: string;
      active: boolean;
    };
    tenant_id: string;
    role: string;
  };
}

export interface AuthMiddlewareResult {
  success: boolean;
  response?: Response;
  request?: AuthenticatedRequest;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function authMiddleware(req: Request): Promise<AuthMiddlewareResult> {
  try {
    console.log('Auth middleware starting...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    );

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid auth header');
      return {
        success: false,
        response: new Response(
          JSON.stringify({ error: 'Authorization header required' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      };
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    // Set the auth token for this request
    // Removed setSession; we'll verify the user directly with the JWT


    // Extract user info from JWT (verify_jwt already enforced by Supabase)
    console.log('Decoding JWT payload...');
    let userId = '';
    let userEmail = '';
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        throw new Error('Malformed JWT');
      }
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(payload);
      const claims = JSON.parse(json);
      userId = claims.sub || claims.user_id || '';
      userEmail = claims.email || '';
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      return {
        success: false,
        response: new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      };
    }

    if (!userId) {
      console.log('No user id in token');
      return {
        success: false,
        response: new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      };
    }

    console.log('User id from token:', userId, userEmail);


    // Get user details from our users table
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, name, email, role, tenant_id, active')
      .eq('id', userId)
      .eq('active', true)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({ error: 'User not found or inactive' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      };
    }

    // Create authenticated request with context
    const authenticatedRequest = req as AuthenticatedRequest;
    authenticatedRequest.context = {
      user: userData,
      tenant_id: userData.tenant_id,
      role: userData.role
    };

    return {
      success: true,
      request: authenticatedRequest
    };

  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    };
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest): Response | null => {
    if (!req.context) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!allowedRoles.includes(req.context.role)) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient permissions',
          required_roles: allowedRoles,
          user_role: req.context.role
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return null; // No error, user has required role
  };
}