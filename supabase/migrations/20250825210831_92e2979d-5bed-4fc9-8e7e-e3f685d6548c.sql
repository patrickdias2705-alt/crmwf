-- Add missing columns to whatsapp_connections table for better multi-tenant support
ALTER TABLE public.whatsapp_connections 
ADD COLUMN IF NOT EXISTS instance_name TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS api_token_encrypted TEXT;

-- Rename base_url to api_url for consistency
ALTER TABLE public.whatsapp_connections 
RENAME COLUMN base_url TO api_url;

-- Update existing connections to have default instance names if null
UPDATE public.whatsapp_connections 
SET instance_name = COALESCE(instance_name, 'default-instance-' || SUBSTRING(id::text, 1, 8))
WHERE instance_name IS NULL;

-- Create index for faster tenant-based queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_tenant_active 
ON public.whatsapp_connections (tenant_id, is_active);

-- Create index for webhook lookups by instance_name
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_instance_name 
ON public.whatsapp_connections (instance_name);

-- Add constraint to ensure one active connection per tenant
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_whatsapp_per_tenant 
ON public.whatsapp_connections (tenant_id) 
WHERE is_active = true;