import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { KanbanColumn } from '@/components/KanbanColumn';
import { KanbanCard } from '@/components/KanbanCard';
import { Phone, Mail, Calendar, TrendingUp } from 'lucide-react';

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

interface KanbanBoardProps {
  stages: Stage[];
  leads: Lead[];
  onMoveCard: (cardId: string, newStageId: string) => void;
  getStageStats: (stageId: string) => { count: number; value: number };
  onLeadUpdated?: () => void;
}

export function KanbanBoard({ stages, leads, onMoveCard, getStageStats, onLeadUpdated }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const lead = leads.find(l => l.id === active.id);
    setDraggedLead(lead || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const leadId = active.id as string;
    const newStageId = over.id as string;
    
    // Check if we're dropping on a stage (not on another lead)
    const stage = stages.find(s => s.id === newStageId);
    if (stage) {
      onMoveCard(leadId, newStageId);
    }
    
    setActiveId(null);
    setDraggedLead(null);
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const formatTags = (tags: any): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [tags];
      }
    }
    return [];
  };

  return (
    <DndContext 
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 p-6 overflow-x-auto min-h-[600px]">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          const stats = getStageStats(stage.id);
          
          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <KanbanColumn
                stage={stage}
                leads={stageLeads}
                stats={stats}
                formatTags={formatTags}
                onLeadUpdated={onLeadUpdated}
              />
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeId && draggedLead ? (
          <KanbanCard lead={draggedLead} formatTags={formatTags} isDragging onLeadUpdated={onLeadUpdated} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}