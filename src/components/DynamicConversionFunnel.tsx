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

      // 2. Buscar leads por estágio atual (método simplificado)
      const { data: leadsByStage, error: leadsError } = await supabase
        .from('leads')
        .select(`
          stage_id,
          stages!inner(name, color, order)
        `)
        .eq('tenant_id', user?.tenant_id);

      if (leadsError) {
        console.error('❌ Erro ao buscar leads:', leadsError);
        throw leadsError;
      }

      console.log('📊 Total de leads encontrados:', leadsByStage?.length || 0);

      // 3. Contar leads por estágio
      const stageCounts: Record<string, number> = {};
      
      if (leadsByStage) {
        leadsByStage.forEach((lead: any) => {
          const stageId = lead.stage_id;
          stageCounts[stageId] = (stageCounts[stageId] || 0) + 1;
        });
      }

      console.log('📊 Contagem por estágio:', stageCounts);

      // 4. Construir dados do funil
      const funnelStages: FunnelStage[] = stages.map(stage => {
        const count = stageCounts[stage.id] || 0;
        console.log(`📊 ${stage.name}: ${count} leads`);
        
        return {
          name: stage.name,
          value: count,
          color: stage.color || '#3B82F6'
        };
      });

      // 5. Mostrar TODOS os estágios (mesmo os vazios)
      // Não filtrar - manter todos os estágios configurados
      
      console.log('✅ Funil construído (todos os estágios):', funnelStages);
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
          Leads atualmente em cada estágio do pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConversionFunnel data={funnelData} />
      </CardContent>
    </Card>
  );
}

