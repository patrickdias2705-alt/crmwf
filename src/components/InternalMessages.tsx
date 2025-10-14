import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send, Users, User, Paperclip, CheckCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InternalMessage {
  id: string;
  tenant_id: string;
  sender_id: string;
  recipient_id: string | null;
  is_broadcast: boolean;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface Conversation {
  recipientId: string | null;
  recipientName: string;
  isBroadcast: boolean;
  messages: InternalMessage[];
  unreadCount: number;
}

export function InternalMessages() {
  const { user, hasRole } = useAuth();
  const isSupervisor = hasRole(['admin', 'supervisor']);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tenant_id) {
      loadData();
      
      // Real-time subscription
      const channel = supabase
        .channel('internal-messages-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'internal_messages'
          },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load agents (same tenant only - safe to include email)
      const { data: agentsData, error: agentsError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('active', true)
        .order('name');

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      // Load all messages (only fetch safe fields for sender/recipient to prevent cross-tenant data leakage)
      const { data: messagesData, error: messagesError } = await supabase
        .from('internal_messages')
        .select(`
          id,
          tenant_id,
          sender_id,
          recipient_id,
          is_broadcast,
          subject,
          message,
          is_read,
          created_at,
          sender:sender_id(id, name),
          recipient:recipient_id(id, name)
        `)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Group messages into conversations
      const convMap = new Map<string, Conversation>();

      (messagesData as any[] || []).forEach((msg: any) => {
        const isForMe = msg.recipient_id === user?.id || (msg.is_broadcast && msg.sender_id !== user?.id);
        const isFromMe = msg.sender_id === user?.id;
        
        if (!isForMe && !isFromMe) return;

        // Handle cases where sender or recipient info might be null due to RLS
        const senderName = msg.sender?.name || 'Usuário';
        const recipientName = msg.recipient?.name || 'Usuário';

        let convKey: string;
        let recipientId: string | null;
        let displayName: string;
        let isBroadcast: boolean;

        if (msg.is_broadcast) {
          convKey = 'broadcast';
          recipientId = null;
          displayName = 'Todos os Agentes';
          isBroadcast = true;
        } else if (isFromMe) {
          convKey = `user-${msg.recipient_id}`;
          recipientId = msg.recipient_id;
          displayName = recipientName;
          isBroadcast = false;
        } else {
          convKey = `user-${msg.sender_id}`;
          recipientId = msg.sender_id;
          displayName = senderName;
          isBroadcast = false;
        }

        if (!convMap.has(convKey)) {
          convMap.set(convKey, {
            recipientId,
            recipientName: displayName,
            isBroadcast,
            messages: [],
            unreadCount: 0
          });
        }

        const conv = convMap.get(convKey)!;
        conv.messages.push(msg);
        
        if (!msg.is_read && isForMe) {
          conv.unreadCount++;
        }
      });

      const convArray = Array.from(convMap.values()).sort((a, b) => {
        const lastA = a.messages[a.messages.length - 1]?.created_at || '';
        const lastB = b.messages[b.messages.length - 1]?.created_at || '';
        return lastB.localeCompare(lastA);
      });

      setConversations(convArray);

      // Select first conversation if none selected
      if (!selectedConversation && convArray.length > 0) {
        setSelectedConversation(convArray[0]);
      } else if (selectedConversation) {
        // Update selected conversation
        const updated = convArray.find(c => 
          c.recipientId === selectedConversation.recipientId && 
          c.isBroadcast === selectedConversation.isBroadcast
        );
        if (updated) {
          setSelectedConversation(updated);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    if (!isSupervisor && !selectedConversation.recipientId) {
      toast.error('Apenas supervisores podem enviar mensagens para todos');
      return;
    }

    try {
      setSending(true);
      
      const { error } = await supabase
        .from('internal_messages')
        .insert({
          tenant_id: user?.tenant_id,
          sender_id: user?.id,
          recipient_id: selectedConversation.recipientId,
          is_broadcast: selectedConversation.isBroadcast,
          subject: 'Mensagem',
          message: messageText
        });

      if (error) throw error;

      setMessageText('');
      toast.success('Mensagem enviada');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markMultipleAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .in('id', messageIds);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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

  const createNewConversation = (recipientId: string | null, isBroadcast: boolean) => {
    const recipientName = isBroadcast 
      ? 'Todos os Agentes' 
      : agents.find(a => a.id === recipientId)?.name || 'Usuário';

    const newConv: Conversation = {
      recipientId,
      recipientName,
      isBroadcast,
      messages: [],
      unreadCount: 0
    };

    setSelectedConversation(newConv);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Lista de Conversas */}
      <Card className="w-80 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-lg">Conversas</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            {isSupervisor && (
              <div className="space-y-2 p-4 border-b">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => createNewConversation(null, true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Enviar para Todos
                </Button>
                {agents.filter(a => a.id !== user?.id).map(agent => (
                  <Button
                    key={agent.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createNewConversation(agent.id, false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {agent.name}
                  </Button>
                ))}
              </div>
            )}
            <div className="space-y-1 p-2">
              {conversations.map((conv, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedConversation?.recipientId === conv.recipientId && 
                    selectedConversation?.isBroadcast === conv.isBroadcast && 
                    "bg-primary/10 border border-primary/20"
                  )}
                  onClick={async () => {
                    setSelectedConversation(conv);
                    // Mark all unread messages in this conversation as read
                    const unreadMessageIds = conv.messages
                      .filter(msg => {
                        const isForMe = msg.recipient_id === user?.id || (msg.is_broadcast && msg.sender_id !== user?.id);
                        return !msg.is_read && isForMe;
                      })
                      .map(msg => msg.id);
                    
                    if (unreadMessageIds.length > 0) {
                      await markMultipleAsRead(unreadMessageIds);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conv.isBroadcast ? <Users className="h-5 w-5" /> : getInitials(conv.recipientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{conv.recipientName}</h4>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {conv.messages.length > 0 && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.messages[conv.messages.length - 1].message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Área de Chat */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConversation.isBroadcast ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      getInitials(selectedConversation.recipientName)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation.recipientName}</h3>
                  {selectedConversation.isBroadcast && (
                    <p className="text-xs text-muted-foreground">Mensagem para todos</p>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Mensagens */}
            <CardContent className="flex-1 p-4 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(message.created_at) !== formatDate(selectedConversation.messages[index - 1].created_at);
                    
                    const isFromMe = message.sender_id === user?.id;

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center text-xs text-muted-foreground py-2">
                            {formatDate(message.created_at)}
                          </div>
                        )}
                        <div className={cn(
                          "flex",
                          isFromMe ? "justify-end" : "justify-start"
                        )}>
                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                            isFromMe 
                              ? "bg-primary text-primary-foreground rounded-br-sm" 
                              : "bg-muted rounded-bl-sm"
                          )}>
                            {!isFromMe && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {message.sender?.name || 'Usuário'}
                              </p>
                            )}
                            <p className="text-sm break-words">{message.message}</p>
                            <div className={cn(
                              "flex items-center justify-end gap-1 mt-1",
                              isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              <span className="text-xs">{formatTime(message.created_at)}</span>
                              {isFromMe && (
                                message.is_read ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
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

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1"
                  disabled={sending}
                />
                <Button onClick={sendMessage} disabled={!messageText.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa ou inicie uma nova</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
