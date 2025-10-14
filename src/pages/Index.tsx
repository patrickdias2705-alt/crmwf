import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { DashboardStats } from '@/components/DashboardStats';
import { RecentActivity } from '@/components/RecentActivity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, Filter, TrendingUp, Users, MessageSquare, Target, CheckCircle, XCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { toast } from 'sonner';
import { useTenantView } from '@/contexts/TenantViewContext';
import { useAuth } from '@/hooks/useAuth';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';

interface DashboardData {
  leads_received: number;
  leads_attended: number;
  leads_scheduled: number;
  leads_closed: number;
  leads_refused: number;
  leads_lost: number;
  conversion_rate: number;
}

interface ChartData {
  date: string;
  leads: number;
  attended: number;
  closed: number;
}

interface SourceData {
  name: string;
  value: number;
  color: string;
}

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source: string;
  created_at: string;
  stage_id: string;
  stages?: {
    name: string;
  };
}

interface Activity {
  id: string;
  type: string;
  actor?: string;
  data: any;
  created_at: string;
  lead_id: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Index() {
  const { viewingTenantId, viewingAgentId, isViewingAgent } = useTenantView();
  const { user, loading } = useAuth();
  const { valuesVisible, toggleValuesVisibility } = useValuesVisibility();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    leads_received: 0,
    leads_attended: 0,
    leads_scheduled: 0,
    leads_closed: 0,
    leads_refused: 0,
    leads_lost: 0,
    conversion_rate: 0
  });

  console.log('📊 Dashboard - Estado atual:', { 
    dashboardData, 
    dataLoading, 
    user: user?.email,
    tenant_id: user?.tenant_id 
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  // Set up realtime subscriptions for dashboard updates
  const { isConnected } = useDashboardRealtime({
    onMetricsUpdate: setDashboardData,
    onNewLead: (lead) => {
      console.log('📊 New lead received:', lead);
      setRecentLeads(prev => [lead, ...prev.slice(0, 9)]); // Keep latest 10
      
      // Update source data based on origin
      setSourceData(prev => {
        const sourceCounts = { ...prev.reduce((acc, item) => ({ ...acc, [item.name.toLowerCase()]: item.value }), {}) };
        const origin = lead.origin || 'outro';
        sourceCounts[origin] = (sourceCounts[origin] || 0) + 1;
        
        return Object.entries(sourceCounts).map(([name, value], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: Number(value),
          color: COLORS[index % COLORS.length]
        }));
      });
    },
    onNewActivity: (activity) => {
      console.log('📊 New activity received:', activity);
      setRecentActivities(prev => [activity, ...prev.slice(0, 9)]); // Keep latest 10
    }
  });

  useEffect(() => {
    if (user?.tenant_id) {
      console.log('📊 Dashboard - Carregando dados para usuário:', user.email);
      loadDashboardData();
    }
  }, [user?.tenant_id, dateRange, selectedAgent, selectedSource, viewingAgentId, isViewingAgent]);


  const exportToExcel = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch all leads in the date range
      const { data: leadsData } = await supabase
        .from('leads')
        .select(`
          *,
          stages (name),
          pipelines (name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (!leadsData || leadsData.length === 0) {
        toast.error('Nenhum dado para exportar no período selecionado');
        return;
      }

      // Prepare CSV content
      const headers = ['Nome', 'Telefone', 'Email', 'Origem', 'Stage', 'Pipeline', 'Status', 'Criado em'];
      const rows = leadsData.map(lead => [
        lead.name || '',
        lead.phone || '',
        lead.email || '',
        lead.origin || '',
        lead.stages?.name || '',
        lead.pipelines?.name || '',
        lead.status || '',
        new Date(lead.created_at).toLocaleDateString('pt-BR')
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  const loadDashboardData = async () => {
    try {
      setDataLoading(true);
      
      console.log('📊 Index - Loading dashboard for:', { 
        viewingAgentId, 
        isViewingAgent 
      });
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Load all leads for the period to calculate metrics based on source filter
      let allLeadsQuery = supabase
        .from('leads')
        .select(`
          *,
          stages (name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      console.log('📊 Dashboard - Query parameters:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dateRange,
        user: user?.email,
        tenant_id: user?.tenant_id
      });

      // Filter by tenant first
      if (user?.tenant_id) {
        allLeadsQuery = allLeadsQuery.eq('tenant_id', user.tenant_id);
        console.log('📊 Dashboard - Filtro tenant aplicado:', user.tenant_id);
      }

      // Filter by agent if viewing specific agent
      if (isViewingAgent && viewingAgentId) {
        allLeadsQuery = allLeadsQuery.eq('assigned_to', viewingAgentId);
        console.log('📊 Dashboard - Filtro agente aplicado:', viewingAgentId);
      }

      // Filter by source if not "all"
      if (selectedSource !== 'all') {
        allLeadsQuery = allLeadsQuery.eq('origin', selectedSource);
        console.log('📊 Dashboard - Filtro origem aplicado:', selectedSource);
      }

      const { data: allLeadsData, error: allLeadsError } = await allLeadsQuery;

      console.log('📊 Dashboard - Todos os leads para métricas:', { 
        allLeadsData: allLeadsData?.length || 0, 
        allLeadsError,
        selectedSource,
        leads: allLeadsData?.slice(0, 3) // Primeiros 3 leads para debug
      });

      if (allLeadsData) {
        // Calculate metrics based on filtered leads
        const totals = {
          leads_received: allLeadsData.length,
          leads_attended: allLeadsData.filter(lead => lead.status === 'attended' || lead.status === 'qualified' || lead.status === 'closed' || lead.status === 'refused' || lead.status === 'lost').length,
          leads_scheduled: allLeadsData.filter(lead => lead.status === 'qualified' || lead.status === 'closed').length,
          leads_closed: allLeadsData.filter(lead => lead.status === 'closed').length,
          leads_refused: allLeadsData.filter(lead => lead.status === 'refused').length,
          leads_lost: allLeadsData.filter(lead => lead.status === 'lost').length,
          conversion_rate: 0
        };

        totals.conversion_rate = totals.leads_received > 0 
          ? (totals.leads_closed / totals.leads_received) * 100 
          : 0;

        console.log('📊 Dashboard - Totais calculados por fonte:', { 
          totals, 
          selectedSource,
          totalLeads: allLeadsData.length
        });
        setDashboardData(totals);

        // Prepare chart data - group by day
        const leadsByDay = allLeadsData.reduce((acc, lead) => {
          const day = new Date(lead.created_at).toISOString().split('T')[0];
          if (!acc[day]) {
            acc[day] = { leads: 0, attended: 0, closed: 0 };
          }
          acc[day].leads++;
          if (lead.status === 'attended' || lead.status === 'qualified' || lead.status === 'closed' || lead.status === 'refused' || lead.status === 'lost') {
            acc[day].attended++;
          }
          if (lead.status === 'closed') {
            acc[day].closed++;
          }
          return acc;
        }, {} as Record<string, { leads: number; attended: number; closed: number }>);

        const chartDataFormatted = Object.entries(leadsByDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            leads: data.leads,
            attended: data.attended,
            closed: data.closed
          }));
        setChartData(chartDataFormatted);
      }

      // Use the same leads data for recent activity and source distribution
      if (allLeadsData) {
        // Set recent leads (limit to 10)
        setRecentLeads(allLeadsData.slice(0, 10));

        // Calculate source distribution based on origin field
        const sourceCounts = allLeadsData.reduce((acc: Record<string, number>, lead) => {
          const origin = lead.origin || 'outro';
          acc[origin] = (acc[origin] || 0) + 1;
          return acc;
        }, {});

        const sourceDataFormatted = Object.entries(sourceCounts).map(([name, value], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: COLORS[index % COLORS.length]
        }));
        setSourceData(sourceDataFormatted);
      }

      // Load recent activities
      let activitiesQuery = supabase
        .from('lead_events')
        .select('*, leads!inner(*)')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (isViewingAgent && viewingAgentId) {
        activitiesQuery = activitiesQuery.eq('leads.assigned_to', viewingAgentId);
      }

      const { data: activitiesData } = await activitiesQuery;

      if (activitiesData) {
        setRecentActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    // console.log('📊 Dashboard - Loading state:', { loading, dataLoading, user: user?.email });
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // console.log('📊 Dashboard - Renderizando com dados:', { 
  //   dashboardData, 
  //   chartData: chartData.length, 
  //   sourceData: sourceData.length 
  // });

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Visão geral do desempenho dos seus leads
              {isConnected && (
                <span className="ml-2 text-green-500 text-sm">● Conectado</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
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
            
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os agentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as fontes</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.leads_received}</div>
              <p className="text-xs text-muted-foreground">leads no período</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendidos</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.leads_attended}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.leads_received > 0 
                  ? `${((dashboardData.leads_attended / dashboardData.leads_received) * 100).toFixed(1)}%`
                  : '0%'
                } do total
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.leads_scheduled}</div>
              <p className="text-xs text-muted-foreground">leads qualificados</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fechados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.leads_closed}</div>
              <p className="text-xs text-muted-foreground">vendas realizadas</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recusados</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.leads_refused}</div>
              <p className="text-xs text-muted-foreground">não interessados</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perdidos</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.leads_lost}</div>
              <p className="text-xs text-muted-foreground">oportunidades perdidas</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversão</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.conversion_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">taxa de fechamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Line Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Evolução de Leads</CardTitle>
              <CardDescription>
                Acompanhe a evolução diária dos seus leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Recebidos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attended" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Atendidos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="closed" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Fechados"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="border-border/50">
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
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="mt-4 space-y-2">
                {sourceData.map((source, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm">{source.name}: {source.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
            <CardDescription>
              Últimos leads recebidos no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Nome</th>
                    <th className="text-left py-2 font-medium">Contato</th>
                    <th className="text-left py-2 font-medium">Fonte</th>
                    <th className="text-left py-2 font-medium">Estágio</th>
                    <th className="text-left py-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/50">
                      <td className="py-3">
                        <div className="font-medium">{lead.name}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm text-muted-foreground">
                          {lead.phone && <div>{lead.phone}</div>}
                          {lead.email && <div>{lead.email}</div>}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className="capitalize">
                          {lead.source}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">
                          {lead.stages?.name || 'Não definido'}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <RecentActivity />
      </div>
    </Layout>
  );
}
