import { useEffect, useRef } from 'react';

/**
 * Hook para persistir o estado de formulários no localStorage
 * Restaura automaticamente quando o formulário é reaberto
 * 
 * @param formKey - Chave única para identificar o formulário (ex: 'create-lead', 'edit-lead-123')
 * @param formData - Estado atual do formulário
 * @param isOpen - Se o formulário está aberto
 * @param onRestore - Callback chamado quando os dados são restaurados
 */
export function useFormPersistence<T extends Record<string, any>>(
  formKey: string,
  formData: T,
  isOpen: boolean,
  onRestore?: (data: T) => void
) {
  const storageKey = `form-persistence-${formKey}`;
  const hasRestoredRef = useRef(false);

  // Salvar dados automaticamente quando o formulário muda (mesmo se não estiver aberto)
  // Usar ref para garantir que sempre temos os dados mais recentes
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  useEffect(() => {
    // Função para salvar dados
    const saveData = () => {
      try {
        const currentData = formDataRef.current;
        if (currentData) {
          // Verificar se há dados válidos antes de salvar
          const hasData = Object.values(currentData).some(value => {
            if (typeof value === 'string') return value.trim() !== '';
            if (typeof value === 'number') return value !== 0;
            return value !== null && value !== undefined;
          });
          
          if (hasData) {
            localStorage.setItem(storageKey, JSON.stringify({
              data: currentData,
              timestamp: Date.now()
            }));
            console.log('💾 Dados salvos automaticamente:', storageKey);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao salvar formulário no localStorage:', error);
      }
    };

    // Salvar imediatamente
    saveData();

    // Salvar também com debounce para evitar muitas escritas
    const timeoutId = setTimeout(saveData, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey]);

  // Salvar dados antes de qualquer recarregamento ou fechamento
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const currentData = formDataRef.current;
        if (currentData) {
          const hasData = Object.values(currentData).some(value => {
            if (typeof value === 'string') return value.trim() !== '';
            if (typeof value === 'number') return value !== 0;
            return value !== null && value !== undefined;
          });
          
          if (hasData) {
            localStorage.setItem(storageKey, JSON.stringify({
              data: currentData,
              timestamp: Date.now()
            }));
            console.log('💾 Dados salvos antes de recarregar:', storageKey);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao salvar antes de recarregar:', error);
      }
    };

    // Salvar quando a página perde foco
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storageKey]);

  // Restaurar dados quando o formulário é aberto
  useEffect(() => {
    if (isOpen && !hasRestoredRef.current && onRestore) {
      // Pequeno delay para garantir que o formulário foi montado
      const timeoutId = setTimeout(() => {
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            
            // Verificar se os dados não são muito antigos (menos de 24 horas)
            const age = Date.now() - parsed.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (age < maxAge && parsed.data) {
              // Verificar se os dados são diferentes dos atuais (para evitar loop)
              const currentDataStr = JSON.stringify(formData);
              const savedDataStr = JSON.stringify(parsed.data);
              
              if (currentDataStr !== savedDataStr) {
                console.log(`📋 Restaurando formulário: ${formKey}`);
                onRestore(parsed.data);
                hasRestoredRef.current = true;
              }
            } else {
              // Dados muito antigos, remover
              localStorage.removeItem(storageKey);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao restaurar formulário do localStorage:', error);
          localStorage.removeItem(storageKey);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, storageKey, formKey, onRestore, formData]);

  // Limpar dados quando o formulário é fechado com sucesso
  const clearPersistedData = () => {
    try {
      localStorage.removeItem(storageKey);
      hasRestoredRef.current = false;
      console.log(`🗑️ Dados do formulário limpos: ${formKey}`);
    } catch (error) {
      console.warn('⚠️ Erro ao limpar dados do formulário:', error);
    }
  };

  // Resetar flag quando o formulário fecha
  useEffect(() => {
    if (!isOpen) {
      hasRestoredRef.current = false;
    }
  }, [isOpen]);

  return { clearPersistedData };
}

