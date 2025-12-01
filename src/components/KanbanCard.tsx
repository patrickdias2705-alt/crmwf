import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, GripVertical } from 'lucide-react';

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
  is_public?: boolean;
  order_number?: string;
  origin?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer_url?: string;
  ad_name?: string;
}

interface KanbanCardProps {
  lead: Lead;
  formatTags: (tags: any) => string[];
  isDragging?: boolean;
  onLeadUpdated?: () => void;
  onDoubleClick?: (lead: Lead) => void;
}

export function KanbanCard({ lead, formatTags, isDragging = false, onLeadUpdated, onDoubleClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'hoje';
    if (diffDays === 2) return 'ontem';
    if (diffDays <= 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const tags = formatTags(lead.tags);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      onDoubleClick={() => onDoubleClick?.(lead)}
      className={`cursor-grab active:cursor-grabbing border-border/50 hover:shadow-md transition-shadow ${
        isDragging || isSortableDragging ? 'shadow-lg rotate-2' : ''
      }`}
    >
      <CardContent className="p-2">
        {/* Header Compacto */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/10">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <h4 className="font-medium text-xs truncate">{lead.name}</h4>
          </div>
          <div {...listeners} className="cursor-grab p-0.5 rounded hover:bg-muted">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Contato em linha única */}
        {lead.phone && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <Phone className="h-2.5 w-2.5" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}

        {/* Ordem e Valor em linha */}
        <div className="flex items-center gap-1 mb-1 flex-wrap">
          {lead.order_number && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 text-[9px] px-1 py-0 h-4">
              {lead.order_number}
            </Badge>
          )}
          {lead.fields?.value && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(lead.fields.value)}
            </Badge>
          )}
        </div>

        {/* Orçamento Super Compacto */}
        {lead.fields?.budget_file_base64 && (
          <div className="mb-1 p-1 bg-green-50 border border-green-200 rounded">
            <div className="text-[9px] font-medium text-green-800 flex items-center justify-between">
              <span>💰 {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(lead.fields.budget_amount || 0)}</span>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = lead.fields.budget_file_base64;
                  link.download = lead.fields.budget_file_name || 'documento.pdf';
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="text-[9px] bg-green-600 text-white px-1 rounded hover:bg-green-700"
              >
                📄
              </button>
            </div>
          </div>
        )}

        {/* Tags Super Compactas */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-[8px] px-1 py-0 h-3">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}