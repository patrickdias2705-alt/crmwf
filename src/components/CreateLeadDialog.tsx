import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, User, Tag, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { toast } from 'sonner';

interface CreateLeadDialogProps {
  onLeadCreated?: () => void;
}

export function CreateLeadDialog({ onLeadCreated }: CreateLeadDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userIntentionallyClosed, setUserIntentionallyClosed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    origin: 'manual',
    category: 'varejo',
    order_number: '',
    classification: 'curva_a'
  });

  // Persistência automática do formulário
  const { clearPersistedData } = useFormPersistence(
    'create-lead',
    formData,
    open,
    (restoredData) => {
      setFormData(restoredData);
      toast.info('Dados do formulário restaurados automaticamente');
    }
  );

  // Controlar o fechamento do dialog - só fechar se o usuário clicar no X ou Cancelar
  const handleOpenChange = (newOpen: boolean) => {
    // Se está fechando e não foi intencional, manter aberto
    if (!newOpen && !userIntentionallyClosed) {
      // Não fechar - manter aberto
      return;
    }
    
    // Se foi intencional, fechar normalmente
    if (!newOpen && userIntentionallyClosed) {
      setOpen(false);
      setUserIntentionallyClosed(false);
      return;
    }
    
    // Se está abrindo
    if (newOpen) {
      setOpen(true);
      setUserIntentionallyClosed(false);
    }
  };

  // Detectar quando a página perde foco (troca de aba) e reabrir dialog se necessário
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Quando a página volta a ter foco, verificar se há dados persistidos
      if (!document.hidden && !open) {
        const storageKey = 'form-persistence-create-lead';
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            const age = Date.now() - parsed.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            // Verificar se há dados válidos e se o formulário não foi intencionalmente fechado
            if (age < maxAge && parsed.data && !userIntentionallyClosed) {
              // Verificar se há dados preenchidos (não apenas valores padrão)
              const hasData = parsed.data.name || parsed.data.phone || parsed.data.email || 
                             parsed.data.order_number || parsed.data.origin !== 'manual' ||
                             parsed.data.category !== 'varejo' || parsed.data.classification !== 'curva_a';
              
              if (hasData) {
                // Se há dados persistidos, reabrir o dialog
                setOpen(true);
                setUserIntentionallyClosed(false);
              }
            }
          }
        } catch (error) {
          // Ignorar erros
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [open, userIntentionallyClosed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenant_id) {
      toast.error('Erro: usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      // Get default pipeline and "Novo Lead" stage
      const { data: pipelines } = await supabase
        .from('pipelines')
        .select('id')
        .eq('tenant_id', user.tenant_id)
        .eq('is_default', true)
        .limit(1)
        .single();

      if (!pipelines) {
        toast.error('Pipeline padrão não encontrado');
        return;
      }

      // Get first stage of the pipeline (ordered by order)
      const { data: stage } = await supabase
        .from('stages')
        .select('id')
        .eq('pipeline_id', pipelines.id)
        .order('order', { ascending: true })
        .limit(1)
        .single();

      if (!stage) {
        toast.error('Nenhum stage encontrado no pipeline padrão');
        return;
      }

      // Create lead
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          origin: formData.origin,
          tenant_id: user.tenant_id,
          pipeline_id: pipelines.id,
          stage_id: stage.id,
          status: 'novo_lead',
          assigned_to: user.id, // CORREÇÃO: Atribuir ao usuário atual
          owner_user_id: user.id, // CORREÇÃO: Definir como dono
          category: formData.category, // NOVO: Categoria do lead
          is_public: false, // NOVO: Por padrão, lead é privado
          order_number: formData.order_number || null, // NOVO: Número do pedido
          fields: {
            classification: formData.classification
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('lead_events').insert({
        tenant_id: user.tenant_id,
        lead_id: lead.id,
        type: 'lead.created',
        actor: 'user',
        user_id: user.id, // CORREÇÃO: Adicionar user_id
        data: { 
          origin: formData.origin, 
          classification: formData.classification
        }
      });

      toast.success('Lead criado com sucesso!');
      clearPersistedData(); // Limpar dados persistidos após sucesso
      setFormData({ name: '', phone: '', email: '', origin: 'manual', category: 'varejo', order_number: '', classification: 'curva_a' });
      setUserIntentionallyClosed(true); // Marcar como fechamento intencional
      setOpen(false);
      onLeadCreated?.();
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast.error(error.message || 'Erro ao criar lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="[&>button]:hidden"
        onEscapeKeyDown={(e) => {
          // Prevenir fechamento com ESC - só fechar se for intencional
          if (!userIntentionallyClosed) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevenir fechamento ao clicar fora - só fechar se for intencional
          if (!userIntentionallyClosed) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevenir fechamento ao interagir fora - só fechar se for intencional
          if (!userIntentionallyClosed) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>Criar Novo Lead</DialogTitle>
              <DialogDescription>
                Preencha os dados para adicionar um novo lead ao sistema
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={() => {
                setUserIntentionallyClosed(true); // Marcar como fechamento intencional
                clearPersistedData(); // Limpar dados quando fechar explicitamente
                setOpen(false);
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </DialogHeader>
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Lead
            </TabsTrigger>
            <TabsTrigger value="classificacao" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Classificação
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do lead"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+55 11 99999-9999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_number">Número do Pedido</Label>
                <Input
                  id="order_number"
                  value={formData.order_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
                  placeholder="Ex: PED-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin">Origem do Lead *</Label>
                <Select value={formData.origin} onValueChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="carteirizado">Carteirizado</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="varejo">Varejo</SelectItem>
                    <SelectItem value="distribuidor">Distribuidor</SelectItem>
                    <SelectItem value="revenda">Revenda</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="classificacao" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Classificação do Lead</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione a classificação mais adequada para este lead
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="curva_a"
                      name="classification"
                      value="curva_a"
                      checked={formData.classification === 'curva_a'}
                      onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value }))}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="curva_a" className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <strong>Curva A</strong>
                      <span className="text-sm text-muted-foreground">- Lead de alta qualidade</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="lead_desqualificado"
                      name="classification"
                      value="lead_desqualificado"
                      checked={formData.classification === 'lead_desqualificado'}
                      onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value }))}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="lead_desqualificado" className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <strong>Lead Desqualificado</strong>
                      <span className="text-sm text-muted-foreground">- Não atende aos critérios</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="lead_sem_resposta"
                      name="classification"
                      value="lead_sem_resposta"
                      checked={formData.classification === 'lead_sem_resposta'}
                      onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value }))}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="lead_sem_resposta" className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <strong>Lead sem Resposta</strong>
                      <span className="text-sm text-muted-foreground">- Não respondeu aos contatos</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="lead_sem_sucesso"
                      name="classification"
                      value="lead_sem_sucesso"
                      checked={formData.classification === 'lead_sem_sucesso'}
                      onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value }))}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="lead_sem_sucesso" className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                      <strong>Lead sem Sucesso</strong>
                      <span className="text-sm text-muted-foreground">- Tentativas não resultaram em venda</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="sem_estoque_produto"
                      name="classification"
                      value="sem_estoque_produto"
                      checked={formData.classification === 'sem_estoque_produto'}
                      onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value }))}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="sem_estoque_produto" className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                      <strong>Sem Estoque do Produto</strong>
                      <span className="text-sm text-muted-foreground">- Produto solicitado indisponível</span>
                    </Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setUserIntentionallyClosed(true); // Marcar como fechamento intencional
                  clearPersistedData(); // Limpar dados quando cancelar explicitamente
                  setOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Lead'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
