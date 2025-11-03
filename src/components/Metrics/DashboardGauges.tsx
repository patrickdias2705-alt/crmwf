import React, { useEffect, useState } from 'react';
import { GaugeCard } from './GaugeCard';
import { Users, Target, MessageSquare, Calendar, Clock, TrendingUp, Award } from 'lucide-react';

interface MetricData {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  color: string;
  maxValue: number;
}

interface DashboardGaugesProps {
  totalLeads: number;
  conversionRate: number;
  messagesSent: number;
  qualified: number;
  openBudgets: number;
  avgTicket: number;
  totalSold: number;
  closedLeads: number;
  showValues?: boolean;
}

export function DashboardGauges({
  totalLeads,
  conversionRate,
  messagesSent,
  qualified,
  openBudgets,
  avgTicket,
  totalSold,
  closedLeads,
  showValues = true
}: DashboardGaugesProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Preparar dados dos gauges - Ordem das métricas principais primeiro
  const gaugeMetrics: MetricData[] = [
    {
      title: 'Total Vendido',
      value: totalSold,
      change: 0,
      icon: Award,
      color: 'text-green-500',
      maxValue: Math.max(totalSold * 1.5, 50000)
    },
    {
      title: 'Leads Fechados',
      value: closedLeads,
      change: 0,
      icon: Award,
      color: 'text-blue-500',
      maxValue: Math.max(closedLeads * 1.5, 100)
    },
    {
      title: 'Ticket Médio',
      value: avgTicket,
      change: 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      maxValue: Math.max(avgTicket * 1.5, 5000)
    },
    {
      title: 'Total de Leads',
      value: totalLeads,
      change: 0,
      icon: Users,
      color: 'text-blue-500',
      maxValue: Math.max(totalLeads * 1.5, 100)
    },
    {
      title: 'Taxa de Conversão',
      value: conversionRate,
      change: 0,
      icon: Target,
      color: 'text-orange-500',
      maxValue: 100
    },
    {
      title: 'Mensagens Enviadas',
      value: messagesSent,
      change: 0,
      icon: MessageSquare,
      color: 'text-pink-500',
      maxValue: Math.max(messagesSent * 1.5, 500)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Grid de Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gaugeMetrics.map((metric, index) => (
          <div
            key={metric.title}
            className={`transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <GaugeCard
              title={metric.title}
              value={metric.value}
              change={metric.change}
              icon={metric.icon}
              color={metric.color}
              showValues={showValues}
              maxValue={metric.maxValue}
              animationDelay={index * 100}
            />
          </div>
        ))}
      </div>

      {/* Indicador de atualização automática */}
      <div className="flex justify-end text-xs text-gray-500">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Atualizado automaticamente via Supabase
        </span>
      </div>
    </div>
  );
}

