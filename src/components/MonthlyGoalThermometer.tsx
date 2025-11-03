import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useTenantView } from '@/contexts/TenantViewContext';
import { supabase } from '@/integrations/supabase/client';
import { Target } from 'lucide-react';

const META_MENSAL = 135000; // R$ 135.000

export function MonthlyGoalThermometer() {
  const { user } = useAuth();
  const { viewingAgentId, isViewingAgent } = useTenantView();
  const [vendasMes, setVendasMes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenant_id) return;
    
    fetchVendasMes();
    
    // Subscribe to sales changes
    const channel = supabase
      .channel('thermometer-sales-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales'
        },
        () => {
          fetchVendasMes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id, viewingAgentId, isViewingAgent]);

  const fetchVendasMes = async () => {
    if (!user?.tenant_id) return;
    
    try {
      setLoading(true);
      
      // Primeiro dia do mês atual
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      // Último dia do mês atual
      const lastDayOfMonth = new Date();
      lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
      lastDayOfMonth.setDate(0);
      lastDayOfMonth.setHours(23, 59, 59, 999);

      // Identificar qual agente mostrar
      let agentIdToFilter: string | null = null;
      
      if (isViewingAgent && viewingAgentId) {
        // Está visualizando um agente específico
        agentIdToFilter = viewingAgentId;
      } else if (user.role === 'agent' || user.role === 'viewer') {
        // É um agente visualizando sua própria meta
        agentIdToFilter = user.id;
      }

      // Buscar vendas e filtrar no cliente por data e agente
      let query = supabase
        .from('sales')
        .select('amount, sold_at, created_at, sold_by')
        .eq('tenant_id', user.tenant_id);

      // Filtrar por agente se necessário
      if (agentIdToFilter) {
        query = query.eq('sold_by', agentIdToFilter);
      }

      const { data: allSales, error } = await query;

      if (error) throw error;

      // Filtrar vendas do mês atual (usando sold_at ou created_at)
      const salesThisMonth = (allSales || []).filter(sale => {
        const saleDate = new Date(sale.sold_at || sale.created_at);
        return saleDate >= firstDayOfMonth && saleDate <= lastDayOfMonth;
      });

      const total = salesThisMonth.reduce((acc, sale) => {
        return acc + (parseFloat(sale.amount || 0) || 0);
      }, 0);

      setVendasMes(total);
    } catch (error) {
      console.error('Erro ao buscar vendas do mês:', error);
    } finally {
      setLoading(false);
    }
  };

  const progresso = Math.min((vendasMes / META_MENSAL) * 100, 100);
  const alturaPreenchida = Math.min(progresso, 100);
  
  // Cor baseado no progresso
  const getColor = () => {
    if (progresso >= 100) return 'bg-gradient-to-t from-green-500 to-emerald-600';
    if (progresso >= 75) return 'bg-gradient-to-t from-blue-500 to-blue-600';
    if (progresso >= 50) return 'bg-gradient-to-t from-yellow-500 to-orange-500';
    return 'bg-gradient-to-t from-red-500 to-red-600';
  };

  const faltam = Math.max(META_MENSAL - vendasMes, 0);

  // Só mostra o termômetro para agentes ou quando está visualizando um agente
  const shouldShow = (user?.role === 'agent' || user?.role === 'viewer' || (isViewingAgent && viewingAgentId));
  
  if (loading || !shouldShow) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-32 p-3 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Meta Mensal</span>
        </div>
        
        {/* Termômetro */}
        <div className="relative w-8 h-48 bg-gray-200 dark:bg-gray-700 rounded-full border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
          {/* Preenchimento */}
          <div
            className={`absolute bottom-0 w-full rounded-full transition-all duration-500 ease-out ${getColor()}`}
            style={{ height: `${alturaPreenchida}%` }}
          />
          
          {/* Marcas de 25%, 50%, 75%, 100% */}
          <div className="absolute left-0 right-0 top-1/4 border-t border-gray-400 dark:border-gray-500 opacity-30" />
          <div className="absolute left-0 right-0 top-1/2 border-t border-gray-400 dark:border-gray-500 opacity-30" />
          <div className="absolute left-0 right-0 top-3/4 border-t border-gray-400 dark:border-gray-500 opacity-30" />
        </div>

        {/* Informações */}
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-foreground">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(vendasMes)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            de {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(META_MENSAL)}
          </div>
          <div className="text-xs font-bold" style={{ color: progresso >= 100 ? '#10b981' : '#ef4444' }}>
            {progresso.toFixed(1)}%
          </div>
          {faltam > 0 && (
            <div className="text-[10px] text-muted-foreground">
              Faltam: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(faltam)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

