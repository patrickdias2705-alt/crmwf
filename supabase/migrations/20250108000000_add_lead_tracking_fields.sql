-- Migration: Add tracking fields to leads table for automatic source detection
-- This enables automatic tracking of lead origin from Instagram, Facebook, Website, etc.

-- Add tracking columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referrer_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS landing_page TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ad_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ad_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS platform_data JSONB DEFAULT '{}'::jsonb;

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON public.leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON public.leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_origin ON public.leads(origin);

-- Add comment explaining the fields
COMMENT ON COLUMN public.leads.utm_source IS 'Traffic source (e.g., instagram, facebook, google, direct)';
COMMENT ON COLUMN public.leads.utm_medium IS 'Marketing medium (e.g., social, cpc, organic, referral)';
COMMENT ON COLUMN public.leads.utm_campaign IS 'Campaign name for tracking';
COMMENT ON COLUMN public.leads.utm_term IS 'Paid search keywords';
COMMENT ON COLUMN public.leads.utm_content IS 'Ad content or variation';
COMMENT ON COLUMN public.leads.referrer_url IS 'URL where the lead came from';
COMMENT ON COLUMN public.leads.landing_page IS 'First page visited by the lead';
COMMENT ON COLUMN public.leads.ad_id IS 'Ad ID from Meta/Google Ads';
COMMENT ON COLUMN public.leads.ad_name IS 'Ad name from Meta/Google Ads';
COMMENT ON COLUMN public.leads.platform_data IS 'Additional platform-specific data (JSON)';

-- Update origin column to accept more values if needed
-- The origin field now works together with UTM parameters for better tracking

-- Create a view for easy tracking analytics
CREATE OR REPLACE VIEW public.lead_tracking_summary AS
SELECT 
  l.tenant_id,
  l.origin,
  l.utm_source,
  l.utm_medium,
  l.utm_campaign,
  COUNT(*) as lead_count,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as leads_last_7_days,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as leads_last_30_days,
  MIN(l.created_at) as first_lead_date,
  MAX(l.created_at) as last_lead_date
FROM public.leads l
GROUP BY l.tenant_id, l.origin, l.utm_source, l.utm_medium, l.utm_campaign;

-- Grant access to the view
GRANT SELECT ON public.lead_tracking_summary TO authenticated;

COMMENT ON VIEW public.lead_tracking_summary IS 'Summary view of lead sources for analytics and reporting';



