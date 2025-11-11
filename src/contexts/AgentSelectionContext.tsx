import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface AgentSelectionContextType {
  selectedAgentId: string | null;
  selectedAgentName: string | null;
  agents: Agent[];
  setSelectedAgent: (agentId: string | null, agentName?: string | null) => void;
  isLoadingAgents: boolean;
  isSupervisor: boolean;
}

const AgentSelectionContext = createContext<AgentSelectionContextType | undefined>(undefined);

export function useAgentSelection() {
  const context = useContext(AgentSelectionContext);
  if (!context) {
    throw new Error('useAgentSelection must be used within AgentSelectionProvider');
  }
  return context;
}

export function AgentSelectionProvider({ children }: { children: React.ReactNode }) {
  const { user, hasRole } = useAuth();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  
  const isSupervisor = hasRole(['supervisor', 'admin']);

  // Carregar lista de agentes quando for supervisor
  useEffect(() => {
    if (isSupervisor && user?.tenant_id) {
      loadAgents();
    } else {
      setAgents([]);
      setSelectedAgentId(null);
      setSelectedAgentName(null);
    }
  }, [isSupervisor, user?.tenant_id]);

  const loadAgents = async () => {
    if (!user?.tenant_id) return;
    
    setIsLoadingAgents(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('tenant_id', user.tenant_id)
        .eq('role', 'agent')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Erro ao carregar agentes:', error);
        setAgents([]);
      } else {
        setAgents(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
      setAgents([]);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const setSelectedAgent = (agentId: string | null, agentName?: string | null) => {
    setSelectedAgentId(agentId);
    if (agentName) {
      setSelectedAgentName(agentName);
    } else if (agentId) {
      // Buscar nome do agente na lista
      const agent = agents.find(a => a.id === agentId);
      setSelectedAgentName(agent?.name || null);
    } else {
      setSelectedAgentName(null);
    }
  };

  return (
    <AgentSelectionContext.Provider
      value={{
        selectedAgentId,
        selectedAgentName,
        agents,
        setSelectedAgent,
        isLoadingAgents,
        isSupervisor,
      }}
    >
      {children}
    </AgentSelectionContext.Provider>
  );
}

