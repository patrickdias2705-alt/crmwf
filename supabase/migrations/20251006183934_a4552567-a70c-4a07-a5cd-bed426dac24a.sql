-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule cleanup job to run every hour
SELECT cron.schedule(
  'cleanup-internal-messages-24h',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
      url:='https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/cleanup-messages',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);