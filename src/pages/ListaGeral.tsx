import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  MessageCircle,
  FileText,
  CheckCircle2,
  Package,
  Search,
  Filter
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  created_at: string;
  is_public: boolean;
  fields?: any;
  stages: {
    name: string;
    color: string;
  } | null;
}

export default function ListaGeral() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [stages, setStages] = useState<{ name: string }[]>([]);

  console.log('🎯 ListaGeral - Componente renderizado', { 
    user: user?.id, 
    tenantId: user?.tenant_id,
    loading,
    leadsCount: leads.length 
  });

  useEffect(() => {
    if (user?.tenant_id) {
      fetchPublicLeads();
      fetchStages();
      
      // Subscribe to real-time updates for public leads
      const leadsChannel = supabase
        .channel('lista-geral-leads')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: 'is_public=eq.true'
          },
          (payload) => {
            console.log('📋 Lista Geral - Lead atualizado:', payload);
            fetchPublicLeads(); // Reload when there are changes
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(leadsChannel);
      };
    }
  }, [user?.tenant_id]);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('name')
        .eq('tenant_id', user?.tenant_id)
        .order('order', { ascending: true });

      if (!error && data) {
        setStages(data);
      }
    } catch (error) {
      console.error('Erro ao buscar stages:', error);
    }
  };

  const fetchPublicLeads = async () => {
    try {
      setLoading(true);
      console.log('🔍 ListaGeral - Iniciando busca de leads públicos...', { 
        tenantId: user?.tenant_id,
        userId: user?.id 
      });
      
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          source,
          created_at,
          is_public,
          fields,
          stages(name, color)
        `)
        .eq('is_public', true)
        .eq('tenant_id', user?.tenant_id)
        .order('created_at', { ascending: false });

      console.log('📋 ListaGeral - Resultado da query:', { data, error });

      if (error) {
        console.error('❌ ListaGeral - Erro na query:', error);
        throw error;
      }
      
      setLeads(data || []);
      console.log('✅ ListaGeral - Leads carregados:', data?.length || 0);
    } catch (error: any) {
      console.error('💥 ListaGeral - Erro geral:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar leads baseado na busca e filtros
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || 
      lead.stages?.name === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'instagram':
        return 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-pink-700 border-pink-200';
      case 'facebook':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'website':
      case 'site':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'manual':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (lead: Lead) => {
    // Priorizar cores da classificação
    const classification = lead.fields?.classification;
    if (classification) {
      switch (classification) {
        case 'curva_a':
          return 'bg-green-500/10 text-green-700 border-green-200';
        case 'lead_desqualificado':
          return 'bg-red-500/10 text-red-700 border-red-200';
        case 'lead_sem_resposta':
          return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
        case 'lead_sem_sucesso':
          return 'bg-orange-500/10 text-orange-700 border-orange-200';
        case 'sem_estoque_produto':
          return 'bg-purple-500/10 text-purple-700 border-purple-200';
        default:
          break;
      }
    }
    
    // Fallback para categoria antiga
    const categoria = lead.fields?.categoria || lead.fields?.tipo;
    if (categoria === 'varejo') {
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    } else if (categoria === 'distribuidor') {
      return 'bg-cyan-500/10 text-cyan-700 border-cyan-200';
    } else {
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (lead: Lead) => {
    // Priorizar ícone da classificação
    const classification = lead.fields?.classification;
    if (classification) {
      switch (classification) {
        case 'curva_a':
          return <CheckCircle2 className="h-3.5 w-3.5" />;
        case 'lead_desqualificado':
          return <span className="text-xs">✗</span>;
        case 'lead_sem_resposta':
          return <MessageCircle className="h-3.5 w-3.5" />;
        case 'lead_sem_sucesso':
          return <span className="text-xs">⚠</span>;
        case 'sem_estoque_produto':
          return <Package className="h-3.5 w-3.5" />;
        default:
          break;
      }
    }
    
    // Fallback para categoria antiga
    const categoria = lead.fields?.categoria || lead.fields?.tipo;
    if (categoria === 'varejo') {
      return <User className="h-3.5 w-3.5" />;
    } else if (categoria === 'distribuidor') {
      return <Package className="h-3.5 w-3.5" />;
    } else {
      return <User className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryLabel = (lead: Lead) => {
    // Priorizar a classificação do cadastro
    const classification = lead.fields?.classification;
    
    if (classification) {
      switch (classification) {
        case 'curva_a':
          return 'Curva A';
        case 'lead_desqualificado':
          return 'Desqualificado';
        case 'lead_sem_resposta':
          return 'Sem Resposta';
        case 'lead_sem_sucesso':
          return 'Sem Sucesso';
        case 'sem_estoque_produto':
          return 'Sem Estoque';
        default:
          break;
      }
    }
    
    // Fallback para segmento (segment, categoria ou tipo)
    const segment = lead.fields?.segment || lead.fields?.categoria || lead.fields?.tipo;
    if (segment === 'varejo') {
      return 'Varejo';
    } else if (segment === 'distribuidor') {
      return 'Distribuidor';
    } else {
      return 'Não Classificado';
    }
  };

  const getSegmentLabel = (lead: Lead) => {
    // Retorna o segmento (varejo/distribuidor) independente da classificação
    const segment = lead.fields?.segment || lead.fields?.categoria || lead.fields?.tipo;
    if (segment === 'varejo') {
      return 'Varejo';
    } else if (segment === 'distribuidor') {
      return 'Distribuidor';
    }
    return null;
  };

  const getStats = () => {
    const whatsapp = filteredLeads.filter(l => l.source === 'whatsapp').length;
    const varejo = filteredLeads.filter(l => {
      const segment = l.fields?.segment || l.fields?.categoria || l.fields?.tipo;
      return segment === 'varejo';
    }).length;
    const distribuidor = filteredLeads.filter(l => {
      const segment = l.fields?.segment || l.fields?.categoria || l.fields?.tipo;
      return segment === 'distribuidor';
    }).length;
    const comOrcamento = filteredLeads.filter(l => l.fields?.budget_file_base64).length;
    const propostasEnviadas = filteredLeads.filter(l => l.stages?.name?.toLowerCase().includes('proposta') || l.stages?.name?.toLowerCase().includes('proposta enviada')).length;
    
    return { whatsapp, varejo, distribuidor, comOrcamento, propostasEnviadas, total: filteredLeads.length };
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Lista Geral</h1>
        <p>Carregando leads públicos...</p>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Lista Geral</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Leads públicos compartilhados - Visível para todos os supervisores e gerentes
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
              <div className="text-3xl font-bold">{leads.length}</div>
              <div className="text-sm text-white/80">Leads Públicos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por estágio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estágios</SelectItem>
            {stages.map((stage, index) => (
              <SelectItem key={index} value={stage.name}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{filteredLeads.length}</span>
          <span>de</span>
          <span className="font-medium">{leads.length}</span>
          <span>leads exibidos</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total de Leads</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">WhatsApp</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.whatsapp}</p>
              </div>
              <div className="bg-emerald-500 p-3 rounded-xl">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Varejo</p>
                <p className="text-3xl font-bold text-blue-900">{stats.varejo}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-600">Distribuidores</p>
                <p className="text-3xl font-bold text-cyan-900">{stats.distribuidor}</p>
              </div>
              <div className="bg-cyan-500 p-3 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Propostas Enviadas</p>
                <p className="text-3xl font-bold text-indigo-900">{stats.propostasEnviadas}</p>
              </div>
              <div className="bg-indigo-500 p-3 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center border border-blue-200">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Nenhum lead público ainda</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Os agentes podem compartilhar leads importantes para a lista geral usando o botão "Subir para Lista Geral"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {filteredLeads.map((lead) => (
            <Card 
              key={lead.id} 
              className="group hover:shadow-lg hover:border-primary/50 transition-all duration-200 border overflow-hidden"
            >
              {/* Card Header Compacto */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-bold text-gray-900 mb-1 truncate group-hover:text-primary transition-colors">
                      {lead.name}
                    </CardTitle>
                  </div>
                  <Badge className={`${getCategoryColor(lead)} flex items-center gap-1 text-xs`}>
                    {getCategoryIcon(lead)}
                    {getCategoryLabel(lead)}
                  </Badge>
                </div>

                {/* Stage Badge Compacto */}
                <div className="flex flex-wrap gap-1">
                  {lead.stages && (
                    <Badge 
                      className={`text-xs font-medium ${
                        lead.stages.name?.toLowerCase().includes('proposta') 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      }`}
                    >
                      {lead.stages.name}
                    </Badge>
                  )}
                  
                  {/* Badge Segmento (Varejo/Distribuidor) */}
                  {getSegmentLabel(lead) && (
                    <Badge 
                      className={`text-xs font-medium ${
                        getSegmentLabel(lead) === 'Varejo' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                          : 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
                      }`}
                    >
                      {getSegmentLabel(lead) === 'Varejo' ? '🛒 Varejo' : '📦 Distribuidor'}
                    </Badge>
                  )}
                  
                  {/* Badge Proposta Enviada */}
                  {(lead.stages?.name?.toLowerCase().includes('proposta')) && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-medium">
                      ✓ Proposta
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardContent className="p-4 space-y-2.5">
                {/* Contact Info - Compacto */}
                <div className="space-y-2">
                {lead.phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3 w-3 text-blue-500" />
                      <span className="font-medium truncate">{lead.phone}</span>
                  </div>
                )}
                
                {lead.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="h-3 w-3 text-blue-600" />
                      <span className="font-medium truncate">{lead.email}</span>
                    </div>
                  )}
                </div>

                {/* Source Info - Compacto */}
                {lead.fields?.interesse && (
                  <div className="text-xs text-gray-600 line-clamp-2">
                    <span className="font-medium">Interesse:</span> {lead.fields.interesse}
                  </div>
                )}
                
                {/* Budget Info - Compacto */}
                {lead.fields?.budget_file_base64 && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg text-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(lead.fields.budget_amount || 0)}
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5" />
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
                      className="text-xs underline hover:no-underline"
                    >
                      Baixar documento
                    </button>
                  </div>
                )}

                {/* Footer - Ultra Compacto */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                  <Badge className={getSourceColor(lead.source)} style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {lead.source === 'whatsapp' ? 'WA' : 'Manual'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}