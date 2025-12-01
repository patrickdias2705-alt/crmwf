// WhatsApp Business API - Meta Oficial
// Documentação: https://developers.facebook.com/docs/whatsapp

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'image' | 'document';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  image?: {
    link: string;
    caption?: string;
  };
}

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  profile_picture?: string;
}

class WhatsAppBusinessAPI {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string = 'https://graph.facebook.com/v18.0';

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  // Enviar mensagem de texto
  async sendTextMessage(to: string, message: string): Promise<any> {
    const payload: WhatsAppMessage = {
      to,
      type: 'text',
      text: {
        body: message
      }
    };

    return this.makeRequest(`/${this.phoneNumberId}/messages`, payload);
  }

  // Enviar mensagem template (GRATUITA)
  async sendTemplateMessage(to: string, templateName: string, language: string = 'pt_BR'): Promise<any> {
    const payload: WhatsAppMessage = {
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language
        }
      }
    };

    return this.makeRequest(`/${this.phoneNumberId}/messages`, payload);
  }

  // Enviar imagem
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<any> {
    const payload: WhatsAppMessage = {
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption
      }
    };

    return this.makeRequest(`/${this.phoneNumberId}/messages`, payload);
  }

  // Obter contatos
  async getContacts(): Promise<WhatsAppContact[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/contacts`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao obter contatos:', error);
      return [];
    }
  }

  // Obter conversas
  async getConversations(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/conversations`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao obter conversas:', error);
      return [];
    }
  }

  // Webhook para receber mensagens
  async setupWebhook(webhookUrl: string, verifyToken: string): Promise<any> {
    const payload = {
      object: 'whatsapp_business_account',
      callback_url: webhookUrl,
      fields: ['messages'],
      verify_token: verifyToken
    };

    return this.makeRequest('/webhooks', payload);
  }

  // Fazer requisição para API
  private async makeRequest(endpoint: string, payload: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Erro da API: ${data.error?.message || 'Erro desconhecido'}`);
      }

      return data;
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }
}

export default WhatsAppBusinessAPI;

// Exemplo de uso:
/*
const whatsapp = new WhatsAppBusinessAPI(
  'SEU_ACCESS_TOKEN',
  'SEU_PHONE_NUMBER_ID'
);

// Enviar mensagem gratuita (template)
await whatsapp.sendTemplateMessage('5511999999999', 'hello_world');

// Enviar mensagem de texto (paga se cliente não iniciou)
await whatsapp.sendTextMessage('5511999999999', 'Olá! Como posso ajudar?');
*/
