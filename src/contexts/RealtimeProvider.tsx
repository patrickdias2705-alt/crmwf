import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: string;
  tenant_id: string;
  user_id?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  emit: (eventType: string, payload: any) => void;
  subscribe: (eventType: string, callback: (event: RealtimeEvent) => void) => () => void;
  presence: Record<string, any>;
  trackPresence: (state: any) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [subscribers, setSubscribers] = useState<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map());
  const [presence, setPresence] = useState<Record<string, any>>({});

  // Initialize channel when user is authenticated
  useEffect(() => {
    if (!user?.id || !user?.tenant_id) {
      return;
    }

    console.log('🔄 Initializing realtime channel for tenant:', user.tenant_id);

    const tenantChannel = supabase.channel(`tenant_${user.tenant_id}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Handle connection status
    tenantChannel.on('presence', { event: 'sync' }, () => {
      const newState = tenantChannel.presenceState();
      console.log('👥 Presence sync:', newState);
      setPresence(newState);
    });

    tenantChannel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('👋 User joined:', key, newPresences);
    });

    tenantChannel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('👋 User left:', key, leftPresences);
    });

    // Handle custom realtime events
    tenantChannel.on('broadcast', { event: '*' }, ({ event, payload }) => {
      console.log('📡 Received broadcast:', event, payload);
      
      const realtimeEvent: RealtimeEvent = {
        type: event,
        payload: payload.data || payload,
        timestamp: payload.timestamp || new Date().toISOString(),
        tenant_id: user.tenant_id!,
        user_id: payload.user_id,
      };

      // Notify all subscribers for this event type
      const eventSubscribers = subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.forEach(callback => {
          try {
            callback(realtimeEvent);
          } catch (error) {
            console.error('Error in realtime subscriber:', error);
          }
        });
      }

      // Also notify wildcard subscribers
      const wildcardSubscribers = subscribers.get('*');
      if (wildcardSubscribers) {
        wildcardSubscribers.forEach(callback => {
          try {
            callback(realtimeEvent);
          } catch (error) {
            console.error('Error in wildcard subscriber:', error);
          }
        });
      }
    });

    // Subscribe to channel
    tenantChannel.subscribe(async (status) => {
      console.log('📡 Channel status:', status);
      setIsConnected(status === 'SUBSCRIBED');
      
      if (status === 'SUBSCRIBED') {
        // Track user presence
        const presenceData = {
          user_id: user.id,
          user_name: user.name,
          online_at: new Date().toISOString(),
          page: window.location.pathname,
        };

        const trackStatus = await tenantChannel.track(presenceData);
        console.log('👤 Presence track status:', trackStatus);
      }
    });

    setChannel(tenantChannel);

    return () => {
      console.log('🔌 Disconnecting realtime channel');
      tenantChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
      setPresence({});
    };
  }, [user?.tenant_id, user?.id, user?.name]);

  // Emit event to channel
  const emit = useCallback((eventType: string, payload: any) => {
    if (!channel || !isConnected) {
      console.warn('⚠️ Cannot emit - channel not connected:', eventType);
      return;
    }

    const eventData = {
      data: payload,
      timestamp: new Date().toISOString(),
      user_id: user?.id,
    };

    console.log('📤 Emitting event:', eventType, eventData);

    channel.send({
      type: 'broadcast',
      event: eventType,
      payload: eventData,
    });
  }, [channel, isConnected, user?.id]);

  // Subscribe to events
  const subscribe = useCallback((eventType: string, callback: (event: RealtimeEvent) => void) => {
    console.log('🔔 Subscribing to event:', eventType);

    setSubscribers(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(eventType)) {
        newMap.set(eventType, new Set());
      }
      newMap.get(eventType)!.add(callback);
      return newMap;
    });

    // Return unsubscribe function
    return () => {
      console.log('🔕 Unsubscribing from event:', eventType);
      setSubscribers(prev => {
        const newMap = new Map(prev);
        const eventSubs = newMap.get(eventType);
        if (eventSubs) {
          eventSubs.delete(callback);
          if (eventSubs.size === 0) {
            newMap.delete(eventType);
          }
        }
        return newMap;
      });
    };
  }, []);

  // Track presence updates
  const trackPresence = useCallback(async (state: any) => {
    if (!channel || !isConnected) {
      console.warn('⚠️ Cannot track presence - channel not connected');
      return;
    }

    const presenceData = {
      ...state,
      user_id: user?.id,
      updated_at: new Date().toISOString(),
    };

    console.log('👤 Tracking presence:', presenceData);
    await channel.track(presenceData);
  }, [channel, isConnected, user?.id]);

  const contextValue: RealtimeContextType = {
    isConnected,
    emit,
    subscribe,
    presence,
    trackPresence,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}