-- Create internal_messages table for supervisor-agent communication
CREATE TABLE IF NOT EXISTS public.internal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_broadcast BOOLEAN NOT NULL DEFAULT false,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- Supervisors can create messages
CREATE POLICY "Supervisors can create internal messages"
ON public.internal_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'supervisor')
  )
);

-- Users can view messages directed to them or broadcast messages
CREATE POLICY "Users can view their internal messages"
ON public.internal_messages
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
  AND (
    recipient_id = auth.uid() 
    OR is_broadcast = true
    OR sender_id = auth.uid()
  )
);

-- Supervisors can view all messages in their tenant
CREATE POLICY "Supervisors can view all internal messages"
ON public.internal_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'supervisor')
  )
  AND tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Users can mark their messages as read
CREATE POLICY "Users can update their messages read status"
ON public.internal_messages
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid() OR (is_broadcast = true AND tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())))
WITH CHECK (recipient_id = auth.uid() OR (is_broadcast = true AND tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())));

-- Trigger to update updated_at
CREATE TRIGGER update_internal_messages_updated_at
BEFORE UPDATE ON public.internal_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_internal_messages_tenant ON public.internal_messages(tenant_id);
CREATE INDEX idx_internal_messages_recipient ON public.internal_messages(recipient_id);
CREATE INDEX idx_internal_messages_sender ON public.internal_messages(sender_id);
CREATE INDEX idx_internal_messages_created ON public.internal_messages(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;