import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { DollarSign, TrendingUp, Calendar, User } from 'lucide-react';

interface SalesSummaryProps {
  period?: number; // days back
}

interface Sale {
  id: string;
  amount: number;
  sold_at: string;
  sold_by_name: string;
  lead_id: string;
  stage_name: string;
}

export function SalesSummary({ period = 30 }: SalesSummaryProps) {
  const { user } = useAuth();
  const { valuesVisible } = useValuesVisibility();
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchSales();
    }
  }, [user?.tenant_id, period]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      
      let salesData: Sale[] = [];
      
      try {
        // Primeiro tenta buscar da tabela sales
        const { data, error } = await supabase
          .from('sales')
          .select('id, amount, sold_at, sold_by_name, lead_id, stage_name')
          .eq('tenant_id', '8bd69047-7533-42f3-a2f7-e3a60477f68c')
          .gte('sold_at', new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString())
          .order('sold_at', { ascending: false });

        if (error) throw error;
        salesData = data || [];
        
        console.log('💰 SalesSummary - Dados da tabela sales:', salesData.length, 'vendas');
        
      } catch (error) {
        console.log('⚠️ Tabela sales não acessível, usando fallback do fields:', error);
      }

      // Se não há dados na tabela sales, usar fallback dos fields
      if (salesData.length === 0) {
        try {
          // Fallback: buscar vendas do fields dos leads
          const { data: leadsData } = await supabase
            .from('leads')
            .select('id, fields, updated_at')
            .eq('tenant_id', '8bd69047-7533-42f3-a2f7-e3a60477f68c')
            .not('fields->sold', 'is', null)
            .eq('fields->sold', true);

          if (leadsData) {
            const cutoffDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();
            
            salesData = leadsData
              .filter(lead => {
                const soldAmount = Number(lead.fields?.sold_amount || 0);
                const soldAt = lead.fields?.sold_at || lead.updated_at;
                return soldAmount > 0 && soldAt >= cutoffDate;
              })
              .map(lead => ({
                id: lead.id,
                amount: Number(lead.fields?.sold_amount || 0),
                sold_at: lead.fields?.sold_at || lead.updated_at,
                sold_by_name: lead.fields?.sold_by || 'Usuário',
                lead_id: lead.id,
                stage_name: 'Vendido'
              }))
              .sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime());
              
            console.log('💰 SalesSummary - Dados do fallback (fields):', salesData.length, 'vendas');
          }
        } catch (error) {
          console.error('Erro ao buscar vendas do fallback:', error);
        }
      }

      setSales(salesData);
      
      // Calcular totais
      const total = salesData.reduce((sum, sale) => sum + sale.amount, 0);
      const avg = salesData.length > 0 ? total / salesData.length : 0;
      
      setTotalSales(total);
      setAvgTicket(avg);
      
      console.log('💰 SalesSummary - Totais calculados:', { total, avg, count: salesData.length });
      
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Resumo de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          Resumo de Vendas ({period} dias)
        </CardTitle>
        <CardDescription>
          Vendas realizadas nos últimos {period} dias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">
              {valuesVisible ? `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
            </div>
            <div className="text-sm text-emerald-600">Total Vendido</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {valuesVisible ? `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
            </div>
            <div className="text-sm text-blue-600">Ticket Médio</div>
          </div>
        </div>

        {/* Lista de vendas recentes */}
        {sales.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-600">Vendas Recentes:</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sales.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">💰</div>
                    <div>
                      <div className="font-medium text-sm">
                        {valuesVisible ? new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(sale.amount) : '••••'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {sale.sold_by_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(sale.sold_at).toLocaleDateString('pt-BR')}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {sale.stage_name}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Nenhuma venda nos últimos {period} dias
          </div>
        )}
      </CardContent>
    </Card>
  );
}
