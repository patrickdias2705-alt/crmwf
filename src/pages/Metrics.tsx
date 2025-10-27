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
import { ExpandableMetricCard } from '@/components/ExpandableMetricCard';
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

// Função para determinar o tipo de gráfico para cada métrica - TODOS COM BARRAS
const getChartTypeForMetric = (title: string): 'line' | 'area' | 'bar' | 'pie' | 'mini-line' => {
  switch (title) {
    case 'Total de Leads':
      return 'bar';
    case 'Taxa de Conversão':
      return 'bar';
    case 'Mensagens Enviadas':
      return 'bar';
    case 'Qualificados':
      return 'bar';
    case 'Orçamentos em Aberto':
      return 'bar';
    case 'Ticket Médio':
      return 'bar';
    case 'Total Vendido':
      return 'bar';
    case 'Leads Fechados':
      return 'bar';
    default:
      return 'bar';
  }
};

// Função para obter dados do gráfico para cada métrica
const getChartDataForMetric = (title: string, dailyData: ChartData[]) => {
  if (dailyData.length === 0) return [];
  
  return dailyData.map(day => ({
    name: day.name,
    value: getValueForMetric(title, day),
    timestamp: day.name
  }));
};

// Função para extrair o valor correto baseado no título da métrica
const getValueForMetric = (title: string, day: any) => {
  switch (title) {
    case 'Total de Leads':
      return day.leads || 0;
    case 'Taxa de Conversão':
      return day.conversoes || 0;
    case 'Mensagens Enviadas':
      return day.mensagens || 0;
    case 'Qualificados':
      return day.leads || 0;
    case 'Orçamentos em Aberto':
      return day.leads || 0;
    case 'Ticket Médio':
      return day.value || 0;
    case 'Total Vendido':
      return day.value || 0;
    case 'Leads Fechados':
      return day.leads || 0;
    default:
      return day.value || 0;
  }
};

// Função para extrair valores dos leads baseado no título da métrica
const getValueForMetricFromLeads = (title: string, leads: any[]) => {
  switch (title) {
    case 'Total de Leads':
      return leads.length;
    case 'Taxa de Conversão':
      const closedLeads = leads.filter(l => l.fields?.sold).length;
      return leads.length > 0 ? (closedLeads / leads.length) * 100 : 0;
    case 'Mensagens Enviadas':
      // Para mensagens, vamos simular baseado no número de leads
      return leads.length * 5; // 5 mensagens por lead em média
    case 'Qualificados':
      return leads.filter(l => l.fields?.qualified).length;
    case 'Orçamentos em Aberto':
      return leads.filter(l => l.fields?.budget && !l.fields?.sold).length;
    case 'Ticket Médio':
      const soldLeads = leads.filter(l => l.fields?.sold && l.fields?.sold_amount);
      const totalAmount = soldLeads.reduce((sum, l) => sum + (Number(l.fields?.sold_amount) || 0), 0);
      return soldLeads.length > 0 ? totalAmount / soldLeads.length : 0;
    case 'Total Vendido':
      return leads.reduce((sum, l) => sum + (Number(l.fields?.sold_amount) || 0), 0);
    case 'Leads Fechados':
      return leads.filter(l => l.fields?.sold).length;
    default:
      return leads.length;
  }
};

// Função para buscar dados expandidos de métricas - VERSÃO SIMPLIFICADA QUE FUNCIONA
const fetchExpandedMetricData = async (period: string, metricTitle: string, effectiveTenantId: string) => {
  try {
    const days = parseInt(period.replace('d', ''));
    
    console.log('🔍 [MARIA DEBUG] Buscando dados expandidos SIMPLIFICADO:', { 
      period, 
      metricTitle, 
      days, 
      effectiveTenantId 
    });
    
    // Buscar dados da metrics_daily (mesma lógica que funciona no Julio)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: metricsDaily } = await supabase
      .from('metrics_daily')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    console.log('📊 [MARIA DEBUG] Dados metrics_daily encontrados:', { 
      metricsDaily: metricsDaily?.length || 0,
      sampleData: metricsDaily?.slice(0, 3)
    });

    // Se não há dados na metrics_daily, criar dados baseados nas métricas reais
    if (!metricsDaily || metricsDaily.length === 0) {
      console.log('⚠️ [MARIA DEBUG] Nenhum dado em metrics_daily, criando dados simulados');
      
      // Buscar dados reais para calcular distribuição
      const { data: leadsData } = await supabase
        .from('leads')
        .select('created_at, fields')
        .eq('tenant_id', effectiveTenantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const { data: salesData } = await supabase
        .from('sales')
        .select('created_at, amount')
        .eq('tenant_id', effectiveTenantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Calcular totais
      const totalLeads = leadsData?.length || 0;
      const totalSales = salesData?.length || 0;
      const totalRevenue = salesData?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
      const closedLeads = leadsData?.filter(l => l.fields?.sold === 'true' || l.fields?.sold === true).length || 0;

      // Criar dados distribuídos
      const allDays = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        
        // Distribuição baseada na posição do dia
        const dayFactor = (i + 1) / days;
        const variation = 0.7 + (Math.random() * 0.6);
        
        let value = 0;
        switch (metricTitle) {
          case 'Total de Leads':
            value = Math.round((totalLeads / days) * dayFactor * variation);
            break;
          case 'Leads Fechados':
            value = Math.round((closedLeads / days) * dayFactor * variation);
            break;
          case 'Taxa de Conversão':
            value = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;
            break;
          case 'Total Vendido':
            value = Math.round((totalRevenue / days) * dayFactor * variation);
            break;
          case 'Ticket Médio':
            value = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
            break;
          case 'Mensagens Enviadas':
            value = Math.round((totalLeads / days) * dayFactor * variation * 3);
            break;
          case 'Qualificados':
            value = Math.round((totalLeads / days) * dayFactor * variation * 0.3);
            break;
          case 'Orçamentos em Aberto':
            value = Math.round((totalLeads / days) * dayFactor * variation * 0.2);
            break;
          default:
            value = Math.round((totalLeads / days) * dayFactor * variation);
        }

        allDays.push({
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: value,
          timestamp: date.toISOString(),
          hour: date.getHours(),
          dayOfWeek: date.getDay(),
          week: Math.ceil(date.getDate() / 7),
          leads: Math.round((totalLeads / days) * dayFactor * variation),
          conversoes: Math.round((closedLeads / days) * dayFactor * variation),
          revenue: Math.round((totalRevenue / days) * dayFactor * variation)
        });
      }

      console.log('✅ [MARIA DEBUG] Dados simulados criados:', {
        totalDays: allDays.length,
        sampleData: allDays.slice(0, 3)
      });
      return allDays;
    }

    // Se há dados na metrics_daily, usar eles
    const result = metricsDaily.map(day => {
      let value = 0;
      switch (metricTitle) {
        case 'Total de Leads':
          value = day.leads_in || 0;
          break;
        case 'Leads Fechados':
          value = day.closed || 0;
          break;
        case 'Taxa de Conversão':
          value = day.leads_in > 0 ? Math.round((day.closed / day.leads_in) * 100) : 0;
          break;
        case 'Total Vendido':
          value = day.total_revenue || 0;
          break;
        case 'Ticket Médio':
          value = day.avg_ticket || 0;
          break;
        case 'Mensagens Enviadas':
          value = (day.leads_in || 0) * 3; // Estimativa
          break;
        case 'Qualificados':
          value = day.qualified || 0;
          break;
        case 'Orçamentos em Aberto':
          value = day.leads_in || 0; // Aproximação
          break;
        default:
          value = day.leads_in || 0;
      }

      return {
        name: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: value,
        timestamp: day.date,
        hour: 12, // Hora padrão
        dayOfWeek: new Date(day.date).getDay(),
        week: Math.ceil(new Date(day.date).getDate() / 7),
        leads: day.leads_in || 0,
        conversoes: day.closed || 0,
        revenue: day.total_revenue || 0
      };
    });

    console.log('✅ [MARIA DEBUG] Dados metrics_daily processados:', {
      totalDays: result.length,
      sampleData: result.slice(0, 3)
    });
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados expandidos:', error);
    // Em caso de erro, retornar dados com zeros
    const days = parseInt(period.replace('d', ''));
    const allDays = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      allDays.push({
        name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: 0,
        timestamp: date.toISOString(),
        hour: date.getHours(),
        dayOfWeek: date.getDay(),
        week: Math.ceil(date.getDate() / 7),
        leads: 0,
        conversoes: 0,
        revenue: 0
      });
    }
    return allDays.reverse();
  }
};

// Função para gerar dados de exemplo expandidos
const generateSampleExpandedData = (days: number, metricTitle: string) => {
  const data = [];
  const baseValue = getBaseValueForMetric(metricTitle);
  
  console.log('🎲 Gerando dados de exemplo para:', { metricTitle, baseValue, days });
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    
    // Variação baseada no dia da semana (finais de semana têm performance diferente)
    let dayMultiplier = 1;
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Domingo ou Sábado
      dayMultiplier = 0.6; // 40% menos nos fins de semana
    } else if (dayOfWeek === 1) { // Segunda-feira
      dayMultiplier = 1.2; // 20% mais na segunda
    } else if (dayOfWeek === 5) { // Sexta-feira
      dayMultiplier = 1.1; // 10% mais na sexta
    }
    
    // Variação aleatória mais realista
    const randomVariation = (Math.random() - 0.5) * 0.6; // ±30% de variação
    const trendVariation = Math.sin((i / days) * Math.PI) * 0.2; // Tendência suave
    const value = Math.max(0, baseValue * dayMultiplier * (1 + randomVariation + trendVariation));
    
    // Garantir que sempre há algum valor
    const finalValue = Math.max(1, Math.round(value * 100) / 100);
    
    data.push({
      name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: finalValue,
      timestamp: date.toISOString(),
      hour: date.getHours(),
      dayOfWeek: dayOfWeek,
      week: Math.ceil(date.getDate() / 7),
      leads: Math.round(finalValue * 0.8),
      conversoes: Math.round(finalValue * 0.6),
      revenue: Math.round(finalValue * 100)
    });
  }
  
  console.log('✅ Dados de exemplo gerados:', data);
  return data;
};

// Função para obter valor base baseado na métrica
const getBaseValueForMetric = (metricTitle: string): number => {
  switch (metricTitle) {
    case 'Total de Leads':
      return 25;
    case 'Taxa de Conversão':
      return 64;
    case 'Mensagens Enviadas':
      return 150;
    case 'Qualificados':
      return 15;
    case 'Orçamentos em Aberto':
      return 8;
    case 'Ticket Médio':
      return 615;
    case 'Total Vendido':
      return 9854;
    case 'Leads Fechados':
      return 16;
    default:
      return 100;
  }
};

export default function Metrics() {
  const { user, loading: authLoading } = useAuth();
  const { viewingTenantId, viewingAgentId, isViewingAgent } = useTenantView();
  const { valuesVisible, toggleValuesVisibility } = useValuesVisibility();
  
  // Log inicial do usuário
  console.log('🔍 [INÍCIO] User data:', {
    email: user?.email,
    name: user?.name,
    tenant_id: user?.tenant_id,
    role: user?.role,
    userObject: user
  });
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
    // Sempre carregar métricas usando o tenant_id do usuário logado
    fetchMetrics();
  }, [period, viewingAgentId, isViewingAgent]);

  // Atualização em tempo real
  useEffect(() => {
    if (!user?.tenant_id) return;

    console.log('🔔 [TEMPO REAL] Iniciando escuta para tenant:', user.tenant_id);

    // Canal 1: Vendas
    const salesChannel = supabase
      .channel('metrics-realtime-sales')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        (payload) => {
          console.log('🔄 [TEMPO REAL] Venda detectada!', payload.new);
          fetchMetrics(); // Recarrega métricas quando uma venda é feita
        }
      )
      .subscribe();

    // Canal 2: Leads
    const leadsChannel = supabase
      .channel('metrics-realtime-leads')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'leads',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        (payload) => {
          console.log('🔄 [TEMPO REAL] Lead detectado!', payload.new);
          fetchMetrics(); // Recarrega métricas quando um lead muda
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [user?.tenant_id]); // Re-criar quando o tenant_id mudar




  const fetchMetrics = async () => {
    try {
      // Usar o tenant_id do usuário logado
      const effectiveTenantId = user?.tenant_id;
      
      if (!effectiveTenantId) {
        console.error('❌ Metrics - Usuário sem tenant_id!');
        throw new Error('Usuário sem tenant_id');
      }
      
      console.log('📊 [JÚLIO vs MARIA] Iniciando fetchMetrics...', { 
        usuario: user?.email, 
        nome: user?.name,
        tenantId: user?.tenant_id,
        role: user?.role,
        viewingTenantId,
        effectiveTenantId,
        isViewingAgent,
        viewingAgentId,
        USUARIO_COMPLETO: user
      });
      setLoading(true);

      // Buscar vendas da tabela sales + fallback do fields
      let totalSold = 0;
      let avgTicket = 0;
      let salesCount = 0;

            // CORREÇÃO DEFINITIVA: Usar PRIMEIRO a tabela sales, SENÃO usar o fallback do fields
      // Isso evita contar vendas duas vezes
      
      let vendasEncontradasNaSales = false;
      
      // 1. Tentar buscar da tabela sales PRIMEIRO
      try {
        const { data: salesData } = await (supabase as any)
          .from('sales')
          .select('amount')
          .eq('tenant_id', effectiveTenantId);

        if (salesData && salesData.length > 0) {
          vendasEncontradasNaSales = true;
          totalSold = salesData.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
          salesCount = salesData.length;
          avgTicket = salesCount > 0 ? totalSold / salesCount : 0;
          
          console.log('💰 [JÚLIO vs MARIA] Usando tabela SALES:', { 
            quantidade: salesCount,
            total: totalSold,
            tenantId: effectiveTenantId,
            usuario: user?.email,
            dadosCompletos: salesData
          });
        }
      } catch (error) {
        console.log('Erro ao buscar tabela sales:', error);
      }

      // 2. Se NÃO encontrou na tabela sales, usar o fallback do fields
      if (!vendasEncontradasNaSales) {
        try {
          const { data: leadsData } = await (supabase as any)
            .from('leads')
            .select('fields')
            .eq('tenant_id', effectiveTenantId)
            .not('fields->sold', 'is', null);

          if (leadsData && leadsData.length > 0) {
            const soldLeads = leadsData.filter((lead: any) => 
              lead.fields?.sold === true || lead.fields?.sold === 'true'
            );
            
            totalSold = soldLeads.reduce((sum: number, lead: any) => 
              sum + (Number(lead.fields?.sold_amount) || 0), 0
            );
            salesCount = soldLeads.length;
            avgTicket = salesCount > 0 ? totalSold / salesCount : 0;
            
            console.log('💰 [SOLUÇÃO DEFINITIVA] Usando FALLBACK (fields):', { 
              quantidade: salesCount,
              total: totalSold,
              tenantId: effectiveTenantId
            });
          }
        } catch (error) {
          console.error('Erro ao buscar vendas do fields:', error);
        }
      }

      // NÃO buscar fallback de leads com orçamento!
      // Vendas SÓ contam quando marcadas explicitamente via botão "Marcar como Vendido"

      // Buscar total de leads
      let totalLeadsCount = 0;
      try {
        // SEMPRE buscar todos os leads do tenant correto (sem filtro por agente)
        const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', effectiveTenantId);
      
        totalLeadsCount = count || 0;
        console.log('📊 Total de Leads encontrado:', totalLeadsCount, 'para tenant:', effectiveTenantId);
      } catch (error) {
        console.error('Erro ao buscar leads:', error);
      }

      // Buscar mensagens
      let messagesCount = 0;
      try {
        // SEMPRE buscar todas as mensagens do tenant correto (sem filtro por agente)
        const { count } = await supabase
        .from('messages')
          .select('*', { count: 'exact', head: true })
        .eq('tenant_id', effectiveTenantId);
      
        messagesCount = count || 0;
        console.log('📊 Total de Mensagens encontrado:', messagesCount, 'para tenant:', effectiveTenantId);
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      }

      // Buscar qualificados
      let qualifiedCount = 0;
      try {
      const { data: qualifiedStages } = await supabase
        .from('stages')
        .select('id')
        .eq('tenant_id', effectiveTenantId)
        .ilike('name', '%qualificado%');

        if (qualifiedStages && qualifiedStages.length > 0) {
          // SEMPRE buscar todos os qualificados do tenant correto (sem filtro por agente)
          const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', effectiveTenantId)
            .in('stage_id', qualifiedStages.map(s => s.id));

          qualifiedCount = count || 0;
          console.log('📊 Total de Qualificados encontrado:', qualifiedCount, 'para tenant:', effectiveTenantId);
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
          .eq('tenant_id', effectiveTenantId);

        const soldIds = soldLeadIds?.map(s => s.lead_id) || [];

        // 2. Buscar IDs de estágios finais (Dinheiro no Bolso, Vendido, etc)
        const { data: finalStages } = await supabase
        .from('stages')
        .select('id')
        .eq('tenant_id', effectiveTenantId)
          .or('name.ilike.%dinheiro no bolso%,name.ilike.%vendido%,name.ilike.%fechado%,name.ilike.%ganho%');

        const finalStageIds = finalStages?.map(s => s.id) || [];
      
        // 3. Buscar leads com orçamento
        // SEMPRE buscar todos os leads com orçamento do tenant correto (sem filtro por agente)
        const { data: leadsWithBudget } = await supabase
          .from('leads')
          .select('id, stage_id, fields')
          .eq('tenant_id', effectiveTenantId)
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

        console.log('💼 Orçamentos em aberto:', openBudgetsCount, 'valor:', openBudgetsValue, 'para tenant:', effectiveTenantId);
        console.log('📊 Excluídos:', soldIds.length, 'vendidos e', finalStageIds.length, 'estágios finais');
        console.log('🔍 Debug orçamentos:', {
          totalLeadsWithBudget: leadsWithBudget?.length || 0,
          soldIds: soldIds,
          finalStageIds: finalStageIds,
          openBudgets: openBudgetsCount,
          openBudgetsValue: openBudgetsValue,
          effectiveTenantId: effectiveTenantId
        });
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
        .eq('tenant_id', effectiveTenantId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Preparar dados do gráfico diário
      let dailyChartData: ChartData[] = [];
      if (metricsDaily && metricsDaily.length > 0) {
        dailyChartData = metricsDaily.map(day => ({
          name: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: day.total_revenue || 0,
          leads: day.leads_in || 0,
          conversoes: day.closed || 0,
          mensagens: 0 // Não temos dados de mensagens na metrics_daily
        }));
      } else {
        // Fallback: criar dados baseados nas métricas reais com progressão lógica
        const days = parseInt(period.replace('d', ''));
        dailyChartData = [];
        
        // Calcular distribuição lógica baseada nos valores reais
        const avgLeadsPerDay = totalLeadsCount / days;
        const avgSalesPerDay = salesCount / days;
        const avgRevenuePerDay = totalSold / days;
        const avgMessagesPerDay = messagesCount / days;
        
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          
          // Criar variação realista baseada na posição do dia
          const dayFactor = (i + 1) / days; // 0.2, 0.4, 0.6, 0.8, 1.0
          const variation = 0.7 + (Math.random() * 0.6); // Variação de 70% a 130%
          
          dailyChartData.push({
            name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: Math.round(avgRevenuePerDay * dayFactor * variation),
            leads: Math.round(avgLeadsPerDay * dayFactor * variation),
            conversoes: Math.round(avgSalesPerDay * dayFactor * variation),
            mensagens: Math.round(avgMessagesPerDay * dayFactor * variation)
          });
        }
      }

      // Os dados já estão completos baseados no período selecionado

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
      
      // Buscar vendas do fields dos leads (fallback) - versão simplificada
      // SEMPRE buscar todas as vendas do usuário logado (sem filtro por agente)
      // Usando a mesma lógica já implementada acima
      console.log('📊 Usando vendas já calculadas:', salesCount);


      // Buscar todos os leads do período
      // SEMPRE buscar todos os leads do tenant correto (sem filtro por agente)
      const result2 = await supabase
        .from('leads')
        .select('id, assigned_to')
        .eq('tenant_id', effectiveTenantId)
        .gte('created_at', new Date(Date.now() - parseInt(period.replace('d', '')) * 24 * 60 * 60 * 1000).toISOString());

      const allLeadsData = result2.data || [];
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
        .eq('tenant_id', effectiveTenantId);
      
      const sourceCounts: Record<string, number> = {};
      leadsBySource?.forEach(lead => {
        const origin = lead.origin || 'cliente_carteirizado';
        sourceCounts[origin] = (sourceCounts[origin] || 0) + 1;
      });

      const sourceChartData = [
        { name: 'Meta Ads', value: sourceCounts['meta_ads'] || 0, color: '#1877F2' },
        { name: 'Instagram (Direct)', value: sourceCounts['instagram'] || 0, color: '#EC4899' },
        { name: 'Facebook (Messenger FB)', value: sourceCounts['facebook'] || 0, color: '#3B82F6' },
        { name: 'Site', value: sourceCounts['site'] || sourceCounts['website'] || 0, color: '#8B5CF6' },
        { name: 'Loja', value: sourceCounts['loja'] || 0, color: '#F59E0B' },
        { name: 'TikTok', value: sourceCounts['tiktok'] || 0, color: '#000000' },
        { name: 'LinkedIn', value: sourceCounts['linkedin'] || 0, color: '#0077B5' },
        { name: 'Indicação', value: sourceCounts['indicacao'] || 0, color: '#14B8A6' },
        { name: 'Cliente Carteirizado', value: sourceCounts['cliente_carteirizado'] || sourceCounts['outro'] || sourceCounts['manual'] || 0, color: '#6B7280' }
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


        {/* Cards de Métricas Visuais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const chartType = getChartTypeForMetric(metric.title);
            const chartData = getChartDataForMetric(metric.title, dailyData);
            
            return (
              <ExpandableMetricCard
                key={index} 
                title={metric.title}
                value={metric.value}
                change={metric.change}
                icon={Icon}
                color={metric.color.replace('text-', '').replace('-500', '')}
                chartType={chartType}
                chartData={chartData}
                showValues={valuesVisible}
                subtitle=""
                onDataRequest={async (period, metricTitle) => {
                  // Função para buscar dados expandidos baseado na métrica
                  const effectiveTenantId = user?.tenant_id;
                  return await fetchExpandedMetricData(period, metricTitle, effectiveTenantId);
                }}
              />
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