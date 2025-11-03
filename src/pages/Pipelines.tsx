import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CreateLeadDialog } from '@/components/CreateLeadDialog';
import { ManageStagesDialog } from '@/components/ManageStagesDialog';
import { LeadDetailsModal } from '@/components/LeadDetailsModal';
import { useTenantView } from '@/contexts/TenantViewContext';

interface Stage {
  id: string;
  name: string;
  order: number;
  pipeline_id: string;
  tenant_id: string;
  color?: string;
}

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  stage_id: string;
  pipeline_id: string;
  tags: any;
  fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function Pipelines() {
  const { user, hasRole, forceUpdate } = useAuth();
  const { viewingAgentId, isViewingAgent } = useTenantView();
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesByLeadId, setSalesByLeadId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      console.log('📊 Pipelines - Loading for:', { 
        viewingAgentId, 
        isViewingAgent,
        userEmail: user?.email,
        userRole: user?.role,
        isSupervisor: hasRole(['supervisor'])
      });

      // SEMPRE usar o tenant_id do usuário logado para ver as pipelines corretas
      const effectiveTenantId = user?.tenant_id;
      
      console.log('🏠 Pipelines - Usando tenant do usuário:', effectiveTenantId);

      // Load stages - SEMPRE do usuário logado
      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .order('order');

      if (stagesError) throw stagesError;

      // Load leads - SEMPRE do usuário logado, mas com filtro de agente se necessário
      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', effectiveTenantId);

      // Filter by agent if viewing specific agent
      if (isViewingAgent && viewingAgentId) {
        leadsQuery = leadsQuery.eq('assigned_to', viewingAgentId);
        console.log('👤 Pipelines - Filtrando por agente:', viewingAgentId);
      }

      const { data: leadsData, error: leadsError } = await leadsQuery
        .order('updated_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Load sales for these leads
      const leadIds = (leadsData || []).map(l => l.id);
      let salesMap: Record<string, number> = {};
      
      if (leadIds.length > 0 && effectiveTenantId) {
        const { data: salesData } = await supabase
          .from('sales')
          .select('lead_id, amount')
          .eq('tenant_id', effectiveTenantId)
          .in('lead_id', leadIds);
        
        if (salesData) {
          salesMap = salesData.reduce((acc, sale) => {
            const amount = parseFloat(sale.amount || 0) || 0;
            acc[sale.lead_id] = (acc[sale.lead_id] || 0) + amount;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      console.log('📊 Pipelines - Dados carregados:', {
        stages: stagesData?.length || 0,
        leads: leadsData?.length || 0,
        sales: Object.keys(salesMap).length,
        effectiveTenantId
      });

      setStages(stagesData || []);
      setLeads((leadsData || []).map(lead => ({
        ...lead,
        tags: Array.isArray(lead.tags) ? lead.tags : [],
        fields: typeof lead.fields === 'object' ? lead.fields : {}
      })));
      setSalesByLeadId(salesMap);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
      toast.error('Erro ao carregar dados do pipeline');
    } finally {
      setLoading(false);
    }
  }, [user?.tenant_id, viewingAgentId, isViewingAgent]);

  useEffect(() => {
    if (user?.tenant_id) {
      console.log('📊 Pipelines - Recarregando dados, forceUpdate:', forceUpdate);
      loadData();
    }
  }, [user?.tenant_id, viewingAgentId, isViewingAgent, forceUpdate, loadData]);

  useEffect(() => {
    if (!user?.tenant_id) return;

    // Subscribe to realtime changes for leads AND stages
    const leadsChannel = supabase
      .channel('pipelines-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Lead changed:', payload);
          loadData();
        }
      )
      .subscribe();

    const stagesChannel = supabase
      .channel('pipelines-stages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stages'
        },
        (payload) => {
          console.log('Stage changed:', payload);
          loadData();
        }
      )
      .subscribe();

    const salesChannel = supabase
      .channel('pipelines-sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          console.log('Sale changed:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(stagesChannel);
      supabase.removeChannel(salesChannel);
    };
  }, [user?.tenant_id, loadData]);

  const handleMoveCard = async (cardId: string, newStageId: string) => {
    // Verificar se o usuário pode mover leads
    if (hasRole(['supervisor'])) {
      toast.error('Supervisores não podem mover leads. Apenas visualização permitida.');
      return;
    }

    try {
      console.log(`Moving lead ${cardId} to stage ${newStageId}`);
      
      // Optimistic update
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === cardId ? { ...lead, stage_id: newStageId } : lead
        )
      );

      // Update in database - trigger will handle metrics automatically
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          stage_id: newStageId, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Log the stage change event
      const { error: eventError } = await supabase.from('lead_events').insert({
        tenant_id: user?.tenant_id,
        lead_id: cardId,
        type: 'lead.stage_changed',
        actor: 'user',
        data: { new_stage_id: newStageId }
      });

      if (eventError) console.error('Error logging event:', eventError);

      toast.success('Lead movido com sucesso');
    } catch (error) {
      console.error('Error moving lead:', error);
      toast.error('Erro ao mover lead');
      // Revert optimistic update on error
      loadData();
    }
  };

  const getStageStats = (stageId: string) => {
    const stageLeads = leads.filter(lead => lead.stage_id === stageId);
    
    // Dinheiro na Mesa: Soma dos orçamentos/propostas que NÃO foram vendidos ainda
    // Só conta se tem orçamento E não tem venda na tabela sales
    const dinheiroNaMesa = stageLeads.reduce((acc, lead) => {
      const budgetAmount = parseFloat(lead.fields?.budget_amount || 0) || 0;
      const temVenda = salesByLeadId[lead.id] && salesByLeadId[lead.id] > 0;
      
      // Só conta se tem orçamento mas NÃO foi vendido ainda
      if (budgetAmount > 0 && !temVenda) {
        return acc + budgetAmount;
      }
      return acc;
    }, 0);

    // Dinheiro no Bolso: Soma das vendas fechadas (da tabela sales)
    const dinheiroNoBolso = stageLeads.reduce((acc, lead) => {
      return acc + (salesByLeadId[lead.id] || 0);
    }, 0);

    return {
      count: stageLeads.length,
      value: stageLeads.reduce((acc, lead) => acc + (lead.fields?.value || 0), 0),
      dinheiroNaMesa,
      dinheiroNoBolso
    };
  };

  const formatTags = (tags: any): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [tags];
      }
    }
    return [];
  };

  const handleLeadDoubleClick = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  const getTotalStats = () => {
    return {
      totalLeads: leads.length,
      totalValue: leads.reduce((acc, lead) => acc + (lead.fields?.value || 0), 0),
      conversionRate: leads.length > 0 
        ? ((leads.filter(lead => {
            const stage = stages.find(s => s.id === lead.stage_id);
            return stage?.name.toLowerCase().includes('fechado') || 
                   stage?.name.toLowerCase().includes('vendido');
          }).length / leads.length) * 100).toFixed(1)
        : '0'
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const stats = getTotalStats();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pipelines</h1>
            <p className="text-muted-foreground">
              {hasRole(['supervisor']) 
                ? 'Visualização das pipelines (somente leitura)'
                : 'Gerencie seus leads através do pipeline de vendas'
              }
            </p>
            {/* Debug info */}
            <div className="mt-1 text-xs text-gray-500">
              Debug: Role={user?.role}, isSupervisor={hasRole(['supervisor']) ? 'true' : 'false'}
            </div>
            {hasRole(['supervisor']) && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                👁️ Modo Visualização
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ManageStagesDialog />
            {hasRole(['admin', 'agent']) && (
              <CreateLeadDialog onLeadCreated={loadData} />
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                no pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(stats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                em negociação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                de fechamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
            <CardDescription>
              {hasRole(['supervisor']) 
                ? 'Visualização das pipelines (somente leitura)'
                : 'Arraste e solte os leads entre os estágios para atualizar o status'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stages.length > 0 ? (
              <KanbanBoard 
                stages={stages}
                leads={leads}
                onMoveCard={handleMoveCard}
                getStageStats={getStageStats}
                onLeadUpdated={loadData}
                onLeadDoubleClick={handleLeadDoubleClick}
                canMoveLeads={!hasRole(['supervisor'])}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6">
                <p className="text-lg mb-2">Nenhum estágio encontrado</p>
                <p className="text-sm">Configure os estágios do seu pipeline primeiro.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Lead */}
        <LeadDetailsModal
          lead={selectedLead}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onLeadUpdated={loadData}
          formatTags={formatTags}
        />
      </div>
    </Layout>
  );
}
