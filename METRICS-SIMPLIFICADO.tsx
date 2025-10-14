// VERSÃO SIMPLIFICADA DO METRICS.TSX PARA TESTE
// Substitua temporariamente o conteúdo do arquivo Metrics.tsx por este código

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
import { ConversionFunnel } from '@/components/ConversionFunnel';
import { ExportLeadsButton } from '@/components/ExportLeadsButton';
import { useTenantView } from '@/contexts/TenantViewContext';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: any;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
  leads?: number;
  conversoes?: number;
}

interface FunnelStage {
  name: string;
  value: number;
  color: string;
}

export default function Metrics() {
  const { user } = useAuth();
  const { viewingAgentId, isViewingAgent } = useTenantView();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [sourceData, setSourceData] = useState<ChartData[]>([]);
  const [conversionData, setConversionData] = useState<FunnelStage[]>([]);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [cac, setCac] = useState(0);
  const [roi, setRoi] = useState(0);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchMetrics();
    }
  }, [user?.tenant_id, period, viewingAgentId, isViewingAgent]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      console.log('📊 Metrics SIMPLIFICADO - Loading for:', { 
        viewingAgentId, 
        isViewingAgent,
        tenant_id: user?.tenant_id
      });

      // Buscar contagem básica de leads
      const { count: totalLeadsCount, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user?.tenant_id);

      if (leadsError) {
        console.error('Erro ao buscar leads:', leadsError);
      }

      // Buscar contagem de mensagens
      const { count: messagesCount, error: messagesError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user?.tenant_id);

      if (messagesError) {
        console.error('Erro ao buscar mensagens:', messagesError);
      }

      // Buscar vendas da tabela sales (se existir)
      let totalSold = 0;
      let avgTicket = 0;
      let salesCount = 0;

      try {
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('amount')
          .eq('tenant_id', user?.tenant_id);

        if (salesError) {
          console.log('📊 Tabela sales não existe ou erro:', salesError);
        } else if (salesData && salesData.length > 0) {
          totalSold = salesData.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
          salesCount = salesData.length;
          avgTicket = salesCount > 0 ? totalSold / salesCount : 0;
          console.log('📊 Vendas encontradas:', { totalSold, avgTicket, vendas: salesCount });
        } else {
          console.log('📊 Nenhuma venda encontrada na tabela sales');
        }
      } catch (error) {
        console.log('📊 Erro ao acessar tabela sales:', error);
      }

      // Calcular taxa de conversão
      const conversionRate = totalLeadsCount && totalLeadsCount > 0 
        ? (salesCount / totalLeadsCount) * 100 
        : 0;

      // Criar cards de métricas
      const metricsCards: MetricCard[] = [
        {
          title: 'Total de Leads',
          value: (totalLeadsCount || 0).toString(),
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
          value: (messagesCount || 0).toString(),
          change: 0,
          icon: MessageSquare,
          color: 'text-purple-500'
        },
        {
          title: 'Qualificados',
          value: '0',
          change: 0,
          icon: Calendar,
          color: 'text-primary'
        },
        {
          title: 'Ticket Médio',
          value: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: 0,
          icon: Clock,
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
      setLtv(avgTicket * 1.5 * 0.3); // LTV simplificado
      setCac(2100); // CAC fixo para teste
      setRoi(totalSold > 0 ? ((totalSold - 2100) / 2100) * 100 : 0);

      // Dados básicos para gráficos
      setDailyData([
        { name: 'Hoje', leads: totalLeadsCount || 0, conversoes: salesCount }
      ]);

      setSourceData([
        { name: 'WhatsApp', value: totalLeadsCount || 0 }
      ]);

      setConversionData([
        { name: 'Leads Recebidos', value: totalLeadsCount || 0, color: '#8884d8' },
        { name: 'Leads Fechados', value: salesCount, color: '#00C49F' }
      ]);

      console.log('📊 Métricas carregadas com sucesso:', {
        totalLeads: totalLeadsCount,
        totalSold,
        avgTicket,
        salesCount
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold">Métricas do CRM</h1>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="365d">Últimos 365 dias</SelectItem>
              </SelectContent>
            </Select>
            <ExportLeadsButton />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá apagar todos os dados de leads, conversas e métricas. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="animate-fade-in hover-scale" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.change >= 0 ? (
                    <span className="text-green-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{metric.change}%
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {metric.change}%
                    </span>
                  )} desde o último mês
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="animate-fade-in hover-scale" style={{ animationDelay: '600ms' }}>
            <CardHeader>
              <CardTitle>Leads e Conversões Diárias</CardTitle>
              <CardDescription>Visão geral dos leads recebidos e convertidos por dia.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke="#8884d8" name="Leads" />
                  <Line type="monotone" dataKey="conversoes" stroke="#82ca9d" name="Conversões" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-scale" style={{ animationDelay: '700ms' }}>
            <CardHeader>
              <CardTitle>Leads por Origem</CardTitle>
              <CardDescription>Distribuição dos leads de acordo com a plataforma de origem.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <ConversionFunnel data={conversionData} />

        {/* Métricas Financeiras */}
        <h2 className="text-2xl font-bold mt-8">Métricas Financeiras</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card className="animate-fade-in hover-scale" style={{ animationDelay: '1200ms' }}>
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
