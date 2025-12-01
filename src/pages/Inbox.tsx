import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationList } from '@/components/ConversationList';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Conversation {
  id: string;
  lead_id: string;
  status: string;
  last_message_at?: string;
  channel: string;
  created_at: string;
  updated_at: string;
  lead?: {
    name: string;
    phone?: string;
    email?: string;
  };
  messages?: Message[];
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

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    
    // Subscribe to realtime changes for conversations
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('Conversation changed:', payload);
          loadConversations();
        }
      )
      .subscribe();

    // Subscribe to realtime changes for messages  
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message changed:', payload);
          if (selectedConversation) {
            loadMessages(selectedConversation.id);
          }
          loadConversations(); // Update conversation list for last message
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []); // Remove selectedConversation dependency to prevent loops

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          leads (
            name,
            phone,
            email
          )
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((data || []) as any);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleSendMessage = async (text: string, mediaUrl?: string) => {
    if (!selectedConversation) return;

    try {
      // Get tenant_id from user
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userData?.tenant_id) {
        console.error('No tenant_id found for user');
        return;
      }

      // Create message in database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          lead_id: selectedConversation.lead_id,
          text,
          media_url: mediaUrl,
          direction: 'outbound',
          tenant_id: userData.tenant_id,
          content: text || ''
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      // Send via WhatsApp
      if (selectedConversation.channel === 'whatsapp') {
        await supabase.functions.invoke('whatsapp-send', {
          body: {
            conversation_id: selectedConversation.id,
            text,
            media_url: mediaUrl
          }
        });
      }

      // Get lead info for realtime event
      const lead = selectedConversation.lead;
      
      // Emit realtime event
      const { realtimeEmitter } = await import('@/utils/realtimeEmitter');
      await realtimeEmitter.emitMessageSent(
        data,
        selectedConversation,
        lead,
        userData.tenant_id
      );

      // Reload messages
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getConversationStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayConversations = conversations.filter(conv => 
      new Date(conv.created_at) >= today
    );
    
    const activeConversations = conversations.filter(conv => 
      conv.status === 'open'
    );

    return {
      total: conversations.length,
      today: todayConversations.length,
      active: activeConversations.length
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando conversas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = getConversationStats();

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Atendimento</h2>
          <p className="text-muted-foreground">
            Gerencie suas conversas e atenda seus clientes
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Conversas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Chat Interface */}
        <Card className="border-border/50 shadow-lg h-[600px]">
          <div className="flex h-full">
            {/* Conversation List */}
            <div className="w-80 border-r border-border">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-lg">Conversas</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{conversations.length} total</Badge>
                  <Badge variant="outline">{stats.active} ativas</Badge>
                </div>
              </div>
              <div className="overflow-y-auto h-full">
                <ConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleConversationSelect}
                />
              </div>
            </div>

            <Separator orientation="vertical" />

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <ChatInterface
                  conversation={selectedConversation}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Selecione uma conversa
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Escolha uma conversa da lista para começar a atender
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}