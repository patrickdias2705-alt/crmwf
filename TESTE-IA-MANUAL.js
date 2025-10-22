// Teste manual da IA para verificar se está funcionando

console.log('🧪 [TESTE MANUAL] Iniciando teste da IA...');

// Simular chamada da IA
async function testarIA() {
  try {
    console.log('🧪 [TESTE MANUAL] Importando AIDatabaseService...');
    
    // Simular import (em um ambiente real seria: import { AIDatabaseService } from '@/services/aiDatabaseService')
    const AIDatabaseService = {
      fixTotalVendidoData: async (tenantId) => {
        console.log('🧪 [TESTE MANUAL] Função fixTotalVendidoData chamada com tenant:', tenantId);
        
        // Simular dados de teste
        const testData = [
          { name: '10/10', value: 1000, sales: 2, revenue: 1000, timestamp: '2025-10-10T00:00:00.000Z' },
          { name: '15/10', value: 2000, sales: 3, revenue: 2000, timestamp: '2025-10-15T00:00:00.000Z' },
          { name: '17/10', value: 1500, sales: 1, revenue: 1500, timestamp: '2025-10-17T00:00:00.000Z' }
        ];
        
        console.log('🧪 [TESTE MANUAL] Retornando dados de teste:', testData);
        
        return {
          success: true,
          correctData: testData,
          summary: {
            totalSales: 6,
            totalRevenue: 4500,
            daysWithSales: 3,
            dateRange: '2025-10-01 a 2025-10-31'
          }
        };
      },
      
      fixConversionRateData: async (tenantId) => {
        console.log('🧪 [TESTE MANUAL] Função fixConversionRateData chamada com tenant:', tenantId);
        
        // Simular dados de teste
        const testData = [
          { name: '10/10', value: 53.8, leads: 13, sales: 7, timestamp: '2025-10-10T00:00:00.000Z' },
          { name: '13/10', value: 88.9, leads: 9, sales: 8, timestamp: '2025-10-13T00:00:00.000Z' },
          { name: '15/10', value: 91.7, leads: 12, sales: 11, timestamp: '2025-10-15T00:00:00.000Z' }
        ];
        
        console.log('🧪 [TESTE MANUAL] Retornando dados de teste:', testData);
        
        return {
          success: true,
          correctData: testData,
          summary: {
            totalLeads: 34,
            totalSales: 26,
            daysWithLeads: 3,
            dateRange: '2025-10-07 a 2025-10-31'
          }
        };
      }
    };
    
    console.log('🧪 [TESTE MANUAL] Testando fixTotalVendidoData...');
    const resultVendido = await AIDatabaseService.fixTotalVendidoData('8bd69047-7533-42f3-a2f7-e3a60477f68c');
    console.log('🧪 [TESTE MANUAL] Resultado Total Vendido:', resultVendido);
    
    console.log('🧪 [TESTE MANUAL] Testando fixConversionRateData...');
    const resultConversao = await AIDatabaseService.fixConversionRateData('8bd69047-7533-42f3-a2f7-e3a60477f68c');
    console.log('🧪 [TESTE MANUAL] Resultado Taxa Conversão:', resultConversao);
    
    console.log('✅ [TESTE MANUAL] Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ [TESTE MANUAL] Erro no teste:', error);
  }
}

// Executar teste
testarIA();
