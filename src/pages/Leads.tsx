import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Phone, Mail, Calendar, User, Trash2, DollarSign, Edit } from 'lucide-react';
import { Button as ActionButton } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CreateLeadDialog } from '@/components/CreateLeadDialog';
import { ExportLeadsButton } from '@/components/ExportLeadsButton';
import { MakeLeadPublicButton } from '@/components/MakeLeadPublicButton';
import { BudgetDocumentUpload } from '@/components/BudgetDocumentUpload';
import { EditLeadDialog } from '@/components/EditLeadDialog';
import { useTenantView } from '@/contexts/TenantViewContext';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  stage_name: string;
  stage_id: string;
  tags: string[];
  created_at: string;
  last_interaction?: string;
  assigned_to?: string;
  has_budget?: boolean;
  is_closed?: boolean;
  is_public?: boolean;
  order_number?: string;
  fields?: any;
  stages?: {
    name: string;
  };
}

export default function Leads() {
  const { user, hasRole } = useAuth();
  const { viewingAgentId, isViewingAgent } = useTenantView();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchLeads();
    }
  }, [user?.tenant_id, viewingAgentId, isViewingAgent]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      console.log('📊 Leads - Loading for:', { 
        viewingAgentId, 
        isViewingAgent 
      });

      if (!user?.tenant_id) {
        console.error('❌ Tenant ID não encontrado');
        return;
      }

            let query = supabase
              .from('leads')
              .select(`
                id,
                name,
                phone,
                email,
                source,
                created_at,
                stage_id,
                assigned_to,
                is_public,
                order_number,
                fields,
                stages (
                  name
                )
              `)
              .eq('tenant_id', user?.tenant_id);

      // Filter by agent if viewing specific agent
      if (isViewingAgent && viewingAgentId) {
        query = query.eq('assigned_to', viewingAgentId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar leads:', error);
        toast.error('Erro ao carregar leads: ' + error.message);
        return;
      }

      // Buscar orçamentos (abertos e vendidos) da tabela budget_documents
      const leadIds = data?.map(l => l.id) || [];
      let budgetMap = new Map<string, BudgetDocument[]>();
      let leadsWithBudgets = new Set<string>();
      
      if (leadIds.length > 0) {
        try {
          console.log('🔍 Buscando orçamentos para', leadIds.length, 'leads');
          // Buscar orçamentos abertos E vendidos para exibir todos
          const { data: budgetDocsData, error: budgetError } = await supabase
            .from('budget_documents')
            .select('id, lead_id, file_name, file_base64, file_url, amount, description, status')
            .in('lead_id', leadIds)
            .in('status', ['aberto', 'vendido']) // Buscar abertos e vendidos
            .order('created_at', { ascending: false });

          if (budgetError) {
            console.error('❌ Erro ao buscar orçamentos da tabela:', budgetError);
            console.error('📋 Detalhes:', {
              message: budgetError.message,
              details: budgetError.details,
              hint: budgetError.hint,
              code: budgetError.code
            });
            // Fallback: buscar dos fields do lead
            leadsWithBudgets = new Set(
              data?.filter((lead: any) => 
                lead.fields?.budget_amount || 
                lead.fields?.budget_file_base64 ||
                (lead.fields?.budget_documents && Array.isArray(lead.fields.budget_documents) && lead.fields.budget_documents.length > 0)
              ).map((l: any) => l.id) || []
            );
          } else {
            console.log('✅ Orçamentos encontrados:', budgetDocsData?.length || 0);
            console.log('📋 Detalhes dos orçamentos:', budgetDocsData);
            
            // Agrupar orçamentos por lead_id (pegar o mais recente de cada lead)
            if (budgetDocsData && budgetDocsData.length > 0) {
              // Agrupar todos os orçamentos por lead_id primeiro
              const budgetsByLead = new Map<string, BudgetDocument[]>();
              budgetDocsData.forEach((budget: BudgetDocument) => {
                if (!budgetsByLead.has(budget.lead_id)) {
                  budgetsByLead.set(budget.lead_id, []);
                }
                budgetsByLead.get(budget.lead_id)!.push(budget);
              });
              
              // Para cada lead, pegar apenas o mais recente (já está ordenado por created_at DESC)
              budgetsByLead.forEach((budgets, leadId) => {
                if (budgets.length > 0) {
                  // Pegar o primeiro (mais recente) de cada lead
                  budgetMap.set(leadId, [budgets[0]]);
                  leadsWithBudgets.add(leadId);
                  console.log(`✅ Lead ${leadId}: orçamento encontrado - R$ ${budgets[0].amount}, arquivo: ${budgets[0].file_name || 'sem arquivo'}`);
                }
              });
            } else {
              console.warn('⚠️ Nenhum orçamento retornado da query, mas não houve erro');
            }
          }
        } catch (error: any) {
          console.error('⚠️ Erro ao buscar orçamentos:', error?.message || error);
          // Fallback: buscar dos fields do lead
          leadsWithBudgets = new Set(
            data?.filter((lead: any) => 
              lead.fields?.budget_amount || 
              lead.fields?.budget_file_base64 ||
              (lead.fields?.budget_documents && Array.isArray(lead.fields.budget_documents) && lead.fields.budget_documents.length > 0)
            ).map((l: any) => l.id) || []
          );
        }
      }

      const formattedLeads = data?.map(lead => {
        const stageName = (lead as any).stages?.name || 'Sem estágio';
        const isClosed = stageName.toLowerCase().includes('fechado') || 
                        stageName.toLowerCase().includes('vendido') || 
                        stageName.toLowerCase().includes('bolso') ||
                        stageName.toLowerCase().includes('ganho');
        
        // Buscar orçamento do lead
        const leadBudgets = budgetMap.get(lead.id) || [];
        
        return {
          ...lead,
          stage_name: stageName,
          tags: [] as string[],
          last_interaction: lead.created_at,
          assigned_to: undefined,
          has_budget: leadsWithBudgets.has(lead.id) || leadBudgets.length > 0,
          budget_documents: leadBudgets,
          is_closed: isClosed
        };
      }) || [];

      setLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm) ||
                         (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    const matchesStage = stageFilter === 'all' || lead.stage_name === stageFilter;
    
    return matchesSearch && matchesSource && matchesStage;
  });

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'facebook': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'instagram': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'site': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'manual': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[source] || colors.manual;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o lead "${leadName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead excluído com sucesso');
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const handleMarkAsSold = async (leadId: string, leadName: string) => {
    try {
      // Buscar stage "Dinheiro no bolso"
      const { data: stages } = await supabase
        .from('stages')
        .select('id, name')
        .eq('tenant_id', user?.tenant_id)
        .or('name.ilike.%bolso%,name.ilike.%fechado%,name.ilike.%vendido%,name.ilike.%ganho%');

      let closedStageId = stages?.[0]?.id;

      if (!closedStageId) {
        toast.error('Estágio de fechamento não encontrado');
        return;
      }

      console.log('🎯 Movendo lead para estágio:', stages?.[0]?.name);

      // Mover lead para stage fechado
      const { error } = await supabase
        .from('leads')
        .update({ stage_id: closedStageId })
        .eq('id', leadId);

      if (error) throw error;

      // Criar evento de venda
      await supabase
        .from('lead_events')
        .insert({
          tenant_id: user?.tenant_id,
          lead_id: leadId,
          type: 'sale.closed',
          actor: user?.email || 'system',
          data: { lead_name: leadName }
        });

      toast.success(`🎉 ${leadName} marcado como vendido!`, {
        duration: 5000,
        className: 'bg-green-500 text-white'
      });
      
      fetchLeads();
    } catch (error) {
      console.error('Error marking as sold:', error);
      toast.error('Erro ao marcar como vendido');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Gerencie todos os seus leads em um só lugar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportLeadsButton />
            {hasRole(['admin', 'agent']) && (
              <CreateLeadDialog onLeadCreated={fetchLeads} />
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use os filtros abaixo para encontrar leads específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fontes</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="carteirizado">Carteirizado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estágios</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="atendido">Atendido</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Leads ({filteredLeads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Nº Pedido</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Estágio</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Última interação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className={`cursor-pointer hover:bg-muted/50 transition-all ${
                        lead.is_closed ? 'bg-green-500/10' : ''
                      }`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className={lead.is_closed ? 'text-green-600 font-semibold' : ''}>
                            {lead.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            {lead.order_number || 'N/A'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSourceColor(lead.source)}>
                          {lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {lead.stage_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.has_budget && lead.budget_documents && lead.budget_documents.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-green-800">
                              💰 {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(lead.budget_documents[0].amount || 0)}
                            </div>
                            {lead.budget_documents[0].description && (
                              <div className="text-xs text-green-700 truncate max-w-32">
                                📝 {lead.budget_documents[0].description}
                              </div>
                            )}
                            {(lead.budget_documents[0].file_base64 || lead.budget_documents[0].file_url) ? (
                              <button 
                                onClick={() => {
                                  const budget = lead.budget_documents![0];
                                  const fileUrl = budget.file_url || 
                                    (budget.file_base64 ? `data:application/pdf;base64,${budget.file_base64}` : null);
                                  
                                  if (fileUrl) {
                                    const link = document.createElement('a');
                                    link.href = fileUrl;
                                    link.download = budget.file_name || 'documento.pdf';
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }
                                }}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                              >
                                📄 Baixar PDF
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem documento</span>
                            )}
                          </div>
                        ) : lead.fields?.budget_file_base64 ? (
                          // Fallback para dados antigos em fields
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-green-800">
                              💰 {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(lead.fields.budget_amount || 0)}
                            </div>
                            <div className="text-xs text-green-700 truncate max-w-32">
                              📝 {lead.fields.budget_description || 'Sem descrição'}
                            </div>
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
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              📄 Baixar
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem orçamento</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lead.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.last_interaction ? formatDate(lead.last_interaction) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingLead(lead);
                              setEditDialogOpen(true);
                            }}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="Editar lead"
                          >
                            <Edit className="h-4 w-4" />
                          </ActionButton>
                          <MakeLeadPublicButton 
                            leadId={lead.id}
                            isPublic={lead.is_public || false}
                            onSuccess={fetchLeads}
                          />
                          <BudgetDocumentUpload 
                            leadId={lead.id} 
                            leadName={lead.name}
                            onDocumentUploaded={() => {
                              console.log('🔄 Recarregando leads após upload de orçamento para lead:', lead.id);
                              // Adicionar pequeno delay para garantir que o banco foi atualizado
                              setTimeout(() => {
                                fetchLeads();
                              }, 500);
                            }}
                          />
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Edição */}
      {editingLead && (
        <EditLeadDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          lead={editingLead}
          onSuccess={() => {
            console.log('🔄 Recarregando leads após edição...');
            fetchLeads();
            setEditingLead(null);
          }}
        />
      )}
    </Layout>
  );
}