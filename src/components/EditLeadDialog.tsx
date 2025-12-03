import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  stage_id: string;
  order_number?: string | null;
  fields?: any;
}

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSuccess: () => void;
}

export function EditLeadDialog({ open: externalOpen, onOpenChange, lead, onSuccess }: EditLeadDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [userIntentionallyClosed, setUserIntentionallyClosed] = useState(false);
  const [internalOpen, setInternalOpen] = useState(externalOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado interno com prop externa quando abrir
  useEffect(() => {
    if (externalOpen) {
      setInternalOpen(true);
      setUserIntentionallyClosed(false);
    }
  }, [externalOpen]);

  // Estado controlado que só muda quando intencional
  const open = internalOpen;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    stage_id: '',
    notes: '',
    budget_amount: '',
    budget_description: '',
    order_number: ''
  });

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [existingPdf, setExistingPdf] = useState<{
    name: string;
    base64: string;
  } | null>(null);

  // Restaurar dados imediatamente quando o componente monta ou quando o lead muda (após recarregamento)
  useEffect(() => {
    if (!lead) return;
    
    const storageKey = `form-persistence-edit-lead-${lead.id}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const age = Date.now() - parsed.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (age < maxAge && parsed.data) {
          console.log('📋 Restaurando dados do formulário após recarregamento');
          setFormData(parsed.data);
          // Reabrir o dialog se houver dados
          if (!internalOpen) {
            setInternalOpen(true);
            onOpenChange(true);
            setUserIntentionallyClosed(false);
          }
          toast.info('Dados do formulário restaurados automaticamente');
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao restaurar dados após recarregamento:', error);
    }
  }, [lead?.id]); // Executar quando o lead muda (após recarregamento)

  // Persistência automática do formulário (apenas quando há um lead sendo editado)
  const { clearPersistedData } = useFormPersistence(
    lead ? `edit-lead-${lead.id}` : 'edit-lead',
    formData,
    open && !!lead,
    (restoredData) => {
      // Só restaurar se não tiver sido restaurado no mount
      const currentDataStr = JSON.stringify(formData);
      const restoredDataStr = JSON.stringify(restoredData);
      if (currentDataStr !== restoredDataStr) {
        setFormData(restoredData);
        toast.info('Dados do formulário restaurados automaticamente');
      }
    }
  );

  // Controlar o fechamento do dialog - só fechar se o usuário clicar no X ou Cancelar
  const handleOpenChange = (newOpen: boolean) => {
    // Se está fechando e não foi intencional, IGNORAR e manter aberto
    if (!newOpen && !userIntentionallyClosed) {
      // Forçar a manter aberto - não atualizar o estado
      console.log('🚫 Tentativa de fechar dialog bloqueada (não intencional)');
      // Forçar o dialog a permanecer aberto usando setTimeout para garantir
      setTimeout(() => {
        if (!userIntentionallyClosed) {
          setInternalOpen(true);
        }
      }, 0);
      return;
    }
    
    // Se foi intencional, fechar normalmente
    if (!newOpen && userIntentionallyClosed) {
      setInternalOpen(false);
      onOpenChange(false);
      setUserIntentionallyClosed(false);
      return;
    }
    
    // Se está abrindo
    if (newOpen) {
      setInternalOpen(true);
      onOpenChange(true);
      setUserIntentionallyClosed(false);
    }
  };

  // Detectar quando a página perde foco (troca de aba) e manter dialog aberto
  useEffect(() => {
    if (!open || !lead) return;

    const handleVisibilityChange = () => {
      // Quando a página volta a ter foco, garantir que o dialog está aberto se houver dados
      if (!document.hidden) {
        const storageKey = `form-persistence-edit-lead-${lead.id}`;
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            const age = Date.now() - parsed.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (age < maxAge && parsed.data && !userIntentionallyClosed) {
              // Se há dados persistidos, garantir que o dialog está aberto
              if (!internalOpen) {
                setInternalOpen(true);
                onOpenChange(true);
                setUserIntentionallyClosed(false);
              }
            }
          }
        } catch (error) {
          // Ignorar erros
        }
      }
    };

    // Prevenir recarregamento da página se houver dados no formulário
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const storageKey = `form-persistence-edit-lead-${lead.id}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const age = Date.now() - parsed.timestamp;
          const maxAge = 24 * 60 * 60 * 1000;
          
          if (age < maxAge && parsed.data && internalOpen) {
            if (!userIntentionallyClosed) {
              // Salvar estado antes de sair
              localStorage.setItem(storageKey, JSON.stringify({
                data: parsed.data,
                timestamp: Date.now()
              }));
            }
          }
        }
      } catch (error) {
        // Ignorar erros
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [internalOpen, lead, userIntentionallyClosed, onOpenChange]);

  // Load stages when dialog opens
  useEffect(() => {
    if (open && user?.tenant_id) {
      fetchStages();
    }
  }, [open, user?.tenant_id]);

  // Load lead data when lead changes (mas não sobrescrever se houver dados persistidos)
  useEffect(() => {
    if (lead && open) {
      // Verificar se há dados persistidos antes de carregar do lead
      const storageKey = `form-persistence-edit-lead-${lead.id}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const age = Date.now() - parsed.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 horas
          
          // Se há dados persistidos recentes, não sobrescrever
          if (age < maxAge && parsed.data) {
            console.log('📋 Mantendo dados persistidos do formulário');
            return; // Não carregar dados do lead, manter os persistidos
          }
        }
      } catch (error) {
        // Se houver erro, continuar com o carregamento normal
      }

      // Carregar dados do lead normalmente
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: lead.source || '',
        stage_id: lead.stage_id || '',
        notes: lead.fields?.notes || '',
        budget_amount: lead.fields?.budget_amount || '',
        budget_description: lead.fields?.budget_description || '',
        order_number: lead.order_number || ''
      });

      // Load existing PDF if available
      if (lead.fields?.budget_file_base64 && lead.fields?.budget_file_name) {
        setExistingPdf({
          name: lead.fields.budget_file_name,
          base64: lead.fields.budget_file_base64
        });
      } else {
        setExistingPdf(null);
      }
    }
  }, [lead, open]);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('id, name, color')
        .eq('tenant_id', user?.tenant_id)
        .order('order', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Erro ao buscar estágios:', error);
      toast.error('Erro ao carregar estágios');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione apenas arquivos PDF');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }

      setPdfFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingPdf = () => {
    setExistingPdf(null);
  };

  const downloadExistingPdf = () => {
    if (existingPdf) {
      const link = document.createElement('a');
      link.href = existingPdf.base64;
      link.download = existingPdf.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !user?.tenant_id) return;

    try {
      setLoading(true);

      // Prepare fields data
      const fieldsData = {
        ...lead.fields,
        notes: formData.notes,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
        budget_description: formData.budget_description
      };

      // Handle PDF upload
      let shouldUpdatePdfInBudget = false;
      if (pdfFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          fieldsData.budget_file_base64 = base64;
          fieldsData.budget_file_name = pdfFile.name;
          shouldUpdatePdfInBudget = true;
          
          await updateLead(fieldsData, shouldUpdatePdfInBudget);
        };
        reader.readAsDataURL(pdfFile);
        return;
      } else if (existingPdf) {
        // Keep existing PDF
        fieldsData.budget_file_base64 = existingPdf.base64;
        fieldsData.budget_file_name = existingPdf.name;
      } else {
        // Remove PDF if both are null
        fieldsData.budget_file_base64 = null;
        fieldsData.budget_file_name = null;
        shouldUpdatePdfInBudget = true; // Marcar para remover PDF da tabela budget_documents também
      }

      await updateLead(fieldsData, shouldUpdatePdfInBudget);

    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (fieldsData: any, shouldUpdatePdfInBudget: boolean = false) => {
    try {
      // Update lead
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          origin: formData.source,
          source: formData.source,
          stage_id: formData.stage_id,
          order_number: formData.order_number || null,
          fields: fieldsData
        })
        .eq('id', lead!.id)
        .eq('tenant_id', user!.tenant_id);

      if (updateError) throw updateError;

      // Atualizar orçamentos em aberto na tabela budget_documents se houver valor ou descrição alterados
      if (formData.budget_amount || formData.budget_description) {
        try {
          // Buscar orçamentos em aberto para este lead
          const { data: budgetDocs, error: budgetError } = await supabase
            .from('budget_documents')
            .select('id')
            .eq('lead_id', lead!.id)
            .eq('status', 'aberto')
            .order('created_at', { ascending: false })
            .limit(1);

          if (!budgetError && budgetDocs && budgetDocs.length > 0) {
            // Atualizar o orçamento mais recente em aberto
            const updateData: any = {};
            if (formData.budget_amount) {
              updateData.amount = parseFloat(formData.budget_amount);
            }
            if (formData.budget_description !== undefined) {
              updateData.description = formData.budget_description;
            }

            if (Object.keys(updateData).length > 0) {
              const { error: updateBudgetError } = await supabase
                .from('budget_documents')
                .update(updateData)
                .eq('id', budgetDocs[0].id);

              if (updateBudgetError) {
                console.warn('Aviso: Não foi possível atualizar o orçamento na tabela budget_documents:', updateBudgetError);
                // Não falhar a operação principal se houver erro ao atualizar orçamento
              }
            }
          }
        } catch (budgetUpdateError) {
          console.warn('Aviso: Erro ao atualizar orçamento na tabela budget_documents:', budgetUpdateError);
          // Não falhar a operação principal se houver erro ao atualizar orçamento
        }
      }

      // Atualizar ou remover PDF na tabela budget_documents se necessário
      if (shouldUpdatePdfInBudget) {
        try {
          // Buscar orçamentos em aberto para este lead
          const { data: budgetDocs, error: budgetError } = await supabase
            .from('budget_documents')
            .select('id')
            .eq('lead_id', lead!.id)
            .eq('status', 'aberto')
            .order('created_at', { ascending: false })
            .limit(1);

          if (!budgetError && budgetDocs && budgetDocs.length > 0) {
            if (fieldsData.budget_file_base64 && pdfFile) {
              // Atualizar o PDF no orçamento mais recente em aberto
              const base64Content = fieldsData.budget_file_base64.includes(',') 
                ? fieldsData.budget_file_base64.split(',')[1] 
                : fieldsData.budget_file_base64;

              const { error: updateBudgetError } = await supabase
                .from('budget_documents')
                .update({
                  file_name: fieldsData.budget_file_name,
                  file_base64: base64Content,
                  file_url: fieldsData.budget_file_base64,
                  file_size: pdfFile.size
                })
                .eq('id', budgetDocs[0].id);

              if (updateBudgetError) {
                console.warn('Aviso: Não foi possível atualizar o PDF do orçamento:', updateBudgetError);
              }
            } else if (!fieldsData.budget_file_base64) {
              // Remover PDF do orçamento se foi removido
              const { error: updateBudgetError } = await supabase
                .from('budget_documents')
                .update({
                  file_name: null,
                  file_base64: null,
                  file_url: null,
                  file_size: null
                })
                .eq('id', budgetDocs[0].id);

              if (updateBudgetError) {
                console.warn('Aviso: Não foi possível remover o PDF do orçamento:', updateBudgetError);
              }
            }
          }
        } catch (pdfUpdateError) {
          console.warn('Aviso: Erro ao atualizar PDF do orçamento:', pdfUpdateError);
        }
      }

      toast.success('Lead atualizado com sucesso!');
      clearPersistedData(); // Limpar dados persistidos após sucesso
      setUserIntentionallyClosed(true); // Marcar como fechamento intencional
      setInternalOpen(false);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
      throw error;
    }
  };

  if (!lead) return null;

  // Forçar a manter aberto se houver dados e não foi intencionalmente fechado
  useEffect(() => {
    if (!internalOpen && !userIntentionallyClosed && lead) {
      const storageKey = `form-persistence-edit-lead-${lead.id}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const age = Date.now() - parsed.timestamp;
          const maxAge = 24 * 60 * 60 * 1000;
          
          if (age < maxAge && parsed.data) {
            // Reabrir se foi fechado acidentalmente
            setInternalOpen(true);
            onOpenChange(true);
          }
        }
      } catch (error) {
        // Ignorar erros
      }
    }
  }, [internalOpen, userIntentionallyClosed, lead, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
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
              <DialogTitle>Editar Lead</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={() => {
                setUserIntentionallyClosed(true); // Marcar como fechamento intencional
                clearPersistedData(); // Limpar dados quando fechar explicitamente
                setInternalOpen(false);
                onOpenChange(false);
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white dark:text-white font-medium">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white dark:text-white font-medium">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white dark:text-white font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source" className="text-white dark:text-white font-medium">Fonte</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  <SelectItem value="instagram">Instagram (Direct)</SelectItem>
                  <SelectItem value="facebook">Facebook (Messenger FB)</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="loja">Loja</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="carteirizado">Carteirizado</SelectItem>
                  <SelectItem value="cliente_carteirizado">Cliente Carteirizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage" className="text-white dark:text-white font-medium">Estágio</Label>
              <Select value={formData.stage_id} onValueChange={(value) => setFormData({ ...formData, stage_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_amount" className="text-white dark:text-white font-medium">Valor do Orçamento (R$)</Label>
              <Input
                id="budget_amount"
                type="number"
                step="0.01"
                value={formData.budget_amount}
                onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_number" className="text-white dark:text-white font-medium">Número do Pedido</Label>
              <Input
                id="order_number"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                placeholder="Ex: PED-2024-001"
              />
            </div>
          </div>

          {/* Descrição do Orçamento */}
          <div className="space-y-2">
            <Label htmlFor="budget_description" className="text-white dark:text-white font-medium">Descrição do Orçamento</Label>
            <Textarea
              id="budget_description"
              value={formData.budget_description}
              onChange={(e) => setFormData({ ...formData, budget_description: e.target.value })}
              placeholder="Descreva o orçamento ou serviço..."
              rows={3}
            />
          </div>

          {/* Upload de PDF */}
          <div className="space-y-4">
            <Label>Documento PDF do Orçamento</Label>
            
            {/* PDF existente */}
            {existingPdf && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {existingPdf.name}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          PDF atual anexado
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadExistingPdf}
                        className="text-green-600 border-green-300 hover:bg-green-100"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeExistingPdf}
                        className="text-red-600 border-red-300 hover:bg-red-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Novo PDF */}
            {pdfPreview && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          {pdfFile?.name}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Novo PDF selecionado
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removePdf}
                      className="text-red-600 border-red-300 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload button */}
            {!pdfPreview && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {existingPdf ? 'Substituir PDF' : 'Anexar PDF'}
                </Button>
                <p className="text-sm text-gray-500">
                  Apenas arquivos PDF, máximo 10MB
                </p>
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white dark:text-white font-medium">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais sobre o lead..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setUserIntentionallyClosed(true); // Marcar como fechamento intencional
                clearPersistedData(); // Limpar dados quando cancelar explicitamente
                setInternalOpen(false);
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
