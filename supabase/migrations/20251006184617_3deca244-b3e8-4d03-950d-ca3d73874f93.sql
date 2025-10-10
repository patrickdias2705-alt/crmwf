-- Fix RLS policies for internal_messages to allow agents to reply

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Supervisors can create internal messages" ON public.internal_messages;

-- Create new INSERT policy that allows:
-- 1. Supervisors to send any messages (direct or broadcast)
-- 2. Regular users to send direct messages (replies)
CREATE POLICY "Users can send direct messages, supervisors can broadcast"
ON public.internal_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Supervisors can send any message (including broadcasts)
  (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'supervisor')
    )
  )
  OR
  -- Regular users can send direct messages (not broadcasts)
  (
    is_broadcast = false 
    AND sender_id = auth.uid()
    AND tenant_id = get_user_tenant_id()
  )
);