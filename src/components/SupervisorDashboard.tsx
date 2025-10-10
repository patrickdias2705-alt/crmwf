import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SupervisorCategorySelector } from './SupervisorCategorySelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Store,
  Truck
} from 'lucide-react';

interface PublicLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
  source: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  order_number?: string;
  fields: {
    value?: number;
    segment?: string;
  };
  stages: {
    name: string;
    color: string;
  } | null;
  users: {
    name: string;
    email: string;
  } | null;
  budget_documents?: Array<{
    id: string;
    file_name: string;
    amount: number;
  }>;
}

interface DashboardMetrics {
  totalLeads: number;
  totalValue: number;
  conversionRate: number;
  leadsByStage: Array<{
    stage: string;
    count: number;
    value: number;
    color: string;
  }>;
  leadsBySource: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  recentLeads: PublicLead[];
  topAgents: Array<{
    name: string;
    leads: number;
    value: number;
  }>;
}

export function SupervisorDashboard() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'varejo' | 'distribuidores'>('varejo');
  const [leads, setLeads] = useState<PublicLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    totalValue: 0,
    conversionRate: 0,
    leadsByStage: [],
    leadsBySource: [],
    recentLeads: [],
    topAgents: []
  });

  useEffect(() => {
    if (user?.tenant_id) {
      fetchPublicLeads();
      
      // Configurar subscription para atualizações em tempo real
      const leadsChannel = supabase
        .channel('public_leads_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: 'is_public=eq.true'
          },
          (payload) => {
            console.log('📊 Supervisor Dashboard - Lead atualizado:', payload);
            fetchPublicLeads(); // Recarregar dados quando houver mudanças
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(leadsChannel);
      };
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    calculateMetrics();
  }, [leads, selectedCategory]);

  const fetchPublicLeads = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          category,
          source,
          created_at,
          updated_at,
          is_public,
          order_number,
          fields,
          stages(name, color),
          users!leads_assigned_to_fkey(name, email),
          budget_documents(id, file_name, amount)
        `)
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setLeads(data || []);
    } catch (error: any) {
      console.error('Error fetching public leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const filteredLeads = leads.filter(lead => lead.category === selectedCategory);
    
    const totalLeads = filteredLeads.length;
    const totalValue = filteredLeads.reduce((sum, lead) => sum + (lead.fields?.value || 0), 0);
    
    // Calculate conversion rate (leads with budget vs total)
    const leadsWithBudget = filteredLeads.filter(lead => lead.fields?.value && lead.fields.value > 0);
    const conversionRate = totalLeads > 0 ? Math.round((leadsWithBudget.length / totalLeads) * 100) : 0;
    
    // Leads by stage
    const stageMap = new Map();
    filteredLeads.forEach(lead => {
      if (lead.stages) {
        const stage = lead.stages.name;
        if (!stageMap.has(stage)) {
          stageMap.set(stage, { count: 0, value: 0, color: lead.stages.color });
        }
        stageMap.get(stage).count++;
        stageMap.get(stage).value += lead.fields?.value || 0;
      }
    });
    const leadsByStage = Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      ...data
    }));
    
    // Leads by source
    const sourceMap = new Map();
    filteredLeads.forEach(lead => {
      const source = lead.source || 'outros';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const leadsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalLeads) * 100)
    })).sort((a, b) => b.count - a.count);
    
    // Recent leads (last 5)
    const recentLeads = filteredLeads.slice(0, 5);
    
    // Top agents
    const agentMap = new Map();
    filteredLeads.forEach(lead => {
      if (lead.users) {
        const agent = lead.users.name;
        if (!agentMap.has(agent)) {
          agentMap.set(agent, { leads: 0, value: 0 });
        }
        agentMap.get(agent).leads++;
        agentMap.get(agent).value += lead.fields?.value || 0;
      }
    });
    const topAgents = Array.from(agentMap.entries()).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.leads - a.leads).slice(0, 3);
    
    setMetrics({
      totalLeads,
      totalValue,
      conversionRate,
      leadsByStage,
      leadsBySource,
      recentLeads,
      topAgents
    });
  };

  const getCategoryIcon = (category: string) => {
    return category === 'varejo' ? <Store className="h-4 w-4" /> : <Truck className="h-4 w-4" />;
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'facebook': return 'bg-blue-100 text-blue-800';
      case 'site': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const varejoCount = leads.filter(l => l.category === 'varejo').length;
  const distribuidoresCount = leads.filter(l => l.category === 'distribuidores').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Supervisor</h1>
          <p className="text-muted-foreground">
            Acompanhamento inteligente dos leads da Lista Geral
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {metrics.totalLeads} leads públicos
        </Badge>
      </div>

      {/* Category Selector */}
      <SupervisorCategorySelector
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        varejoCount={varejoCount}
        distribuidoresCount={distribuidoresCount}
      />

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              na Lista Geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(metrics.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              em negociação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              com orçamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividade</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.recentLeads.length}
            </div>
            <p className="text-xs text-muted-foreground">
              leads recentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Leads by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Estágio</CardTitle>
            <CardDescription>
              Distribuição dos leads por estágio do pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.leadsByStage.map((stage) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-sm font-medium">{stage.stage}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stage.count} leads
                    </div>
                  </div>
                  <Progress 
                    value={(stage.count / metrics.totalLeads) * 100} 
                    className="h-2"
                  />
                  {stage.value > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Valor: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(stage.value)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
            <CardDescription>
              De onde vêm os leads da Lista Geral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.leadsBySource.map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getSourceColor(source.source)}>
                      {source.source}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{source.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({source.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads and Top Agents */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
            <CardDescription>
              Últimos leads adicionados à Lista Geral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(lead.category)}
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lead.users?.name || 'Não atribuído'}
                      </div>
                      {lead.order_number && (
                        <div className="text-xs">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Pedido: {lead.order_number}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {lead.fields?.value && (
                      <div className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(lead.fields.value)}
                      </div>
                    )}
                    <div className="flex items-center gap-1 justify-end">
                      <Badge variant="outline" className={getSourceColor(lead.source)}>
                        {lead.source}
                      </Badge>
                      {lead.budget_documents && lead.budget_documents.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          📄 {lead.budget_documents.length} doc(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Agentes</CardTitle>
            <CardDescription>
              Agentes com mais leads na Lista Geral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topAgents.map((agent, index) => (
                <div key={agent.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.leads} leads
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(agent.value)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      valor total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
