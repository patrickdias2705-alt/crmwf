import React, { useEffect, useState } from 'react';
import { GaugeCard } from './GaugeCard';
import { Award, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';

interface SalesData {
  totalSales: number;
  totalCount: number;
  avgTicket: number;
  todaySales: number;
  todayCount: number;
  todayAvg: number;
}

export function SalesGauges() {
  const { user } = useAuth();
  const { valuesVisible } = useValuesVisibility();
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalCount: 0,
    avgTicket: 0,
    todaySales: 0,
    todayCount: 0,
    todayAvg: 0
  });
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const fetchSalesData = async () => {
    try {
      if (!user?.tenant_id) return;

      // Buscar dados de vendas
      const { data: allSales } = await supabase
        .from('sales')
        .select('amount, sold_at')
        .eq('tenant_id', user.tenant_id);

      const totalSales = allSales?.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0) || 0;
      const totalCount = allSales?.length || 0;
      const avgTicket = totalCount > 0 ? totalSales / totalCount : 0;

      // Vendas de hoje
      const today = new Date().toISOString().split('T')[0];
      const todaySalesData = allSales?.filter(sale => sale.sold_at?.startsWith(today)) || [];
      const todaySales = todaySalesData.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
      const todayCount = todaySalesData.length;
      const todayAvg = todayCount > 0 ? todaySales / todayCount : 0;

      setSalesData({
        totalSales,
        totalCount,
        avgTicket,
        todaySales,
        todayCount,
        todayAvg
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tenant_id) {
      fetchSalesData();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchSalesData, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.tenant_id]);

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase
      .channel('sales-gauges-stats')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        () => {
          fetchSalesData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-gray-500">Carregando estatísticas de vendas...</div>
      </div>
    );
  }

  const totalGauges = [
    {
      title: 'Total Vendido',
      value: salesData.totalSales,
      change: 0,
      icon: DollarSign,
      color: 'text-green-500',
      maxValue: Math.max(salesData.totalSales * 1.5, 100000)
    },
    {
      title: 'Vendas',
      value: salesData.totalCount,
      change: 0,
      icon: Award,
      color: 'text-blue-500',
      maxValue: Math.max(salesData.totalCount * 1.5, 100)
    },
    {
      title: 'Ticket Médio',
      value: salesData.avgTicket,
      change: 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      maxValue: Math.max(salesData.avgTicket * 1.5, 5000)
    }
  ];

  const todayGauges = [
    {
      title: 'Vendas Hoje',
      value: salesData.todaySales,
      change: 0,
      icon: DollarSign,
      color: 'text-green-500',
      maxValue: Math.max(salesData.todaySales * 1.5, 5000)
    },
    {
      title: 'Quantidade',
      value: salesData.todayCount,
      change: 0,
      icon: Award,
      color: 'text-orange-500',
      maxValue: Math.max(salesData.todayCount * 1.5, 20)
    },
    {
      title: 'Médio Hoje',
      value: salesData.todayAvg,
      change: 0,
      icon: TrendingUp,
      color: 'text-pink-500',
      maxValue: Math.max(salesData.todayAvg * 1.5, 2000)
    }
  ];

  return (
    <div className="space-y-8">
      {/* Total Geral */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          📊 Total Geral
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {totalGauges.map((gauge, index) => (
            <div
              key={gauge.title}
              className={`transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <GaugeCard
                title={gauge.title}
                value={gauge.value}
                change={gauge.change}
                icon={gauge.icon}
                color={gauge.color}
                showValues={valuesVisible}
                maxValue={gauge.maxValue}
                animationDelay={index * 100}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hoje */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          📅 Hoje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {todayGauges.map((gauge, index) => (
            <div
              key={gauge.title}
              className={`transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${(index + totalGauges.length) * 100}ms` }}
            >
              <GaugeCard
                title={gauge.title}
                value={gauge.value}
                change={gauge.change}
                icon={gauge.icon}
                color={gauge.color}
                showValues={valuesVisible}
                maxValue={gauge.maxValue}
                animationDelay={(index + totalGauges.length) * 100}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicador de atualização automática */}
      <div className="flex justify-end text-xs text-gray-500">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Atualização automática a cada 30 segundos
        </span>
      </div>
    </div>
  );
}

