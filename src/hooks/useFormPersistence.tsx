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

  // Salvar dados automaticamente quando o formulário muda
  useEffect(() => {
    if (isOpen && formData) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          data: formData,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('⚠️ Erro ao salvar formulário no localStorage:', error);
      }
    }
  }, [formData, isOpen, storageKey]);

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

