import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const loadUnreadCount = async () => {
      const { data, error } = await supabase
        .from('internal_messages')
        .select('id, is_read, recipient_id, is_broadcast, sender_id')
        .eq('is_read', false);

      if (error) {
        console.error('Error loading unread count:', error);
        return;
      }

      const myUnread = data?.filter(
        m => m.recipient_id === user.id || (m.is_broadcast && m.sender_id !== user.id)
      ).length || 0;

      setUnreadCount(myUnread);
    };

    loadUnreadCount();

    // Real-time subscription
    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internal_messages'
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return unreadCount;
}
