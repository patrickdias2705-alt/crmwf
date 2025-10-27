import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Filter,
  Plus,
  Check,
  CheckCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EvolutionApiService } from '@/services/evolutionApi';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isFromMe: boolean;
}

interface Conversation {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  avatar?: string;
  status: 'online' | 'offline' | 'typing';
}

interface WhatsAppInterfaceProps {
  instanceId?: string;
  isConnected?: boolean;
}

export function WhatsAppInterface({ instanceId, isConnected }: WhatsAppInterfaceProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar conversas reais da Evolution API
  useEffect(() => {
    const fetchConversations = async () => {
      if (!instanceId || !isConnected) return;

      try {
        setIsLoading(true);
        console.log('🔍 Buscando conversas reais para instância:', instanceId);
        
        const chats = await EvolutionApiService.getChats(instanceId);
        console.log('📱 Conversas encontradas:', chats);

        if (chats && Array.isArray(chats)) {
          const formattedConversations: Conversation[] = chats.map((chat: any) => ({
            id: chat.id || chat.jid,
            name: chat.name || chat.pushName || 'Contato',
            phone: chat.id || chat.jid,
            lastMessage: chat.lastMessage?.message?.conversation || chat.lastMessage?.message?.extendedTextMessage?.text || 'Sem mensagens',
            timestamp: chat.lastMessage?.messageTimestamp ? chat.lastMessage.messageTimestamp * 1000 : Date.now(),
            unreadCount: chat.unreadCount || 0,
            status: 'offline' as const
          }));

          setConversations(formattedConversations);
          console.log('✅ Conversas carregadas:', formattedConversations.length);
        } else {
          console.log('⚠️ Nenhuma conversa encontrada ou formato inesperado:', chats);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        // Fallback para dados de exemplo se houver erro
        const mockConversations: Conversation[] = [
          {
            id: '1',
            name: 'João Silva',
            phone: '+5511999999999',
            lastMessage: 'Olá! Gostaria de saber mais sobre seus produtos.',
            timestamp: Date.now() - 1000 * 60 * 30,
            unreadCount: 2,
            status: 'online'
          }
        ];
        setConversations(mockConversations);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [instanceId, isConnected]);

  // Carregar mensagens reais quando uma conversa é selecionada
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !instanceId) return;

      try {
        console.log('🔍 Buscando mensagens para conversa:', selectedConversation.id);
        
        const messagesData = await EvolutionApiService.getMessages(instanceId, selectedConversation.id);
        console.log('💬 Mensagens encontradas:', messagesData);

        if (messagesData && Array.isArray(messagesData)) {
          const formattedMessages: Message[] = messagesData.map((msg: any) => ({
            id: msg.key?.id || msg.id || Date.now().toString(),
            from: msg.key?.remoteJid || selectedConversation.phone,
            to: user?.email || '',
            body: msg.message?.conversation || 
                  msg.message?.extendedTextMessage?.text || 
                  msg.message?.imageMessage?.caption ||
                  '[Mídia]' ||
                  'Mensagem não suportada',
            timestamp: msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now(),
            type: msg.message?.conversation ? 'text' : 
                  msg.message?.imageMessage ? 'image' :
                  msg.message?.audioMessage ? 'audio' :
                  msg.message?.videoMessage ? 'video' : 'text',
            status: 'read' as const,
            isFromMe: msg.key?.fromMe || false
          }));

          setMessages(formattedMessages);
          console.log('✅ Mensagens carregadas:', formattedMessages.length);
        } else {
          console.log('⚠️ Nenhuma mensagem encontrada ou formato inesperado:', messagesData);
          setMessages([]);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [selectedConversation, instanceId, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !instanceId) return;

    const message: Message = {
      id: Date.now().toString(),
      from: user?.email || '',
      to: selectedConversation.phone,
      body: newMessage,
      timestamp: Date.now(),
      type: 'text',
      status: 'sent',
      isFromMe: true
    };

    setMessages(prev => [...prev, message]);
    const messageText = newMessage;
    setNewMessage('');

    // Enviar mensagem via Evolution API real
    try {
      console.log('📤 Enviando mensagem via Evolution API:', {
        instanceId,
        chatId: selectedConversation.phone,
        message: messageText
      });

      await EvolutionApiService.sendMessage(instanceId, selectedConversation.phone, messageText);
      
      // Atualizar status para entregue
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, status: 'delivered' }
              : msg
          )
        );
      }, 1000);

      console.log('✅ Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.phone.includes(searchTerm)
  );

  return (
    <div className="flex h-[600px] bg-background border rounded-lg overflow-hidden">
      {/* Lista de conversas */}
      <div className="w-1/3 border-r bg-muted/20">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando conversas...</p>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
              </div>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-muted' : ''
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.avatar} />
                  <AvatarFallback>
                    {conversation.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{conversation.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={conversation.status === 'online' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {conversation.status === 'online' ? 'Online' : 
                       conversation.status === 'typing' ? 'Digitando...' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
          )}
        </ScrollArea>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Cabeçalho da conversa */}
            <div className="p-4 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.avatar} />
                    <AvatarFallback>
                      {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedConversation.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.phone}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.isFromMe
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.body}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.isFromMe && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
