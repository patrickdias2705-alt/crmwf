import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from '@/components/KanbanCard';
import { TrendingUp } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  order: number;
  pipeline_id: string;
  tenant_id: string;
  color?: string;
}

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  stage_id: string;
  pipeline_id: string;
  tags: any;
  fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface KanbanColumnProps {
  stage: Stage;
  leads: Lead[];
  stats: { count: number; value: number; dinheiroNaMesa?: number; dinheiroNoBolso?: number };
  formatTags: (tags: any) => string[];
  onLeadUpdated?: () => void;
  onLeadDoubleClick?: (lead: Lead) => void;
}

export function KanbanColumn({ stage, leads, stats, formatTags, onLeadUpdated, onLeadDoubleClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <Card className={`h-full border-border/50 ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2 pt-3" style={{ 
        borderTop: `3px solid ${stage.color || '#3B82F6'}` 
      }}>
        {/* Dinheiro no Bolso - só mostra se o estágio se chamar "Dinheiro no Bolso" */}
        {stage.name.toLowerCase().includes('dinheiro no bolso') && (stats.dinheiroNoBolso || 0) > 0 && (
          <div className="flex justify-center mb-2">
            <Badge 
              variant="secondary" 
              className="text-xs font-bold h-6 px-2 bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400"
            >
              💰 Dinheiro no Bolso: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(stats.dinheiroNoBolso || 0)}
            </Badge>
          </div>
        )}

        {/* Dinheiro na Mesa - só mostra se o estágio se chamar "Dinheiro na Mesa" */}
        {stage.name.toLowerCase().includes('dinheiro na mesa') && (stats.dinheiroNaMesa || 0) > 0 && (
          <div className="flex justify-center mb-2">
            <Badge 
              variant="secondary" 
              className="text-xs font-bold h-6 px-2 bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400"
            >
              📋 Dinheiro na Mesa: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(stats.dinheiroNaMesa || 0)}
            </Badge>
          </div>
        )}

        {/* Badge com número de leads acima do nome */}
        <div className="flex justify-center mb-2">
          <Badge 
            variant="secondary" 
            className="text-sm font-bold h-7 px-3 bg-primary/10 text-primary border-primary/20"
          >
            {stats.count} {stats.count === 1 ? 'lead' : 'leads'}
          </Badge>
        </div>
        
        <CardTitle className="flex items-center justify-center text-sm">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: stage.color || '#3B82F6' }}
            />
            <span className="font-semibold">{stage.name}</span>
          </div>
        </CardTitle>
        
        {stats.value > 0 && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
            <TrendingUp className="h-3 w-3" />
            <span>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.value)}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent ref={setNodeRef} className="space-y-1.5 h-[calc(100vh-280px)] overflow-y-auto">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              formatTags={formatTags}
              onLeadUpdated={onLeadUpdated}
              onDoubleClick={onLeadDoubleClick}
            />
          ))}
        </SortableContext>
        
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Arraste leads para cá
          </div>
        )}
      </CardContent>
    </Card>
  );
}