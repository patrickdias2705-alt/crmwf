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
  last_5_days: Array<{
    date: string;
    sales: number;
    count: number;
    avg_ticket: number;
  }>;
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
      let last5Days: Array<{date: string, sales: number, count: number, avg_ticket: number}> = [];

      try {
        // NOVO: Usar métricas diárias automáticas
        // Buscar métricas de HOJE para vendas diárias
        const { data: todayMetrics, error: todayError } = await supabase
          .from('daily_sales_metrics')
          .select('total_sales, total_leads, closed_leads, avg_ticket')
          .eq('tenant_id', '8bd69047-7533-42f3-a2f7-e3a60477f68c')
          .eq('date', new Date().toISOString().split('T')[0])
          .single();

        // Buscar TOTAL GERAL de todas as vendas históricas
        const { data: allSales, error: allSalesError } = await supabase
          .from('sales')
          .select('amount')
          .eq('tenant_id', '8bd69047-7533-42f3-a2f7-e3a60477f68c');

        // Buscar métricas dos últimos 5 dias
        const { data: last5DaysData, error: last5DaysError } = await supabase
          .from('daily_sales_metrics')
          .select('date, total_sales, closed_leads, avg_ticket')
          .eq('tenant_id', '8bd69047-7533-42f3-a2f7-e3a60477f68c')
          .gte('date', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (todayError) throw todayError;
        
        if (todayMetrics) {
          // Vendas de HOJE (reset diário)
          todaySales = Number(todayMetrics.total_sales) || 0;
          todayCount = Number(todayMetrics.closed_leads) || 0;
          
          // TOTAL GERAL (soma de todas as vendas históricas)
          if (allSales && allSales.length > 0) {
            totalSales = allSales.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
            totalCount = allSales.length;
          } else {
            totalSales = 0;
            totalCount = 0;
          }
          
          // Processar dados dos últimos 5 dias
          if (last5DaysData && last5DaysData.length > 0) {
            last5Days = last5DaysData.map(day => ({
              date: day.date,
              sales: Number(day.total_sales) || 0,
              count: Number(day.closed_leads) || 0,
              avg_ticket: Number(day.avg_ticket) || 0
            }));
          }
          
          console.log('💰 LiveSalesStats - Métricas diárias:', { 
            totalSales, totalCount, todaySales, todayCount,
            todayMetrics, allSalesCount: allSales?.length || 0,
            last5Days: last5Days.length
          });
        } else {
          // Fallback: buscar da tabela sales se métricas diárias não existirem
          const { data: salesTableData, error: salesError } = await supabase
            .from('sales')
            .select('amount, sold_at')
            .eq('tenant_id', '8bd69047-7533-42f3-a2f7-e3a60477f68c');

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
            
            console.log('💰 LiveSalesStats - Fallback tabela sales:', { totalSales, totalCount, todaySales, todayCount });
          }
        }
      } catch (error) {
        console.log('⚠️ Métricas diárias não acessíveis, usando fallback:', error);
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
        last_5_days: last5Days,
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
          filter: `tenant_id=eq.8bd69047-7533-42f3-a2f7-e3a60477f68c`
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

        {/* Últimos 5 Dias */}
        {stats.last_5_days && stats.last_5_days.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-3">📈 Últimos 5 Dias</h4>
            <div className="space-y-2">
              {stats.last_5_days.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-gray-500 w-16">
                      {index === 0 ? 'Hoje' : 
                       index === 1 ? 'Ontem' : 
                       new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      {valuesVisible ? `R$ ${day.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {valuesVisible ? `${day.count} vendas` : '•••• vendas'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
