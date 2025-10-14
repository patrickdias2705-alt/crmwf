import { Button } from '@/components/ui/button';
import { CheckCircle2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

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

  // Verificar se já foi vendido ao montar o componente
  useEffect(() => {
    const checkIfSold = async () => {
      const { data } = await supabase
        .from('sales')
        .select('id')
        .eq('lead_id', leadId)
        .single();
      
      if (data) {
        setIsSold(true);
      }
    };
    
    checkIfSold();
  }, [leadId]);

  const handleMarkAsSold = async () => {
    if (isSold) return; // Não fazer nada se já vendido

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

      // Criar registro de venda na tabela dedicada
      const saleData = {
        tenant_id: user?.tenant_id,
        lead_id: leadId,
        amount: budgetAmount,
        stage_id: closedStageId,
        stage_name: stages?.[0]?.name,
        sold_by: user?.id,
        sold_by_name: user?.email || 'Usuário',
        budget_description: 'Venda realizada via botão',
        budget_file_name: 'Orçamento enviado'
      };

      console.log('💾 Criando registro de venda:', saleData);

      // Tentar inserir na tabela sales, se der erro de RLS, usar fallback
      let saleCreated = false;
      
      try {
        const { error: saleError } = await supabase
          .from('sales')
          .insert(saleData);

        if (saleError) {
          console.log('⚠️ Erro na tabela sales (possível RLS), usando fallback:', saleError.message);
          saleCreated = false;
        } else {
          console.log('✅ Registro de venda criado na tabela sales');
          saleCreated = true;
        }
      } catch (error) {
        console.log('⚠️ Erro ao inserir na tabela sales, usando fallback:', error);
        saleCreated = false;
      }

      // Se não conseguiu criar na tabela sales, usar fallback no fields do lead
      if (!saleCreated) {
        console.log('🔄 Usando fallback: marcando venda no fields do lead');
        
        // Buscar dados atuais do lead primeiro
        const { data: currentLead } = await supabase
          .from('leads')
          .select('fields')
          .eq('id', leadId)
          .single();

        const { error: fallbackError } = await supabase
          .from('leads')
          .update({
            fields: {
              ...currentLead?.fields,
              sold: true,
              sold_amount: budgetAmount,
              sold_at: new Date().toISOString(),
              sold_by: user?.email || 'Usuário'
            }
          })
          .eq('id', leadId);

        if (fallbackError) {
          console.error('❌ Erro no fallback:', fallbackError);
          toast.error('Erro ao registrar venda: ' + fallbackError.message);
          return;
        }
        
        console.log('✅ Venda registrada via fallback no fields do lead');
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

      setIsSold(true); // Marcar como vendido no estado

      toast.success(`🎉 ${leadName} marcado como VENDIDO!`, {
        description: budgetAmount 
          ? `Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetAmount)}`
          : undefined,
        duration: 5000,
      });
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Error marking as sold:', error);
      toast.error('Erro ao marcar como vendido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar botão diferente se já foi vendido
  if (isSold) {
    return (
      <Button 
        size="sm" 
        variant="default"
        disabled
        className="bg-gradient-to-r from-green-700 to-emerald-700 text-white font-bold shadow-lg cursor-not-allowed opacity-100 border-2 border-green-500"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        ✅ VENDIDO
      </Button>
    );
  }

  return (
    <Button 
      size="sm" 
      variant="default"
      onClick={handleMarkAsSold}
      disabled={loading}
      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
    >
      <DollarSign className="h-4 w-4 mr-2" />
      {loading ? 'Processando...' : 'Marcar como Vendido'}
    </Button>
  );
}

