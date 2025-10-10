import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema for lead capture with tracking
const leadCaptureSchema = z.object({
  tenant_id: z.string().uuid(),
  
  // Lead basic info
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  
  // Origin detection
  origin: z.enum(['whatsapp', 'instagram', 'facebook', 'site', 'indicacao', 'google_ads', 'outro']).optional(),
  
  // UTM Parameters (for automatic source tracking)
  utm_source: z.string().optional(),      // instagram, facebook, google, etc
  utm_medium: z.string().optional(),      // social, cpc, organic, referral
  utm_campaign: z.string().optional(),    // campaign name
  utm_term: z.string().optional(),        // keywords
  utm_content: z.string().optional(),     // ad variation
  
  // Additional tracking
  referrer_url: z.string().url().optional(),
  landing_page: z.string().url().optional(),
  ad_id: z.string().optional(),
  ad_name: z.string().optional(),
  
  // Platform-specific data
  platform_data: z.record(z.any()).optional(),
  
  // Additional fields
  message: z.string().optional(),
  segment: z.string().optional(),
  category: z.string().optional(),
  order_number: z.string().optional(),
});

/**
 * Automatically determine origin from UTM parameters
 */
function determineOrigin(utmSource?: string, utmMedium?: string): string {
  if (!utmSource) return 'site';
  
  const source = utmSource.toLowerCase();
  
  if (source.includes('instagram') || source === 'ig') return 'instagram';
  if (source.includes('facebook') || source === 'fb') return 'facebook';
  if (source.includes('whatsapp') || source === 'wa') return 'whatsapp';
  if (source.includes('google')) return 'google_ads';
  if (source.includes('indicacao') || source === 'referral') return 'indicacao';
  
  // Check medium
  if (utmMedium) {
    const medium = utmMedium.toLowerCase();
    if (medium === 'social') {
      // Try to infer from source
      return source.includes('meta') ? 'facebook' : 'site';
    }
    if (medium === 'cpc' || medium === 'paid') return 'google_ads';
  }
  
  return 'site';
}

/**
 * Enrich platform data with additional context
 */
function enrichPlatformData(data: any, utmParams: any): any {
  const enriched = { ...data };
  
  // Add Meta (Facebook/Instagram) specific fields
  if (utmParams.ad_id || utmParams.ad_name) {
    enriched.meta_ads = {
      ad_id: utmParams.ad_id,
      ad_name: utmParams.ad_name,
    };
  }
  
  // Add timestamp
  enriched.captured_at = new Date().toISOString();
  
  // Add browser/device info if available in headers
  return enriched;
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
    const body = await req.json();
    
    // Validate input
    const leadData = leadCaptureSchema.parse(body);
    
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

    // Determine origin automatically if not provided
    const origin = leadData.origin || determineOrigin(leadData.utm_source, leadData.utm_medium);
    
    // Enrich platform data
    const platformData = enrichPlatformData(
      leadData.platform_data || {}, 
      {
        ad_id: leadData.ad_id,
        ad_name: leadData.ad_name,
      }
    );

    // Get default pipeline and stage
    const { data: defaultPipeline, error: pipelineError } = await supabaseClient
      .from('pipelines')
      .select('id, stages(id, name, order)')
      .eq('tenant_id', leadData.tenant_id)
      .eq('is_default', true)
      .single();

    if (pipelineError || !defaultPipeline) {
      throw new Error('Default pipeline not found for tenant');
    }

    // Get first stage (lowest order)
    const stages = defaultPipeline.stages as any[];
    const firstStage = stages.sort((a, b) => a.order - b.order)[0];

    if (!firstStage) {
      throw new Error('No stages found in default pipeline');
    }

    // Check if lead already exists (by phone or email)
    let existingLead = null;
    if (leadData.phone) {
      const { data } = await supabaseClient
        .from('leads')
        .select('id, name, phone, email')
        .eq('tenant_id', leadData.tenant_id)
        .eq('phone', leadData.phone)
        .maybeSingle();
      existingLead = data;
    }

    if (!existingLead && leadData.email) {
      const { data } = await supabaseClient
        .from('leads')
        .select('id, name, phone, email')
        .eq('tenant_id', leadData.tenant_id)
        .eq('email', leadData.email)
        .maybeSingle();
      existingLead = data;
    }

    if (existingLead) {
      // Update existing lead with new tracking info
      const { data: updatedLead, error: updateError } = await supabaseClient
        .from('leads')
        .update({
          // Update tracking info
          utm_source: leadData.utm_source,
          utm_medium: leadData.utm_medium,
          utm_campaign: leadData.utm_campaign,
          utm_term: leadData.utm_term,
          utm_content: leadData.utm_content,
          referrer_url: leadData.referrer_url,
          landing_page: leadData.landing_page,
          ad_id: leadData.ad_id,
          ad_name: leadData.ad_name,
          platform_data: platformData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log event
      await supabaseClient.from('lead_events').insert({
        tenant_id: leadData.tenant_id,
        lead_id: existingLead.id,
        type: 'lead.updated',
        actor: 'lead_capture',
        data: {
          message: 'Lead re-captured with new tracking data',
          origin: origin,
          utm_params: {
            source: leadData.utm_source,
            medium: leadData.utm_medium,
            campaign: leadData.utm_campaign,
          }
        }
      });

      return new Response(JSON.stringify({ 
        success: true,
        lead: updatedLead,
        message: 'Existing lead updated with new tracking information',
        is_new: false,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create new lead
    const { data: newLead, error: createError } = await supabaseClient
      .from('leads')
      .insert({
        tenant_id: leadData.tenant_id,
        name: leadData.name,
        phone: leadData.phone || null,
        email: leadData.email || null,
        origin: origin,
        
        // Tracking fields
        utm_source: leadData.utm_source,
        utm_medium: leadData.utm_medium,
        utm_campaign: leadData.utm_campaign,
        utm_term: leadData.utm_term,
        utm_content: leadData.utm_content,
        referrer_url: leadData.referrer_url,
        landing_page: leadData.landing_page,
        ad_id: leadData.ad_id,
        ad_name: leadData.ad_name,
        platform_data: platformData,
        
        // Pipeline info
        pipeline_id: defaultPipeline.id,
        stage_id: firstStage.id,
        status: 'novo_lead',
        
        // Additional fields
        category: leadData.category || origin,
        order_number: leadData.order_number,
        fields: {
          segment: leadData.segment,
          capture_message: leadData.message,
        },
      })
      .select()
      .single();

    if (createError) throw createError;

    // Log lead creation event
    await supabaseClient.from('lead_events').insert({
      tenant_id: leadData.tenant_id,
      lead_id: newLead.id,
      type: 'lead.created',
      actor: 'lead_capture',
      data: {
        origin: origin,
        utm_params: {
          source: leadData.utm_source,
          medium: leadData.utm_medium,
          campaign: leadData.utm_campaign,
        },
        capture_method: 'web_form',
        message: leadData.message,
      }
    });

    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    await supabaseClient
      .from('metrics_daily')
      .upsert({
        tenant_id: leadData.tenant_id,
        date: today,
        leads_in: 1,
      }, {
        onConflict: 'tenant_id,date',
      });

    return new Response(JSON.stringify({ 
      success: true,
      lead: newLead,
      message: 'Lead captured successfully',
      is_new: true,
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Lead capture error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({ 
        error: 'Validation error',
        details: error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});



