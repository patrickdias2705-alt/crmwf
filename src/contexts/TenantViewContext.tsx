import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TenantViewContextType {
  viewingTenantId: string | null;
  viewingTenantName: string | null;
  viewingAgentId: string | null;
  viewingAgentName: string | null;
  setViewingTenant: (tenantId: string | null, tenantName: string | null, agentId?: string | null, agentName?: string | null) => void;
  isViewingOtherTenant: boolean;
  isViewingAgent: boolean;
  canSwitchTenant: boolean;
}

const TenantViewContext = createContext<TenantViewContextType | undefined>(undefined);

export function useTenantView() {
  const context = useContext(TenantViewContext);
  if (!context) {
    throw new Error('useTenantView must be used within TenantViewProvider');
  }
  return context;
}

export function TenantViewProvider({ children }: { children: React.ReactNode }) {
  const { user, hasRole } = useAuth();
  const [viewingTenantId, setViewingTenantId] = useState<string | null>(null);
  const [viewingTenantName, setViewingTenantName] = useState<string | null>(null);
  const [viewingAgentId, setViewingAgentId] = useState<string | null>(null);
  const [viewingAgentName, setViewingAgentName] = useState<string | null>(null);
  
  const canSwitchTenant = hasRole(['admin', 'supervisor']);
  const isViewingOtherTenant = viewingTenantId !== null && viewingTenantId !== user?.tenant_id;
  const isViewingAgent = viewingAgentId !== null;

  useEffect(() => {
    // Reset viewing tenant when user changes or loses permission
    if (!canSwitchTenant) {
      setViewingTenantId(null);
      setViewingTenantName(null);
      setViewingAgentId(null);
      setViewingAgentName(null);
    }
  }, [canSwitchTenant]);

  const setViewingTenant = (tenantId: string | null, tenantName: string | null, agentId?: string | null, agentName?: string | null) => {
    if (!canSwitchTenant) return;
    console.log('🔍 Setting tenant view:', { tenantId, tenantName, agentId, agentName });
    setViewingTenantId(tenantId);
    setViewingTenantName(tenantName);
    setViewingAgentId(agentId || null);
    setViewingAgentName(agentName || null);
  };

  // Helper to get effective tenant ID for queries
  const getEffectiveTenantId = () => {
    return isViewingOtherTenant ? viewingTenantId : user?.tenant_id;
  };

  return (
    <TenantViewContext.Provider
      value={{
        viewingTenantId: getEffectiveTenantId(),
        viewingTenantName,
        viewingAgentId,
        viewingAgentName,
        setViewingTenant,
        isViewingOtherTenant,
        isViewingAgent,
        canSwitchTenant,
      }}
    >
      {children}
    </TenantViewContext.Provider>
  );
}