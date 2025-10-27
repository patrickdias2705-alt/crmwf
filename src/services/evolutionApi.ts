import axios from 'axios';

const EVOLUTION_CONFIG = {
  API_URL: 'https://evolutionapi.dentechia.shop/',
  API_KEY: 'KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH'
};

const evolutionApi = axios.create({
  baseURL: EVOLUTION_CONFIG.API_URL,
  headers: {
    'apikey': EVOLUTION_CONFIG.API_KEY,
    'Content-Type': 'application/json'
  }
});

export interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    status: string;
  };
}

export interface QRCodeResponse {
  base64: string;
  updatedAt: number;
}

export interface ConnectionStateResponse {
  instance: {
    instanceName: string;
    state: string;
    status: string;
  };
}

export class EvolutionApiService {
  // Criar instância
  static async createInstance(instanceName: string, userNumber?: string): Promise<CreateInstanceResponse> {
    // Payload que funciona com a API atual
    const payload: any = {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true
    };

    console.log('Criando instância com payload:', payload);
    
    const response = await evolutionApi.post('/instance/create', payload);
    return response.data;
  }

  // Obter QR Code
  static async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    console.log('Buscando QR Code para instância:', instanceId);
    const response = await evolutionApi.get(`/instance/qrcode/${instanceId}`);
    console.log('Resposta do QR Code:', response.data);
    return response.data;
  }

  // Verificar status da conexão
  static async getConnectionState(instanceId: string): Promise<ConnectionStateResponse> {
    const response = await evolutionApi.get(`/instance/connectionState/${instanceId}`);
    return response.data;
  }

  // Solicitar novo QR Code
  static async requestQRCode(instanceId: string): Promise<any> {
    const response = await evolutionApi.get(`/instance/connect/${instanceId}`);
    return response.data;
  }

  // Deletar instância
  static async deleteInstance(instanceId: string): Promise<any> {
    const response = await evolutionApi.delete(`/instance/delete/${instanceId}`);
    return response.data;
  }

  // Listar instâncias
  static async listInstances(): Promise<any> {
    const response = await evolutionApi.get('/instance/fetchInstances');
    return response.data;
  }

  // Buscar conversas/chats
  static async getChats(instanceId: string): Promise<any> {
    const response = await evolutionApi.get(`/chat/find/${instanceId}`);
    return response.data;
  }

  // Buscar mensagens de uma conversa
  static async getMessages(instanceId: string, chatId: string): Promise<any> {
    const response = await evolutionApi.get(`/chat/findMessages/${instanceId}/${chatId}`);
    return response.data;
  }

  // Enviar mensagem
  static async sendMessage(instanceId: string, chatId: string, message: string): Promise<any> {
    const response = await evolutionApi.post(`/message/sendText/${instanceId}`, {
      number: chatId,
      text: message
    });
    return response.data;
  }

  // Verificar se a instância está conectada
  static async isInstanceConnected(instanceId: string): Promise<boolean> {
    try {
      const status = await this.getConnectionState(instanceId);
      return status?.instance?.state === 'open';
    } catch (error) {
      return false;
    }
  }
}
