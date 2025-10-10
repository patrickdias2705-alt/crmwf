-- Create function to make a lead public (accessible to all supervisors)
-- This allows agents to "promote" important leads to the general list

CREATE OR REPLACE FUNCTION public.make_lead_public(lead_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_lead RECORD;
  current_user_id UUID;
  current_tenant_id UUID;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  current_tenant_id := get_user_tenant_id();

  -- Check if user has permission (must be owner or have manager+ role)
  IF NOT EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = lead_id
      AND l.tenant_id = current_tenant_id
      AND (
        l.owner_user_id = current_user_id
        OR has_role('admin'::app_role)
        OR has_role('client_owner'::app_role)
        OR has_role('manager'::app_role)
      )
  ) THEN
    RAISE EXCEPTION 'Permission denied: You do not have access to this lead';
  END IF;

  -- Update lead to be public
  UPDATE leads
  SET 
    is_public = true,
    updated_at = NOW()
  WHERE id = lead_id
    AND tenant_id = current_tenant_id
  RETURNING * INTO updated_lead;

  -- Log the event
  INSERT INTO lead_events (
    tenant_id,
    lead_id,
    type,
    actor,
    user_id,
    data
  ) VALUES (
    current_tenant_id,
    lead_id,
    'lead.made_public',
    'user',
    current_user_id,
    jsonb_build_object(
      'previous_is_public', false,
      'new_is_public', true,
      'user_name', (SELECT name FROM users WHERE id = current_user_id)
    )
  );

  -- Return success with lead data
  RETURN jsonb_build_object(
    'success', true,
    'lead_id', lead_id,
    'is_public', true,
    'message', 'Lead successfully made public'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.make_lead_public(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.make_lead_public IS 'Marks a lead as public, making it visible to all supervisors and managers in the tenant';



