// Teste rápido da função getCorrectDayOfWeek
// Para verificar se está calculando os dias corretos

function getCorrectDayOfWeek(ddMM) {
  // Mapeamento direto baseado no calendário de outubro de 2025
  const calendarMap = {
    '07/10': 'terça-feira',   // 7 de outubro de 2025
    '08/10': 'quarta-feira',  // 8 de outubro de 2025
    '09/10': 'quinta-feira',  // 9 de outubro de 2025
    '10/10': 'sexta-feira',   // 10 de outubro de 2025
    '11/10': 'sábado',        // 11 de outubro de 2025
    '12/10': 'domingo',       // 12 de outubro de 2025
    '13/10': 'segunda-feira', // 13 de outubro de 2025
    '14/10': 'terça-feira',   // 14 de outubro de 2025
    '15/10': 'quarta-feira',  // 15 de outubro de 2025
    '16/10': 'quinta-feira',  // 16 de outubro de 2025
    '17/10': 'sexta-feira',   // 17 de outubro de 2025
    '18/10': 'sábado',        // 18 de outubro de 2025
    '19/10': 'domingo',       // 19 de outubro de 2025
    '20/10': 'segunda-feira', // 20 de outubro de 2025
    '21/10': 'terça-feira',   // 21 de outubro de 2025
    '22/10': 'quarta-feira',  // 22 de outubro de 2025
    '23/10': 'quinta-feira',  // 23 de outubro de 2025
    '24/10': 'sexta-feira',   // 24 de outubro de 2025
    '25/10': 'sábado',        // 25 de outubro de 2025
    '26/10': 'domingo',       // 26 de outubro de 2025
    '27/10': 'segunda-feira', // 27 de outubro de 2025
    '28/10': 'terça-feira',   // 28 de outubro de 2025
    '29/10': 'quarta-feira',  // 29 de outubro de 2025
    '30/10': 'quinta-feira',  // 30 de outubro de 2025
    '31/10': 'sexta-feira'    // 31 de outubro de 2025
  };
  
  return calendarMap[ddMM] || 'dia não encontrado';
}

// Testar as datas principais
console.log('10/10 =', getCorrectDayOfWeek('10/10')); // Deveria ser sexta-feira
console.log('15/10 =', getCorrectDayOfWeek('15/10')); // Deveria ser quarta-feira
console.log('13/10 =', getCorrectDayOfWeek('13/10')); // Deveria ser segunda-feira

// Verificar se a data está sendo criada corretamente
console.log('Data 10/10:', new Date('2025-10-10T00:00:00.000Z'));
console.log('Dia da semana (0=domingo, 6=sábado):', new Date('2025-10-10T00:00:00.000Z').getDay());
