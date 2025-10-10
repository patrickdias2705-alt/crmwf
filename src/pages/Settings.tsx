import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PipelineSettings } from '@/components/settings/PipelineSettings';
import { CustomFieldsSettings } from '@/components/settings/CustomFieldsSettings';
import { WebhookSettings } from '@/components/settings/WebhookSettings';
import { EvolutionSettings } from '@/components/settings/EvolutionSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Settings as SettingsIcon, 
  Workflow, 
  Database, 
  Webhook, 
  MessageSquare, 
  User, 
  LogOut, 
  Building2, 
  Shield,
  Bell,
  Users,
  Zap,
  BarChart,
  Link,
  Lock,
  Mail,
  Phone,
  Calendar,
  Target,
  Timer,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  const { user, tenant, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');

  const isAdmin = user?.role === 'admin' || user?.role === 'client_owner';

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  const tabs = [
    {
      id: 'account',
      label: 'Conta',
      icon: User,
      description: 'Informações da conta e configurações gerais'
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      description: 'Configurações de gerenciamento de leads'
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: Bell,
      description: 'Alertas e notificações do sistema'
    },
    {
      id: 'automation',
      label: 'Automação',
      icon: Zap,
      description: 'Automações de vendas e marketing'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart,
      description: 'Configurações de relatórios e métricas'
    },
    {
      id: 'security',
      label: 'Segurança',
      icon: Lock,
      description: 'Configurações de segurança e permissões'
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: Workflow,
      description: 'Configure estágios e fluxo de vendas'
    },
    {
      id: 'fields',
      label: 'Campos',
      icon: Database,
      description: 'Campos customizados dos leads'
    },
    {
      id: 'integrations',
      label: 'Integrações',
      icon: Link,
      description: 'WhatsApp, Webhooks e outras integrações'
    }
  ];

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
            <p className="text-muted-foreground">
              Configure seu sistema CRM e integrações
            </p>
          </div>
          
          <Badge variant="outline" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            {user?.role}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 bg-muted/50 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="h-5 w-5 text-primary" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>{tab.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tab.id === 'account' && (
                    <div className="space-y-6">
                      {/* User Profile Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Perfil do Usuário
                        </h3>
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                              {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{user?.name}</h4>
                            <p className="text-muted-foreground">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="capitalize">
                                <Shield className="h-3 w-3 mr-1" />
                                {user?.role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Company Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Informações da Empresa
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Nome da Empresa</label>
                              <p className="font-medium">{tenant?.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Plano</label>
                              <Badge variant="outline" className="mt-1 capitalize">
                                {tenant?.plan}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Account Actions */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Ações da Conta</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="destructive" 
                            onClick={handleLogout}
                            className="flex items-center gap-2"
                          >
                            <LogOut className="h-4 w-4" />
                            Sair da Conta
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ao sair, você será redirecionado para a página de login.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Configurações de Leads */}
                  {tab.id === 'leads' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Atribuição Automática
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Distribuição Round Robin</p>
                              <p className="text-sm text-muted-foreground">Distribui leads automaticamente entre vendedores</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Ativar
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Atribuição por Região</p>
                              <p className="text-sm text-muted-foreground">Atribui leads baseado na localização</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configurar
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Lead Scoring
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Pontuação por WhatsApp</label>
                              <p className="text-xs text-muted-foreground mb-2">Pontos por mensagem recebida</p>
                              <Input type="number" defaultValue="10" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Pontuação por Email</label>
                              <p className="text-xs text-muted-foreground mb-2">Pontos por email fornecido</p>
                              <Input type="number" defaultValue="15" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Timer className="h-5 w-5" />
                          Tempo de Resposta
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">SLA Primeiro Contato</label>
                              <select className="w-full p-2 border rounded mt-1">
                                <option>5 minutos</option>
                                <option>15 minutos</option>
                                <option>30 minutos</option>
                                <option>1 hora</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">SLA Resposta WhatsApp</label>
                              <select className="w-full p-2 border rounded mt-1">
                                <option>1 minuto</option>
                                <option>5 minutos</option>
                                <option>15 minutos</option>
                                <option>30 minutos</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configurações de Notificações */}
                  {tab.id === 'notifications' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Bell className="h-5 w-5" />
                          Alertas de Sistema
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Novo Lead</p>
                              <p className="text-sm text-muted-foreground">Notificar quando um novo lead entrar</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Ativo
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">WhatsApp Desconectado</p>
                              <p className="text-sm text-muted-foreground">Alerta quando WhatsApp desconectar</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Ativo
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Lead Sem Resposta</p>
                              <p className="text-sm text-muted-foreground">Alerta após 2 horas sem resposta</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configurar
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Notificações por Email
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Email para Relatórios</label>
                              <Input type="email" placeholder="admin@empresa.com" className="mt-1" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Frequência</label>
                              <Select>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Diário</SelectItem>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configurações de Automação */}
                  {tab.id === 'automation' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Automações de WhatsApp
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Mensagem de Boas-vindas</p>
                              <p className="text-sm text-muted-foreground">Enviar automaticamente ao primeiro contato</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configurar
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Follow-up Automático</p>
                              <p className="text-sm text-muted-foreground">Mensagem após X horas sem resposta</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configurar
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Qualificações
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Lembrete de Reunião</p>
                              <p className="text-sm text-muted-foreground">Enviar lembrete 1h antes da reunião</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Ativo
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Confirmação de Presença</p>
                              <p className="text-sm text-muted-foreground">Solicitar confirmação 24h antes</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Ativo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configurações de Relatórios */}
                  {tab.id === 'reports' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart className="h-5 w-5" />
                          Métricas Principais
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Meta Mensal de Leads</label>
                              <Input type="number" defaultValue="100" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Meta de Conversão (%)</label>
                              <Input type="number" defaultValue="15" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Relatórios Automáticos
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Relatório Diário</p>
                              <p className="text-sm text-muted-foreground">Leads, conversões e métricas do dia</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Ativo
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Relatório Semanal</p>
                              <p className="text-sm text-muted-foreground">Resumo semanal de performance</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configurar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configurações de Segurança */}
                  {tab.id === 'security' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Controle de Acesso
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Autenticação em Dois Fatores</p>
                              <p className="text-sm text-muted-foreground">Segurança adicional para login</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configurar
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Sessão Automática</p>
                              <p className="text-sm text-muted-foreground">Tempo limite de sessão inativa</p>
                            </div>
                            <select className="p-2 border rounded">
                              <option>30 minutos</option>
                              <option>1 hora</option>
                              <option>4 horas</option>
                              <option>8 horas</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Logs de Auditoria
                          </h3>
                          <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Log de Acessos</p>
                                <p className="text-sm text-muted-foreground">Registro de todos os logins</p>
                              </div>
                              <Button variant="outline" size="sm">
                                Ver Logs
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Log de Alterações</p>
                                <p className="text-sm text-muted-foreground">Histórico de mudanças no sistema</p>
                              </div>
                              <Button variant="outline" size="sm">
                                Ver Logs
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configurações de Pipeline */}
                  {tab.id === 'pipeline' && <PipelineSettings />}
                  
                  {/* Configurações de Campos */}
                  {tab.id === 'fields' && <CustomFieldsSettings />}

                  {/* Configurações de Integrações */}
                  {tab.id === 'integrations' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          WhatsApp
                        </h3>
                        {isAdmin ? (
                          <EvolutionSettings />
                        ) : (
                          <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              Apenas administradores podem configurar integrações
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Webhook className="h-5 w-5" />
                          Webhooks e N8N
                        </h3>
                        {isAdmin ? (
                          <WebhookSettings />
                        ) : (
                          <div className="text-center py-8">
                            <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              Apenas administradores podem configurar webhooks
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Link className="h-5 w-5" />
                          Outras Integrações
                        </h3>
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Google Sheets</p>
                              <p className="text-sm text-muted-foreground">Exportar leads automaticamente</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Conectar
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Zapier</p>
                              <p className="text-sm text-muted-foreground">Integrar com milhares de apps</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Conectar
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">RD Station</p>
                              <p className="text-sm text-muted-foreground">Sincronizar com marketing</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Conectar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}