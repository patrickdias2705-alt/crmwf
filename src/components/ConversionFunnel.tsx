import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FunnelStage {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

interface ConversionFunnelProps {
  data: FunnelStage[];
  className?: string;
}

export function ConversionFunnel({ data, className }: ConversionFunnelProps) {
  const [animatedData, setAnimatedData] = useState<FunnelStage[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Calculate percentages based on the first stage (total leads)
    const maxValue = data[0]?.value || 1;
    const dataWithPercentages = data.map((stage, index) => ({
      ...stage,
      percentage: (stage.value / maxValue) * 100,
    }));

    // Start animation after component mounts
    setIsVisible(true);
    
    // Animate values gradually
    const timer = setTimeout(() => {
      setAnimatedData(dataWithPercentages);
    }, 300);

    return () => clearTimeout(timer);
  }, [data]);

  const getFunnelWidth = (index: number, total: number) => {
    if (!isVisible) return 0;
    // Calcular largura baseada na posição (funil decrescente)
    const step = 100 / (total + 1);
    return 100 - (step * index);
  };

  const getConversionRate = (currentValue: number, previousValue: number) => {
    if (!previousValue) return 100;
    return ((currentValue / previousValue) * 100).toFixed(1);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {animatedData.map((stage, index) => {
        const previousStage = index > 0 ? animatedData[index - 1] : null;
        const conversionRate = previousStage 
          ? getConversionRate(stage.value, previousStage.value)
          : '100';

        return (
          <div 
            key={`${stage.name}-${index}`}
            className="relative group"
            style={{
              animationDelay: `${index * 200}ms`
            }}
          >
            {/* Stage Container */}
            <div className="relative">
              {/* Funnel Shape */}
              <div 
                className="relative mx-auto transition-all duration-1000 ease-out overflow-hidden shadow-lg"
                style={{
                  width: `${getFunnelWidth(index, animatedData.length)}%`,
                  minWidth: '250px',
                  maxWidth: '100%',
                  height: '90px',
                  clipPath: index === animatedData.length - 1 
                    ? 'polygon(15% 0%, 85% 0%, 70% 100%, 30% 100%)'
                    : 'polygon(8% 0%, 92% 0%, 85% 100%, 15% 100%)',
                  background: `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)`,
                }}
              >
                {/* Gradient Overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5"
                />
                
                {/* Shine Effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full transition-transform duration-2000 group-hover:translate-x-full"
                  style={{
                    animation: isVisible ? `shine-${index} 3s infinite ${index * 0.5}s` : 'none'
                  }}
                />
              </div>

              {/* Stage Content */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <div className="font-bold text-lg animate-fade-in" style={{ animationDelay: `${index * 200 + 500}ms` }}>
                    {stage.value.toLocaleString()}
                  </div>
                  <div className="text-sm opacity-90 animate-fade-in" style={{ animationDelay: `${index * 200 + 700}ms` }}>
                    {stage.name}
                  </div>
                </div>
              </div>

              {/* Conversion Rate Badge */}
              {index > 0 && (
                <div 
                  className="absolute -top-3 right-4 bg-background border border-border rounded-full px-3 py-1 text-xs font-medium shadow-lg animate-scale-in"
                  style={{ animationDelay: `${index * 200 + 900}ms` }}
                >
                  <span className="text-green-600">{conversionRate}%</span>
                </div>
              )}

              {/* Connecting Arrow */}
              {index < animatedData.length - 1 && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div 
                    className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-muted-foreground/30 animate-fade-in"
                    style={{ animationDelay: `${index * 200 + 1100}ms` }}
                  />
                </div>
              )}
            </div>

            {/* Stage Stats */}
            <div 
              className="mt-4 text-center animate-fade-in"
              style={{ animationDelay: `${index * 200 + 1300}ms` }}
            >
              <div className="text-sm text-muted-foreground">
                {stage.percentage?.toFixed(1)}% do total
              </div>
              {index > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {(animatedData[index - 1].value - stage.value).toLocaleString()} perdidos
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '2000ms' }}>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
          <div className="text-lg font-bold text-green-600">
            {animatedData.length > 0 && animatedData[animatedData.length - 1] 
              ? ((animatedData[animatedData.length - 1].value / animatedData[0].value) * 100).toFixed(1)
              : '0'}%
          </div>
          <div className="text-sm text-muted-foreground">Taxa de Conversão Geral</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
          <div className="text-lg font-bold text-blue-600">
            {animatedData[0]?.value.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-muted-foreground">Total de Leads</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800/30">
          <div className="text-lg font-bold text-purple-600">
            {animatedData.length > 0 && animatedData[animatedData.length - 1]
              ? animatedData[animatedData.length - 1].value.toLocaleString()
              : '0'}
          </div>
          <div className="text-sm text-muted-foreground">Vendas Fechadas</div>
        </div>
      </div>

      <style>{`
        @keyframes shine-0 { 0%, 100% { transform: translateX(-100%) skewX(-12deg); } 50% { transform: translateX(200%) skewX(-12deg); } }
        @keyframes shine-1 { 0%, 100% { transform: translateX(-100%) skewX(-12deg); } 50% { transform: translateX(200%) skewX(-12deg); } }
        @keyframes shine-2 { 0%, 100% { transform: translateX(-100%) skewX(-12deg); } 50% { transform: translateX(200%) skewX(-12deg); } }
        @keyframes shine-3 { 0%, 100% { transform: translateX(-100%) skewX(-12deg); } 50% { transform: translateX(200%) skewX(-12deg); } }
        @keyframes shine-4 { 0%, 100% { transform: translateX(-100%) skewX(-12deg); } 50% { transform: translateX(200%) skewX(-12deg); } }
      `}</style>
    </div>
  );
}