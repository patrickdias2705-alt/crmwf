-- Allow viewing basic user info across tenants for internal messaging
DROP POLICY IF EXISTS "Users can view users in their tenant" ON public.users;

-- Create new policy that allows viewing users in same tenant OR users who sent messages to you
CREATE POLICY "Users can view users in their tenant or message senders"
ON public.users
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
  OR
  id IN (
    SELECT sender_id FROM internal_messages 
    WHERE recipient_id = auth.uid() OR is_broadcast = true
  )
  OR
  id IN (
    SELECT recipient_id FROM internal_messages 
    WHERE sender_id = auth.uid()
  )
);

-- Create a function to clean up old internal messages (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_internal_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.internal_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;