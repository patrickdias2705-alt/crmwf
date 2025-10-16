import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, MessageSquare, Calendar, Clock, Award, DollarSign, Maximize2, Minimize2, Filter, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ExpandableMetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  chartData?: any[];
  chartType: 'line' | 'area' | 'bar' | 'pie' | 'mini-line';
  subtitle?: string;
  showValues?: boolean;
  onDataRequest?: (period: string, metric: string) => Promise<any[]>;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export function ExpandableMetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  chartData = [], 
  chartType,
  subtitle,
  showValues = true,
  onDataRequest
}: ExpandableMetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedData, setExpandedData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedView, setSelectedView] = useState('bar');
  const [loading, setLoading] = useState(false);

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

  const handleExpand = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setLoading(true);
    console.log('🔄 [MARIA DEBUG] Expandindo métrica:', { title, selectedPeriod });
    
    // Buscar dados REAIS primeiro
    if (onDataRequest) {
      try {
        console.log('📡 [MARIA DEBUG] Buscando dados REAIS...');
        const realData = await onDataRequest(selectedPeriod, title);
        console.log('📊 [MARIA DEBUG] Dados recebidos do onDataRequest:', {
          dataLength: realData?.length,
          data: realData,
          title,
          period: selectedPeriod
        });
        
        if (realData && realData.length > 0) {
          console.log('📊 [MARIA DEBUG] Dados reais encontrados, definindo expandedData:', realData);
          setExpandedData(realData);
        } else {
          console.log('⚠️ [MARIA DEBUG] Nenhum dado real encontrado, gerando dados com zeros');
          const zeroData = generateZeroData(selectedPeriod);
          setExpandedData(zeroData);
        }
      } catch (error) {
        console.log('⚠️ [MARIA DEBUG] Erro ao buscar dados reais, gerando dados com zeros:', error);
        const zeroData = generateZeroData(selectedPeriod);
        setExpandedData(zeroData);
      }
    } else {
      console.log('⚠️ [MARIA DEBUG] onDataRequest não disponível, gerando dados com zeros');
      // Fallback: gerar dados com zeros
      const zeroData = generateZeroData(selectedPeriod);
      setExpandedData(zeroData);
    }
    
    setIsExpanded(true);
    setLoading(false);
    console.log('✅ [MARIA DEBUG] Modal expandido com dados reais');
  };

  const generateZeroData = (period: string) => {
    const days = parseInt(period.replace('d', ''));
    const data = [];
    
    console.log('🎲 [MARIA DEBUG] Gerando dados com zeros:', { period, days, title });
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      
      data.push({
        name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: 0,
        timestamp: date.toISOString(),
        hour: date.getHours(),
        dayOfWeek: date.getDay(),
        week: Math.ceil((date.getDate()) / 7),
        leads: 0,
        conversoes: 0,
        revenue: 0
      });
    }
    
    console.log('✅ [MARIA DEBUG] Dados com zeros gerados:', {
      dataLength: data.length,
      sampleData: data.slice(0, 3)
    });
    return data;
  };

  const generateExpandedData = (period: string) => {
    const days = parseInt(period.replace('d', ''));
    const data = [];
    
    console.log('🎲 Gerando dados expandidos SIMPLES:', { period, days, title });
    
    // Valores fixos baseados no título para garantir que sempre apareça
    const fixedValues = {
      'Total de Leads': [25, 18, 32, 28, 35, 22, 30, 28, 33, 29, 31, 27, 34, 30],
      'Taxa de Conversão': [65, 58, 72, 68, 75, 62, 70, 67, 73, 69, 71, 66, 74, 68],
      'Mensagens Enviadas': [120, 95, 140, 130, 150, 110, 135, 125, 145, 135, 140, 120, 155, 130],
      'Qualificados': [18, 15, 22, 20, 25, 16, 21, 19, 23, 20, 22, 17, 24, 21],
      'Orçamentos em Aberto': [12, 8, 15, 13, 18, 10, 14, 12, 16, 13, 15, 11, 17, 14],
      'Ticket Médio': [580, 520, 650, 600, 720, 550, 680, 620, 670, 630, 660, 590, 700, 640],
      'Total Vendido': [8500, 7200, 9200, 8800, 10500, 7800, 9500, 8900, 9800, 9100, 9400, 8200, 10200, 9200],
      'Leads Fechados': [16, 12, 20, 18, 22, 14, 19, 17, 21, 18, 20, 15, 23, 19]
    };
    
    const values = fixedValues[title as keyof typeof fixedValues] || [10, 8, 12, 11, 15, 9, 13, 11, 14, 12, 13, 10, 16, 12];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const valueIndex = Math.min(i, values.length - 1);
      const finalValue = values[valueIndex] || 10;
      
      data.push({
        name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: finalValue,
        timestamp: date.toISOString(),
        hour: date.getHours(),
        dayOfWeek: date.getDay(),
        week: Math.ceil((date.getDate()) / 7),
        leads: Math.round(finalValue * 0.8),
        conversoes: Math.round(finalValue * 0.6),
        revenue: Math.round(finalValue * 100)
      });
    }
    
    console.log('✅ Dados expandidos SIMPLES gerados:', data);
    return data;
  };

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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                  pointerEvents: 'none'
                }}
                allowEscapeViewBox={{ x: false, y: false }}
                isAnimationActive={false}
                wrapperStyle={{ 
                  outline: 'none',
                  pointerEvents: 'none'
                }}
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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                  pointerEvents: 'none'
                }}
                allowEscapeViewBox={{ x: false, y: false }}
                isAnimationActive={false}
                wrapperStyle={{ 
                  outline: 'none',
                  pointerEvents: 'none'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <BarChart {...chartProps}>
              <Bar 
                dataKey="value" 
                fill={`url(#bitrix-gradient-${color.replace('#', '')})`}
                radius={[6, 6, 0, 0]}
                stroke="none"
                strokeWidth={0}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }}></div>
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 mt-1">
                          {payload[0].value.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={false}
                allowEscapeViewBox={{ x: false, y: false }}
                isAnimationActive={false}
                wrapperStyle={{ 
                  outline: 'none',
                  pointerEvents: 'none'
                }}
              />
              <defs>
                <linearGradient id={`bitrix-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1}/>
                  <stop offset="50%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                </linearGradient>
              </defs>
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

  const renderExpandedChart = () => {
    console.log('🎨 [MARIA DEBUG] Renderizando gráfico expandido:', { 
      expandedData: expandedData?.length, 
      selectedView,
      expandedDataSample: expandedData?.slice(0, 2)
    });
    
    // Usar dados reais ou dados com zeros
    const chartData = expandedData && expandedData.length > 0 ? expandedData : generateZeroData(selectedPeriod);
    
    console.log('📊 [MARIA DEBUG] Dados do gráfico para renderização:', {
      chartDataLength: chartData?.length,
      chartDataSample: chartData?.slice(0, 3),
      selectedView
    });

    const chartProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (selectedView) {
      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666" 
                fontSize={12}
                tick={{ fill: '#666' }}
              />
              <YAxis 
                stroke="#666" 
                fontSize={12}
                tick={{ fill: '#666' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 pointer-events-none">
                        <p className="font-semibold">{`Data: ${label}`}</p>
                        <p className="text-blue-400">{`${title}: ${payload[0].value}`}</p>
                        {payload[0].payload.timestamp && (
                          <p className="text-gray-300 text-xs">
                            {new Date(payload[0].payload.timestamp).toLocaleDateString('pt-BR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
                allowEscapeViewBox={{ x: false, y: false }}
                isAnimationActive={false}
                position={{ x: 0, y: 0 }}
                wrapperStyle={{ 
                  outline: 'none',
                  pointerEvents: 'none'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, fill: color, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666" 
                fontSize={12}
                tick={{ fill: '#666' }}
              />
              <YAxis 
                stroke="#666" 
                fontSize={12}
                tick={{ fill: '#666' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 pointer-events-none">
                        <p className="font-semibold">{`Data: ${label}`}</p>
                        <p className="text-blue-400">{`${title}: ${payload[0].value}`}</p>
                        {payload[0].payload.timestamp && (
                          <p className="text-gray-300 text-xs">
                            {new Date(payload[0].payload.timestamp).toLocaleDateString('pt-BR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
                allowEscapeViewBox={{ x: false, y: false }}
                isAnimationActive={false}
                position={{ x: 0, y: 0 }}
                wrapperStyle={{ 
                  outline: 'none',
                  pointerEvents: 'none'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                fill={color}
                fillOpacity={0.3}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="1 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 pointer-events-none">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: color }}></div>
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {payload[0].value.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {title}
                        </div>
                        {payload[0].payload.timestamp && (
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(payload[0].payload.timestamp).toLocaleDateString('pt-BR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={false}
                allowEscapeViewBox={{ x: false, y: false }}
                isAnimationActive={false}
                wrapperStyle={{ 
                  outline: 'none',
                  pointerEvents: 'none'
                }}
              />
              <defs>
                <linearGradient id={`bitrix-expanded-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1}/>
                  <stop offset="50%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <Bar 
                dataKey="value" 
                fill={`url(#bitrix-expanded-${color.replace('#', '')})`}
                radius={[8, 8, 0, 0]}
                stroke="none"
                strokeWidth={0}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                  pointerEvents: 'none'
                }}
                allowEscapeViewBox={{ x: false, y: false }}
                isAnimationActive={false}
                wrapperStyle={{ 
                  outline: 'none',
                  pointerEvents: 'none'
                }}
              />
              <Scatter dataKey="value" fill={color} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getViewOptions = () => {
    switch (title) {
      case 'Total de Leads':
        return [
          { value: 'trend', label: 'Tendência' },
          { value: 'area', label: 'Área' },
          { value: 'bar', label: 'Barras' }
        ];
      case 'Taxa de Conversão':
        return [
          { value: 'trend', label: 'Tendência' },
          { value: 'line', label: 'Linha' },
          { value: 'scatter', label: 'Pontos' }
        ];
      case 'Total Vendido':
        return [
          { value: 'area', label: 'Área' },
          { value: 'trend', label: 'Tendência' },
          { value: 'bar', label: 'Barras' }
        ];
      default:
        return [
          { value: 'trend', label: 'Tendência' },
          { value: 'bar', label: 'Barras' }
        ];
    }
  };

  return (
    <>
      <Card className={`relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg hover:shadow-xl transition-all duration-500 group ${
        showValues ? 'scale-100' : 'scale-95'
      }`}>
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
            
            <div className="flex items-center space-x-2">
              {/* Change Indicator */}
              <div className={`flex items-center space-x-1 ${changeColor}`}>
                {React.createElement(changeIcon, { className: "w-4 h-4" })}
                <span className="text-sm font-medium">
                  {showValues ? `${isPositive ? '+' : ''}${change.toFixed(1)}%` : '•••'}
                </span>
              </div>

              {/* Expand Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpand}
                disabled={loading}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                ) : isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
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
          <div className={`mb-2 transition-all duration-500 ease-in-out ${
            showValues ? 'h-20 opacity-100' : 'h-0 opacity-0 overflow-hidden'
          }`}>
            {renderChart()}
          </div>

          {/* Progress Bar for Mini-line */}
          {chartType === 'mini-line' && (
            <div className={`mt-2 transition-all duration-500 ease-in-out ${
              showValues ? 'h-8 opacity-100' : 'h-0 opacity-0 overflow-hidden'
            }`}>
              {renderChart()}
            </div>
          )}

          {/* Animated Border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </CardContent>
      </Card>

      {/* Expanded Modal */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3 text-white">
              <Icon className={`w-6 h-6 ${color}`} />
              <span>Análise Detalhada - {title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Período:</span>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32 bg-white text-gray-900 border-gray-300">
                    <SelectValue className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="7d" className="text-gray-900">7 dias</SelectItem>
                    <SelectItem value="14d" className="text-gray-900">14 dias</SelectItem>
                    <SelectItem value="30d" className="text-gray-900">30 dias</SelectItem>
                    <SelectItem value="90d" className="text-gray-900">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white">Visualização:</span>
                <Select value={selectedView} onValueChange={setSelectedView}>
                  <SelectTrigger className="w-40 bg-white text-gray-900 border-gray-300">
                    <SelectValue className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {getViewOptions().map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-gray-900">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm" className="ml-auto bg-white text-gray-900 border-gray-300 hover:bg-gray-100">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* Expanded Chart */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              {renderExpandedChart()}
            </div>

            {/* Top Performance Days */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-blue-400" />
                Dias de Maior Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(expandedData && expandedData.length > 0 ? expandedData : generateZeroData(selectedPeriod))
                  .filter(day => day.value > 0) // Filtrar apenas dias com dados
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3)
                  .map((day, index) => (
                    <div key={index} className="bg-slate-700 p-4 rounded-lg shadow-sm border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-white">{day.name}</div>
                          <div className="text-xs text-gray-300">
                            {day.timestamp && new Date(day.timestamp).toLocaleDateString('pt-BR', { 
                              weekday: 'long' 
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-400">
                            {day.value.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-300">#{index + 1}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="text-2xl font-bold text-blue-400">
                  {expandedData && expandedData.length > 0 ? Math.max(...expandedData.map(d => d.value)).toFixed(0) : '0'}
                </div>
                <div className="text-sm text-blue-400">Máximo</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="text-2xl font-bold text-green-400">
                  {expandedData && expandedData.length > 0 ? Math.min(...expandedData.filter(d => d.value > 0).map(d => d.value)).toFixed(0) : '0'}
                </div>
                <div className="text-sm text-green-400">Mínimo</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="text-2xl font-bold text-purple-400">
                  {expandedData && expandedData.length > 0 ? (expandedData.reduce((sum, d) => sum + d.value, 0) / expandedData.length).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-purple-400">Média</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="text-2xl font-bold text-orange-400">
                  {expandedData && expandedData.length > 0 ? expandedData.reduce((sum, d) => sum + d.value, 0).toFixed(0) : '0'}
                </div>
                <div className="text-sm text-orange-400">Total</div>
              </div>
            </div>

            {/* Performance by Day of Week */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-400" />
                Performance por Dia da Semana
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => {
                  const dayData = expandedData && expandedData.length > 0 ? expandedData.filter(d => d.dayOfWeek === index && d.value > 0) : [];
                  const avgValue = dayData.length > 0 ? dayData.reduce((sum, d) => sum + d.value, 0) / dayData.length : 0;
                  const maxValue = expandedData && expandedData.length > 0 ? Math.max(...expandedData.map(d => d.value)) : 1;
                  const percentage = maxValue > 0 ? (avgValue / maxValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="text-center">
                      <div className="text-xs text-white mb-2">{day}</div>
                      <div className="h-20 bg-slate-700 rounded-lg relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400 rounded-lg transition-all duration-500"
                          style={{ height: `${Math.max(5, percentage)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        {avgValue.toFixed(0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
