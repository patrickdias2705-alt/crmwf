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
          // Para estágios FINAIS: contar apenas UNIQUE leads (1 vez por lead)
          const { data: uniqueLeads, error: uniqueError } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', user?.tenant_id)
            .eq('stage_id', stage.id);

          if (!uniqueError && uniqueLeads) {
            count = uniqueLeads || 0;
          }

          console.log(`🏁 [FINAL] ${stage.name}: ${count} leads únicos`);
        } else {
          // Para estágios NORMAIS: contar TODOS os eventos de passagem
          console.log(`🔍 Buscando eventos para estágio: ${stage.name} (${stage.id})`);
          
          // Buscar todos os eventos onde o lead foi movido PARA este estágio
          const { data: allEvents, error: eventsError } = await supabase
            .from('lead_events')
            .select('data, created_at')
            .eq('tenant_id', user?.tenant_id)
            .eq('type', 'stage_moved');

          console.log(`📊 Total de eventos 'stage_moved' no tenant:`, allEvents?.length || 0);

          let eventCount = 0;
          if (!eventsError && allEvents) {
            // Filtrar manualmente os eventos que têm este stage_id no "to"
            const filteredEvents = allEvents.filter((event: any) => {
              const matches = event.data?.to?.stage_id === stage.id;
              if (matches) {
                console.log(`✅ Evento match para ${stage.name}:`, event.data);
              }
              return matches;
            });
            eventCount = filteredEvents.length;
            console.log(`🎯 Eventos filtrados para ${stage.name}:`, eventCount);
          } else if (eventsError) {
            console.error(`❌ Erro ao buscar eventos:`, eventsError);
          }

          // Buscar leads atuais no estágio
          const { count: currentCount, error: currentError } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', user?.tenant_id)
            .eq('stage_id', stage.id);

          console.log(`👥 Leads atuais em ${stage.name}:`, currentCount || 0);
          
          if (currentError) {
            console.error(`❌ Erro ao buscar leads:`, currentError);
          }
          
          // Usar o maior valor entre eventos e leads atuais
          count = Math.max(eventCount, currentCount || 0);

          console.log(`✅ [NORMAL] ${stage.name}: TOTAL = ${count} (eventos: ${eventCount}, atuais: ${currentCount || 0})`);
        }

        funnelStages.push({
          name: stage.name,
          value: count,
          color: stage.color || '#3B82F6'
        });
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
          Jornada completa dos leads por todos os estágios da pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConversionFunnel data={funnelData} />
      </CardContent>
    </Card>
  );
}

