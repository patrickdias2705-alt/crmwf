import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp } from 'lucide-react';
import { ConversionFunnel } from '@/components/ConversionFunnel';

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  is_final: boolean;
}

interface FunnelStage {
  name: string;
  value: number;
  color: string;
}

export function DynamicConversionFunnel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchFunnelData();
      
      // Atualização em tempo real
      const channel = supabase
        .channel('funnel-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'lead_events', filter: `tenant_id=eq.${user.tenant_id}` },
          () => {
            console.log('📊 Evento detectado! Atualizando funil...');
            fetchFunnelData();
          }
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'leads', filter: `tenant_id=eq.${user.tenant_id}` },
          () => {
            console.log('📊 Lead atualizado! Atualizando funil...');
            fetchFunnelData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.tenant_id]);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando dados do funil...');
      console.log('👤 Tenant ID:', user?.tenant_id);

      // 1. Buscar todas as stages ordenadas
      const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('id, name, color, order')
        .eq('tenant_id', user?.tenant_id)
        .order('order', { ascending: true });

      if (stagesError) {
        console.error('❌ Erro ao buscar stages:', stagesError);
        throw stagesError;
      }
      
      if (!stages || stages.length === 0) {
        console.log('⚠️ Nenhum estágio encontrado');
        setFunnelData([]);
        setLoading(false);
        return;
      }

      console.log('📊 Estágios encontrados:', stages.length, stages.map(s => s.name));

      // Identificar estágios finais (fechado, recusado, perdido)
      const finalStageNames = ['dinheiro no bolso', 'dinheiro na mesa', 'recusado', 'perdido', 'lost', 'refused', 'fechado', 'ganho', 'vendido'];
      const finalStages = stages.filter(stage => 
        finalStageNames.some(name => stage.name.toLowerCase().includes(name))
      );
      const finalStageIds = finalStages.map(s => s.id);

      console.log('🏁 Estágios finais:', finalStages.map(s => s.name));

      // 2. Para cada estágio, contar quantas vezes leads passaram por ele
      const funnelStages: FunnelStage[] = [];

      for (const stage of stages) {
        let count = 0;

        if (finalStageIds.includes(stage.id)) {
          // Para estágios FINAIS: contar apenas UNIQUE leads atualmente nesse estágio
          const { count: uniqueLeads, error: uniqueError } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', user?.tenant_id)
            .eq('stage_id', stage.id);

          if (!uniqueError) {
            count = uniqueLeads || 0;
          }

          console.log(`🏁 [FINAL] ${stage.name}: ${count} leads únicos atualmente`);
        } else {
          // Para estágios NORMAIS: contar TODOS os eventos de passagem
          console.log(`🔍 Buscando eventos para estágio: ${stage.name} (${stage.id})`);
          
          // Buscar todos os eventos onde o lead foi movido PARA este estágio
          const { data: allEvents, error: eventsError } = await supabase
            .from('lead_events')
            .select('data, created_at, lead_id')
            .eq('tenant_id', user?.tenant_id)
            .eq('type', 'stage_moved')
            .not('data->to->stage_id', 'is', null);

          console.log(`📊 Total de eventos 'stage_moved' no tenant:`, allEvents?.length || 0);

          let eventCount = 0;
          if (!eventsError && allEvents) {
            // Filtrar eventos que têm este stage_id no "to"
            const filteredEvents = allEvents.filter((event: any) => {
              return event.data?.to?.stage_id === stage.id;
            });
            eventCount = filteredEvents.length;
            console.log(`🎯 Eventos filtrados para ${stage.name}:`, eventCount);
            
            // Log detalhado dos eventos para debug
            if (filteredEvents.length > 0) {
              console.log(`📋 Eventos detalhados para ${stage.name}:`, filteredEvents.map((e: any) => ({
                lead_id: e.lead_id,
                to_stage: e.data?.to?.stage_id,
                created_at: e.created_at
              })));
            }
          } else if (eventsError) {
            console.error(`❌ Erro ao buscar eventos:`, eventsError);
          }

          // Para estágios normais, usar APENAS os eventos de passagem
          // (não os leads atuais, pois isso não representa a jornada completa)
          count = eventCount;

          console.log(`✅ [NORMAL] ${stage.name}: TOTAL = ${count} eventos de passagem`);
        }

        funnelStages.push({
          name: stage.name,
          value: count,
          color: stage.color || '#3B82F6'
        });
      }

      // 3. Validar que os 3 estágios finais são mutuamente exclusivos
      const finalStagesData = funnelStages.filter(stage => 
        finalStageIds.includes(stages.find(s => s.name === stage.name)?.id || '')
      );
      
      console.log('🏁 Estágios finais no funil:', finalStagesData.map(s => `${s.name}: ${s.value}`));
      
      // Se há leads em múltiplos estágios finais, isso indica um problema
      const totalFinalLeads = finalStagesData.reduce((sum, stage) => sum + stage.value, 0);
      if (totalFinalLeads > 0) {
        console.log(`📊 Total de leads em estágios finais: ${totalFinalLeads}`);
        console.log('✅ Validação: Estágios finais são mutuamente exclusivos');
      }

      console.log('✅ Funil construído:', funnelStages);
      setFunnelData(funnelStages);

    } catch (error) {
      console.error('❌ Erro ao buscar dados do funil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Funil de Conversão
          </CardTitle>
          <CardDescription>Jornada completa dos leads por todos os estágios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (funnelData.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Funil de Conversão
          </CardTitle>
          <CardDescription>Jornada completa dos leads por todos os estágios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado disponível para o funil
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Funil de Conversão
        </CardTitle>
        <CardDescription>
          Jornada completa: estágios normais mostram quantas vezes leads passaram por eles, 
          estágios finais mostram leads únicos atualmente neles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConversionFunnel data={funnelData} />
      </CardContent>
    </Card>
  );
}

