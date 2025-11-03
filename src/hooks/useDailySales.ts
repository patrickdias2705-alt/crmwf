import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useDailySales() {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchDailySales() {
    try {
      if (!user?.tenant_id) {
        console.log('❌ useDailySales: Sem tenant_id');
        setTotal(0);
        setLoading(false);
        return;
      }

      // Buscar vendas do dia atual (desde a meia-noite de hoje)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Começa na meia-noite de hoje

      console.log('🔍 useDailySales: Buscando vendas de hoje desde', today.toISOString());
      console.log('🔍 useDailySales: Tenant ID:', user.tenant_id);

      // Buscar vendas usando created_at como referência principal
      const { data, error } = await supabase
        .from('sales')
        .select('amount, created_at, sold_at')
        .eq('tenant_id', user.tenant_id)
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('❌ Erro ao buscar vendas diárias:', error);
        setTotal(0);
      } else {
        console.log('✅ useDailySales: Vendas encontradas:', data);
        const sum = data.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        console.log('💰 useDailySales: Total calculado:', sum);
        setTotal(sum);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar vendas diárias:', error);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDailySales();
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(fetchDailySales, 60000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenant_id]);

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase
      .channel('daily-sales-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        () => {
          fetchDailySales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenant_id]);

  return { total, loading };
}

