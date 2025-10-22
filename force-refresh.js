// Script para forçar atualização do cache
console.log('🔄 Forçando atualização do cache...');

// Adicionar timestamp para quebrar cache
const timestamp = Date.now();
const links = document.querySelectorAll('link[rel="stylesheet"]');
const scripts = document.querySelectorAll('script[src]');

links.forEach(link => {
  if (link.href) {
    const url = new URL(link.href);
    url.searchParams.set('v', timestamp);
    link.href = url.toString();
  }
});

scripts.forEach(script => {
  if (script.src) {
    const url = new URL(script.src);
    url.searchParams.set('v', timestamp);
    script.src = url.toString();
  }
});

console.log('✅ Cache atualizado!');