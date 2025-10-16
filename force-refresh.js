// Script para forçar refresh e limpar cache
console.log('🔄 Forçando refresh e limpeza de cache...');

// Limpar localStorage
localStorage.clear();

// Limpar sessionStorage
sessionStorage.clear();

// Recarregar a página
window.location.reload(true);

console.log('✅ Cache limpo e página recarregada!');
