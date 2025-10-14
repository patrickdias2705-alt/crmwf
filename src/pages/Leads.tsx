import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Phone, Mail, Calendar, User, Trash2, DollarSign, Edit } from 'lucide-react';
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
  const { user, hasRole } = useAuth();
  const { viewingAgentId, isViewingAgent } = useTenantView();
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
      fetchLeads();
    }
  }, [user?.tenant_id, viewingAgentId, isViewingAgent, currentPage]);

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
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
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
                        {lead.fields?.budget_file_base64 ? (
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
                            onClick={() => handleEditLead(lead)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
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