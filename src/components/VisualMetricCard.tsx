import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, MessageSquare, Calendar, Clock, Award, DollarSign } from 'lucide-react';

interface VisualMetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  chartData?: any[];
  chartType: 'line' | 'area' | 'bar' | 'pie' | 'mini-line';
  subtitle?: string;
  showValues?: boolean;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export function VisualMetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  chartData = [], 
  chartType,
  subtitle,
  showValues = true 
}: VisualMetricCardProps) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changeIcon = isPositive ? TrendingUp : TrendingDown;

  // Gerar dados de exemplo se não houver dados reais
  const generateSampleData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const baseValue = typeof value === 'number' ? value : 0;
      data.push({
        name: `Dia ${i + 1}`,
        value: Math.max(0, baseValue + (Math.random() - 0.5) * baseValue * 0.3),
        timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    return data;
  };

  const data = chartData.length > 0 ? chartData : generateSampleData();

  const renderChart = () => {
    const chartProps = {
      data,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart {...chartProps}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart {...chartProps}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                fill={color}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <BarChart {...chartProps}>
              <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <PieChart>
              <Pie
                data={[{ name: 'Atual', value: typeof value === 'number' ? value : 0 }]}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={35}
                fill={color}
                dataKey="value"
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'mini-line':
        return (
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, (typeof value === 'number' ? value : 0) * 2))}%` }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-green-500/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
      </div>

      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          
          {/* Change Indicator */}
          <div className={`flex items-center space-x-1 ${changeColor}`}>
            {React.createElement(changeIcon, { className: "w-4 h-4" })}
            <span className="text-sm font-medium">
              {showValues ? `${isPositive ? '+' : ''}${change.toFixed(1)}%` : '•••'}
            </span>
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {showValues ? value : '••••'}
          </div>
          <div className="text-xs text-gray-500">
            {showValues ? 'vs período anterior' : '••••••••••••••••'}
          </div>
        </div>

        {/* Chart */}
        <div className="h-20 mb-2">
          {renderChart()}
        </div>

        {/* Progress Bar for Mini-line */}
        {chartType === 'mini-line' && (
          <div className="mt-2">
            {renderChart()}
          </div>
        )}

        {/* Animated Border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  );
}
