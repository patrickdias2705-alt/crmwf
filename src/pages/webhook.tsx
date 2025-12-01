import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function WebhookHandler() {
  const { user } = useAuth();
  const [webhookData, setWebhookData] = useState<any>(null);

  useEffect(() => {
    // Simular recebimento de webhook da Evolution API
    const handleWebhook = (event: MessageEvent) => {
      if (event.data.type === 'QRCODE_UPDATED') {
        console.log('QR Code atualizado:', event.data);
        setWebhookData(event.data);
        
        // Disparar evento para o WhatsAppConnector
        window.dispatchEvent(new CustomEvent('evolutionQRUpdate', {
          detail: event.data
        }));
      }
      
      if (event.data.type === 'CONNECTION_UPDATE') {
        console.log('Status de conexão atualizado:', event.data);
        setWebhookData(event.data);
        
        // Disparar evento para o WhatsAppConnector
        window.dispatchEvent(new CustomEvent('evolutionConnectionUpdate', {
          detail: event.data
        }));
      }
    };

    // Escutar mensagens do webhook
    window.addEventListener('message', handleWebhook);

    return () => {
      window.removeEventListener('message', handleWebhook);
    };
  }, []);

  if (!user) {
    return <div>Webhook handler - Apenas para usuários logados</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Webhook Evolution API</h2>
      {webhookData ? (
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(webhookData, null, 2)}</pre>
        </div>
      ) : (
        <p>Aguardando dados do webhook...</p>
      )}
    </div>
  );
}
