// ========================================
// VERIFICAR PROBLEMA DE CACHE NO FRONTEND
// ========================================
// Execute este script no console do navegador (F12)

console.log('🔍 Verificando problema de cache no frontend...');

// 1. Verificar se há dados em localStorage
console.log('📦 Dados no localStorage:');
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('auth') || key.includes('leads') || key.includes('sales')) {
    console.log(`  ${key}:`, localStorage.getItem(key));
  }
});

// 2. Verificar se há dados em sessionStorage
console.log('📦 Dados no sessionStorage:');
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('auth') || key.includes('leads') || key.includes('sales')) {
    console.log(`  ${key}:`, sessionStorage.getItem(key));
  }
});

// 3. Verificar se há dados em cache do navegador
if ('caches' in window) {
  caches.keys().then(names => {
    console.log('🗄️ Caches disponíveis:', names);
    names.forEach(name => {
      caches.open(name).then(cache => {
        cache.keys().then(keys => {
          console.log(`  Cache ${name}:`, keys.length, 'entradas');
        });
      });
    });
  });
}

// 4. Verificar se há dados em memória (variáveis globais)
console.log('🧠 Dados em memória:');
if (window.supabase) {
  console.log('  Supabase client:', window.supabase);
} else {
  console.log('  Supabase client não encontrado');
}

// 5. Verificar se há dados em React state (se possível)
if (window.React) {
  console.log('  React encontrado:', window.React.version);
} else {
  console.log('  React não encontrado');
}

// 6. Verificar se há dados em Redux (se possível)
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  console.log('  Redux DevTools encontrado');
} else {
  console.log('  Redux DevTools não encontrado');
}

// 7. Verificar se há dados em IndexedDB
if ('indexedDB' in window) {
  console.log('  IndexedDB disponível');
  // Tentar listar databases
  indexedDB.databases().then(databases => {
    console.log('  Databases IndexedDB:', databases);
  }).catch(err => {
    console.log('  Erro ao listar IndexedDB:', err);
  });
} else {
  console.log('  IndexedDB não disponível');
}

// 8. Verificar se há dados em WebSQL (deprecated)
if (window.openDatabase) {
  console.log('  WebSQL disponível (deprecated)');
} else {
  console.log('  WebSQL não disponível');
}

// 9. Verificar se há dados em cookies
console.log('🍪 Cookies:');
document.cookie.split(';').forEach(cookie => {
  if (cookie.includes('supabase') || cookie.includes('auth') || cookie.includes('session')) {
    console.log(`  ${cookie.trim()}`);
  }
});

// 10. Verificar se há dados em URL parameters
console.log('🔗 URL parameters:');
const urlParams = new URLSearchParams(window.location.search);
urlParams.forEach((value, key) => {
  console.log(`  ${key}: ${value}`);
});

// 11. Verificar se há dados em hash
console.log('🔗 Hash da URL:');
if (window.location.hash) {
  console.log(`  ${window.location.hash}`);
} else {
  console.log('  Nenhum hash na URL');
}

// 12. Verificar se há dados em referrer
console.log('🔗 Referrer:');
if (document.referrer) {
  console.log(`  ${document.referrer}`);
} else {
  console.log('  Nenhum referrer');
}

// 13. Verificar se há dados em user agent
console.log('🔍 User Agent:');
console.log(`  ${navigator.userAgent}`);

// 14. Verificar se há dados em timezone
console.log('🌍 Timezone:');
console.log(`  ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

// 15. Verificar se há dados em locale
console.log('🌍 Locale:');
console.log(`  ${navigator.language}`);

// 16. Verificar se há dados em screen
console.log('📱 Screen:');
console.log(`  ${screen.width}x${screen.height}`);

// 17. Verificar se há dados em viewport
console.log('📱 Viewport:');
console.log(`  ${window.innerWidth}x${window.innerHeight}`);

// 18. Verificar se há dados em performance
console.log('⚡ Performance:');
if (window.performance && window.performance.memory) {
  console.log(`  Memória usada: ${Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024)}MB`);
  console.log(`  Memória total: ${Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024)}MB`);
  console.log(`  Limite de memória: ${Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024)}MB`);
} else {
  console.log('  Performance API não disponível');
}

console.log('✅ Verificação de cache concluída!');
