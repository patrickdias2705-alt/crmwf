// Chatwoot API Integration
// Documentação: https://www.chatwoot.com/developers/api/

interface ChatwootMessage {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing';
  created_at: string;
  sender?: {
    id: number;
    name: string;
    email: string;
  };
  conversation?: {
    id: number;
    status: 'open' | 'resolved' | 'pending';
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
}

interface ChatwootConversation {
  id: number;
  status: 'open' | 'resolved' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contact: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    avatar_url?: string;
  };
  messages: ChatwootMessage[];
  created_at: string;
  updated_at: string;
}

interface ChatwootContact {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  custom_attributes: Record<string, any>;
}

class ChatwootAPI {
  private baseUrl: string;
  private accountId: string;
  private accessToken: string;
  private useProxy: boolean;

  constructor(baseUrl: string, accountId: string, accessToken: string, useProxy: boolean = true) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.accountId = accountId;
    this.accessToken = accessToken;
    this.useProxy = useProxy;
  }

  // Private helper method to get the full URL
  private getFullUrl(path: string): string {
    if (this.useProxy && import.meta.env.DEV) {
      // Use proxy in development
      return `/chatwoot-proxy${path}`;
    }
    // Use direct URL in production
    return `${this.baseUrl}${path}`;
  }

  // Private helper method to get headers
  private getHeaders(): Record<string, string> {
    return {
      'api_access_token': this.accessToken,
      'Content-Type': 'application/json'
    };
  }

  // Obter conversas
  async getConversations(status?: string): Promise<ChatwootConversation[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const response = await fetch(
        this.getFullUrl(`/api/v1/accounts/${this.accountId}/conversations?${params}`),
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao obter conversas do Chatwoot:', error);
      throw error;
    }
  }

  // Obter conversa específica
  async getConversation(conversationId: number): Promise<ChatwootConversation> {
    try {
      const response = await fetch(
        this.getFullUrl(`/api/v1/accounts/${this.accountId}/conversations/${conversationId}`),
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.payload;
    } catch (error) {
      console.error('Erro ao obter conversa do Chatwoot:', error);
      throw error;
    }
  }

  // Obter mensagens de uma conversa
  async getMessages(conversationId: number): Promise<ChatwootMessage[]> {
    try {
      const response = await fetch(
        this.getFullUrl(`/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`),
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao obter mensagens do Chatwoot:', error);
      throw error;
    }
  }

  // Enviar mensagem
  async sendMessage(conversationId: number, content: string, messageType: 'outgoing' = 'outgoing'): Promise<ChatwootMessage> {
    try {
      const response = await fetch(
        this.getFullUrl(`/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`),
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            content,
            message_type: messageType
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem no Chatwoot:', error);
      throw error;
    }
  }

  // Criar contato
  async createContact(contactData: {
    name: string;
    email?: string;
    phone_number?: string;
    custom_attributes?: Record<string, any>;
  }): Promise<ChatwootContact> {
    try {
      const response = await fetch(
        this.getFullUrl(`/api/v1/accounts/${this.accountId}/contacts`),
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(contactData)
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.payload.contact;
    } catch (error) {
      console.error('Erro ao criar contato no Chatwoot:', error);
      throw error;
    }
  }

  // Atualizar status da conversa
  async updateConversationStatus(conversationId: number, status: 'open' | 'resolved' | 'pending'): Promise<void> {
    try {
      const response = await fetch(
        this.getFullUrl(`/api/v1/accounts/${this.accountId}/conversations/${conversationId}`),
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ status })
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status da conversa no Chatwoot:', error);
      throw error;
    }
  }

  // Obter contatos
  async getContacts(): Promise<ChatwootContact[]> {
    try {
      const response = await fetch(
        this.getFullUrl(`/api/v1/accounts/${this.accountId}/contacts`),
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.payload || [];
    } catch (error) {
      console.error('Erro ao obter contatos do Chatwoot:', error);
      throw error;
    }
  }

  // Webhook para receber mensagens do Chatwoot
  async setupWebhook(webhookUrl: string): Promise<any> {
    try {
      const response = await fetch(
        this.getFullUrl(`/api/v1/accounts/${this.accountId}/webhooks`),
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            webhook_url: webhookUrl,
            subscriptions: ['conversation.created', 'conversation.updated', 'message.created']
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao configurar webhook do Chatwoot:', error);
      throw error;
    }
  }
}

export default ChatwootAPI;

// Exemplo de uso:
/*
const chatwoot = new ChatwootAPI(
  'https://seu-chatwoot.com',
  'SEU_ACCOUNT_ID',
  'SEU_ACCESS_TOKEN'
);

// Obter conversas abertas
const conversations = await chatwoot.getConversations('open');

// Enviar mensagem
await chatwoot.sendMessage(123, 'Olá! Como posso ajudar?');

// Obter mensagens de uma conversa
const messages = await chatwoot.getMessages(123);
*/
