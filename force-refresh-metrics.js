// Script para forçar atualização das métricas
console.log('🔄 Forçando atualização das métricas...');

// Limpar cache do localStorage
localStorage.clear();
sessionStorage.clear();

// Recarregar a página
window.location.reload(true);

// Ou se estiver em uma SPA, forçar recarregamento completo
if (window.location.href.includes('localhost')) {
  window.location.href = window.location.href + '?t=' + Date.now();
}
