import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { DollarSign, TrendingUp, Clock, Target } from 'lucide-react';

interface SalesStats {
  total_stats: {
    total_sales: number;
    total_count: number;
    avg_ticket: number;
  };
  today_stats: {
    today_sales: number;
    today_count: number;
    today_avg: number;
  };
  calculated_at: string;
}

export function LiveSalesStats() {
  const { user } = useAuth();
  const { valuesVisible } = useValuesVisibility();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      if (!user?.tenant_id) return;

      // Primeiro: tentar buscar da tabela sales
      let salesData: any[] = [];
      let totalSales = 0;
      let totalCount = 0;
      let todaySales = 0;
      let todayCount = 0;

      try {
        const { data: salesTableData, error: salesError } = await supabase
          .from('sales')
          .select('amount, sold_at')
          .eq('tenant_id', user.tenant_id);

        if (salesError) throw salesError;
        
        if (salesTableData && salesTableData.length > 0) {
          salesData = salesTableData;
          totalSales = salesTableData.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
          totalCount = salesTableData.length;
          
          // Vendas de hoje
          const today = new Date().toISOString().split('T')[0];
          const todayData = salesTableData.filter(sale => 
            sale.sold_at && sale.sold_at.startsWith(today)
          );
          todaySales = todayData.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
          todayCount = todayData.length;
          
          console.log('💰 LiveSalesStats - Dados da tabela sales:', { totalSales, totalCount, todaySales, todayCount });
        }
      } catch (error) {
        console.log('⚠️ Tabela sales não acessível, usando fallback:', error);
      }

      // Fallback: buscar vendas do fields dos leads se tabela sales estiver vazia
      if (salesData.length === 0) {
        try {
          const { data: leadsData } = await supabase
            .from('leads')
            .select('fields, updated_at')
            .eq('tenant_id', user.tenant_id)
            .not('fields->sold', 'is', null)
            .eq('fields->sold', true);

          if (leadsData && leadsData.length > 0) {
            const soldLeads = leadsData.filter(lead => 
              lead.fields?.sold_amount && Number(lead.fields.sold_amount) > 0
            );
            
            totalSales = soldLeads.reduce((sum, lead) => sum + Number(lead.fields?.sold_amount || 0), 0);
            totalCount = soldLeads.length;
            
            // Vendas de hoje (baseado no updated_at)
            const today = new Date().toISOString().split('T')[0];
            const todayData = soldLeads.filter(lead => 
              lead.updated_at && lead.updated_at.startsWith(today)
            );
            todaySales = todayData.reduce((sum, lead) => sum + Number(lead.fields?.sold_amount || 0), 0);
            todayCount = todayData.length;
            
            console.log('💰 LiveSalesStats - Dados do fallback (fields):', { totalSales, totalCount, todaySales, todayCount });
          }
        } catch (error) {
          console.error('Erro ao buscar vendas do fallback:', error);
        }
      }

      const avgTicket = totalCount > 0 ? totalSales / totalCount : 0;
      const todayAvg = todayCount > 0 ? todaySales / todayCount : 0;

      const statsData = {
        success: true,
        total_stats: {
          total_sales: totalSales,
          total_count: totalCount,
          avg_ticket: avgTicket
        },
        today_stats: {
          today_sales: todaySales,
          today_count: todayCount,
          today_avg: todayAvg
        },
        calculated_at: new Date().toISOString()
      };

      setStats(statsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching sales stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tenant_id) {
      fetchStats();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.tenant_id]);

  // Escutar mudanças na tabela sales em tempo real
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase
      .channel('sales-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        () => {
          console.log('🔄 Venda detectada, atualizando estatísticas...');
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Estatísticas de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando estatísticas...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Estatísticas de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Nenhuma estatística disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Estatísticas de Vendas
          <Badge variant="secondary" className="ml-auto">
            <Clock className="h-3 w-3 mr-1" />
            {lastUpdate.toLocaleTimeString('pt-BR')}
          </Badge>
        </CardTitle>
        <CardDescription>
          Dados atualizados automaticamente em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas Gerais */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-3">📊 Total Geral</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-lg font-bold text-emerald-600">
                {valuesVisible ? `R$ ${stats.total_stats.total_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
              </div>
              <div className="text-xs text-emerald-600">Total Vendido</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {valuesVisible ? stats.total_stats.total_count : '••••'}
              </div>
              <div className="text-xs text-blue-600">Vendas</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {valuesVisible ? `R$ ${stats.total_stats.avg_ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
              </div>
              <div className="text-xs text-purple-600">Ticket Médio</div>
            </div>
          </div>
        </div>

        {/* Estatísticas do Dia */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-3">📅 Hoje</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {valuesVisible ? `R$ ${stats.today_stats.today_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
              </div>
              <div className="text-xs text-green-600">Vendas Hoje</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {valuesVisible ? stats.today_stats.today_count : '••••'}
              </div>
              <div className="text-xs text-orange-600">Quantidade</div>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className="text-lg font-bold text-pink-600">
                {valuesVisible ? `R$ ${stats.today_stats.today_avg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
              </div>
              <div className="text-xs text-pink-600">Médio Hoje</div>
            </div>
          </div>
        </div>

        {/* Indicador de Atualização Automática */}
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            Atualização automática a cada 30 segundos
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
