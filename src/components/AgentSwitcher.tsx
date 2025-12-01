import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, UserCheck, ArrowLeftRight, Home } from 'lucide-react';
import { useTenantView } from '@/contexts/TenantViewContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  tenant_id: string;
  tenants: {
    name: string;
  };
}

export function AgentSwitcher() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { 
    isViewingAgent, 
    viewingAgentName, 
    viewingAgentId,
    viewingTenantName,
    setViewingTenant,
    canSwitchTenant 
  } = useTenantView();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (canSwitchTenant) {
      loadAgents();
    }
  }, [canSwitchTenant]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          active,
          tenant_id,
          tenants (
            name
          )
        `)
        .eq('role', 'agent')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
      toast.error('Erro ao carregar lista de agentes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    console.log('🎯 Trocando para agente:', agent.name);
    const tenantName = agent.tenants?.name || 'Sem tenant';
    setViewingTenant(agent.tenant_id, tenantName, agent.id, agent.name);
    toast.success(`Visualizando painel de ${agent.name}`, {
      description: 'Todos os dados agora são do agente selecionado',
      duration: 3000,
    });
    // Navigate to dashboard
    navigate('/');
  };

  const handleReturnToOwn = () => {
    console.log('🏠 Voltando para própria conta');
    setViewingTenant(null, null);
    toast.info('Voltou para sua própria conta');
    navigate('/');
  };

  const handleGoToSupervisor = () => {
    setViewingTenant(null, null);
    navigate('/supervisor');
  };

  // Don't show if user doesn't have permission
  if (!canSwitchTenant) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isViewingAgent ? "default" : "outline"}
          size="sm" 
          className="gap-2"
        >
          {isViewingAgent ? (
            <>
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{viewingAgentName?.split(' ')[0]}</span>
              <Badge variant="secondary" className="ml-1 hidden md:inline-flex">
                Agente
              </Badge>
            </>
          ) : (
            <>
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Trocar Agente</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Selecionar Agente
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {isViewingAgent && (
          <>
            <div className="px-2 py-3 text-sm bg-primary/10 mx-2 rounded-lg mb-2">
              <div className="flex items-center gap-2 text-primary">
                <Eye className="h-4 w-4" />
                <div>
                  <div className="font-semibold">{viewingAgentName}</div>
                  <div className="text-xs text-muted-foreground">{viewingTenantName}</div>
                </div>
              </div>
            </div>
            
            <DropdownMenuItem onClick={handleReturnToOwn} className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para minha conta
            </DropdownMenuItem>

            {hasRole(['admin', 'supervisor']) && (
              <DropdownMenuItem onClick={handleGoToSupervisor} className="gap-2">
                <Users className="h-4 w-4" />
                Painel Supervisor
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
          </>
        )}

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Carregando agentes...
            </div>
          ) : agents.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Nenhum agente ativo encontrado
            </div>
          ) : (
            agents.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => handleSelectAgent(agent)}
                className={`gap-2 ${
                  agent.id === viewingAgentId 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{agent.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {agent.tenants?.name || 'Sem tenant'}
                  </div>
                </div>
                {agent.id === viewingAgentId && (
                  <Eye className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>

        {!loading && agents.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground text-center">
              {agents.length} agente{agents.length !== 1 ? 's' : ''} ativo{agents.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}





