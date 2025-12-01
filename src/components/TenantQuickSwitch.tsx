import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Building2, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TenantQuickSwitchProps {
  className?: string;
}

export function TenantQuickSwitch({ className = '' }: TenantQuickSwitchProps) {
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  // Emails das contas para troca
  const VAREJO_EMAIL = 'recebimento.fto@gmail.com';
  const PORTA_PORTA_EMAIL = 'supervisorportaporta@gmail.com'; // Supervisor da Elaine

  // Verificar se o usuário é um dos dois emails permitidos
  const isTargetUser = user?.email === VAREJO_EMAIL || user?.email === PORTA_PORTA_EMAIL;

  // Se não for um dos usuários específicos, não renderizar o componente
  if (!isTargetUser) {
    return null;
  }

  const handleAccountSwitch = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    
    try {
      const targetEmail = user?.email === VAREJO_EMAIL ? PORTA_PORTA_EMAIL : VAREJO_EMAIL;
      const targetName = user?.email === VAREJO_EMAIL ? 'Porta Porta' : 'Varejo';
      
      console.log('🔄 Iniciando troca de conta:', {
        currentEmail: user?.email,
        targetEmail,
        targetName
      });
      
      toast.info('Trocando de conta...', {
        description: `Alternando para ${targetName}`,
        duration: 2000,
      });

      // Armazenar o email de destino no localStorage para o sistema reconhecer
      localStorage.setItem('targetAccount', targetEmail);
      localStorage.setItem('accountSwitch', 'true');
      
      console.log('💾 Dados salvos no localStorage:', {
        targetAccount: targetEmail,
        accountSwitch: 'true'
      });
      
      // Simular troca de conta alterando o contexto do usuário
      const currentUser = user;
      
      // Criar um objeto de usuário simulado para a conta de destino
      const simulatedUser = {
        ...currentUser,
        email: targetEmail,
        user_metadata: {
          ...currentUser?.user_metadata,
          name: targetName === 'Porta Porta' ? 'Supervisor Porta Porta' : 'Recebimento FTO'
        }
      };

      console.log('👤 Usuário simulado criado:', simulatedUser);

      // Atualizar o contexto de autenticação localmente
      window.dispatchEvent(new CustomEvent('accountSwitch', { 
        detail: { user: simulatedUser, targetEmail, targetName } 
      }));

      console.log('📡 Evento accountSwitch disparado');

      toast.success(`Trocou para ${targetName}`, {
        description: `Agora você está visualizando como ${targetEmail}`,
        duration: 3000,
      });

      // Recarregar a página para aplicar as mudanças
      setTimeout(() => {
        console.log('🔄 Recarregando página...');
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('❌ Erro ao trocar conta:', error);
      toast.error('Erro ao trocar de conta');
    } finally {
      // Reset da animação após um delay
      setTimeout(() => setIsAnimating(false), 2000);
    }
  };

  const getCurrentAccountInfo = () => {
    if (user?.email === VAREJO_EMAIL) {
      return {
        currentName: 'Varejo',
        currentIcon: Home,
        nextAccount: 'Porta Porta',
        nextIcon: Building2,
      };
    } else {
      return {
        currentName: 'Porta Porta',
        currentIcon: Building2,
        nextAccount: 'Varejo',
        nextIcon: Home,
      };
    }
  };

  const accountInfo = getCurrentAccountInfo();
  const CurrentIcon = accountInfo.currentIcon;
  const NextIcon = accountInfo.nextIcon;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAccountSwitch}
      disabled={isAnimating}
      className={`
        relative overflow-hidden transition-all duration-300 ease-in-out
        hover:bg-primary/10 hover:border-primary/30 hover:shadow-lg
        ${isAnimating ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        <div className={`transition-transform duration-300 ${isAnimating ? 'rotate-180' : ''}`}>
          <ArrowLeftRight className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1">
          <CurrentIcon className="h-3 w-3" />
          <span className="text-xs font-medium">
            {isAnimating ? 'Trocando...' : `Trocar - ${accountInfo.nextAccount}`}
          </span>
        </div>
      </div>
      
      {/* Efeito de brilho durante a animação */}
      {isAnimating && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
      )}
    </Button>
  );
}
