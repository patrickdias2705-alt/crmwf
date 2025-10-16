// ========================================
// DEBUG SCRIPT - Cole no Console do Chrome (F12)
// ========================================

console.log('🔍 Iniciando debug do sistema...');

// 1. Verificar se há sessão ativa
const checkSession = async () => {
  const { data: { session }, error } = await window.supabase.auth.getSession();
  console.log('📊 Sessão atual:', session);
  console.log('❌ Erro de sessão:', error);
  return session;
};

// 2. Verificar localStorage
console.log('💾 LocalStorage keys:', Object.keys(localStorage));
console.log('💾 Supabase auth keys:', 
  Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-'))
);

// 3. Verificar se há erros no React
console.log('⚛️ React errors:', window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__);

// 4. Verificar rota atual
console.log('🛣️ Rota atual:', window.location.pathname);
console.log('🛣️ URL completa:', window.location.href);

// Execute a verificação de sessão
checkSession().then(session => {
  if (session) {
    console.log('✅ Usuário logado:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
  } else {
    console.log('❌ Nenhum usuário logado');
  }
});

// 5. Verificar se o Supabase está carregado
console.log('🔌 Supabase client:', window.supabase ? '✅ Carregado' : '❌ Não carregado');

console.log('✅ Debug completo! Verifique os logs acima.');

