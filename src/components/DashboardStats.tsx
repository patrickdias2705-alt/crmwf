import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, TrendingUp, Phone, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantView } from "@/contexts/TenantViewContext";

export function DashboardStats() {
  const { user } = useAuth();
  const { viewingTenantId, viewingAgentId, isViewingAgent } = useTenantView();
  const [stats, setStats] = useState([
    {
      title: "Total Leads",
      value: "0",
      change: "+0%",
      changeType: "neutral" as const,
      icon: Users,
    },
    {
      title: "Active Conversations",
      value: "0",
      change: "+0%",
      changeType: "neutral" as const,
      icon: MessageSquare,
    },
    {
      title: "Conversion Rate",
      value: "0%",
      change: "+0%",
      changeType: "neutral" as const,
      icon: TrendingUp,
    },
    {
      title: "Receita Total",
      value: "R$ 0,00",
      change: "+0%",
      changeType: "neutral" as const,
      icon: DollarSign,
    },
    {
      title: "WhatsApp Connected",
      value: "Not Connected",
      change: "Inactive",
      changeType: "neutral" as const,
      icon: Phone,
    },
  ]);

  useEffect(() => {
    const effectiveTenantId = viewingTenantId || user?.tenant_id;
    if (!effectiveTenantId) return;

    console.log('📊 DashboardStats - Loading for:', { 
      tenant: effectiveTenantId, 
      agent: viewingAgentId,
      isViewingAgent 
    });

    const fetchStats = async () => {
      // Base query builder for leads
      let leadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', effectiveTenantId);
      
      // Filter by agent if viewing specific agent
      if (isViewingAgent && viewingAgentId) {
        leadsQuery = leadsQuery.eq('assigned_to', viewingAgentId);
      }

      const { count: leadsCount } = await leadsQuery;

      // Base query for conversations
      let conversationsQuery = supabase
        .from('conversations')
        .select('*, leads!inner(*)', { count: 'exact', head: true })
        .eq('tenant_id', effectiveTenantId)
        .eq('status', 'open');
      
      if (isViewingAgent && viewingAgentId) {
        conversationsQuery = conversationsQuery.eq('leads.assigned_to', viewingAgentId);
      }

      const { count: conversationsCount } = await conversationsQuery;

      // Buscar métricas para taxa de conversão
      const { data: metricsData } = await supabase
        .from('metrics_daily')
        .select('leads_in, closed')
        .eq('tenant_id', effectiveTenantId);

      const totals = metricsData?.reduce((acc, day) => ({
        leads_in: acc.leads_in + (day.leads_in || 0),
        closed: acc.closed + (day.closed || 0)
      }), { leads_in: 0, closed: 0 }) || { leads_in: 0, closed: 0 };

      const conversionRate = totals.leads_in > 0 ? (totals.closed / totals.leads_in) * 100 : 0;

      // Buscar receita total (orçamentos de leads fechados)
      let budgetsQuery = supabase
        .from('budgets')
        .select('value, lead_id, leads!inner(stage_id, tenant_id, assigned_to, stages!inner(name))')
        .eq('leads.tenant_id', effectiveTenantId);

      if (isViewingAgent && viewingAgentId) {
        budgetsQuery = budgetsQuery.eq('leads.assigned_to', viewingAgentId);
      }

      const { data: budgetsData } = await budgetsQuery;

      const totalRevenue = budgetsData?.reduce((sum, b) => {
        const stageName = (b.leads as any)?.stages?.name?.toLowerCase() || '';
        if (stageName.includes('fechado') || 
            stageName.includes('vendido') || 
            stageName.includes('ganho') ||
            stageName.includes('bolso')) {
          return sum + (Number(b.value) || 0);
        }
        return sum;
      }, 0) || 0;

      // Buscar status do WhatsApp
      const { data: whatsappData } = await supabase
        .from('whatsapp_connections')
        .select('status')
        .eq('tenant_id', effectiveTenantId)
        .eq('is_active', true)
        .single();

      setStats([
        {
          title: "Total Leads",
          value: (leadsCount || 0).toString(),
          change: "+0%",
          changeType: "neutral" as const,
          icon: Users,
        },
        {
          title: "Active Conversations",
          value: (conversationsCount || 0).toString(),
          change: "+0%",
          changeType: "neutral" as const,
          icon: MessageSquare,
        },
        {
          title: "Conversion Rate",
          value: `${conversionRate.toFixed(1)}%`,
          change: "+0%",
          changeType: "neutral" as const,
          icon: TrendingUp,
        },
        {
          title: "Receita Total",
          value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: "+0%",
          changeType: "neutral" as const,
          icon: DollarSign,
        },
        {
          title: "WhatsApp Connected",
          value: whatsappData?.status === 'open' ? "Connected" : "Not Connected",
          change: whatsappData?.status === 'open' ? "Active" : "Inactive",
          changeType: "neutral" as const,
          icon: Phone,
        },
      ]);
    };

    fetchStats();

    // Subscribe to realtime changes
    const budgetsChannel = supabase
      .channel('dashboard-budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets'
        },
        () => {
          console.log('💰 Budget changed, refreshing dashboard stats');
          fetchStats();
        }
      )
      .subscribe();

    const leadsChannel = supabase
      .channel('dashboard-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          console.log('👤 Lead changed, refreshing dashboard stats');
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(budgetsChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [user?.tenant_id, viewingTenantId, viewingAgentId, isViewingAgent]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}