import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, TrendingUp, Phone, DollarSign, Zap, Target, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantView } from "@/contexts/TenantViewContext";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

export function DashboardStats() {
  const { user } = useAuth();
  const { viewingTenantId, viewingAgentId, isViewingAgent } = useTenantView();
  const { valuesVisible } = useValuesVisibility();
  const [stats, setStats] = useState([
    {
      title: "Total Leads",
      value: "0",
      change: "+0%",
      changeType: "neutral" as const,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-500/10 to-cyan-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Taxa de Conversão",
      value: "0%",
      change: "+0%",
      changeType: "neutral" as const,
      icon: Target,
      color: "from-emerald-500 to-green-500",
      bgColor: "from-emerald-500/10 to-green-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Total Vendido",
      value: "R$ 0,00",
      change: "+0%",
      changeType: "neutral" as const,
      icon: DollarSign,
      color: "from-amber-500 to-orange-500",
      bgColor: "from-amber-500/10 to-orange-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Conversas Ativas",
      value: "0",
      change: "+0%",
      changeType: "neutral" as const,
      icon: MessageSquare,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      title: "Performance",
      value: "Excelente",
      change: "Ativo",
      changeType: "positive" as const,
      icon: Activity,
      color: "from-rose-500 to-red-500",
      bgColor: "from-rose-500/10 to-red-500/10",
      borderColor: "border-rose-500/20",
    },
  ]);

  useEffect(() => {
    // Usar o tenant_id do usuário logado
    const effectiveTenantId = user?.tenant_id;
    
    if (!effectiveTenantId) {
      console.error('❌ DashboardStats - Usuário sem tenant_id!');
      // Manter stats zeradas mas sem quebrar
      setStats([
        {
          title: "Total Leads",
          value: "0",
          change: "+0%",
          changeType: "neutral" as const,
          icon: Users,
          color: "from-blue-500 to-cyan-500",
          bgColor: "from-blue-500/10 to-cyan-500/10",
          borderColor: "border-blue-500/20",
        },
        {
          title: "Taxa de Conversão",
          value: "0%",
          change: "+0%",
          changeType: "neutral" as const,
          icon: Target,
          color: "from-emerald-500 to-green-500",
          bgColor: "from-emerald-500/10 to-green-500/10",
          borderColor: "border-emerald-500/20",
        },
        {
          title: "Total Vendido",
          value: "R$ 0,00",
          change: "+0%",
          changeType: "neutral" as const,
          icon: DollarSign,
          color: "from-amber-500 to-orange-500",
          bgColor: "from-amber-500/10 to-orange-500/10",
          borderColor: "border-amber-500/20",
        },
        {
          title: "Conversas Ativas",
          value: "0",
          change: "+0%",
          changeType: "neutral" as const,
          icon: MessageSquare,
          color: "from-purple-500 to-pink-500",
          bgColor: "from-purple-500/10 to-pink-500/10",
          borderColor: "border-purple-500/20",
        },
        {
          title: "Performance",
          value: "Iniciando",
          change: "Ativo",
          changeType: "neutral" as const,
          icon: Activity,
          color: "from-rose-500 to-red-500",
          bgColor: "from-rose-500/10 to-red-500/10",
          borderColor: "border-rose-500/20",
        },
      ]);
      return;
    }
    
    console.log('🏠 DashboardStats - Tenant ID debug:', {
      userEmail: user?.email,
      userTenantId: user?.tenant_id,
      effectiveTenantId,
      userRawMetaData: user?.raw_user_meta_data
    });

    console.log('📊 DashboardStats - Loading for:', { 
      tenant: effectiveTenantId, 
      agent: viewingAgentId,
      isViewingAgent,
      userEmail: user?.email
    });

    const fetchStats = async () => {
      try {
        console.log('📊 DashboardStats - Iniciando fetchStats para tenant:', effectiveTenantId);
        
        // Base query builder for leads (TODOS os leads, não apenas recentes)
        let leadsQuery = supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', effectiveTenantId);
          // REMOVIDO filtro de data para buscar TODOS os leads
        
        // Filter by agent if viewing specific agent
        if (isViewingAgent && viewingAgentId) {
          leadsQuery = leadsQuery.eq('assigned_to', viewingAgentId);
        }

        const { count: leadsCount, error: leadsError } = await leadsQuery;
        
        if (leadsError) {
          console.error('❌ DashboardStats - Erro ao buscar leads:', leadsError);
        }
        
        console.log('📊 DashboardStats - Leads encontrados:', leadsCount);

        // Base query for conversations
        let conversationsQuery = supabase
          .from('conversations')
          .select('*, leads!inner(*)', { count: 'exact', head: true })
          .eq('tenant_id', effectiveTenantId)
          .eq('status', 'open');
        
        if (isViewingAgent && viewingAgentId) {
          conversationsQuery = conversationsQuery.eq('leads.assigned_to', viewingAgentId);
        }

        const { count: conversationsCount, error: conversationsError } = await conversationsQuery;
        
        if (conversationsError) {
          console.error('❌ DashboardStats - Erro ao buscar conversas:', conversationsError);
        }
        
        console.log('📊 DashboardStats - Conversas encontradas:', conversationsCount);

        // Buscar métricas para taxa de conversão (TODAS as métricas, não apenas recentes)
        const { data: metricsData, error: metricsError } = await supabase
          .from('metrics_daily')
          .select('leads_in, closed')
          .eq('tenant_id', effectiveTenantId);
          // REMOVIDO filtro de data para buscar TODAS as métricas

        if (metricsError) {
          console.error('❌ DashboardStats - Erro ao buscar métricas:', metricsError);
        }

        const totals = metricsData?.reduce((acc, day) => ({
          leads_in: acc.leads_in + (day.leads_in || 0),
          closed: acc.closed + (day.closed || 0)
        }), { leads_in: 0, closed: 0 }) || { leads_in: 0, closed: 0 };

        const conversionRate = totals.leads_in > 0 ? (totals.closed / totals.leads_in) * 100 : 0;
        
        console.log('📊 DashboardStats - Métricas calculadas:', { totals, conversionRate });

      // Buscar receita total da tabela sales (TODAS as vendas, não apenas recentes)
      let salesQuery = supabase
        .from('sales')
        .select('amount, lead_id')
        .eq('tenant_id', effectiveTenantId);
        // REMOVIDO filtro de data para buscar TODAS as vendas

      if (isViewingAgent && viewingAgentId) {
        // Filter by agent through leads table
        const { data: agentLeads } = await supabase
          .from('leads')
          .select('id')
          .eq('assigned_to', viewingAgentId)
          .eq('tenant_id', effectiveTenantId);
        
        const agentLeadIds = agentLeads?.map(l => l.id) || [];
        if (agentLeadIds.length > 0) {
          salesQuery = salesQuery.in('lead_id', agentLeadIds);
        } else {
          // No leads for this agent, so no sales
          salesQuery = salesQuery.eq('lead_id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
        }
      }

      const { data: salesData, error: salesError } = await salesQuery;
      
      console.log('💰 DashboardStats - Sales data:', { 
        salesData: salesData?.length || 0, 
        salesError,
        effectiveTenantId,
        userEmail: user?.email,
        salesDataDetails: salesData?.slice(0, 3) // Primeiros 3 registros
      });
      
      // Fallback: se não houver dados em sales, buscar de leads.fields
      let totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;
      
      console.log('💰 DashboardStats - Revenue from sales table:', totalRevenue);
      
      if (totalRevenue === 0) {
        let leadsFieldsQuery = supabase
          .from('leads')
          .select('fields')
          .eq('tenant_id', effectiveTenantId)
          .eq('status', 'closed');
          // REMOVIDO filtro de data para buscar TODOS os leads fechados
        
        if (isViewingAgent && viewingAgentId) {
          leadsFieldsQuery = leadsFieldsQuery.eq('assigned_to', viewingAgentId);
        }
        
        const { data: leadsWithFields, error: leadsError } = await leadsFieldsQuery;
        
        console.log('💰 DashboardStats - Leads fields data:', { 
          leadsWithFields: leadsWithFields?.length || 0, 
          leadsError 
        });
        
        totalRevenue = leadsWithFields?.reduce((sum, lead) => {
          const saleValue = lead.fields?.sale_value || lead.fields?.saleValue || 0;
          return sum + (typeof saleValue === 'string' ? parseFloat(saleValue) : saleValue);
        }, 0) || 0;
        
        console.log('💰 DashboardStats - Revenue from leads fields:', totalRevenue);
      }
      
      console.log('💰 DashboardStats - Final total revenue:', totalRevenue);

      // Calcular performance baseada em conversão
      let performance = "Iniciando";
      if (conversionRate > 20) performance = "Excelente";
      else if (conversionRate > 15) performance = "Muito Bom";
      else if (conversionRate > 10) performance = "Bom";
      else if (conversionRate > 5) performance = "Regular";

      setStats([
        {
          title: "Total Leads",
          value: leadsCount?.toString() || "0",
          change: "+12%",
          changeType: "positive" as const,
          icon: Users,
          color: "from-blue-500 to-cyan-500",
          bgColor: "from-blue-500/10 to-cyan-500/10",
          borderColor: "border-blue-500/20",
        },
        {
          title: "Taxa de Conversão",
          value: `${conversionRate.toFixed(1)}%`,
          change: conversionRate > 10 ? "+5.2%" : "-2.1%",
          changeType: conversionRate > 10 ? "positive" as const : "negative" as const,
          icon: Target,
          color: "from-emerald-500 to-green-500",
          bgColor: "from-emerald-500/10 to-green-500/10",
          borderColor: "border-emerald-500/20",
        },
        {
          title: "Total Vendido",
          value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          change: "+8.4%",
          changeType: "positive" as const,
          icon: DollarSign,
          color: "from-amber-500 to-orange-500",
          bgColor: "from-amber-500/10 to-orange-500/10",
          borderColor: "border-amber-500/20",
        },
        {
          title: "Conversas Ativas",
          value: conversationsCount?.toString() || "0",
          change: "+3.1%",
          changeType: "positive" as const,
          icon: MessageSquare,
          color: "from-purple-500 to-pink-500",
          bgColor: "from-purple-500/10 to-pink-500/10",
          borderColor: "border-purple-500/20",
        },
        {
          title: "Performance",
          value: performance,
          change: "Ativo",
          changeType: "positive" as const,
          icon: Activity,
          color: "from-rose-500 to-red-500",
          bgColor: "from-rose-500/10 to-red-500/10",
          borderColor: "border-rose-500/20",
        },
      ]);
      
      console.log('✅ DashboardStats - Stats atualizadas com sucesso');
      
      } catch (error) {
        console.error('❌ DashboardStats - Erro geral ao buscar stats:', error);
        
        // Em caso de erro, manter stats zeradas mas sem quebrar
        setStats([
          {
            title: "Total Leads",
            value: "0",
            change: "+0%",
            changeType: "neutral" as const,
            icon: Users,
            color: "from-blue-500 to-cyan-500",
            bgColor: "from-blue-500/10 to-cyan-500/10",
            borderColor: "border-blue-500/20",
          },
          {
            title: "Taxa de Conversão",
            value: "0%",
            change: "+0%",
            changeType: "neutral" as const,
            icon: Target,
            color: "from-emerald-500 to-green-500",
            bgColor: "from-emerald-500/10 to-green-500/10",
            borderColor: "border-emerald-500/20",
          },
          {
            title: "Total Vendido",
            value: "R$ 0,00",
            change: "+0%",
            changeType: "neutral" as const,
            icon: DollarSign,
            color: "from-amber-500 to-orange-500",
            bgColor: "from-amber-500/10 to-orange-500/10",
            borderColor: "border-amber-500/20",
          },
          {
            title: "Conversas Ativas",
            value: "0",
            change: "+0%",
            changeType: "neutral" as const,
            icon: MessageSquare,
            color: "from-purple-500 to-pink-500",
            bgColor: "from-purple-500/10 to-pink-500/10",
            borderColor: "border-purple-500/20",
          },
          {
            title: "Performance",
            value: "Iniciando",
            change: "Ativo",
            changeType: "neutral" as const,
            icon: Activity,
            color: "from-rose-500 to-red-500",
            bgColor: "from-rose-500/10 to-red-500/10",
            borderColor: "border-rose-500/20",
          },
        ]);
      }
    };

    fetchStats();

    // Real-time updates
    const leadsChannel = supabase
      .channel('dashboard-leads-stats')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads', filter: `tenant_id=eq.${effectiveTenantId}` },
        () => {
          console.log('👤 Lead changed, refreshing dashboard stats');
          fetchStats();
        }
      )
      .subscribe();

    const budgetsChannel = supabase
      .channel('dashboard-budgets-stats')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'budgets', filter: `leads.tenant_id=eq.${effectiveTenantId}` },
        () => {
          console.log('💰 Budget changed, refreshing dashboard stats');
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(budgetsChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [user?.tenant_id, viewingTenantId, viewingAgentId, isViewingAgent]);

  console.log('🎨 DashboardStats renderizando com design novo:', stats);
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title} 
            className="group relative overflow-hidden transition-all duration-700 hover:scale-110 hover:shadow-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-md border-2 border-blue-500/40 hover:border-cyan-400/60 animate-fade-in"
            style={{ 
              animationDelay: `${index * 150}ms`,
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
              boxShadow: '0 8px 32px rgba(37, 99, 235, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Efeito de brilho animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Efeito de partículas */}
            <div className="absolute top-2 right-2 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
            <div className="absolute top-4 right-6 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-6 right-3 w-1.5 h-1.5 bg-white/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-cyan-300 transition-colors duration-300">
                {stat.title}
              </CardTitle>
              <div className={`
                p-3 rounded-xl bg-gradient-to-br ${stat.color} 
                shadow-2xl group-hover:shadow-cyan-500/50 transition-all duration-500
                group-hover:scale-125 group-hover:rotate-12 animate-float
              `}>
                <Icon className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Valor principal com animação de contador */}
              <div className="relative">
                <div className={`
                  text-4xl font-black bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent
                  group-hover:scale-125 transition-transform duration-500
                  drop-shadow-2xl animate-pulse-glow
                  tracking-tight
                `}
                style={{
                  WebkitTextStroke: '0.5px rgba(37, 99, 235, 0.3)'
                }}>
                  {valuesVisible ? stat.value : '••••'}
                </div>
                
                {/* Efeito de destaque no hover */}
                <div className={`
                  absolute inset-0 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent
                  opacity-0 group-hover:opacity-20 transition-opacity duration-300
                  blur-sm
                `}>
                  {valuesVisible ? stat.value : '••••'}
                </div>
              </div>

              {/* Indicador de mudança com animação */}
              <div className="flex items-center space-x-2">
                <div className={`
                  flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                  ${stat.changeType === 'positive' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : stat.changeType === 'negative'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }
                  group-hover:scale-105 transition-transform duration-200
                `}>
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : stat.changeType === 'negative' ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <BarChart3 className="h-3 w-3" />
                  )}
                  <span className="font-semibold">
                    {valuesVisible ? stat.change : '••••'}
                  </span>
                </div>
                
                {/* Indicador de status */}
                <div className={`
                  w-2 h-2 rounded-full animate-pulse
                  ${stat.changeType === 'positive' ? 'bg-emerald-500' : 
                    stat.changeType === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                  }
                `} />
              </div>

              {/* Linha de progresso animada */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                <div 
                  className={`
                    h-full bg-gradient-to-r ${stat.color} rounded-full
                    transition-all duration-1000 ease-out
                    group-hover:animate-pulse
                  `}
                  style={{ 
                    width: stat.changeType === 'positive' ? '85%' : 
                           stat.changeType === 'negative' ? '45%' : '60%'
                  }}
                />
              </div>
            </CardContent>

            {/* Efeito de borda brilhante no hover */}
            <div className={`
              absolute inset-0 rounded-lg border-2 border-transparent
              bg-gradient-to-r ${stat.color} bg-clip-border
              opacity-0 group-hover:opacity-30 transition-opacity duration-300
              -z-10
            `} />
          </Card>
        );
      })}
    </div>
  );
}