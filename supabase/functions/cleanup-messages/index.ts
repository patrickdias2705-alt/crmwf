import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting cleanup of old internal messages...');

    // Delete messages older than 24 hours
    const { data, error } = await supabase
      .from('internal_messages')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select('id');

    if (error) {
      console.error('❌ Error cleaning up messages:', error);
      throw error;
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Cleaned up ${deletedCount} old messages`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        message: `Deleted ${deletedCount} messages older than 24 hours`
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('❌ Cleanup function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
