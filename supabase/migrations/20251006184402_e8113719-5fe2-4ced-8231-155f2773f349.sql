-- Fix infinite recursion in internal_messages RLS policies

-- Drop existing UPDATE policy that causes recursion
DROP POLICY IF EXISTS "Users can update their messages read status" ON public.internal_messages;

-- Create a simpler, non-recursive UPDATE policy
CREATE POLICY "Users can mark their messages as read"
ON public.internal_messages
FOR UPDATE
TO authenticated
USING (
  -- User can update if they are the recipient
  (recipient_id = auth.uid())
  OR
  -- Or if it's a broadcast message and they're in the same tenant
  (is_broadcast = true AND tenant_id = get_user_tenant_id())
)
WITH CHECK (
  -- Can only update is_read field for their own messages
  (recipient_id = auth.uid())
  OR
  (is_broadcast = true AND tenant_id = get_user_tenant_id())
);