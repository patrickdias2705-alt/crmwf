// Script para forçar atualização do CSS
console.log('🔄 Forçando atualização do CSS...');

// Adicionar timestamp para quebrar cache
const timestamp = Date.now();

// Atualizar todos os links CSS
const links = document.querySelectorAll('link[rel="stylesheet"]');
links.forEach(link => {
  if (link.href) {
    const url = new URL(link.href);
    url.searchParams.set('v', timestamp);
    link.href = url.toString();
  }
});

// Forçar reload do CSS
const styleSheets = document.styleSheets;
for (let i = 0; i < styleSheets.length; i++) {
  try {
    styleSheets[i].disabled = true;
    styleSheets[i].disabled = false;
  } catch (e) {
    // Ignore cross-origin errors
  }
}

// Adicionar CSS inline para garantir que os labels sejam brancos
const style = document.createElement('style');
style.textContent = `
  label {
    color: white !important;
  }
  .text-white {
    color: white !important;
  }
  .dark\\:text-white {
    color: white !important;
  }
`;
document.head.appendChild(style);

console.log('✅ CSS forçado a atualizar!');
