import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, MessageSquare, Calendar, Clock, Award, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SalesSummary } from '@/components/SalesSummary';
import { LiveSalesStats } from '@/components/LiveSalesStats';
import { DynamicConversionFunnel } from '@/components/DynamicConversionFunnel';
import { ExportLeadsButton } from '@/components/ExportLeadsButton';
import { useTenantView } from '@/contexts/TenantViewContext';

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
  const { user } = useAuth();
  const { viewingAgentId, isViewingAgent } = useTenantView();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [sourceData, setSourceData] = useState<ChartData[]>([]);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [cac, setCac] = useState(0);
  const [roi, setRoi] = useState(0);

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

  const handleClearData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado');
        return;
      }

      const response = await supabase.functions.invoke('clear-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast.success('Todos os dados foram apagados com sucesso!');
      fetchMetrics();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Erro ao limpar dados');
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Buscar vendas da tabela sales + fallback do fields
      let totalSold = 0;
      let avgTicket = 0;
      let salesCount = 0;

      // Primeiro: tentar buscar da tabela sales
      try {
        const { data: salesData } = await supabase
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
          const { data: leadsData } = await supabase
            .from('leads')
            .select('fields')
            .eq('tenant_id', user?.tenant_id)
            .not('fields->sold', 'is', null)
            .eq('fields->sold', true);

          if (leadsData && leadsData.length > 0) {
            totalSold = leadsData.reduce((sum, lead) => sum + (Number(lead.fields?.sold_amount) || 0), 0);
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
        const { data: soldLeadIds } = await supabase
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
          const openBudgets = leadsWithBudget.filter(lead => {
            const hasValidBudget = lead.fields?.budget_amount && Number(lead.fields.budget_amount) > 0;
            const notInFinalStage = !finalStageIds.includes(lead.stage_id);
            const notSold = !soldIds.includes(lead.id);
            
            return hasValidBudget && notInFinalStage && notSold;
          });

          openBudgetsCount = openBudgets.length;
          openBudgetsValue = openBudgets.reduce((sum, lead) => 
            sum + Number(lead.fields?.budget_amount || 0), 0
          );
        }

        console.log('💼 Orçamentos em aberto:', openBudgetsCount, 'valor:', openBudgetsValue);
        console.log('📊 Excluídos:', soldIds.length, 'vendidos e', finalStageIds.length, 'estágios finais');
      } catch (error) {
        console.error('Erro ao buscar orçamentos em aberto:', error);
      }

      const conversionRate = totalLeadsCount > 0 ? (salesCount / totalLeadsCount) * 100 : 0;

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
      setTicketMedio(avgTicket);
      setLtv(avgTicket * 1.5 * 0.3);
      setCac(2100);
      setRoi(totalSold > 0 ? ((totalSold - 2100) / 2100) * 100 : 0);

      // Dados para gráficos
      setDailyData([{ name: 'Hoje', leads: totalLeadsCount, conversoes: salesCount }]);
      setSourceData([{ name: 'WhatsApp', value: totalLeadsCount }]);

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

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
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá apagar permanentemente todos os seus leads, conversas, métricas e orçamentos. 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sim, apagar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                    {metric.value}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: `${index * 100 + 400}ms` }}>
                    {metric.change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={metric.change > 0 ? 'text-green-500' : 'text-red-500'}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="ml-1">vs período anterior</span>
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
      </div>
    </Layout>
  );
}