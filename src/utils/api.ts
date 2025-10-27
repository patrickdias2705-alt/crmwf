// Helper para obter a URL base da API
export const getApiUrl = (path: string = '') => {
  // Se estamos em desenvolvimento (localhost), usar URL relativa
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${path}`;
  }
  
  // Em produção, usar URL completa do Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqeqaagnnkilihlfjbrm.supabase.co';
  return `${supabaseUrl}${path}`;
};

// Helper específico para Edge Functions
export const getEdgeFunctionUrl = (functionName: string) => {
  return getApiUrl(`/functions/v1/${functionName}`);
};
