import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WhatsAppState {
  instanceId: string | null;
  qrCode: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  isConnected: boolean;
  lastUpdate: number | null;
  error: string | null;
}

interface WhatsAppActions {
  setInstanceId: (instanceId: string | null) => void;
  setQrCode: (qrCode: string | null) => void;
  setConnectionStatus: (status: WhatsAppState['connectionStatus']) => void;
  setError: (error: string | null) => void;
  clearState: () => void;
  updateLastUpdate: () => void;
}

const initialState: WhatsAppState = {
  instanceId: null,
  qrCode: null,
  connectionStatus: 'disconnected',
  isConnected: false,
  lastUpdate: null,
  error: null
};

export const useWhatsAppStore = create<WhatsAppState & WhatsAppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setInstanceId: (instanceId) => {
        set({ instanceId, error: null });
        get().updateLastUpdate();
      },

      setQrCode: (qrCode) => {
        set({ qrCode, error: null });
        get().updateLastUpdate();
      },

      setConnectionStatus: (connectionStatus) => {
        const isConnected = connectionStatus === 'connected';
        set({ connectionStatus, isConnected, error: null });
        get().updateLastUpdate();
      },

      setError: (error) => {
        set({ error, connectionStatus: 'error' });
        get().updateLastUpdate();
      },

      clearState: () => {
        set(initialState);
      },

      updateLastUpdate: () => {
        set({ lastUpdate: Date.now() });
      }
    }),
    {
      name: 'whatsapp-store',
      partialize: (state) => ({
        instanceId: state.instanceId,
        connectionStatus: state.connectionStatus,
        isConnected: state.isConnected
      })
    }
  )
);
