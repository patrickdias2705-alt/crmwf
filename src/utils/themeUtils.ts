// Utilitários para gerenciar tema
export const clearThemeStorage = () => {
  // Limpar qualquer configuração de tema armazenada
  localStorage.removeItem('theme');
  localStorage.removeItem('next-themes');
  localStorage.removeItem('theme-preference');
  
  // Forçar tema claro no HTML
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  
  // Remover classe dark do body se existir
  document.body.classList.remove('dark');
  document.body.classList.add('light');
};

export const setDefaultTheme = () => {
  // Garantir que o tema padrão seja light
  if (typeof window !== 'undefined') {
    // Verificar se há tema armazenado
    const storedTheme = localStorage.getItem('theme') || 
                       localStorage.getItem('next-themes') || 
                       localStorage.getItem('theme-preference');
    
    // Se não há tema armazenado ou é dark, forçar light
    if (!storedTheme || storedTheme === 'dark' || storedTheme.includes('dark')) {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('next-themes', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }
};
