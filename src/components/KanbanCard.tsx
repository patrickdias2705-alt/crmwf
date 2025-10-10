import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, Calendar, Clock, GripVertical } from 'lucide-react';
import { MakeLeadPublicButton } from '@/components/MakeLeadPublicButton';
import { BudgetDocumentUpload } from '@/components/BudgetDocumentUpload';
import { LeadTrackingInfo } from '@/components/LeadTrackingInfo';

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
}

export function KanbanCard({ lead, formatTags, isDragging = false, onLeadUpdated }: KanbanCardProps) {
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
      className={`cursor-grab active:cursor-grabbing border-border/50 hover:shadow-md transition-shadow ${
        isDragging || isSortableDragging ? 'shadow-lg rotate-2' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
              
              {lead.order_number && (
                <div className="mt-1">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                    {lead.order_number}
                  </Badge>
                </div>
              )}
              
              <div className="flex flex-col gap-1 mt-1">
                {lead.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{lead.phone}</span>
                  </div>
                )}
                
                {lead.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div {...listeners} className="cursor-grab p-1 rounded hover:bg-muted">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Tracking Info */}
        <div className="mb-3">
          <LeadTrackingInfo 
            origin={lead.origin}
            utm_source={lead.utm_source}
            utm_medium={lead.utm_medium}
            utm_campaign={lead.utm_campaign}
            utm_content={lead.utm_content}
            referrer_url={lead.referrer_url}
            ad_name={lead.ad_name}
            variant="compact"
          />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Value */}
        {lead.fields?.value && (
          <div className="mb-3">
            <Badge variant="secondary" className="text-xs">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(lead.fields.value)}
            </Badge>
          </div>
        )}

        {/* Budget Info */}
        {lead.fields?.budget_file_base64 && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="text-xs font-medium text-green-800 mb-1">
              💰 Orçamento: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(lead.fields.budget_amount || 0)}
            </div>
            <div className="text-xs text-green-700 mb-2 truncate">
              📝 {lead.fields.budget_description || 'Sem descrição'}
            </div>
            <button 
              onClick={() => {
                // Criar link de download para o arquivo Base64
                const link = document.createElement('a');
                link.href = lead.fields.budget_file_base64;
                link.download = lead.fields.budget_file_name || 'documento.pdf';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 animate-pulse"
            >
              📄 Baixar Anexo
            </button>
          </div>
        )}

        {/* Last activity */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <Clock className="h-3 w-3" />
          <span>Atualizado {formatDate(lead.updated_at)}</span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t space-y-2">
          <MakeLeadPublicButton 
            leadId={lead.id}
            isPublic={lead.is_public || false}
            onSuccess={onLeadUpdated}
          />
          <BudgetDocumentUpload 
            leadId={lead.id} 
            leadName={lead.name}
            onDocumentUploaded={onLeadUpdated}
          />
        </div>
      </CardContent>
    </Card>
  );
}