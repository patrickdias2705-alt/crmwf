import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Clock, User } from 'lucide-react';

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
  messages?: any[];
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({ 
  conversations, 
  selectedConversation, 
  onSelectConversation 
}: ConversationListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (diffDays <= 7) {
      return `${diffDays}d`;
    }
    
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      case 'pending': return 'bg-[hsl(167_100%_45%)]';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-2 p-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
            selectedConversation?.id === conversation.id 
              ? 'bg-muted border-primary' 
              : 'border-border/50'
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">
                    {conversation.leads?.name 
                      ? getInitials(conversation.leads.name)
                      : <User className="h-4 w-4" />
                    }
                  </AvatarFallback>
                </Avatar>
                
                {/* Status indicator */}
                <div 
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(conversation.status)}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm truncate">
                    {conversation.leads?.name || 'Cliente'}
                  </h4>
                  
                  <div className="flex items-center gap-1">
                    {conversation.last_message_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
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

                {conversation.leads?.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{conversation.leads.phone}</span>
                  </div>
                )}

                {/* Last message preview would go here if available */}
                <div className="text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Criado {formatTime(conversation.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {conversations.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
        </div>
      )}
    </div>
  );
}