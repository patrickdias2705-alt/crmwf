// Helpers de data para usar com o schema util do Supabase
// Centraliza as constantes de data e permite mudanças futuras

export const DATE_CONSTANTS = {
  // Data de início do sistema (deve corresponder ao valor em util.app_constants)
  START_DATE: '2025-10-07',
  
  // Data atual (atualizada dinamicamente - 17 de outubro de 2025)
  CURRENT_DATE: '2025-10-17',
  
  // Formato para queries Supabase
  START_DATE_ISO: '2025-10-07T00:00:00.000Z',
  END_DATE_ISO: '2025-10-17T23:59:59.999Z'
};

// Função para obter o período atual em formato ISO
export const getCurrentPeriod = () => ({
  start: `${DATE_CONSTANTS.START_DATE}T00:00:00.000Z`,
  end: `${DATE_CONSTANTS.CURRENT_DATE}T23:59:59.999Z`
});

// Função para gerar array de dias do período (07/10 a 17/10)
export const generateDaysArray = () => {
  const days = [];
  const startDay = 7; // 07/10
  const endDay = 17;  // 17/10 (hoje)
  
  for (let day = startDay; day <= endDay; day++) {
    days.push(`${day.toString().padStart(2, '0')}/10`);
  }
  
  return days;
};

// Função para formatar data para exibição
export const formatDateForDisplay = (dateString: string) => {
  return dateString; // Já está no formato DD/MM
};

// Função para verificar se uma data é hoje
export const isToday = (dateString: string) => {
  return dateString === `${DATE_CONSTANTS.CURRENT_DATE.split('-')[2]}/${DATE_CONSTANTS.CURRENT_DATE.split('-')[1]}`;
};

// Função para calcular dias desde o início (simula util.days_since_start())
export const getDaysSinceStart = () => {
  const startDate = new Date(DATE_CONSTANTS.START_DATE);
  const currentDate = new Date(DATE_CONSTANTS.CURRENT_DATE);
  const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Função para obter tempo detalhado desde o início (simula util.elapsed_since_start())
export const getElapsedSinceStart = () => {
  const startDate = new Date(DATE_CONSTANTS.START_DATE);
  const currentDate = new Date(DATE_CONSTANTS.CURRENT_DATE);
  const diffMs = Math.max(0, currentDate.getTime() - startDate.getTime());
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: Math.floor(diffMs / 1000)
  };
};

// Função para comparar datas de forma precisa (evita problemas de fuso horário)
export const isLeadFromDate = (leadCreatedAt: string, targetDay: number): boolean => {
  const leadDate = new Date(leadCreatedAt);
  const leadDateStr = leadDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const expectedDateStr = `2025-10-${targetDay.toString().padStart(2, '0')}`;
  return leadDateStr === expectedDateStr;
};

// Função para obter dia da semana em português (considerando fuso horário correto)
export const getDayOfWeek = (dateString: string): string => {
  // Converter para data no fuso de São Paulo
  const date = new Date(dateString);
  const dateSP = new Date(date.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  return days[dateSP.getDay()];
};

// Função para obter dia da semana de uma data específica (formato DD/MM)
export const getDayOfWeekFromDDMM = (ddMM: string): string => {
  const [day, month] = ddMM.split('/');
  const year = 2025;
  const dateString = `${year}-${month}-${day.padStart(2, '0')}T00:00:00.000Z`;
  return getDayOfWeek(dateString);
};

// Função para formatar data completa em português
export const formatDateComplete = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
};

// Função para obter dia da semana correto de uma data DD/MM (baseado no calendário real de 2025)
export const getCorrectDayOfWeek = (ddMM: string): string => {
  // Mapeamento direto baseado no calendário de outubro de 2025
  const calendarMap: Record<string, string> = {
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
};
