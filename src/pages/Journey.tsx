import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreateLeadDialog } from '@/components/CreateLeadDialog';

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
  fields: any;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export default function Journey() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('leads-changes')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      // Load stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .order('order');

      if (stagesError) throw stagesError;

      // Load leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (leadsError) throw leadsError;

      setStages(stagesData || []);
      setLeads((leadsData || []).map(lead => ({
        ...lead,
        tags: Array.isArray(lead.tags) ? lead.tags : [],
        fields: typeof lead.fields === 'object' ? lead.fields : {}
      })));
    } catch (error) {
      console.error('Error loading journey data:', error);
      toast.error('Erro ao carregar dados da jornada');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveCard = async (cardId: string, newStageId: string) => {
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
        .update({ stage_id: newStageId, updated_at: new Date().toISOString() })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Log the stage change event
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userData?.tenant_id) {
        const { error: eventError } = await supabase.from('lead_events').insert({
          lead_id: cardId,
          tenant_id: userData.tenant_id,
          type: 'lead.stage_changed',
          actor: 'user',
          data: { new_stage_id: newStageId }
        });

        if (eventError) console.error('Error logging event:', eventError);
      }

      toast.success('Lead movido com sucesso');
      console.log('Lead moved successfully');
    } catch (error) {
      console.error('Error moving lead:', error);
      toast.error('Erro ao mover lead');
      // Revert optimistic update on error
      loadData();
    }
  };

  const getStageStats = (stageId: string) => {
    const stageLeads = leads.filter(lead => lead.stage_id === stageId);
    return {
      count: stageLeads.length,
      value: stageLeads.reduce((acc, lead) => acc + (lead.fields?.value || 0), 0)
    };
  };

  const getTotalStats = () => {
    return {
      totalLeads: leads.length,
      totalValue: leads.reduce((acc, lead) => acc + (lead.fields?.value || 0), 0),
      conversionRate: leads.length > 0 
        ? ((leads.filter(lead => lead.stage_id === stages.find(s => s.name.toLowerCase().includes('fechado'))?.id).length / leads.length) * 100).toFixed(1)
        : '0'
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando jornada...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = getTotalStats();

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Jornada do Lead</h2>
            <p className="text-muted-foreground">
              Visualize e gerencie seus leads através do pipeline de vendas
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <CreateLeadDialog onLeadCreated={loadData} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                no pipeline atual
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
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
                valor potencial
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
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

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estágios Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stages.length}</div>
              <p className="text-xs text-muted-foreground">
                no pipeline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
            <CardDescription>
              Arraste e solte os leads entre os estágios para atualizar o status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stages.length > 0 ? (
              <KanbanBoard 
                stages={stages}
                leads={leads}
                onMoveCard={handleMoveCard}
                getStageStats={getStageStats}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Nenhum estágio encontrado. Configure seu pipeline primeiro.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}