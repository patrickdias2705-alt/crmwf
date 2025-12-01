import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Registrar elementos do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface GaugeCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  showValues?: boolean;
  maxValue?: number;
  animationDelay?: number;
}

export function GaugeCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  showValues = true,
  maxValue = 100,
  animationDelay = 0
}: GaugeCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Calcular valor numérico baseado no valor recebido
  const getNumericValue = (): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remover R$ e vírgulas/pontos
      const cleanValue = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(/,/g, '.').replace(/%/g, '');
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    }
    return 0;
  };

  const numericValue = getNumericValue();
  const percentage = (numericValue / maxValue) * 100;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  // Animação de preenchimento
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(clampedPercentage);
    }, animationDelay);
    
    return () => clearTimeout(timer);
  }, [clampedPercentage, animationDelay]);

  // Mapear cor para hex
  const getColorHex = (colorClass: string): string => {
    if (colorClass.includes('blue')) return '#0075FF';
    if (colorClass.includes('green')) return '#10B981';
    if (colorClass.includes('purple')) return '#8B5CF6';
    if (colorClass.includes('orange')) return '#F59E0B';
    if (colorClass.includes('red')) return '#EF4444';
    if (colorClass.includes('emerald')) return '#10B981';
    if (colorClass.includes('yellow')) return '#F59E0B';
    if (colorClass.includes('pink')) return '#EC4899';
    return '#0075FF';
  };

  // Dados do gauge
  const gaugeData = {
    labels: ['Valor', 'Meta', 'Restante'],
    datasets: [
      {
        data: [animatedValue, 5, 100 - animatedValue - 5], // 5% é a linha da meta
        backgroundColor: [
          getColorHex(color),
          '#FF9800',
          '#EAEAEA'
        ],
        borderWidth: 0,
        cutout: '80%',
        rotation: -90,
        circumference: 180
      }
    ]
  };

  const gaugeOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    cutout: '80%',
    rotation: -90,
    circumference: 180,
    animation: {
      animateRotate: true,
      duration: 1500,
      easing: 'easeOut' as const
    }
  };

  const formatValue = (): string => {
    if (typeof value === 'number') {
      if (title.includes('Taxa') || title.includes('Conversão')) {
        return `${value.toFixed(1)}%`;
      }
      if (title.includes('R$') || title.includes('Ticket') || title.includes('Vendido') || title.includes('Vendas')) {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return value.toString();
    }
    return value;
  };

  return (
    <Card 
      className="shadow-sm rounded-xl bg-white p-4 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          </div>
          
          {/* Trend Indicator */}
          <div className={`flex items-center space-x-1 ${changeColor}`}>
            <ChangeIcon className="w-4 h-4" />
            <span className="text-xs font-medium">
              {showValues ? `${isPositive ? '+' : ''}${change.toFixed(1)}%` : '•••'}
            </span>
          </div>
        </div>

        {/* Gauge */}
        <div className="flex items-center justify-center my-4 relative" style={{ height: '140px' }}>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Doughnut data={gaugeData} options={gaugeOptions} />
            
            {/* Valor Central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {showValues ? formatValue() : '•••'}
              </div>
              <div className="text-xs text-gray-500 text-center px-2">
                {showValues ? 'vs período anterior' : '••••••••••'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

