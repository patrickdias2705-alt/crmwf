import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Users, Send, RefreshCw, ExternalLink, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ChatwootAPI from '@/services/chatwootApi';
import WhatsAppChat from './WhatsAppChat';

interface ChatwootIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function ChatwootIntegration({ isOpen, onClose }: ChatwootIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null);
  const [conversations, setConversations] = useState<ChatwootConversation[]>([]);
  const [messages, setMessages] = useState<ChatwootMessage[]>([]);
  const [chatwootApi, setChatwootApi] = useState<ChatwootAPI | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [useNewChatView, setUseNewChatView] = useState(true);

  // Configurações do Chatwoot (já pré-configuradas)
  const [chatwootUrl] = useState('https://chatwoot-chatwoot.l0vghu.easypanel.host');
  const [accountId] = useState('1');
  const [accessToken] = useState('HUYUHnVUAunUeAWpcUS8VWeK');

  // Inicializar API e conectar automaticamente
  useEffect(() => {
    if (isOpen && chatwootUrl && accountId && accessToken) {
      const api = new ChatwootAPI(chatwootUrl, accountId, accessToken);
      setChatwootApi(api);
      // Dar um pequeno delay para garantir que tudo está pronto
      setTimeout(() => {
        testConnection();
      }, 100);
    }
  }, [isOpen]);

  // Testar conexão
  const testConnection = async () => {
    if (!chatwootUrl || !accountId || !accessToken) return;
    
    try {
      setIsLoading(true);
      setConnectionError(null);
      
      // Teste básico de conectividade
      console.log('🔍 Testando conexão com Chatwoot...');
      console.log('URL:', chatwootUrl);
      console.log('Account ID:', accountId);
      console.log('Token:', accessToken.substring(0, 10) + '...');
      
      // Teste 1: Verificar se a URL está acessível (usando header correto api_access_token)
      console.log('📡 Testando conectividade básica...');
      const basicTest = await fetch(`${chatwootUrl}/api/v1/accounts/${accountId}`, {
        method: 'GET',
        headers: {
          'api_access_token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status da resposta:', basicTest.status);
      
      if (basicTest.status === 401) {
        throw new Error('401: Token inválido ou expirado. Crie um novo token no Chatwoot.');
      } else if (basicTest.status === 404) {
        throw new Error('404: Account ID não encontrado. Verifique se o ID da conta está correto.');
      } else if (basicTest.status === 403) {
        throw new Error('403: Acesso negado. Verifique as permissões do token.');
      }
      
      // Teste 2: Obter conversas
      console.log('📱 Testando obtenção de conversas...');
      const api = new ChatwootAPI(chatwootUrl, accountId, accessToken);
      const conversationsData = await api.getConversations('open');
      
      setChatwootApi(api);
      setConversations(conversationsData);
      setIsConnected(true);
      toast.success(`Conectado! ${conversationsData.length} conversas encontradas`);
    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      
      // Diagnóstico detalhado do erro
      let errorMessage = 'Erro ao conectar com o Chatwoot';
      
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Token inválido ou expirado. Crie um novo token no Chatwoot.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Account ID não encontrado. Verifique se o ID da conta está correto.';
      } else if (error.message?.includes('403')) {
        errorMessage = 'Acesso negado. Verifique as permissões do token.';
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        errorMessage = 'Erro de rede. Verifique sua conexão com a internet e se a URL do Chatwoot está correta.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao Chatwoot. Verifique se o servidor está acessível.';
      } else {
        errorMessage = error.message || 'Erro desconhecido ao conectar com o Chatwoot';
      }
      
      setConnectionError(errorMessage);
      setIsConnected(false);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar conversas
  const loadConversations = async () => {
    if (!chatwootApi) return;
    
    try {
      setIsLoading(true);
      const conversationsData = await chatwootApi.getConversations('open');
      setConversations(conversationsData);
      toast.success(`${conversationsData.length} conversas carregadas`);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas do Chatwoot');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: number) => {
    if (!chatwootApi) return;
    
    try {
      setIsLoading(true);
      const conversation = await chatwootApi.getConversation(conversationId);
      setSelectedConversation(conversation);
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!chatwootApi || !message.trim() || !selectedConversation) {
      toast.error('Preencha a mensagem e selecione uma conversa');
      return;
    }

    try {
      setIsLoading(true);
      await chatwootApi.sendMessage(selectedConversation.id, message);
      toast.success('Mensagem enviada com sucesso!');
      setMessage('');
      // Recarregar mensagens
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar status da conversa
  const updateConversationStatus = async (status: 'open' | 'resolved' | 'pending') => {
    if (!chatwootApi || !selectedConversation) return;

    try {
      setIsLoading(true);
      await chatwootApi.updateConversationStatus(selectedConversation.id, status);
      toast.success(`Conversa ${status === 'resolved' ? 'resolvida' : status === 'pending' ? 'pendente' : 'aberta'}`);
      // Recarregar conversas
      await loadConversations();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da conversa');
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir Chatwoot em nova aba
  const openChatwoot = () => {
    window.open(chatwootUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-500', text: 'Aberta' },
      pending: { color: 'bg-yellow-500', text: 'Pendente' },
      resolved: { color: 'bg-gray-500', text: 'Resolvida' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-blue-500', text: 'Baixa' },
      medium: { color: 'bg-yellow-500', text: 'Média' },
      high: { color: 'bg-orange-500', text: 'Alta' },
      urgent: { color: 'bg-red-500', text: 'Urgente' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge variant="outline" className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl mx-auto h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chatwoot - WhatsApp Business
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setUseNewChatView(!useNewChatView)}
              variant="outline"
              size="sm"
            >
              {useNewChatView ? 'Visualização Antiga' : 'Visualização Nova'}
            </Button>
            <Button
              onClick={openChatwoot}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Chatwoot
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {useNewChatView ? (
            <div className="flex-1">
              <WhatsAppChat inboxId="1" />
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="text-muted-foreground">Conectando ao Chatwoot...</p>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Não foi possível conectar</h3>
                  <p className="text-muted-foreground">
                    {connectionError || 'Erro ao conectar com o Chatwoot'}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Button
                    onClick={testConnection}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Conectando...' : 'Conectar ao Chatwoot'}
                  </Button>
                  
                  {connectionError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm space-y-2">
                      <strong>Erro de conexão:</strong>
                      <p>{connectionError}</p>
                      <div className="text-xs text-red-600 mt-2">
                        <p>Possíveis soluções:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Verifique sua conexão com a internet</li>
                          <li>O servidor Chatwoot pode estar fora do ar</li>
                          <li>Tente novamente em alguns segundos</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex space-y-4">
              {/* Lista de conversas */}
              <div className="w-1/3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Conversas ({conversations.length})
                  </h4>
                  <Button
                    onClick={loadConversations}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded cursor-pointer border ${
                          selectedConversation?.id === conversation.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => loadMessages(conversation.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{conversation.contact.name}</p>
                          {getStatusBadge(conversation.status)}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {conversation.contact.phone_number && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Phone className="h-3 w-3" />
                              {conversation.contact.phone_number}
                            </div>
                          )}
                          {conversation.contact.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="h-3 w-3" />
                              {conversation.contact.email}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          {getPriorityBadge(conversation.priority)}
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(conversation.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Área de mensagens */}
              <div className="flex-1 flex flex-col space-y-4">
                {selectedConversation ? (
                  <>
                    {/* Cabeçalho da conversa */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <h5 className="font-semibold">{selectedConversation.contact.name}</h5>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.contact.phone_number} • {selectedConversation.contact.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedConversation.status)}
                        {getPriorityBadge(selectedConversation.priority)}
                      </div>
                    </div>

                    {/* Mensagens */}
                    <ScrollArea className="flex-1 h-64 border rounded p-4">
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.message_type === 'outgoing' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs p-3 rounded ${
                                msg.message_type === 'outgoing'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Área de envio */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-20"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={sendMessage}
                          disabled={isLoading || !message.trim()}
                          className="flex-1"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Enviar
                        </Button>
                        <Button
                          onClick={() => updateConversationStatus('resolved')}
                          disabled={isLoading}
                          variant="outline"
                        >
                          Resolver
                        </Button>
                        <Button
                          onClick={() => updateConversationStatus('pending')}
                          disabled={isLoading}
                          variant="outline"
                        >
                          Pendente
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>Selecione uma conversa para ver as mensagens</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
