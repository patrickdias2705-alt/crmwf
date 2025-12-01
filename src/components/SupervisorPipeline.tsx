import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KanbanBoard } from '@/components/KanbanBoard';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';

interface SupervisorPipelineProps {
  selectedAgent: string;
}

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
  phone?: string | null;
  email?: string | null;
  stage_id: string;
  pipeline_id: string;
  tags: any;
  fields: any;
  created_at: string;
  updated_at: string;
}

export function SupervisorPipeline({ selectedAgent }: SupervisorPipelineProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipelineData();
    
    console.log('🔍 SupervisorPipeline - Agent:', selectedAgent);

    // Subscribe to real-time updates
    const leadsChannel = supabase
      .channel('supervisor-pipeline-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          console.log('🔄 Lead updated, reloading pipeline data');
          loadPipelineData();
        }
      )
      .subscribe();

    const stagesChannel = supabase
      .channel('supervisor-pipeline-stages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stages'
        },
        () => {
          console.log('🔄 Stage updated, reloading pipeline data');
          loadPipelineData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(stagesChannel);
    };
  }, [selectedAgent]);

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading pipeline - Agent:', selectedAgent);

      // If no agent selected or "all", show nothing
      if (!selectedAgent || selectedAgent === 'all') {
        console.log('⚠️ No specific agent selected');
        setStages([]);
        setLeads([]);
        setLoading(false);
        return;
      }
      
      // Get the agent's tenant
      const { data: agentData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', selectedAgent)
        .single();
      
      if (!agentData) {
        console.log('⚠️ Agent not found');
        setStages([]);
        setLeads([]);
        setLoading(false);
        return;
      }

      const targetTenantId = agentData.tenant_id;
      console.log('🎯 Agent tenant:', targetTenantId);

      // Get default pipeline for the agent's tenant
      const { data: pipeline } = await supabase
        .from('pipelines')
        .select('id')
        .eq('tenant_id', targetTenantId)
        .eq('is_default', true)
        .limit(1)
        .single();

      if (!pipeline) {
        console.log('⚠️ No default pipeline found for tenant:', targetTenantId);
        setStages([]);
        setLeads([]);
        setLoading(false);
        return;
      }

      // Load stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .eq('pipeline_id', pipeline.id)
        .eq('tenant_id', targetTenantId)
        .order('order');

      if (stagesError) throw stagesError;

      // Load leads - FILTER BY SELECTED AGENT
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('pipeline_id', pipeline.id)
        .eq('tenant_id', targetTenantId)
        .eq('assigned_to', selectedAgent);

      if (leadsError) throw leadsError;

      setStages(stagesData || []);
      setLeads(leadsData || []);
      
      console.log('✅ Pipeline loaded:', stagesData?.length, 'stages,', leadsData?.length, 'leads for agent:', selectedAgent);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
      toast.error('Erro ao carregar pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveCard = async (leadId: string, newStageId: string) => {
    try {
      console.log('🔄 Moving lead', leadId, 'to stage', newStageId);
      
      const { error } = await supabase
        .from('leads')
        .update({ stage_id: newStageId })
        .eq('id', leadId);

      if (error) throw error;

      // Optimistically update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, stage_id: newStageId } : lead
      ));

      toast.success('Lead movido com sucesso');
    } catch (error) {
      console.error('Error moving lead:', error);
      toast.error('Erro ao mover lead');
      // Reload data on error
      loadPipelineData();
    }
  };

  const getStageStats = (stageId: string) => {
    const stageLeads = leads.filter(lead => lead.stage_id === stageId);
    return {
      count: stageLeads.length,
      value: 0 // Could calculate total value if we have budget data
    };
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando pipeline...</p>
      </div>
    );
  }

  if (!selectedAgent || selectedAgent === 'all') {
    return (
      <div className="text-center p-8">
        <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Selecione um agente para visualizar o pipeline
        </p>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Nenhum pipeline encontrado para este agente
        </p>
      </div>
    );
  }

  return (
    <KanbanBoard
      stages={stages}
      leads={leads}
      onMoveCard={handleMoveCard}
      getStageStats={getStageStats}
    />
  );
}
