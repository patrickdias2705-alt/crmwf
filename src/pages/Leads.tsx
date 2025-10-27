import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Phone, Mail, Calendar, User, Trash2, DollarSign, Edit, ArrowLeft, Plus, Filter, Download } from 'lucide-react';
import { Button, Button as ActionButton } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CreateLeadDialog } from '@/components/CreateLeadDialog';
import { CreateBudgetDialog } from '@/components/CreateBudgetDialog';
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
  const { user, hasRole, forceUpdate } = useAuth();
  const { viewingAgentId, isViewingAgent } = useTenantView();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const leadsPerPage = 20;

  // Estados para edição de leads
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (user?.tenant_id) {
      console.log('📊 Leads - Recarregando dados, forceUpdate:', forceUpdate);
      fetchLeads();
    }
  }, [user?.tenant_id, viewingAgentId, isViewingAgent, currentPage, forceUpdate]);

  const fetchLeads = async () => {
    try {
      console.log('📊 Leads - Loading for:', { 
        viewingAgentId, 
        isViewingAgent,
        page: currentPage,
        perPage: leadsPerPage
      });

      // Calcular offset para paginação
      const from = (currentPage - 1) * leadsPerPage;
      const to = from + leadsPerPage - 1;

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
        `, { count: 'exact' })
        .eq('tenant_id', user?.tenant_id);

      // Filter by agent if viewing specific agent
      if (isViewingAgent && viewingAgentId) {
        query = query.eq('assigned_to', viewingAgentId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Buscar budgets para cada lead
      const leadIds = data?.map(l => l.id) || [];
      const { data: budgetsData } = await supabase
        .from('budgets')
        .select('lead_id')
        .in('lead_id', leadIds);

      const leadsWithBudgets = new Set(budgetsData?.map(b => b.lead_id) || []);

      const formattedLeads = data?.map(lead => {
        const stageName = (lead as any).stages?.name || 'Sem estágio';
        const isClosed = stageName.toLowerCase().includes('fechado') || 
                        stageName.toLowerCase().includes('vendido') || 
                        stageName.toLowerCase().includes('bolso') ||
                        stageName.toLowerCase().includes('ganho');
        
        return {
          ...lead,
          stage_name: stageName,
          tags: [] as string[],
          last_interaction: lead.created_at,
          assigned_to: undefined,
          has_budget: leadsWithBudgets.has(lead.id),
          is_closed: isClosed
        };
      }) || [];

      setLeads(formattedLeads);
      
      // Calcular total de páginas
      const totalPagesCount = Math.ceil((count || 0) / leadsPerPage);
      setTotalPages(totalPagesCount);
      
      console.log('✅ Leads carregados:', { 
        currentPage, 
        totalPages: totalPagesCount,
        leadsCount: formattedLeads.length,
        totalLeads: count || 0
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchLeads();
    setEditDialogOpen(false);
    setSelectedLead(null);
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
      'whatsapp': 'bg-green-500/20 text-green-400 border-green-500/30',
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
      <div className="space-y-4 max-w-full">
        {/* Header otimizado */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div className="h-8 w-px bg-blue-200 dark:bg-blue-800" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestão de Leads
                </h1>
                <p className="text-blue-600/80 dark:text-blue-400/80 text-sm">
                  Gerencie todos os seus leads em um só lugar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportLeadsButton />
              {hasRole(['admin', 'agent']) && (
                <CreateLeadDialog onLeadCreated={fetchLeads} />
              )}
            </div>
          </div>
        </div>

        {/* Filtros otimizados */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">Filtros e Busca</CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Use os filtros abaixo para encontrar leads específicos rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar Lead</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Nome, telefone ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Origem</label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Todas as origens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as origens</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estágio</label>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Todos os estágios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estágios</SelectItem>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="atendido">Base Qualificada WF</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de leads melhorada */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Lista de Leads</CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400">
                    {filteredLeads.length} leads encontrados
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Total: {leads.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome</TableHead>
                    <TableHead className="min-w-[120px]">Contato</TableHead>
                    <TableHead className="min-w-[100px]">Pedido</TableHead>
                    <TableHead className="min-w-[100px]">Fonte</TableHead>
                    <TableHead className="min-w-[120px]">Estágio</TableHead>
                    <TableHead className="min-w-[140px]">Orçamento</TableHead>
                    <TableHead className="min-w-[100px]">Tags</TableHead>
                    <TableHead className="min-w-[100px]">Criado</TableHead>
                    <TableHead className="min-w-[120px]">Última Ação</TableHead>
                    <TableHead className="min-w-[120px]">Ações</TableHead>
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
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm ${lead.is_closed ? 'text-green-600 font-semibold' : ''}`}>
                            {lead.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[100px]">{lead.phone}</span>
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs px-1 py-0">
                            {lead.order_number || 'N/A'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs px-1 py-0 ${getSourceColor(lead.source)}`}>
                          {lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {lead.stage_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.fields?.budget_file_base64 ? (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-green-800">
                              💰 {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(lead.fields.budget_amount || 0)}
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
                              className="text-xs bg-green-600 text-white px-1 py-0.5 rounded hover:bg-green-700"
                            >
                              📄
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem orçamento</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[80px]">
                          {lead.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                              {tag.length > 8 ? tag.substring(0, 8) + '...' : tag}
                            </Badge>
                          ))}
                          {lead.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{lead.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lead.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lead.last_interaction ? formatDate(lead.last_interaction) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLead(lead)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                            title="Editar lead"
                          >
                            <Edit className="h-3 w-3" />
                          </ActionButton>
                          <MakeLeadPublicButton 
                            leadId={lead.id}
                            isPublic={lead.is_public || false}
                            onSuccess={fetchLeads}
                          />
                          <BudgetDocumentUpload 
                            leadId={lead.id} 
                            leadName={lead.name}
                            onDocumentUploaded={fetchLeads}
                          />
                          {!lead.has_budget && (
                            <CreateBudgetDialog 
                              leadId={lead.id} 
                              leadName={lead.name}
                              onBudgetCreated={fetchLeads}
                            />
                          )}
                          {lead.has_budget && !lead.is_closed && (
                            <ActionButton
                              variant="default"
                              size="sm"
                              onClick={() => handleMarkAsSold(lead.id, lead.name)}
                              className="bg-green-600 hover:bg-green-700 text-white animate-fade-in"
                            >
                              Vendido
                            </ActionButton>
                          )}
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}

        {/* Dialog de Edição */}
        <EditLeadDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          lead={selectedLead}
          onSuccess={handleEditSuccess}
        />
      </div>
    </Layout>
  );
}