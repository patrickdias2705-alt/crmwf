// ========================================
// LIMPAR CACHE E FORÇAR ATUALIZAÇÃO
// ========================================
// Execute este script no console do navegador (F12)

console.log('🧹 Limpando cache e forçando atualização...');

// 1. Limpar localStorage
localStorage.clear();
console.log('✅ localStorage limpo');

// 2. Limpar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpo');

// 3. Limpar cache do navegador
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
    console.log('✅ Cache do navegador limpo');
  });
}

// 4. Forçar reload da página
window.location.reload(true);
console.log('🔄 Página recarregada');

// 5. Verificar se há dados em cache do Supabase
console.log('🔍 Verificando cache do Supabase...');
if (window.supabase) {
  console.log('Supabase client encontrado');
} else {
  console.log('Supabase client não encontrado');
}

// 6. Verificar se há dados em localStorage relacionados ao Supabase
const supabaseKeys = Object.keys(localStorage).filter(key => 
  key.includes('supabase') || 
  key.includes('sb-') || 
  key.includes('auth')
);
console.log('🔑 Chaves relacionadas ao Supabase no localStorage:', supabaseKeys);

// 7. Verificar se há dados em sessionStorage relacionados ao Supabase
const supabaseSessionKeys = Object.keys(sessionStorage).filter(key => 
  key.includes('supabase') || 
  key.includes('sb-') || 
  key.includes('auth')
);
console.log('🔑 Chaves relacionadas ao Supabase no sessionStorage:', supabaseSessionKeys);
