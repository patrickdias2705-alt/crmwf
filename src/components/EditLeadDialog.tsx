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

  // Flag para controlar se já carregou os dados do lead
  const hasLoadedLeadDataRef = useRef(false);

  // Load lead data when lead changes - SEMPRE carregar dados do lead quando abre
  useEffect(() => {
    if (lead && open && !hasLoadedLeadDataRef.current) {
      console.log('📋 Carregando dados do lead:', lead);
      console.log('📋 Lead ID:', lead.id);
      
      // Função para carregar dados do orçamento da tabela budget_documents
      const loadBudgetData = async () => {
        try {
          console.log('🔍 Buscando orçamento na tabela budget_documents para lead:', lead.id);
          
          // Buscar orçamento mais recente (vendido ou aberto) da tabela budget_documents
          // Priorizar vendido se existir, senão buscar aberto
          const { data: budgetDocs, error: budgetError } = await supabase
              .from('budget_documents')
            .select('amount, description, file_name, file_base64, file_url, status, sale_id')
              .eq('lead_id', lead.id)
            .in('status', ['aberto', 'vendido'])
              .order('created_at', { ascending: false })
              .limit(1)
            .maybeSingle();

          console.log('📊 Resultado da busca de orçamento:', { budgetDocs, budgetError });

          if (budgetError) {
            console.warn('⚠️ Erro ao buscar orçamento:', budgetError);
          }

          if (!budgetError && budgetDocs) {
            console.log('✅ Orçamento encontrado na tabela budget_documents:', budgetDocs);
            console.log('💰 Valor do orçamento (raw):', budgetDocs.amount, typeof budgetDocs.amount);
            
            // Formatar valor para exibição no input
            let formattedAmount = '';
            if (budgetDocs.amount !== null && budgetDocs.amount !== undefined) {
              // Converter para número e depois para string, removendo zeros desnecessários
              const numAmount = typeof budgetDocs.amount === 'string' 
                ? parseFloat(budgetDocs.amount) 
                : Number(budgetDocs.amount);
              
              if (!isNaN(numAmount)) {
                // Formatar com 2 casas decimais, mas remover zeros à direita se não forem necessários
                formattedAmount = numAmount.toString();
                // Se tiver casas decimais, garantir formato correto
                if (formattedAmount.includes('.')) {
                  const parts = formattedAmount.split('.');
                  if (parts[1] && parts[1].length > 2) {
                    formattedAmount = numAmount.toFixed(2);
                  }
                }
              }
            }
            
            console.log('💰 Valor formatado para input:', formattedAmount);
            
            // Atualizar formData com dados do orçamento - FORÇAR atualização
            // Usar setTimeout para garantir que o estado seja atualizado após o render
            setTimeout(() => {
              setFormData(prev => {
                const newData = {
                  ...prev,
                  budget_amount: formattedAmount || (prev.budget_amount || ''),
                  budget_description: budgetDocs.description || prev.budget_description || ''
                };
                console.log('📝 Atualizando formData com:', newData);
                console.log('💰 Valor que será exibido no campo:', newData.budget_amount);
                return newData;
              });
            }, 100);

            // Carregar PDF se existir
            if (budgetDocs.file_base64 || budgetDocs.file_url) {
              const fileUrl = budgetDocs.file_url || (budgetDocs.file_base64 ? `data:application/pdf;base64,${budgetDocs.file_base64}` : null);
              if (fileUrl) {
                setExistingPdf({
                  name: budgetDocs.file_name,
                  base64: fileUrl
                });
              }
            }
            return; // Dados carregados da tabela, não precisa do fallback
          } else {
            console.log('ℹ️ Nenhum orçamento encontrado na tabela budget_documents, usando fallback dos fields');
            }
          } catch (error) {
          console.error('❌ Erro ao buscar orçamento da tabela:', error);
        }

        // Fallback: buscar dos fields do lead (compatibilidade com dados antigos)
        if (lead.fields?.budget_file_base64 && lead.fields?.budget_file_name) {
          setExistingPdf({
            name: lead.fields.budget_file_name,
            base64: lead.fields.budget_file_base64
          });
          }
        };

      // Carregar dados básicos do lead primeiro (com valores padrão)
      // ⚠️ IMPORTANTE: Carregar origin primeiro, depois source como fallback
      // Isso garante que a origem marcada pelo usuário seja preservada
      const loadedOrigin = lead.origin || lead.source || '';
      console.log('📋 Carregando origem do lead:', {
        lead_origin: lead.origin,
        lead_source: lead.source,
        loadedOrigin_final: loadedOrigin,
        lead_id: lead.id
      });
      
      const initialFormData = {
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: loadedOrigin, // PRIORIZAR origin sobre source
        stage_id: lead.stage_id || '',
        notes: lead.fields?.notes || '',
        budget_amount: lead.fields?.budget_amount?.toString() || '',
        budget_description: lead.fields?.budget_description || '',
        order_number: lead.order_number || ''
      };
      
      console.log('📝 Dados iniciais do formData:', initialFormData);
      setFormData(initialFormData);

      // Carregar dados do orçamento (prioriza tabela budget_documents)
      // Aguardar um pouco para garantir que o formData inicial foi definido
      loadBudgetData().then(() => {
        console.log('✅ Carregamento de dados do orçamento concluído');
      });
      
      hasLoadedLeadDataRef.current = true;
    }
    
    // Resetar flag quando o dialog fecha ou o lead muda
    if (!open || !lead) {
      hasLoadedLeadDataRef.current = false;
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
      // ⚠️ CRÍTICO: Preservar a origem escolhida pelo usuário
      // Não sobrescrever - usar o valor que o usuário selecionou
      // Se não tiver origem selecionada, usar a existente ou 'outro' como padrão
      const originValue = formData.source || lead?.origin || lead?.source || 'outro';
      
      if (!originValue || originValue === 'manual') {
        throw new Error('Origem do lead é obrigatória. Selecione uma origem válida.');
      }
      
      console.log('💾 Salvando origem do lead:', {
        formData_source: formData.source,
        lead_origin: lead?.origin,
        lead_source: lead?.source,
        originValue_final: originValue,
        lead_id: lead!.id
      });
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          origin: originValue, // Usar valor escolhido pelo usuário
          source: originValue, // Manter sincronizado
          stage_id: formData.stage_id,
          order_number: formData.order_number || null,
          fields: fieldsData
        })
        .eq('id', lead!.id)
        .eq('tenant_id', user!.tenant_id);

      if (updateError) throw updateError;

      // ⚠️ VALIDAÇÃO CRÍTICA: Verificar se a atualização foi realmente salva no banco
      const { data: verifyLead, error: verifyError } = await supabase
        .from('leads')
        .select('id, origin, source')
        .eq('id', lead!.id)
        .single();

      if (verifyError || !verifyLead) {
        throw new Error('Erro ao verificar lead no banco de dados. A atualização pode não ter sido salva corretamente.');
      }

      if (verifyLead.origin !== originValue) {
        console.error('❌ ERRO: Origem não foi salva corretamente!', {
          esperado: originValue,
          salvo: verifyLead.origin
        });
        throw new Error(`Origem não foi salva corretamente. Esperado: ${originValue}, Salvo: ${verifyLead.origin}`);
      }

      console.log('✅ Lead atualizado e verificado no banco:', {
        id: verifyLead.id,
        origin: verifyLead.origin,
        source: verifyLead.source
      });

      // ⚠️ CRÍTICO: SEMPRE atualizar a tabela sales PRIMEIRO se o lead estiver vendido
      // Isso garante que o valor da venda seja atualizado independente de ter budget_documents
      let saleUpdated = false;
      try {
        // Buscar venda na tabela sales diretamente (prioridade)
        const { data: salesData, error: salesCheckError } = await supabase
          .from('sales')
          .select('id, amount, budget_description')
          .eq('lead_id', lead!.id)
          .order('sold_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!salesCheckError && salesData) {
          console.log('💾 VENDA ENCONTRADA na tabela sales, atualizando valor...', {
            sale_id: salesData.id,
            valor_atual: salesData.amount,
            novo_valor: formData.budget_amount
          });

          const saleUpdateData: any = {};
          if (formData.budget_amount !== undefined && formData.budget_amount !== null && formData.budget_amount !== '') {
            const newAmount = parseFloat(formData.budget_amount);
            if (!isNaN(newAmount)) {
              saleUpdateData.amount = newAmount;
              console.log(`🔄 SUBSTITUINDO valor da venda na tabela sales: ${salesData.amount} → ${newAmount}`);
            }
          }
          if (formData.budget_description !== undefined) {
            saleUpdateData.budget_description = formData.budget_description || '';
          }

          if (Object.keys(saleUpdateData).length > 0) {
            console.log('💾 ATUALIZANDO venda na tabela sales (UPDATE):', saleUpdateData);
            const { error: saleUpdateError } = await supabase
              .from('sales')
              .update(saleUpdateData)
              .eq('id', salesData.id);

            if (saleUpdateError) {
              console.error('❌ ERRO ao atualizar venda na tabela sales:', saleUpdateError);
              throw new Error(`Erro ao atualizar valor da venda: ${saleUpdateError.message}`);
            }

            // ⚠️ VALIDAÇÃO CRÍTICA: Verificar se a venda foi realmente atualizada no banco
            const { data: verifySale, error: verifySaleError } = await supabase
              .from('sales')
              .select('id, amount, budget_description')
              .eq('id', salesData.id)
              .single();

            if (verifySaleError || !verifySale) {
              console.error('❌ ERRO: Venda não foi encontrada após atualização!', verifySaleError);
              throw new Error('Erro ao verificar venda no banco. A atualização pode não ter sido salva.');
            }

            // Verificar se o valor foi realmente atualizado
            if (saleUpdateData.amount !== undefined) {
              const savedAmount = parseFloat(verifySale.amount?.toString() || '0');
              const expectedAmount = parseFloat(saleUpdateData.amount.toString());
              if (Math.abs(savedAmount - expectedAmount) > 0.01) {
                console.error('❌ ERRO: Valor da venda não foi salvo corretamente!', {
                  esperado: expectedAmount,
                  salvo: savedAmount
                });
                throw new Error(`Valor da venda não foi salvo corretamente. Esperado: R$ ${expectedAmount.toFixed(2)}, Salvo: R$ ${savedAmount.toFixed(2)}`);
              }
            }

            console.log('✅ Venda atualizada e verificada no banco (tabela sales):', {
              id: verifySale.id,
              amount: verifySale.amount,
              budget_description: verifySale.budget_description
            });
            saleUpdated = true;
          }
        } else if (salesCheckError) {
          console.warn('⚠️ Erro ao buscar venda na tabela sales:', salesCheckError);
        }
      } catch (salesUpdateError: any) {
        console.error('❌ ERRO ao atualizar venda na tabela sales:', salesUpdateError);
        // Se é um erro que lançamos (throw), propagar
        if (salesUpdateError instanceof Error && salesUpdateError.message.includes('Erro ao')) {
          throw salesUpdateError;
        }
        // Caso contrário, lançar erro genérico
        throw new Error(`Erro ao atualizar venda: ${salesUpdateError?.message || 'Erro desconhecido'}`);
      }

      // SEMPRE tentar atualizar orçamentos (abertos ou vendidos) na tabela budget_documents
      // E também atualizar a tabela sales se o lead estiver vendido (caso não tenha atualizado acima)
      // Isso permite corrigir valores mesmo que sejam 0 ou vazios
        try {
        // Buscar orçamentos (abertos ou vendidos) para este lead
          const { data: budgetDocs, error: budgetError } = await supabase
            .from('budget_documents')
          .select('id, amount, description, status, sale_id')
            .eq('lead_id', lead!.id)
          .in('status', ['aberto', 'vendido'])
            .order('created_at', { ascending: false })
            .limit(1);

          if (!budgetError && budgetDocs && budgetDocs.length > 0) {
          // IMPORTANTE: Sempre SUBSTITUIR o valor, nunca somar ou duplicar
          // Atualizar o orçamento mais recente (vendido ou aberto)
            const updateData: any = {};
          
          // Sempre SUBSTITUIR amount se foi fornecido (mesmo que seja 0)
          // Isso é uma SUBSTITUIÇÃO, não uma adição
          if (formData.budget_amount !== undefined && formData.budget_amount !== null && formData.budget_amount !== '') {
            const newAmount = parseFloat(formData.budget_amount);
            if (!isNaN(newAmount)) {
              // SUBSTITUIR o valor existente pelo novo valor
              updateData.amount = newAmount;
              console.log(`🔄 SUBSTITUINDO valor do orçamento: ${budgetDocs[0].amount} → ${newAmount}`);
            }
          }
          
          // Sempre SUBSTITUIR description se foi fornecida
            if (formData.budget_description !== undefined) {
            updateData.description = formData.budget_description || '';
            }

          // Atualizar se houver mudanças - sempre UPDATE (substituição), nunca INSERT
            if (Object.keys(updateData).length > 0) {
            console.log('💾 SUBSTITUINDO orçamento na tabela budget_documents (UPDATE, não INSERT):', updateData);
              const { error: updateBudgetError } = await supabase
                .from('budget_documents')
              .update(updateData) // UPDATE sempre substitui, nunca soma
              .eq('id', budgetDocs[0].id); // Atualizar apenas o registro específico

              if (updateBudgetError) {
                console.error('❌ ERRO ao atualizar orçamento na tabela budget_documents:', updateBudgetError);
                throw new Error(`Erro ao atualizar valor do orçamento: ${updateBudgetError.message}`);
              }

              // ⚠️ VALIDAÇÃO CRÍTICA: Verificar se o orçamento foi realmente atualizado no banco
              const { data: verifyBudget, error: verifyBudgetError } = await supabase
                .from('budget_documents')
                .select('id, amount, description')
                .eq('id', budgetDocs[0].id)
                .single();

              if (verifyBudgetError || !verifyBudget) {
                console.error('❌ ERRO: Orçamento não foi encontrado após atualização!', verifyBudgetError);
                throw new Error('Erro ao verificar orçamento no banco. A atualização pode não ter sido salva.');
              }

              // Verificar se o valor foi realmente atualizado
              if (updateData.amount !== undefined) {
                const savedAmount = parseFloat(verifyBudget.amount?.toString() || '0');
                const expectedAmount = parseFloat(updateData.amount.toString());
                if (Math.abs(savedAmount - expectedAmount) > 0.01) {
                  console.error('❌ ERRO: Valor do orçamento não foi salvo corretamente!', {
                    esperado: expectedAmount,
                    salvo: savedAmount
                  });
                  throw new Error(`Valor do orçamento não foi salvo corretamente. Esperado: R$ ${expectedAmount.toFixed(2)}, Salvo: R$ ${savedAmount.toFixed(2)}`);
                }
              }

              console.log('✅ Orçamento atualizado e verificado no banco:', {
                id: verifyBudget.id,
                amount: verifyBudget.amount,
                description: verifyBudget.description
              });
              
              // Se o orçamento está vendido e ainda não atualizamos a venda, atualizar via sale_id
              // IMPORTANTE: Sempre UPDATE (substituição), nunca INSERT (criação de duplicata)
              if (!saleUpdated && budgetDocs[0].status === 'vendido' && budgetDocs[0].sale_id) {
                try {
                  const saleUpdateData: any = {};
                  if (formData.budget_amount !== undefined && formData.budget_amount !== null && formData.budget_amount !== '') {
                    const newAmount = parseFloat(formData.budget_amount);
                    if (!isNaN(newAmount)) {
                      // SUBSTITUIR o valor existente pelo novo valor
                      saleUpdateData.amount = newAmount;
                      console.log(`🔄 SUBSTITUINDO valor da venda via sale_id: → ${newAmount}`);
                    }
                  }
                  if (formData.budget_description !== undefined) {
                    saleUpdateData.budget_description = formData.budget_description || '';
                  }

                  if (Object.keys(saleUpdateData).length > 0) {
                    console.log('💾 SUBSTITUINDO venda na tabela sales via sale_id (UPDATE, não INSERT):', saleUpdateData);
                    // IMPORTANTE: Usar UPDATE com .eq() para garantir que atualiza apenas o registro existente
                    // Nunca usar INSERT aqui para evitar duplicatas
                    const { error: saleUpdateError } = await supabase
                      .from('sales')
                      .update(saleUpdateData) // UPDATE sempre substitui, nunca soma
                      .eq('id', budgetDocs[0].sale_id); // Atualizar apenas o registro específico

                    if (saleUpdateError) {
                      console.error('❌ ERRO ao atualizar venda na tabela sales:', saleUpdateError);
                      throw new Error(`Erro ao atualizar valor da venda: ${saleUpdateError.message}`);
                    }

                    // ⚠️ VALIDAÇÃO CRÍTICA: Verificar se a venda foi realmente atualizada no banco
                    const { data: verifySale, error: verifySaleError } = await supabase
                      .from('sales')
                      .select('id, amount, budget_description')
                      .eq('id', budgetDocs[0].sale_id)
                      .single();

                    if (verifySaleError || !verifySale) {
                      console.error('❌ ERRO: Venda não foi encontrada após atualização!', verifySaleError);
                      throw new Error('Erro ao verificar venda no banco. A atualização pode não ter sido salva.');
                    }

                    // Verificar se o valor foi realmente atualizado
                    if (saleUpdateData.amount !== undefined) {
                      const savedAmount = parseFloat(verifySale.amount?.toString() || '0');
                      const expectedAmount = parseFloat(saleUpdateData.amount.toString());
                      if (Math.abs(savedAmount - expectedAmount) > 0.01) {
                        console.error('❌ ERRO: Valor da venda não foi salvo corretamente!', {
                          esperado: expectedAmount,
                          salvo: savedAmount
                        });
                        throw new Error(`Valor da venda não foi salvo corretamente. Esperado: R$ ${expectedAmount.toFixed(2)}, Salvo: R$ ${savedAmount.toFixed(2)}`);
                      }
                    }

                    console.log('✅ Venda atualizada e verificada no banco (via sale_id):', {
                      id: verifySale.id,
                      amount: verifySale.amount,
                      budget_description: verifySale.budget_description
                    });
                    saleUpdated = true;
                  }
                } catch (saleUpdateError: any) {
                  console.error('❌ ERRO ao atualizar venda na tabela sales:', saleUpdateError);
                  // Se é um erro que lançamos (throw), propagar
                  if (saleUpdateError instanceof Error && saleUpdateError.message.includes('Erro ao')) {
                    throw saleUpdateError;
                  }
                  // Caso contrário, lançar erro genérico
                  throw new Error(`Erro ao atualizar venda: ${saleUpdateError?.message || 'Erro desconhecido'}`);
                }
              }
            }
          } else if (budgetError) {
            console.error('❌ ERRO ao buscar orçamento para atualização:', budgetError);
            // Se estava tentando atualizar um valor mas não encontrou orçamento, avisar
            if (formData.budget_amount && formData.budget_amount.trim() !== '') {
              throw new Error(`Erro ao buscar orçamento para atualizar valor: ${budgetError.message}`);
            }
          }
        } catch (budgetUpdateError: any) {
        console.error('❌ ERRO ao atualizar orçamento na tabela budget_documents:', budgetUpdateError);
        // Se é um erro que lançamos (throw), propagar
        if (budgetUpdateError instanceof Error && budgetUpdateError.message.includes('Erro ao')) {
          throw budgetUpdateError;
        }
        // Caso contrário, lançar erro genérico
        throw new Error(`Erro ao atualizar orçamento: ${budgetUpdateError?.message || 'Erro desconhecido'}`);
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

      // ⚠️ Só mostrar sucesso e atualizar frontend se TUDO foi salvo corretamente
      toast.success('Lead atualizado com sucesso!', {
        description: 'Todos os dados foram salvos e verificados no banco de dados.',
        duration: 5000
      });
      
      clearPersistedData(); // Limpar dados persistidos após sucesso
      setUserIntentionallyClosed(true); // Marcar como fechamento intencional
      setInternalOpen(false);
      
      // Atualizar frontend chamando onSuccess (isso recarrega a lista de leads)
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ ERRO ao atualizar lead:', error);
      
      // Mensagem de erro detalhada
      const errorMessage = error?.message || 'Erro desconhecido ao atualizar lead';
      toast.error('Erro ao atualizar lead', {
        description: errorMessage,
        duration: 8000
      });
      
      // NÃO atualizar frontend se houver erro
      // NÃO fechar dialog se houver erro
      // Deixar o usuário tentar novamente
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
        className="max-w-5xl w-[95vw] max-h-[95vh] overflow-y-auto [&>button]:hidden"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-900 dark:text-white font-medium">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-900 dark:text-white font-medium">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-900 dark:text-white font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source" className="text-slate-900 dark:text-white font-medium">Origem *</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="carteirizado">Carteirizado</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage" className="text-slate-900 dark:text-white font-medium">Estágio</Label>
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
              <Label htmlFor="budget_amount" className="text-slate-900 dark:text-white font-medium">Valor do Orçamento (R$)</Label>
              <Input
                id="budget_amount"
                type="number"
                step="0.01"
                value={formData.budget_amount || ''}
                onChange={(e) => {
                  console.log('✏️ Valor alterado pelo usuário:', e.target.value);
                  setFormData({ ...formData, budget_amount: e.target.value });
                }}
                placeholder="0,00"
              />
              {formData.budget_amount && (
                <p className="text-xs text-muted-foreground">
                  Valor atual: {formData.budget_amount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_number" className="text-slate-900 dark:text-white font-medium">Número do Pedido</Label>
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
            <Label htmlFor="budget_description" className="text-slate-900 dark:text-white font-medium">Descrição do Orçamento</Label>
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
            <Label htmlFor="notes" className="text-slate-900 dark:text-white font-medium">Notas</Label>
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
