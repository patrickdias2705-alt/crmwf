import { useEffect, useRef } from 'react';
import { useRealtime } from '@/contexts/RealtimeProvider';

interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: string;
  tenant_id: string;
  user_id?: string;
}

interface UseRealtimeSubscriptionOptions {
  events: string[];
  onEvent: (event: RealtimeEvent) => void;
  deps?: any[];
}

export function useRealtimeSubscription({ events, onEvent, deps = [] }: UseRealtimeSubscriptionOptions) {
  const { subscribe, isConnected } = useRealtime();
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const onEventRef = useRef(onEvent);

  // Keep callback ref updated
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    console.log('🔔 Setting up realtime subscriptions for:', events);

    // Clean up previous subscriptions
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Subscribe to each event
    events.forEach(eventType => {
      const unsubscribe = subscribe(eventType, (event) => {
        console.log('📥 Received realtime event:', event.type, event.payload);
        onEventRef.current(event);
      });
      unsubscribersRef.current.push(unsubscribe);
    });

    return () => {
      console.log('🔕 Cleaning up realtime subscriptions');
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [isConnected, subscribe, JSON.stringify(events), ...deps]);

  return { isConnected };
}
