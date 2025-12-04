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

      // ⚠️ ORDEM CRÍTICA: Criar venda PRIMEIRO, depois mover lead
      // Isso garante que se a venda falhar, o lead não fica como "vendido" sem registro
      
      // Criar registro de venda na tabela dedicada ANTES de mover o lead
      // IMPORTANTE: Copiar dados do orçamento para sales antes de apagar
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

      console.log('💾 Criando registro de venda PRIMEIRO (antes de mover lead):', saleData);
      console.log('📊 Tenant ID:', user?.tenant_id, '| User ID:', user?.id);

      // ⚠️ VALIDAÇÕES CRÍTICAS ANTES DE CRIAR VENDA
      if (!user?.id) {
        console.error('❌ ERRO: User ID não encontrado');
        toast.error('Erro: Usuário não identificado. Faça login novamente.');
        return;
      }

      if (!user?.tenant_id) {
        console.error('❌ ERRO: Tenant ID não encontrado');
        toast.error('Erro: Tenant não identificado. Contate o suporte.');
        return;
      }

      // Verificar se o tenant_id é válido (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user.tenant_id)) {
        console.error('❌ ERRO: Tenant ID inválido:', user.tenant_id);
        toast.error('Erro: Tenant ID inválido. Contate o suporte.');
        return;
      }

      // Tentar inserir na tabela sales PRIMEIRO
      let saleCreated = false;
      let saleId: string | null = null;
      let saleError: any = null;
      
      try {
        console.log('🔍 Tentando inserir venda na tabela sales...');
        console.log('📋 Dados da venda:', JSON.stringify(saleData, null, 2));
        
        const { data: insertedSale, error: error } = await supabase
          .from('sales')
          .insert(saleData)
          .select('id')
          .single();

        saleError = error;

        if (saleError) {
          console.error('❌ ERRO CRÍTICO na tabela sales:', saleError);
          console.error('❌ Detalhes do erro:', {
            code: saleError.code,
            message: saleError.message,
            details: saleError.details,
            hint: saleError.hint,
            tenant_id: user?.tenant_id,
            user_id: user?.id,
            saleData: saleData
          });
          
          // Verificar se é erro de RLS
          if (saleError.code === '42501' || saleError.message?.includes('permission') || saleError.message?.includes('policy')) {
            console.error('❌ ERRO DE PERMISSÃO (RLS): A política RLS está bloqueando a inserção');
            toast.error('Erro de permissão: Verifique as políticas RLS da tabela sales. Contate o suporte.');
          } else {
            toast.error('Erro ao criar venda: ' + saleError.message);
          }
          
          // NÃO mover o lead se a venda falhar
          return;
        } else {
          console.log('✅ Registro de venda criado na tabela sales:', insertedSale);
          saleCreated = true;
          saleId = insertedSale?.id || null;
          
          // Verificar se realmente foi criado (validação extra)
          if (!saleId) {
            console.error('❌ ERRO: Venda criada mas sem ID retornado');
            console.error('❌ Dados retornados:', insertedSale);
            toast.error('Erro ao registrar venda. Tente novamente.');
            return;
          }

          // ⚠️ VALIDAÇÃO EXTRA: Verificar se a venda realmente existe no banco
          const { data: verifySale, error: verifyError } = await supabase
            .from('sales')
            .select('id, amount, tenant_id')
            .eq('id', saleId)
            .single();

          if (verifyError || !verifySale) {
            console.error('❌ ERRO CRÍTICO: Venda criada mas não encontrada no banco!');
            console.error('❌ Erro de verificação:', verifyError);
            console.error('❌ Sale ID:', saleId);
            toast.error('Erro: Venda criada mas não verificada. Contate o suporte.');
            saleCreated = false;
            saleId = null;
            return;
          }

          // Verificar se o tenant_id está correto
          if (verifySale.tenant_id !== user.tenant_id) {
            console.error('❌ ERRO CRÍTICO: Tenant ID da venda não corresponde ao usuário!');
            console.error('❌ Tenant ID da venda:', verifySale.tenant_id);
            console.error('❌ Tenant ID do usuário:', user.tenant_id);
            // Deletar a venda incorreta
            await supabase.from('sales').delete().eq('id', saleId);
            toast.error('Erro: Inconsistência de dados. Contate o suporte.');
            saleCreated = false;
            saleId = null;
            return;
          }

          console.log('✅ Venda verificada no banco de dados:', verifySale);
        }
      } catch (error: any) {
        console.error('❌ Erro ao inserir na tabela sales:', error);
        console.error('❌ Stack trace:', error?.stack);
        console.error('❌ Tipo do erro:', error?.constructor?.name);
        toast.error('Erro ao criar venda: ' + (error?.message || 'Erro desconhecido'));
        // NÃO mover o lead se a venda falhar
        return;
      }

      // Se não conseguiu criar a venda, não continuar (NÃO mover lead)
      if (!saleCreated || !saleId) {
        console.error('❌ Não foi possível criar a venda. Abortando operação.');
        console.error('❌ Estado final:', { saleCreated, saleId, saleError });
        toast.error('Erro ao registrar venda. O lead não foi movido. Tente novamente.');
        return;
      }

      console.log('✅ Venda criada com sucesso. Agora movendo lead para estágio:', stages?.[0]?.name);

      // SÓ AGORA mover lead para stage fechado (após venda criada com sucesso)
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          stage_id: closedStageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        console.error('❌ ERRO CRÍTICO: Venda criada mas não foi possível mover lead:', updateError);
        console.error('❌ Detalhes do erro:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          leadId: leadId,
          saleId: saleId
        });
        
        // Reverter a venda se não conseguir mover o lead
        const { error: deleteError } = await supabase
          .from('sales')
          .delete()
          .eq('id', saleId);
        
        if (deleteError) {
          console.error('❌ ERRO CRÍTICO: Não foi possível reverter a venda!', deleteError);
          console.error('❌ A venda foi criada mas o lead não foi movido. Sale ID:', saleId);
          toast.error('Erro crítico: Venda criada mas lead não movido. Contate o suporte imediatamente.');
        } else {
          console.log('✅ Venda revertida com sucesso');
          toast.error('Erro ao atualizar lead. A venda foi revertida. Tente novamente.');
        }
        return;
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
          
          // IMPORTANTE: Após passar para sales, APAGAR o orçamento da tabela budget_documents
      // Mas só apagar se a venda foi criada com sucesso E o lead foi movido
          if (latestDocument?.id && saleId) {
            console.log('🗑️ Apagando orçamento da tabela budget_documents (dados já estão em sales)...');
            const { error: deleteBudgetError } = await supabase
              .from('budget_documents')
              .delete()
              .eq('id', latestDocument.id);
            
            if (deleteBudgetError) {
          console.error('⚠️ Aviso: Não foi possível apagar o orçamento:', deleteBudgetError);
          // Não reverter a venda aqui, pois ela já foi criada e o lead já foi movido
          // Apenas logar o erro
            } else {
              console.log('✅ Orçamento apagado da tabela budget_documents (dados preservados em sales)');
      }
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

