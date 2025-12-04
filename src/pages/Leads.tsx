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
  budget_documents?: BudgetDocument[];
  is_closed?: boolean;
  is_sold?: boolean; // Flag para identificar se foi vendido (tem registro em sales)
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
      // E também buscar vendas da tabela sales para leads vendidos
      const leadIds = data?.map(l => l.id) || [];
      let budgetMap = new Map<string, BudgetDocument[]>();
      let leadsWithBudgets = new Set<string>();
      
      if (leadIds.length > 0) {
        try {
          console.log('🔍 Buscando orçamentos para', leadIds.length, 'leads');
          
          // 1. Buscar TODOS os orçamentos da tabela budget_documents
          const { data: budgetDocsData, error: budgetError } = await supabase
            .from('budget_documents')
            .select('id, lead_id, file_name, file_base64, file_url, amount, description, status')
            .in('lead_id', leadIds)
            // Não filtrar por status - buscar TODOS para garantir que apareçam
            .order('created_at', { ascending: false });
          
          // 2. Buscar vendas da tabela sales para leads vendidos (orçamentos que foram convertidos em vendas)
          const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('id, lead_id, amount, budget_description, budget_file_name, sold_at')
            .in('lead_id', leadIds)
            .order('sold_at', { ascending: false });
          
          // 3. Buscar orçamentos vendidos que ainda têm arquivo (status = 'vendido' mas ainda na tabela)
          const { data: soldBudgetsData, error: soldBudgetsError } = await supabase
            .from('budget_documents')
            .select('id, lead_id, file_name, file_base64, file_url, amount, description, status, sale_id')
            .in('lead_id', leadIds)
            .eq('status', 'vendido')
            .order('created_at', { ascending: false });

          // ⚠️ ORDEM CRÍTICA: Processar VENDAS PRIMEIRO (tabela sales)
          // Leads vendidos devem aparecer como "VENDIDO" e não como "orçamento"
          // Isso garante que vendas tenham prioridade sobre orçamentos abertos
          // soldLeadIds já foi declarado fora do try para ser acessível
          
          if (salesError) {
            console.error('❌ Erro ao buscar vendas da tabela sales:', salesError);
          } else if (salesData && salesData.length > 0) {
            console.log('✅ Vendas encontradas na tabela sales:', salesData.length);
            
            // Processar vendas PRIMEIRO - estas têm prioridade sobre orçamentos
            salesData.forEach((sale: any) => {
              soldLeadIds.add(sale.lead_id); // Marcar lead como vendido
              
              // Tentar encontrar arquivo do orçamento vendido relacionado
              const relatedBudget = soldBudgetsData?.find((b: BudgetDocument) => 
                b.lead_id === sale.lead_id && b.sale_id === sale.id
              );
              
              const virtualBudget: BudgetDocument = {
                id: sale.id, // Usar ID da venda como ID do orçamento virtual
                lead_id: sale.lead_id,
                file_name: sale.budget_file_name || relatedBudget?.file_name || null,
                file_base64: relatedBudget?.file_base64 || null, // Tentar pegar do orçamento vendido
                file_url: relatedBudget?.file_url || null, // Tentar pegar do orçamento vendido
                amount: sale.amount || 0,
                description: sale.budget_description || '',
                status: 'vendido' // SEMPRE marcado como vendido quando vem de sales
              };
              
              // VENDAS SEMPRE têm prioridade - sobrescrever qualquer orçamento existente
              budgetMap.set(sale.lead_id, [virtualBudget]);
              leadsWithBudgets.add(sale.lead_id);
              console.log(`✅ Lead ${sale.lead_id}: VENDA (prioridade) - R$ ${sale.amount}, status: vendido`);
            });
          }
          
          // Processar orçamentos vendidos que ainda têm arquivo (status = 'vendido' na tabela)
          if (!soldBudgetsError && soldBudgetsData && soldBudgetsData.length > 0) {
            console.log('✅ Orçamentos vendidos com arquivo encontrados:', soldBudgetsData.length);
            
            soldBudgetsData.forEach((budget: BudgetDocument) => {
              // Só adicionar se o lead NÃO tiver venda na tabela sales (vendas têm prioridade)
              if (!soldLeadIds.has(budget.lead_id) && !budgetMap.has(budget.lead_id)) {
                budgetMap.set(budget.lead_id, [budget]);
                leadsWithBudgets.add(budget.lead_id);
                console.log(`✅ Lead ${budget.lead_id}: orçamento vendido com arquivo - R$ ${budget.amount}`);
              }
            });
          }
          
          // Processar orçamentos ABERTOS da tabela budget_documents (só se não for vendido)
          if (budgetError) {
            console.error('❌ Erro ao buscar orçamentos da tabela:', budgetError);
          } else if (budgetDocsData && budgetDocsData.length > 0) {
            console.log('✅ Orçamentos encontrados na tabela budget_documents:', budgetDocsData.length);
            
            // Agrupar orçamentos por lead_id
            const budgetsByLead = new Map<string, BudgetDocument[]>();
            budgetDocsData.forEach((budget: BudgetDocument) => {
              if (!budgetsByLead.has(budget.lead_id)) {
                budgetsByLead.set(budget.lead_id, []);
              }
              budgetsByLead.get(budget.lead_id)!.push(budget);
            });
            
            // Para cada lead, pegar o mais recente priorizando status
            budgetsByLead.forEach((budgets, leadId) => {
              // ⚠️ CRÍTICO: Se o lead foi vendido (tem venda na tabela sales), NÃO processar orçamentos abertos
              // Vendas têm prioridade absoluta sobre orçamentos
              if (soldLeadIds.has(leadId)) {
                console.log(`⏭️ Lead ${leadId}: já tem venda, ignorando orçamentos abertos`);
                return; // Pular este lead - já foi processado como venda
              }
              
              if (budgets.length > 0) {
                // Ordenar: primeiro abertos, depois vendidos, depois outros
                const sorted = budgets.sort((a, b) => {
                  if (a.status === 'aberto' && b.status !== 'aberto') return -1;
                  if (a.status !== 'aberto' && b.status === 'aberto') return 1;
                  if (a.status === 'vendido' && b.status !== 'vendido' && b.status !== 'aberto') return -1;
                  if (a.status !== 'vendido' && a.status !== 'aberto' && b.status === 'vendido') return 1;
                  return 0;
                });
                
                const selectedBudget = sorted[0];
                // Só adicionar se não tiver venda (vendas têm prioridade)
                if (!budgetMap.has(leadId)) {
                  budgetMap.set(leadId, [selectedBudget]);
                  leadsWithBudgets.add(leadId);
                  console.log(`✅ Lead ${leadId}: orçamento encontrado - R$ ${selectedBudget.amount}, status: ${selectedBudget.status}`);
                }
              }
            });
          }
          
          // Fallback: buscar dos fields do lead se não encontrou nada
          if (budgetMap.size === 0 && leadsWithBudgets.size === 0) {
            console.log('⚠️ Nenhum orçamento encontrado, tentando fallback dos fields...');
            leadsWithBudgets = new Set(
              data?.filter((lead: any) => 
                lead.fields?.budget_amount || 
                lead.fields?.budget_file_base64 ||
                (lead.fields?.budget_documents && Array.isArray(lead.fields.budget_documents) && lead.fields.budget_documents.length > 0)
              ).map((l: any) => l.id) || []
            );
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

      // ⚠️ CRÍTICO: soldLeadIds deve estar acessível aqui
      // Se foi declarado dentro do try, precisa ser movido para fora ou passado
      const formattedLeads = data?.map(lead => {
        const stageName = (lead as any).stages?.name || 'Sem estágio';
        const isClosed = stageName.toLowerCase().includes('fechado') || 
                        stageName.toLowerCase().includes('vendido') || 
                        stageName.toLowerCase().includes('bolso') ||
                        stageName.toLowerCase().includes('ganho');
        
        // Buscar orçamento/venda do lead
        const leadBudgets = budgetMap.get(lead.id) || [];
        
        // ⚠️ CRÍTICO: Verificar se o lead foi vendido (tem registro na tabela sales)
        const isSold = soldLeadIds.has(lead.id);
        
        // Se foi vendido mas o budget não está marcado como vendido, corrigir
        if (isSold && leadBudgets[0] && leadBudgets[0].status !== 'vendido') {
          leadBudgets[0].status = 'vendido';
          console.log(`🔧 Corrigindo status do lead ${lead.id}: marcado como vendido`);
        }
        
        return {
          ...lead,
          stage_name: stageName,
          tags: [] as string[],
          last_interaction: lead.created_at,
          assigned_to: undefined,
          has_budget: leadsWithBudgets.has(lead.id) || leadBudgets.length > 0,
          budget_documents: leadBudgets,
          is_closed: isClosed || isSold, // Marcar como fechado se foi vendido
          is_sold: isSold // Flag adicional para identificar vendas
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
                            {/* Mostrar como VENDIDO se tiver registro na tabela sales */}
                            {lead.is_sold || lead.budget_documents[0].status === 'vendido' ? (
                              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                ✅ VENDIDO: {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(lead.budget_documents[0].amount || 0)}
                              </div>
                            ) : (
                              <div className="text-xs font-medium text-green-800">
                                💰 {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(lead.budget_documents[0].amount || 0)}
                              </div>
                            )}
                            {lead.budget_documents[0].description && (
                              <div className="text-xs text-green-700 truncate max-w-32">
                                📝 {lead.budget_documents[0].description}
                              </div>
                            )}
                            {/* Sempre mostrar botão de download se tiver file_name - padronizado */}
                            {lead.budget_documents[0].file_name ? (
                              (lead.budget_documents[0].file_base64 || lead.budget_documents[0].file_url) ? (
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
                                // Se tem file_name mas não tem arquivo disponível, ainda mostrar botão (padronizado)
                                <button 
                                  onClick={() => {
                                    toast.info('Arquivo não disponível para download. O documento pode ter sido removido após a venda.');
                                  }}
                                  className="text-xs bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500 cursor-not-allowed"
                                  title="Arquivo não disponível"
                                >
                                  📄 Baixar PDF
                                </button>
                              )
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