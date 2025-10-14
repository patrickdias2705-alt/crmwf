import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, Calendar, Clock, Tag, MapPin } from 'lucide-react';
import { MakeLeadPublicButton } from '@/components/MakeLeadPublicButton';
import { BudgetDocumentUpload } from '@/components/BudgetDocumentUpload';
import { MarkAsSoldButton } from '@/components/MarkAsSoldButton';

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

interface LeadDetailsModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
  formatTags: (tags: any) => string[];
}

export function LeadDetailsModal({ lead, open, onOpenChange, onLeadUpdated, formatTags }: LeadDetailsModalProps) {
  if (!lead) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tags = formatTags(lead.tags);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg bg-primary/10">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              {lead.order_number && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 mt-1">
                  {lead.order_number}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações de Contato */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Informações de Contato
            </h3>
            
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{lead.phone}</span>
              </div>
            )}
            
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
            )}
          </div>

          {/* Origem e Tracking */}
          {(lead.origin || lead.utm_source) && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Origem do Lead
              </h3>
              
              {lead.origin && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{lead.origin}</Badge>
                </div>
              )}
              
              {lead.utm_source && (
                <div className="text-xs space-y-1">
                  <p><strong>Source:</strong> {lead.utm_source}</p>
                  {lead.utm_medium && <p><strong>Medium:</strong> {lead.utm_medium}</p>}
                  {lead.utm_campaign && <p><strong>Campaign:</strong> {lead.utm_campaign}</p>}
                  {lead.utm_content && <p><strong>Content:</strong> {lead.utm_content}</p>}
                  {lead.ad_name && <p><strong>Ad Name:</strong> {lead.ad_name}</p>}
                  {lead.referrer_url && <p><strong>Referrer:</strong> {lead.referrer_url}</p>}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Valor */}
          {lead.fields?.value && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Valor Estimado</h3>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(lead.fields.value)}
              </div>
            </div>
          )}

          {/* Orçamento */}
          {lead.fields?.budget_file_base64 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3 text-green-800">💰 Orçamento Enviado</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor:</span>
                  <span className="text-lg font-bold text-green-700">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(lead.fields.budget_amount || 0)}
                  </span>
                </div>
                
                {lead.fields.budget_description && (
                  <div>
                    <span className="text-sm font-medium">Descrição:</span>
                    <p className="text-sm text-muted-foreground mt-1">{lead.fields.budget_description}</p>
                  </div>
                )}
                
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
                  className="w-full mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  📄 Baixar Orçamento
                </button>
              </div>

              {/* Botão Marcar como Vendido */}
              <MarkAsSoldButton
                leadId={lead.id}
                leadName={lead.name}
                budgetAmount={lead.fields.budget_amount || 0}
                isSold={lead.fields?.sold === true}
                onSuccess={() => {
                  onLeadUpdated?.();
                  onOpenChange(false);
                }}
              />
            </div>
          )}

          {/* Datas */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4" />
              Histórico
            </h3>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Criado em:</span>
              <span>{formatDate(lead.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última atualização:</span>
              <span>{formatDate(lead.updated_at)}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-sm">Ações</h3>
            
            <div className="space-y-2">
              <MakeLeadPublicButton 
                leadId={lead.id}
                isPublic={lead.is_public || false}
                onSuccess={() => {
                  onLeadUpdated?.();
                  onOpenChange(false);
                }}
              />
              
              <BudgetDocumentUpload 
                leadId={lead.id} 
                leadName={lead.name}
                onDocumentUploaded={() => {
                  onLeadUpdated?.();
                  onOpenChange(false);
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

