import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Phone, Video, MoreVertical, Image, ArrowRight, MessageCircle, QrCode, RefreshCw, ExternalLink, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { InternalMessages } from '@/components/InternalMessages';

interface Conversation {
  id: string;
  lead_id: string;
  status: 'open' | 'closed' | 'paused';
  last_message_at: string;
  channel: string;
  created_at: string;
  updated_at: string;
  leads: {
    name: string;
    phone?: string;
    email?: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  text?: string;
  media_url?: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
  wa_message_id?: string;
}

interface WhatsAppConnection {
  id: string;
  status: string;
  phone?: string;
  qr_code_url?: string;
  instance_name?: string;
}

export default function Conversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [whatsappConnection, setWhatsappConnection] = useState<WhatsAppConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchWhatsAppConnection();
      fetchConversations();
      
      // Set up real-time subscription for conversations
      const conversationsChannel = supabase
        .channel('conversations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `tenant_id=eq.${user.tenant_id}`
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      // Set up real-time subscription for messages
      const messagesChannel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `tenant_id=eq.${user.tenant_id}`
          },
          (payload) => {
            if (selectedConversation && payload.new && 
                (payload.new as any).conversation_id === selectedConversation.id) {
              fetchMessages(selectedConversation.id);
            }
            fetchConversations(); // Update last message
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationsChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user?.tenant_id, selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchWhatsAppConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('id, status, phone, qr_code_url, instance_name')
        .eq('tenant_id', user?.tenant_id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading WhatsApp connection:', error);
        return;
      }

      setWhatsappConnection(data);
    } catch (error) {
      console.error('Error fetching WhatsApp connection:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          lead_id,
          status,
          last_message_at,
          channel,
          created_at,
          updated_at,
          leads!inner (
            name,
            phone,
            email
          )
        `)
        .eq('tenant_id', user?.tenant_id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      setConversations((data || []) as any);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('tenant_id', user?.tenant_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform direction from database format to UI format
      const transformedMessages = data?.map(msg => ({
        ...msg,
        direction: (msg.direction === 'inbound' ? 'inbound' : 'outbound') as 'inbound' | 'outbound'
      })) || [];

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase.functions.invoke('messages-outbound', {
        body: {
          phone: selectedConversation.leads.phone,
          text: newMessage,
        }
      });

      if (error) throw error;

      setNewMessage('');
      toast.success('Mensagem enviada');
      
      // Refresh messages to show the sent message
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const moveToStage = async (stageId: string) => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase.functions.invoke('leads-move', {
        body: {
          phone: selectedConversation.leads.phone,
          stage_id: stageId,
        }
      });

      if (error) throw error;
      toast.success('Lead movido com sucesso');
      fetchConversations();
    } catch (error) {
      console.error('Error moving lead:', error);
      toast.error('Erro ao mover lead');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Conversas WhatsApp
          </TabsTrigger>
          <TabsTrigger value="internal" className="gap-2">
            <Bell className="h-4 w-4" />
            Mensagens Internas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="h-[calc(100vh-12rem)] flex gap-6">
        {/* Lista de Conversas */}
        <Card className="w-80 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversas
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    WhatsApp Web
                  </a>
                </Button>
                {whatsappConnection?.status !== 'connected' && (
                  <Link to="/whatsapp">
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-2" />
                      Conectar API
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            {whatsappConnection && (
              <div className="flex items-center gap-2 text-sm">
                <Badge 
                  variant={whatsappConnection.status === 'connected' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {whatsappConnection.status === 'connected' ? 'Conectado' : whatsappConnection.status}
                </Badge>
                {whatsappConnection.phone && (
                  <span className="text-muted-foreground">{whatsappConnection.phone}</span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {whatsappConnection?.status !== 'connected' ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">WhatsApp não conectado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Conecte seu WhatsApp para ver as conversas em tempo real ou use o WhatsApp Web
                </p>
                <div className="flex gap-2 flex-col">
                  <Button asChild>
                    <a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir WhatsApp Web
                    </a>
                  </Button>
                  <Link to="/whatsapp">
                    <Button variant="outline">
                      <QrCode className="h-4 w-4 mr-2" />
                      Conectar API
                    </Button>
                  </Link>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma conversa</h3>
                <p className="text-sm text-muted-foreground">
                  As conversas aparecerão aqui quando alguém entrar em contato
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-1 p-4">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedConversation?.id === conversation.id && "bg-primary/10 border border-primary/20"
                      )}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(conversation.leads.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{conversation.leads.name}</h4>
                            <Badge 
                              variant={conversation.status === 'open' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {conversation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {conversation.leads.phone}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(conversation.last_message_at)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {conversation.channel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header do Chat */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(selectedConversation.leads.name)}
                        </AvatarFallback>
                      </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.leads.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.leads.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={moveToStage}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Mover para..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="atendido">Atendido</SelectItem>
                        <SelectItem value="qualificado">Qualificado</SelectItem>
                        <SelectItem value="fechado">Fechado</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Mensagens */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const showDate = index === 0 || 
                        new Date(message.created_at).toDateString() !== 
                        new Date(messages[index - 1].created_at).toDateString();

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="text-center text-xs text-muted-foreground py-2">
                              {formatDate(message.created_at)}
                            </div>
                          )}
                          <div className={cn(
                            "flex",
                            message.direction === 'outbound' ? "justify-end" : "justify-start"
                          )}>
                            <div className={cn(
                              "max-w-[70%] rounded-lg p-3",
                              message.direction === 'outbound' 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            )}>
                              {message.media_url && (
                                <div className="space-y-2">
                                  <img 
                                    src={message.media_url} 
                                    alt="Imagem" 
                                    className="rounded max-w-full h-auto"
                                  />
                                </div>
                              )}
                              {message.text && <p className="text-sm">{message.text}</p>}
                              <div className={cn(
                                "text-xs mt-1",
                                message.direction === 'outbound' 
                                  ? "text-primary-foreground/70" 
                                  : "text-muted-foreground"
                              )}>
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input de Mensagem */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Image className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </Card>
        </TabsContent>

        <TabsContent value="internal">
          <InternalMessages />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}