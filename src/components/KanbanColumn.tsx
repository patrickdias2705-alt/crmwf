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
}

export function KanbanColumn({ stage, leads, stats, formatTags, onLeadUpdated }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <Card className={`h-full border-border/50 ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3" style={{ 
        borderTop: `3px solid ${stage.color || '#3B82F6'}` 
      }}>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: stage.color || '#3B82F6' }}
            />
            <span>{stage.name}</span>
          </div>
          <Badge variant="secondary">{stats.count}</Badge>
        </CardTitle>
        
        {stats.value > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.value)}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent ref={setNodeRef} className="space-y-3 min-h-[400px]">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              formatTags={formatTags}
              onLeadUpdated={onLeadUpdated}
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