import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para manter a sessão ativa mesmo quando a aba perde o foco
 * Evita que o CRM feche quando o usuário troca de aba
 */
export function useSessionPersistence() {
  useEffect(() => {
    // Função para verificar e renovar a sessão
    const checkAndRefreshSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Verificar se o token está próximo de expirar (menos de 5 minutos)
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
            
            // Se faltam menos de 5 minutos, tentar renovar
            if (expiresIn < 300) {
              console.log('🔄 Renovando sessão automaticamente...');
              const { data, error } = await supabase.auth.refreshSession();
              
              if (error) {
                console.error('❌ Erro ao renovar sessão:', error);
              } else {
                console.log('✅ Sessão renovada com sucesso');
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
      }
    };

    // Verificar sessão quando a aba volta a ter foco
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Aba voltou ao foco, verificando sessão...');
        checkAndRefreshSession();
      }
    };

    // Verificar sessão periodicamente (a cada 4 minutos)
    const intervalId = setInterval(checkAndRefreshSession, 4 * 60 * 1000);

    // Adicionar listener de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Verificar sessão quando a página carrega
    checkAndRefreshSession();

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}





