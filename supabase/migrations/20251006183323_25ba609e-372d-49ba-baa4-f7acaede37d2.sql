-- Fix RLS policy to allow cross-tenant messaging
-- Drop the old policy
DROP POLICY IF EXISTS "Users can view their internal messages" ON public.internal_messages;

-- Create new policy that allows viewing messages regardless of tenant if they're addressed to you
CREATE POLICY "Users can view their internal messages"
ON public.internal_messages
FOR SELECT
TO authenticated
USING (
  recipient_id = auth.uid() 
  OR is_broadcast = true
  OR sender_id = auth.uid()
);

-- Also update the supervisors policy to be less restrictive
DROP POLICY IF EXISTS "Supervisors can view all internal messages" ON public.internal_messages;

CREATE POLICY "Supervisors can view all messages they sent"
ON public.internal_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'supervisor')
  )
  AND sender_id = auth.uid()
);