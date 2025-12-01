import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  Phone, 
  Mail, 
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface Conversation {
  id: string;
  lead_id: string;
  status: string;
  last_message_at?: string;
  channel: string;
  created_at: string;
  updated_at: string;
  leads?: {
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

interface ChatInterfaceProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (text: string, mediaUrl?: string) => void;
}

export function ChatInterface({ conversation, messages, onSendMessage }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    setIsTyping(true);
    await onSendMessage(messageText);
    setMessageText('');
    setIsTyping(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    return date.toLocaleDateString('pt-BR');
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const dateKey = message.created_at.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {getInitials(conversation.leads?.name || 'Cliente')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold">{conversation.leads?.name || 'Cliente'}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {conversation.channel}
              </Badge>
              <Badge 
                variant={conversation.status === 'open' ? 'default' : 'secondary'}
                className="text-xs capitalize"
              >
                {conversation.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Mover Estágio
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Marcar Qualificado
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Marcar Fechado
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Marcar Perdido
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contact Info */}
      {(conversation.leads?.phone || conversation.leads?.email) && (
        <div className="p-4 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-4 text-sm">
            {conversation.leads?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{conversation.leads.phone}</span>
              </div>
            )}
            {conversation.leads?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{conversation.leads.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([dateKey, groupMessages]) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="flex items-center gap-4 my-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground bg-background px-2">
                {formatMessageDate(groupMessages[0].created_at)}
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Messages */}
            {groupMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${
                  message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.direction === 'inbound' && (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.direction === 'outbound'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.media_url && (
                    <div className="mb-2">
                      <img
                        src={message.media_url}
                        alt="Attachment"
                        className="max-w-full h-auto rounded"
                      />
                    </div>
                  )}
                  
                  {message.text && (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                  
                  <div
                    className={`text-xs mt-1 ${
                      message.direction === 'outbound'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>Enviando...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={isTyping}
          />
          
          <Button type="submit" size="sm" disabled={!messageText.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}