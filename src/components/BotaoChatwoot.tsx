import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BotaoChatwootProps {
  email?: string;
  telefone?: string;
  accountId?: number;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function BotaoChatwoot({ 
  email, 
  telefone, 
  accountId = 1,
  className = '',
  variant = 'outline',
  size = 'default'
}: BotaoChatwootProps) {
  const [loading, setLoading] = useState(false);

  const chatwootUrl = 'https://chatwoot-chatwoot.l0vghu.easypanel.host';

  const buscarContato = async (email?: string, telefone?: string) => {
    if (!email && !telefone) {
      return null;
    }

    try {
      const chatwootUrl = 'https://chatwoot-chatwoot.l0vghu.easypanel.host';
      const apiToken = 'HUYUHnVUAunUeAWpcUS8VWeK';

      // Buscar contato por email primeiro
      if (email) {
        const searchUrl = `${chatwootUrl}/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(email)}`;
        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'api_access_token': apiToken,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.payload && data.payload.length > 0) {
            return data.payload[0];
          }
        }
      }

      // Se não encontrou por email, tenta por telefone
      if (telefone) {
        const searchUrl = `${chatwootUrl}/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(telefone)}`;
        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'api_access_token': apiToken,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.payload && data.payload.length > 0) {
            return data.payload[0];
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar contato:', error);
      return null;
    }
  };

  const buscarConversas = async (contactId: number) => {
    try {
      const chatwootUrl = 'https://chatwoot-chatwoot.l0vghu.easypanel.host';
      const apiToken = 'HUYUHnVUAunUeAWpcUS8VWeK';

      const response = await fetch(
        `${chatwootUrl}/api/v1/accounts/${accountId}/contacts/${contactId}/conversations`,
        {
          method: 'GET',
          headers: {
            'api_access_token': apiToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar conversas');
      }

      const data = await response.json();

      if (data.payload && data.payload.length > 0) {
        return data.payload[0]; // Retorna a primeira conversa (mais recente)
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      return null;
    }
  };

  const handleClick = async () => {
    if (!email && !telefone) {
      toast.error('Email ou telefone necessário para buscar conversas');
      return;
    }

    setLoading(true);

    try {
      // 1. Buscar contato
      const contato = await buscarContato(email, telefone);

      if (!contato) {
        // Fallback: abrir dashboard geral
        toast.info('Contato não encontrado. Abrindo todas as conversas...');
        window.open(`${chatwootUrl}/app/accounts/${accountId}/dashboard`, '_blank');
        return;
      }

      // 2. Buscar conversas do contato
      const conversa = await buscarConversas(contato.id);

      if (conversa) {
        // Abrir conversa específica
        window.open(
          `${chatwootUrl}/app/accounts/${accountId}/conversations/${conversa.id}`,
          '_blank'
        );
        toast.success('Abrindo conversa no Chatwoot...');
      } else {
        // Abrir página do contato
        window.open(
          `${chatwootUrl}/app/accounts/${accountId}/contacts/${contato.id}`,
          '_blank'
        );
        toast.success('Abrindo contato no Chatwoot...');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao abrir Chatwoot. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || (!email && !telefone)}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Carregando...
        </>
      ) : (
        <>
          <MessageCircle className="h-4 w-4 mr-2" />
          Ver no Chatwoot
        </>
      )}
    </Button>
  );
}

