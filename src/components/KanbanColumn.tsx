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
  stats: { count: number; value: number };
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
      <CardHeader className="pb-2 pt-2" style={{ 
        borderTop: `3px solid ${stage.color || '#3B82F6'}` 
      }}>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: stage.color || '#3B82F6' }}
            />
            <span className="font-semibold">{stage.name}</span>
          </div>
          <Badge variant="secondary" className="text-xs h-5">{stats.count}</Badge>
        </CardTitle>
        
        {stats.value > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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