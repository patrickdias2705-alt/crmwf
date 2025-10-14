import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface LeadExportData {
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  estagio: string;
  vendido: string;
  valorOrcamento: string;
  descricaoOrcamento: string;
  roi: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export async function exportLeadsToExcel(tenantId: string) {
  try {
    // Buscar leads com informações completas
    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        id,
        name,
        phone,
        email,
        source,
        created_at,
        updated_at,
        stages (
          name
        ),
        budgets (
          value,
          description,
          roi
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Formatar dados para o Excel
    const formattedData: LeadExportData[] = leads.map(lead => {
      const stage = (lead.stages as any)?.name || 'Sem estágio';
      const isWon = stage.match(/fechado|vendido|ganho/i) ? 'SIM' : 'NÃO';
      
      // Pegar primeiro orçamento (ou criar objeto vazio)
      const budget = Array.isArray(lead.budgets) && lead.budgets.length > 0 
        ? lead.budgets[0] 
        : null;

      return {
        nome: lead.name,
        telefone: lead.phone || 'N/A',
        email: lead.email || 'N/A',
        origem: lead.source || 'Manual',
        estagio: stage,
        vendido: isWon,
        valorOrcamento: budget?.value 
          ? `R$ ${Number(budget.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
          : 'N/A',
        descricaoOrcamento: budget?.description || 'N/A',
        roi: budget?.roi ? `${budget.roi}%` : 'N/A',
        dataCriacao: new Date(lead.created_at).toLocaleDateString('pt-BR'),
        dataAtualizacao: lead.updated_at 
          ? new Date(lead.updated_at).toLocaleDateString('pt-BR')
          : 'N/A'
      };
    });

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Criar worksheet com todos os leads
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Configurar largura das colunas
    const wscols = [
      { wch: 25 }, // nome
      { wch: 15 }, // telefone
      { wch: 30 }, // email
      { wch: 15 }, // origem
      { wch: 20 }, // estagio
      { wch: 10 }, // vendido
      { wch: 18 }, // valorOrcamento
      { wch: 40 }, // descricaoOrcamento
      { wch: 10 }, // roi
      { wch: 15 }, // dataCriacao
      { wch: 15 }  // dataAtualizacao
    ];
    ws['!cols'] = wscols;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Todos os Leads');

    // Criar aba com apenas leads vendidos
    const soldLeads = formattedData.filter(lead => lead.vendido === 'SIM');
    if (soldLeads.length > 0) {
      const wsSold = XLSX.utils.json_to_sheet(soldLeads);
      wsSold['!cols'] = wscols;
      XLSX.utils.book_append_sheet(wb, wsSold, 'Leads Vendidos');
    }

    // Criar aba com leads ativos (não vendidos)
    const activeLeads = formattedData.filter(lead => lead.vendido === 'NÃO');
    if (activeLeads.length > 0) {
      const wsActive = XLSX.utils.json_to_sheet(activeLeads);
      wsActive['!cols'] = wscols;
      XLSX.utils.book_append_sheet(wb, wsActive, 'Leads Ativos');
    }

    // Criar aba de resumo financeiro
    const totalBudgets = formattedData.filter(l => l.valorOrcamento !== 'N/A').length;
    const totalRevenue = formattedData
      .filter(l => l.vendido === 'SIM' && l.valorOrcamento !== 'N/A')
      .reduce((sum, l) => {
        const value = parseFloat(l.valorOrcamento.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
        return sum + value;
      }, 0);

    const summary = [
      { metrica: 'Total de Leads', valor: formattedData.length },
      { metrica: 'Leads Vendidos', valor: soldLeads.length },
      { metrica: 'Leads Ativos', valor: activeLeads.length },
      { metrica: 'Total de Orçamentos', valor: totalBudgets },
      { metrica: 'Receita Total', valor: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { metrica: 'Taxa de Conversão', valor: `${((soldLeads.length / formattedData.length) * 100).toFixed(2)}%` },
      { metrica: 'Ticket Médio', valor: soldLeads.length > 0 ? `R$ ${(totalRevenue / soldLeads.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A' }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summary);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Financeiro');

    // Gerar arquivo e fazer download
    const fileName = `leads-relatorio-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar leads:', error);
    return { success: false, error };
  }
}
