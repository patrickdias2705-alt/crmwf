import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, MessageSquare, Calendar, Clock, Award, Settings, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SalesSummary } from '@/components/SalesSummary';
import { LiveSalesStats } from '@/components/LiveSalesStats';
import { DynamicConversionFunnel } from '@/components/DynamicConversionFunnel';
import { ExportLeadsButton } from '@/components/ExportLeadsButton';
import { useTenantView } from '@/contexts/TenantViewContext';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
  leads?: number;
  conversoes?: number;
  mensagens?: number;
}

export default function Metrics() {
  const { user, loading: authLoading } = useAuth();
  const { viewingAgentId, isViewingAgent } = useTenantView();
  const { valuesVisible, toggleValuesVisibility } = useValuesVisibility();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [sourceData, setSourceData] = useState<ChartData[]>([]);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [cac, setCac] = useState(0);
  const [roi, setRoi] = useState(0);
  
  // Configurações de tráfego pago
  const [trafficSpend, setTrafficSpend] = useState(0); // Investimento em tráfego
  const [grossMargin, setGrossMargin] = useState(0.6); // Margem bruta (60%)
  const [horizonMonths, setHorizonMonths] = useState(12); // Horizonte LTV
  const [showTrafficConfig, setShowTrafficConfig] = useState(false);

  const handleSaveTrafficConfig = () => {
    // Salvar no localStorage
    localStorage.setItem('trafficSpend', trafficSpend.toString());
    localStorage.setItem('grossMargin', grossMargin.toString());
    localStorage.setItem('horizonMonths', horizonMonths.toString());
    
    // Fechar modal
    setShowTrafficConfig(false);
    
    // Recalcular métricas com as novas configurações
    fetchMetrics();
    
    // Mostrar confirmação
    toast.success('Configurações salvas e métricas atualizadas!');
  };

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const savedTrafficSpend = localStorage.getItem('trafficSpend');
    const savedGrossMargin = localStorage.getItem('grossMargin');
    const savedHorizonMonths = localStorage.getItem('horizonMonths');

    if (savedTrafficSpend) {
      setTrafficSpend(Number(savedTrafficSpend));
    }
    if (savedGrossMargin) {
      setGrossMargin(Number(savedGrossMargin));
    }
    if (savedHorizonMonths) {
      setHorizonMonths(Number(savedHorizonMonths));
    }
  }, []);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchMetrics();
    }
  }, [user?.tenant_id, period, viewingAgentId, isViewingAgent]);

  // Atualização em tempo real
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase
      .channel('metrics-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          console.log('🔄 Venda detectada! Atualizando métricas...', payload);
          fetchMetrics(); // Recarrega métricas quando uma venda é feita
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('🔄 Lead detectado! Atualizando métricas...', payload);
          fetchMetrics(); // Recarrega métricas quando um lead muda
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id]);

  useEffect(() => {
    if (!user?.tenant_id) return;

    // Subscribe to realtime changes for leads, stages, budgets
    const leadsChannel = supabase
      .channel('metrics-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          console.log('Lead changed, updating metrics');
          fetchMetrics();
        }
      )
      .subscribe();

    const stagesChannel = supabase
      .channel('metrics-stages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stages'
        },
        () => {
          console.log('Stage changed, updating metrics');
          fetchMetrics();
        }
      )
      .subscribe();

    const metricsChannel = supabase
      .channel('metrics-daily-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metrics_daily'
        },
        () => {
          console.log('Metrics changed, refreshing');
          fetchMetrics();
        }
      )
      .subscribe();

    const budgetsChannel = supabase
      .channel('metrics-budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets'
        },
        () => {
          console.log('Budget changed, updating metrics');
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(stagesChannel);
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(budgetsChannel);
    };
  }, [user?.tenant_id]);


  const fetchMetrics = async () => {
    try {
      console.log('📊 Iniciando fetchMetrics...', { user: user?.email, tenant_id: user?.tenant_id });
      setLoading(true);

      // Buscar vendas da tabela sales + fallback do fields
      let totalSold = 0;
      let avgTicket = 0;
      let salesCount = 0;

      // Primeiro: tentar buscar da tabela sales
      try {
        const { data: salesData } = await (supabase as any)
          .from('sales')
          .select('amount')
          .eq('tenant_id', user?.tenant_id);

        if (salesData && salesData.length > 0) {
          totalSold = salesData.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
          salesCount = salesData.length;
          avgTicket = salesCount > 0 ? totalSold / salesCount : 0;
          console.log('💰 VENDAS (tabela sales):', { totalSold, salesCount, avgTicket });
        }
      } catch (error) {
        console.log('Tabela sales não acessível, usando fallback:', error);
      }

      // Fallback: buscar vendas do fields dos leads
      if (salesCount === 0) {
        try {
          const { data: leadsData } = await (supabase as any)
            .from('leads')
            .select('fields')
            .eq('tenant_id', user?.tenant_id)
            .not('fields->sold', 'is', null)
            .eq('fields->sold', true);

          if (leadsData && leadsData.length > 0) {
            totalSold = leadsData.reduce((sum: number, lead: any) => sum + (Number(lead.fields?.sold_amount) || 0), 0);
            salesCount = leadsData.length;
            avgTicket = salesCount > 0 ? totalSold / salesCount : 0;
            console.log('💰 VENDAS (fallback fields):', { totalSold, salesCount, avgTicket });
          }
        } catch (error) {
          console.error('Erro ao buscar vendas do fallback:', error);
        }
      }

      // NÃO buscar fallback de leads com orçamento!
      // Vendas SÓ contam quando marcadas explicitamente via botão "Marcar como Vendido"

      // Buscar total de leads
      let totalLeadsCount = 0;
      try {
        const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user?.tenant_id);
      
        totalLeadsCount = count || 0;
      } catch (error) {
        console.error('Erro ao buscar leads:', error);
      }

      // Buscar mensagens
      let messagesCount = 0;
      try {
        const { count } = await supabase
        .from('messages')
          .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user?.tenant_id);
      
        messagesCount = count || 0;
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      }

      // Buscar qualificados
      let qualifiedCount = 0;
      try {
      const { data: qualifiedStages } = await supabase
        .from('stages')
        .select('id')
        .eq('tenant_id', user?.tenant_id)
        .ilike('name', '%qualificado%');

        if (qualifiedStages && qualifiedStages.length > 0) {
          const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', user?.tenant_id)
            .in('stage_id', qualifiedStages.map(s => s.id));
          qualifiedCount = count || 0;
        }
      } catch (error) {
        console.error('Erro ao buscar qualificados:', error);
      }

      // Buscar orçamentos em aberto (com orçamento mas NÃO vendidos e NÃO em estágios finais)
      let openBudgetsCount = 0;
      let openBudgetsValue = 0;
      try {
        // 1. Buscar IDs de leads que já foram marcados como vendidos (tabela sales)
        const { data: soldLeadIds } = await (supabase as any)
          .from('sales')
          .select('lead_id')
          .eq('tenant_id', user?.tenant_id);

        const soldIds = soldLeadIds?.map(s => s.lead_id) || [];

        // 2. Buscar IDs de estágios finais (Dinheiro no Bolso, Vendido, etc)
        const { data: finalStages } = await supabase
        .from('stages')
        .select('id')
        .eq('tenant_id', user?.tenant_id)
          .or('name.ilike.%dinheiro no bolso%,name.ilike.%vendido%,name.ilike.%fechado%,name.ilike.%ganho%');

        const finalStageIds = finalStages?.map(s => s.id) || [];
      
        // 3. Buscar leads com orçamento
        const { data: leadsWithBudget } = await supabase
          .from('leads')
          .select('id, stage_id, fields')
          .eq('tenant_id', user?.tenant_id)
          .not('fields->budget_amount', 'is', null);

        if (leadsWithBudget) {
          // 4. Filtrar apenas os que TÊM orçamento MAS:
          //    - NÃO estão em estágios finais
          //    - NÃO foram marcados como vendidos
          const openBudgets = leadsWithBudget.filter((lead: any) => {
            const hasValidBudget = lead.fields?.budget_amount && Number(lead.fields.budget_amount) > 0;
            const notInFinalStage = !finalStageIds.includes(lead.stage_id);
            const notSold = !soldIds.includes(lead.id);
            
            return hasValidBudget && notInFinalStage && notSold;
          });

          openBudgetsCount = openBudgets.length;
          openBudgetsValue = openBudgets.reduce((sum: number, lead: any) => 
            sum + Number(lead.fields?.budget_amount || 0), 0
          );
        }

        console.log('💼 Orçamentos em aberto:', openBudgetsCount, 'valor:', openBudgetsValue);
        console.log('📊 Excluídos:', soldIds.length, 'vendidos e', finalStageIds.length, 'estágios finais');
      } catch (error) {
        console.error('Erro ao buscar orçamentos em aberto:', error);
      }

      const conversionRate = totalLeadsCount > 0 ? (salesCount / totalLeadsCount) * 100 : 0;

      // Buscar dados diários da tabela metrics_daily baseado no período selecionado
      const daysBack = parseInt(period.replace('d', '').replace('y', '365')) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const { data: metricsDaily } = await supabase
        .from('metrics_daily')
        .select('*')
        .eq('tenant_id', user?.tenant_id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Preparar dados do gráfico diário
      let dailyChartData: ChartData[] = [];
      if (metricsDaily && metricsDaily.length > 0) {
        dailyChartData = metricsDaily.map(day => ({
          name: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: day.total_sold || 0,
          leads: day.leads_in || 0,
          conversoes: day.closed || 0,
          mensagens: day.messages_out || 0
        }));
      } else {
        // Fallback: se não houver dados na metrics_daily, mostrar resumo de hoje
        dailyChartData = [{ 
          name: 'Hoje', 
          value: totalSold, 
          leads: totalLeadsCount, 
          conversoes: salesCount,
          mensagens: messagesCount
        }];
      }

      // Criar cards com os valores encontrados
      const metricsCards: MetricCard[] = [
        {
          title: 'Total de Leads',
          value: totalLeadsCount.toString(),
          change: 0,
          icon: Users,
          color: 'text-blue-500'
        },
        {
          title: 'Taxa de Conversão',
          value: `${conversionRate.toFixed(1)}%`,
          change: 0,
          icon: Target,
          color: 'text-green-500'
        },
        {
          title: 'Mensagens Enviadas',
          value: messagesCount.toString(),
          change: 0,
          icon: MessageSquare,
          color: 'text-purple-500'
        },
        {
          title: 'Qualificados',
          value: qualifiedCount.toString(),
          change: 0,
          icon: Calendar,
          color: 'text-primary'
        },
        {
          title: 'Orçamentos em Aberto',
          value: `${openBudgetsCount} (R$ ${openBudgetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
          change: 0,
          icon: Clock,
          color: 'text-orange-500'
        },
        {
          title: 'Ticket Médio',
          value: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: 0,
          icon: TrendingUp,
          color: 'text-red-500'
        },
        {
          title: 'Total Vendido',
          value: `R$ ${totalSold.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: 0,
          icon: Award,
          color: 'text-emerald-500'
        },
        {
          title: 'Leads Fechados',
          value: salesCount.toString(),
          change: 0,
          icon: Award,
          color: 'text-yellow-500'
        }
      ];

      setMetrics(metricsCards);
      
      // Calcular métricas com fórmulas corretas
      // Ticket Médio já está sendo calculado corretamente
      setTicketMedio(avgTicket);
      
      // Buscar dados para cálculos avançados
      // Primeiro tenta buscar da tabela sales
      let salesData: any[] = [];
      let leadsData: any[] = [];
      
      try {
        const { data: salesTableData } = await supabase
          .from('sales')
          .select('id, lead_id, amount')
          .eq('tenant_id', user?.tenant_id)
          .gte('sold_at', new Date(Date.now() - parseInt(period.replace('d', '')) * 24 * 60 * 60 * 1000).toISOString());
        
        salesData = salesTableData || [];
        console.log('📊 Vendas da tabela sales:', salesData.length);
      } catch (error) {
        console.log('⚠️ Tabela sales não acessível, usando fallback');
      }

      // Se não há vendas na tabela sales, buscar do fields dos leads
      if (salesData.length === 0) {
        const { data: soldLeadsData } = await supabase
          .from('leads')
          .select('id, fields, updated_at')
          .eq('tenant_id', user?.tenant_id)
          .not('fields->sold', 'is', null)
          .eq('fields->sold', true)
          .gte('updated_at', new Date(Date.now() - parseInt(period.replace('d', '')) * 24 * 60 * 60 * 1000).toISOString());

        if (soldLeadsData) {
          salesData = soldLeadsData.map(lead => ({
            id: lead.id,
            lead_id: lead.id,
            amount: Number(lead.fields?.sold_amount || 0)
          }));
          console.log('📊 Vendas do fallback (fields):', salesData.length);
        }
      }

      // Buscar todos os leads do período
      const { data: allLeadsData } = await supabase
        .from('leads')
        .select('id')
        .eq('tenant_id', user?.tenant_id)
        .gte('created_at', new Date(Date.now() - parseInt(period.replace('d', '')) * 24 * 60 * 60 * 1000).toISOString());

      leadsData = allLeadsData || [];

      // Calcular métricas
      const totalLeads = leadsData?.length || 0;
      const totalSales = salesData?.length || 0;
      const uniqueCustomers = new Set(salesData?.map(s => s.lead_id) || []).size || 0;
      const totalRevenue = salesData?.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0) || 0;
      
      console.log('📊 Dados para cálculo de métricas:', {
        totalLeads,
        totalSales,
        uniqueCustomers,
        totalRevenue,
        trafficSpend,
        grossMargin,
        horizonMonths,
        avgTicket,
        salesData: salesData.slice(0, 3), // Primeiros 3 para debug
        leadsData: leadsData.slice(0, 3)  // Primeiros 3 para debug
      });
      
      // CAC = CPL / Taxa de Conversão
      // CPL = Investimento / Leads
      // Taxa de Conversão = Clientes Únicos / Total de Leads
      const leadConversionRate = totalLeads > 0 ? uniqueCustomers / totalLeads : 0;
      const cpl = totalLeads > 0 ? trafficSpend / totalLeads : 0;
      const calculatedCac = leadConversionRate > 0 ? cpl / leadConversionRate : 0;
      
      // ROI = (Receita * Margem - Investimento) / Investimento
      const profit = (totalRevenue * grossMargin) - trafficSpend;
      const calculatedRoi = trafficSpend > 0 ? profit / trafficSpend : 0;
      
      // LTV = TM * Pedidos médios por cliente * Margem * Horizonte
      const avgOrdersPerCustomer = uniqueCustomers > 0 ? totalSales / uniqueCustomers : 0;
      const calculatedLtv = avgTicket * avgOrdersPerCustomer * grossMargin * horizonMonths;
      
      console.log('💰 Métricas calculadas:', {
        leadConversionRate: leadConversionRate,
        cpl: cpl,
        calculatedCac: calculatedCac,
        profit: profit,
        calculatedRoi: calculatedRoi,
        avgOrdersPerCustomer: avgOrdersPerCustomer,
        calculatedLtv: calculatedLtv,
        debug: {
          totalLeads,
          trafficSpend,
          uniqueCustomers,
          totalRevenue,
          grossMargin
        }
      });
      
      setCac(calculatedCac);
      setRoi(calculatedRoi);
      setLtv(calculatedLtv);

      // Buscar leads por origem
      const { data: leadsBySource } = await supabase
        .from('leads')
        .select('origin')
        .eq('tenant_id', user?.tenant_id);
      
      const sourceCounts: Record<string, number> = {};
      leadsBySource?.forEach(lead => {
        const origin = lead.origin || 'outro';
        sourceCounts[origin] = (sourceCounts[origin] || 0) + 1;
      });

      const sourceChartData = [
        { name: 'WhatsApp', value: sourceCounts['whatsapp'] || 0, color: '#10B981' },
        { name: 'Instagram', value: sourceCounts['instagram'] || 0, color: '#EC4899' },
        { name: 'Facebook', value: sourceCounts['facebook'] || 0, color: '#3B82F6' },
        { name: 'Site', value: sourceCounts['site'] || sourceCounts['website'] || 0, color: '#8B5CF6' },
        { name: 'Indicação', value: sourceCounts['indicacao'] || 0, color: '#14B8A6' },
        { name: 'Outro', value: sourceCounts['outro'] || sourceCounts['manual'] || 0, color: '#6B7280' }
      ].filter(item => item.value > 0); // Remove fontes sem leads

      // Dados para gráficos
      setDailyData(dailyChartData);
      setSourceData(sourceChartData);
      
      console.log('📊 Métricas carregadas:', {
        totalLeads: totalLeadsCount,
        totalSold,
        salesCount,
        avgTicket,
        dailyDataPoints: dailyChartData.length
      });

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Verificar se está carregando a autenticação
  if (authLoading) {
    console.log('📊 Aguardando autenticação...');
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Verificando autenticação...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Verificar se o usuário está autenticado
  if (!user) {
    console.log('📊 Usuário não autenticado, redirecionando...');
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Acesso Negado
            </h2>
            <p className="text-muted-foreground">
              Você precisa estar logado para acessar as métricas.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    console.log('📊 Metrics loading...', { user: user?.email, tenant_id: user?.tenant_id });
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando métricas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  console.log('📊 Metrics renderizando...', { 
    user: user?.email, 
    tenant_id: user?.tenant_id,
    metricsCount: metrics.length,
    dailyDataCount: dailyData.length,
    sourceDataCount: sourceData.length
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Métricas</h1>
            <p className="text-muted-foreground">
              Analise o desempenho do seu negócio
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTrafficConfig(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Tráfego Pago
            </Button>
            <ExportLeadsButton />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleValuesVisibility}
              className="flex items-center gap-2"
            >
              {valuesVisible ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Ocultar Valores
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Mostrar Valores
                </>
              )}
                </Button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${metric.color} transition-transform duration-300 group-hover:scale-110`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold animate-fade-in" style={{ animationDelay: `${index * 100 + 200}ms` }}>
                    {valuesVisible ? metric.value : '••••'}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: `${index * 100 + 400}ms` }}>
                    {valuesVisible ? (
                      <>
                    {metric.change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={metric.change > 0 ? 'text-green-500' : 'text-red-500'}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="ml-1">vs período anterior</span>
                      </>
                    ) : (
                      <span>••••</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Linha - Performance Diária */}
          <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
            <CardHeader>
              <CardTitle>Performance Diária</CardTitle>
              <CardDescription>
                Acompanhe a evolução dos seus indicadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Leads"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversoes" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Conversões"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Fontes */}
          <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
            <CardHeader>
              <CardTitle>Leads por Fonte</CardTitle>
              <CardDescription>
                Distribuição dos leads por canal de origem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={1000}
                    animationDuration={1500}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={(entry as any).color || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Funil de Conversão */}
        <Card className="animate-fade-in" style={{ animationDelay: '1000ms' }}>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>
              Visualize o progresso dos leads através do pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8">
                <DynamicConversionFunnel />
          </CardContent>
        </Card>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-fade-in hover-scale" style={{ animationDelay: '1200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ticket Médio
                  </p>
                  <p className="text-2xl font-bold">R$ {ticketMedio.toFixed(2)}</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400">
                  +0%
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in hover-scale" style={{ animationDelay: '1300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    LTV Médio
                  </p>
                  <p className="text-2xl font-bold">R$ {ltv.toFixed(2)}</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400">
                  +0%
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in hover-scale" style={{ animationDelay: '1400ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    CAC
                  </p>
                  <p className="text-2xl font-bold">R$ {cac.toFixed(2)}</p>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400">
                  -0%
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in hover-scale" style={{ animationDelay: '1500ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    ROI
                  </p>
                  <p className="text-2xl font-bold">{roi.toFixed(1)}x</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400">
                  +0%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas em Tempo Real e Resumo de Vendas */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveSalesStats />
          <SalesSummary period={parseInt(period.replace('d', '')) || 7} />
        </div>

        {/* Modal de Configuração de Tráfego Pago */}
        {showTrafficConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Configurações de Tráfego Pago</CardTitle>
                <CardDescription>
                  Configure os parâmetros para cálculo de CAC, ROI e LTV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trafficSpend">Investimento em Tráfego (R$)</Label>
                  <Input
                    id="trafficSpend"
                    type="number"
                    value={trafficSpend}
                    onChange={(e) => setTrafficSpend(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grossMargin">Margem Bruta (%)</Label>
                  <Input
                    id="grossMargin"
                    type="number"
                    value={grossMargin * 100}
                    onChange={(e) => setGrossMargin(Number(e.target.value) / 100)}
                    min="0"
                    max="100"
                    step="1"
                    placeholder="60"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="horizonMonths">Horizonte LTV (meses)</Label>
                  <Input
                    id="horizonMonths"
                    type="number"
                    value={horizonMonths}
                    onChange={(e) => setHorizonMonths(Number(e.target.value))}
                    min="1"
                    max="60"
                    placeholder="12"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSaveTrafficConfig}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTrafficConfig(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}