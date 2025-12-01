import { Button } from '@/components/ui/button';
import { CheckCircle2, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { BudgetDocumentUpload } from '@/components/BudgetDocumentUpload';

interface MarkAsSoldButtonProps {
  leadId: string;
  leadName: string;
  budgetAmount?: number;
  onSuccess?: () => void;
}

export function MarkAsSoldButton({ 
  leadId, 
  leadName, 
  budgetAmount,
  onSuccess 
}: MarkAsSoldButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSold, setIsSold] = useState(false);
  const [showRepurchaseDialog, setShowRepurchaseDialog] = useState(false);

  // Função para verificar status do lead
  const checkStatus = async () => {
    // Verificar se tem venda
    const { data: sales } = await supabase
      .from('sales')
      .select('id')
      .eq('lead_id', leadId)
      .limit(1);
    
    const hasSale = sales && sales.length > 0;
    
    // Se tem venda, verificar se tem orçamento em aberto
    if (hasSale) {
      const { data: budgetDocs } = await supabase
        .from('budget_documents')
        .select('id')
        .eq('lead_id', leadId)
        .eq('status', 'aberto')
        .limit(1);
      
      // Se tem orçamento em aberto, mostrar "Marcar como Vendido" (não é mais recompra pendente)
      // Se não tem orçamento, mostrar "Nova Recompra"
      setIsSold(hasSale && (!budgetDocs || budgetDocs.length === 0));
    } else {
      setIsSold(false);
    }
  };

  // Verificar status ao montar e quando leadId muda
  useEffect(() => {
    if (leadId) {
      checkStatus();
    }
  }, [leadId]);

  const handleMarkAsSold = async () => {
    // Permitir múltiplas vendas (recompra), então não bloqueamos aqui

    try {
      setLoading(true);
      console.log('🎯 Iniciando processo de marcar como vendido...');
      console.log('📊 Dados:', { leadId, leadName, budgetAmount, tenant_id: user?.tenant_id });

      if (!user?.tenant_id) {
        toast.error('Erro: Tenant ID não encontrado');
        return;
      }

      if (!budgetAmount || budgetAmount <= 0) {
        toast.error('Erro: Valor do orçamento inválido. É necessário enviar um orçamento primeiro.');
        return;
      }

      // Buscar orçamento mais recente da tabela budget_documents (status = 'aberto')
      const { data: budgetDocs, error: budgetError } = await supabase
        .from('budget_documents')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'aberto')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let latestDocument: any = null;
      
      if (budgetDocs && !budgetError) {
        // Usar orçamento da tabela budget_documents
        latestDocument = {
          file_name: budgetDocs.file_name,
          description: budgetDocs.description || '',
          amount: budgetDocs.amount || budgetAmount,
          id: budgetDocs.id
        };
        console.log('✅ Orçamento encontrado na tabela budget_documents:', latestDocument);
      } else {
        // Fallback: buscar dos fields do lead (compatibilidade)
        console.log('⚠️ Orçamento não encontrado na tabela, buscando dos fields...');
        const { data: leadData } = await supabase
          .from('leads')
          .select('fields')
          .eq('id', leadId)
          .single();

        const fields = leadData?.fields || {};
        
        if (fields.budget_documents && Array.isArray(fields.budget_documents) && fields.budget_documents.length > 0) {
          const sortedDocs = [...fields.budget_documents].sort((a: any, b: any) => 
            new Date(b.uploaded_at || b.created_at || 0).getTime() - 
            new Date(a.uploaded_at || a.created_at || 0).getTime()
          );
          latestDocument = sortedDocs[0];
        } else if (fields.budget_file_name) {
          latestDocument = {
            file_name: fields.budget_file_name,
            description: fields.budget_description || '',
            amount: fields.budget_amount || budgetAmount
          };
        }
      }

      // Verificar se o lead já foi vendido anteriormente (recompra)
      const { data: previousSales, error: salesCheckError } = await supabase
        .from('sales')
        .select('id, sold_at')
        .eq('lead_id', leadId)
        .order('sold_at', { ascending: false });

      const isRepurchase = previousSales && previousSales.length > 0;
      
      if (isRepurchase) {
        console.log('🔄 Detectada recompra! Lead já foi vendido anteriormente.');
        console.log('📄 Documento da recompra:', latestDocument);
      }

      // Buscar stage "Fechado" ou similar
      const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('id, name')
        .eq('tenant_id', user?.tenant_id)
        .or('name.ilike.%fechado%,name.ilike.%vendido%,name.ilike.%ganho%,name.ilike.%bolso%');

      if (stagesError) {
        console.error('Erro ao buscar stages:', stagesError);
        toast.error('Erro ao buscar estágios: ' + stagesError.message);
        return;
      }

      let closedStageId = stages?.[0]?.id;

      if (!closedStageId) {
        toast.error('Estágio de fechamento não encontrado. Crie um stage "Fechado" ou "Vendido".');
        return;
      }

      console.log('🎯 Movendo lead para estágio:', stages?.[0]?.name);

      // Mover lead para stage fechado
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          stage_id: closedStageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        console.error('Erro ao atualizar lead:', updateError);
        throw updateError;
      }

      console.log('✅ Lead movido para estágio fechado');

      // Se for recompra, atualizar origem para "carteirizado"
      if (isRepurchase) {
        const { error: originUpdateError } = await supabase
          .from('leads')
          .update({ 
            origin: 'carteirizado',
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);

        if (originUpdateError) {
          console.error('⚠️ Erro ao atualizar origem para carteirizado:', originUpdateError);
        } else {
          console.log('✅ Origem atualizada para "carteirizado" devido à recompra');
        }
      }

      // Criar registro de venda na tabela dedicada
      // IMPORTANTE: Copiar dados do orçamento para sales antes de apagar
      // A tabela sales só tem: budget_description e budget_file_name
      const saleData = {
        tenant_id: user?.tenant_id,
        lead_id: leadId,
        amount: budgetAmount, // Valor do documento mais recente
        stage_id: closedStageId,
        stage_name: stages?.[0]?.name,
        sold_by: user?.id,
        sold_by_name: user?.email || 'Usuário',
        budget_description: latestDocument?.description || 'Venda realizada via botão',
        budget_file_name: latestDocument?.file_name || 'Orçamento enviado'
      };

      console.log('💾 Criando registro de venda:', saleData);

      // Tentar inserir na tabela sales
      let saleCreated = false;
      let saleId: string | null = null;
      
      try {
        const { data: insertedSale, error: saleError } = await supabase
          .from('sales')
          .insert(saleData)
          .select('id')
          .single();

        if (saleError) {
          console.error('❌ Erro na tabela sales:', saleError);
          toast.error('Erro ao criar venda: ' + saleError.message);
          return;
        } else {
          console.log('✅ Registro de venda criado na tabela sales:', insertedSale);
          saleCreated = true;
          saleId = insertedSale?.id || null;
          
          // IMPORTANTE: Após passar para sales, APAGAR o orçamento da tabela budget_documents
          // Mas só apagar se a venda foi criada com sucesso
          if (latestDocument?.id && saleId) {
            console.log('🗑️ Apagando orçamento da tabela budget_documents (dados já estão em sales)...');
            const { error: deleteBudgetError } = await supabase
              .from('budget_documents')
              .delete()
              .eq('id', latestDocument.id);
            
            if (deleteBudgetError) {
              console.error('❌ ERRO CRÍTICO: Não foi possível apagar o orçamento:', deleteBudgetError);
              // Se não conseguiu apagar, reverter a venda para manter consistência
              await supabase
                .from('sales')
                .delete()
                .eq('id', saleId);
              
              toast.error('Erro ao processar venda. Tente novamente.');
              return;
            } else {
              console.log('✅ Orçamento apagado da tabela budget_documents (dados preservados em sales)');
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Erro ao inserir na tabela sales:', error);
        toast.error('Erro ao criar venda: ' + (error?.message || 'Erro desconhecido'));
        return;
      }

      // Se não conseguiu criar a venda, não continuar
      if (!saleCreated) {
        console.error('❌ Não foi possível criar a venda');
        toast.error('Erro ao registrar venda. Tente novamente.');
        return;
      }

      // Criar evento de venda
      await supabase
        .from('lead_events')
        .insert({
          tenant_id: user?.tenant_id,
          lead_id: leadId,
          type: 'sale.closed',
          actor: user?.email || 'system',
          data: { 
            lead_name: leadName,
            amount: budgetAmount,
            closed_by: user?.name || user?.email,
            closed_at: new Date().toISOString()
          }
        });

      // Não marcar como vendido permanentemente para permitir recompra
      // setIsSold(true); removido para permitir múltiplas vendas

      const successMessage = isRepurchase 
        ? `🔄 ${leadName} - RECOMPRA registrada! Lead agora é carteirizado.`
        : `🎉 ${leadName} marcado como VENDIDO!`;

      toast.success(successMessage, {
        description: budgetAmount 
          ? `Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetAmount)}`
          : undefined,
        duration: 5000,
      });
      
      // Atualizar estado para mostrar botão de recompra
      setIsSold(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error marking as sold:', error);
      toast.error('Erro ao marcar como vendido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Se já foi vendido, mostrar botão de recompra
  if (isSold) {
    return (
      <>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setShowRepurchaseDialog(true)}
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Nova Recompra
        </Button>
        
        <BudgetDocumentUpload
          leadId={leadId}
          leadName={leadName}
          isRepurchase={true}
          open={showRepurchaseDialog}
          onOpenChange={setShowRepurchaseDialog}
          onDocumentUploaded={async () => {
            setShowRepurchaseDialog(false);
            // Recarregar status completo (vendas + orçamentos)
            await checkStatus();
            onSuccess?.();
          }}
        />
      </>
    );
  }

  // Se não foi vendido ainda, mostrar botão "Marcar como Vendido"
  return (
    <Button 
      size="sm" 
      variant="default"
      onClick={handleMarkAsSold}
      disabled={loading || !budgetAmount}
      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
    >
      <DollarSign className="h-4 w-4 mr-2" />
      {loading ? 'Processando...' : 'Marcar como Vendido'}
    </Button>
  );
}

