import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Phone, Mail, Clock, CheckCircle, XCircle, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { getEdgeFunctionUrl } from "@/utils/api";

type Contact = {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
};

type Chat = {
  id: number;
  status: 'open' | 'resolved' | 'pending';
  account_id: number;
  contact: Contact;
  messages?: Array<any>;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  last_message_at?: string; // Data/hora da última mensagem
  unread_count?: number;
  priority?: string;
};

interface WhatsAppChatProps {
  inboxId: string;
}

export default function WhatsAppChat({ inboxId }: WhatsAppChatProps) {
  const [conversations, setConversations] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);
  
  // Novos estados para emoji, anexo e gravação de áudio
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Estado para imagem expandida
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Usar a Edge Function do Supabase como proxy
      const fullUrl = getEdgeFunctionUrl(`chatwoot-conversations${inboxId ? `?inbox_id=${inboxId}` : ''}`);

      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // A API do Chatwoot retorna {data: {payload: [...]}}
      const conversationsList = result?.data?.payload || [];
      
      if (!Array.isArray(conversationsList)) {
        console.error('Expected array but got:', conversationsList);
        setConversations([]);
        return;
      }
      
      // Debug: ver estrutura completa das conversas
      console.log('📊 Conversas retornadas pelo Chatwoot:', {
        total: conversationsList.length,
        primeiraConversa: conversationsList[0],
        camposDisponiveis: conversationsList[0] ? Object.keys(conversationsList[0]) : []
      });
      
      setConversations(conversationsList);
      toast.success(`${conversationsList.length} conversas carregadas`);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Erro ao carregar conversas');
      toast.error('Erro ao carregar conversas do Chatwoot');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (inboxId) {
      fetchConversations();
    }
  }, [inboxId]);

  // Função para fazer scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll automático quando mensagens mudam
  useEffect(() => {
    if (selectedConversation?.messages) {
      const currentMessageCount = selectedConversation.messages.length;
      if (currentMessageCount !== lastMessageCountRef.current) {
        setTimeout(() => scrollToBottom(), 100);
        lastMessageCountRef.current = currentMessageCount;
      }
    }
  }, [selectedConversation?.messages]);

  // Carregar TODAS as mensagens quando uma conversa é selecionada (primeira vez)
  useEffect(() => {
    console.log('🎯 Conversation selected:', selectedConversation?.id);
    if (selectedConversation && !selectedConversation.messages) {
      console.log('📥 Loading messages for conversation:', selectedConversation.id);
      // Carregar TODAS as mensagens apenas na primeira vez
      loadMessagesForConversation(selectedConversation.id, false);
      setTimeout(() => scrollToBottom(), 500);
    }
  }, [selectedConversation?.id]);

  // Auto-refresh mensagens a cada 3 segundos APENAS se já tem mensagens carregadas
  useEffect(() => {
    if (!selectedConversation || !selectedConversation.messages) return;

    const interval = setInterval(() => {
      loadMessagesForConversation(selectedConversation.id, true); // silent mode
    }, 3000); // 3 segundos para reduzir requisições

    return () => clearInterval(interval);
  }, [selectedConversation?.id, selectedConversation?.messages?.length]);

  // Auto-refresh conversas SEM recarregar mensagens visíveis
  useEffect(() => {
    const interval = setInterval(() => {
      if (inboxId && !isLoading) {
        // Atualizar apenas a lista de conversas, sem recarregar mensagens
        fetchConversationsSilently();
      }
    }, 15000); // 15 segundos

    return () => clearInterval(interval);
  }, [inboxId, isLoading]);

  // Função para recarregar conversas sem mostrar loading
  const fetchConversationsSilently = async () => {
    try {
      const fullUrl = getEdgeFunctionUrl(`chatwoot-conversations${inboxId ? `?inbox_id=${inboxId}` : ''}`);

      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0',
        },
      });

      if (!response.ok) return;

      const result = await response.json();
      const conversationsList = result?.data?.payload || [];
      
      if (!Array.isArray(conversationsList)) return;
      
      setConversations(conversationsList);
    } catch (err) {
      console.error('Error silently fetching conversations:', err);
    }
  };

  const loadMessagesForConversation = async (conversationId: number, silent = false) => {
    try {
      const fullUrl = getEdgeFunctionUrl(`chatwoot-conversations?conversation_id=${conversationId}`);

      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Debug: ver a estrutura da resposta
      console.log('🔍 Chatwoot API Response:', result);
      
      // A resposta da API do Chatwoot pode ter diferentes estruturas
      let newMessages = [];
      if (result.payload) {
        newMessages = result.payload;
      } else if (Array.isArray(result)) {
        newMessages = result;
      } else if (result.data && Array.isArray(result.data.payload)) {
        newMessages = result.data.payload;
      }
      
      console.log('📨 Messages loaded:', newMessages.length);
      
      // Mostrar preview das mensagens
      if (newMessages.length > 0) {
        console.log('📋 First message:', newMessages[0]);
        console.log('📋 Last message:', newMessages[newMessages.length - 1]);
      }
      
      // Atualizar a conversa selecionada com as mensagens
      setSelectedConversation(prev => {
        if (!prev || prev.id !== conversationId) return prev;
        
        // Se está em modo silencioso e já tem mensagens, só adicionar novas (evita recarregar tudo)
        if (silent && prev.messages && prev.messages.length > 0) {
          const existingIds = new Set(prev.messages.map(m => m.id));
          const onlyNewMessages = newMessages.filter((m: any) => !existingIds.has(m.id));
          
          if (onlyNewMessages.length > 0) {
            console.log(`✅ ${onlyNewMessages.length} novas mensagens adicionadas`);
            return { ...prev, messages: [...prev.messages, ...onlyNewMessages] };
          }
          
          // Se não tem mensagens novas, não fazer nada (evita re-render desnecessário)
          return prev;
        }
        
        // Primeira carga: substituir todas as mensagens
        console.log('🔄 Carregando histórico completo:', newMessages.length);
        return { ...prev, messages: newMessages };
      });
      
      if (!silent && newMessages.length > 0) {
        setTimeout(() => scrollToBottom(), 200);
      }
    } catch (err: any) {
      console.error('❌ Error loading messages:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-500', text: 'Aberta', icon: CheckCircle },
      pending: { color: 'bg-yellow-500', text: 'Pendente', icon: Clock },
      resolved: { color: 'bg-gray-500', text: 'Resolvida', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Data inválida:', dateString);
      return '';
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Comparar apenas datas (sem hora)
    const isToday = messageDate.getTime() === today.getTime();
    const isYesterday = messageDate.getTime() === yesterday.getTime();
    
    if (isToday) {
      // Se for hoje, mostrar apenas hora
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (isYesterday) {
      // Se for ontem, mostrar "ontem"
      return 'Ontem';
    } else {
      // Se for outro dia, mostrar data e hora
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para adicionar emoji
  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Funções para gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Gravando áudio...');
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Erro ao iniciar gravação');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Áudio gravado!');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      chunksRef.current = [];
      setRecordedAudio(null);
      toast.info('Gravação cancelada');
    }
  };

  const sendAudio = async () => {
    if (!recordedAudio || !selectedConversation) return;

    toast.info('Enviando áudio...');
    
    // Aqui você precisaria enviar o áudio para o Chatwoot via API
    // Por enquanto, apenas resetamos o estado
    setRecordedAudio(null);
    toast.success('Áudio enviado! (Funcionalidade em desenvolvimento)');
  };

  // Função para anexar arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aqui você enviaria o arquivo para o Chatwoot
    toast.info(`Arquivo selecionado: ${file.name}`);
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedConversation) {
      toast.error('Digite uma mensagem');
      return;
    }

    const messageContent = message.trim();
    const conversationId = selectedConversation.id;
    
    // Salvar a mensagem que estamos enviando para adicionar imediatamente
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      message_type: 1, // outgoing
      created_at: Date.now() / 1000, // timestamp em segundos
      status: 'sending'
    };

    // Adicionar mensagem imediatamente na interface (otimistic update)
    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), tempMessage]
      };
    });

    // Limpar o campo de mensagem imediatamente
    setMessage('');
    setIsSending(true);

    try {
      // Enviar mensagem para o Chatwoot
      const response = await fetch(getEdgeFunctionUrl('chatwoot-conversations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: messageContent,
          message_type: 'outgoing',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Atualizar status da mensagem para enviado
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, status: 'sent', id: result.id || msg.id }
              : msg
          )
        };
      });

      toast.success('Mensagem enviada!');
      
      // Recarregar mensagens completas em background (sem bloquear)
      setTimeout(() => {
        loadMessagesForConversation(conversationId);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Remover mensagem temporária em caso de erro
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).filter(msg => msg.id !== tempMessage.id)
        };
      });
      
      setMessage(messageContent); // Restaurar mensagem no campo
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao carregar conversas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchConversations} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-semibold">Nenhuma conversa encontrada</p>
          <p className="text-sm text-muted-foreground mt-2">
            As conversas aparecerão aqui quando houver mensagens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#0b141a]">
      {/* Lista de Conversas - Sidebar Esquerda */}
      <div className="w-96 bg-[#111b21] border-r border-[#313d45] flex flex-col">
        {/* Header da Sidebar */}
        <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold">Chatwoot WhatsApp</h3>
          <Button onClick={fetchConversations} size="sm" variant="ghost" className="text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de Conversas */}
        <ScrollArea className="flex-1">
          <div>
            {conversations.map((convo) => (
              <div
                key={convo.id}
                className={`px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors border-b border-[#313d45] ${
                  selectedConversation?.id === convo.id ? 'bg-[#2a3942]' : ''
                }`}
                onClick={() => setSelectedConversation(convo)}
              >
                <div className="flex items-start gap-3">
                  {convo.meta?.sender?.thumbnail && (
                    <img 
                      src={convo.meta.sender.thumbnail} 
                      alt={convo.meta.sender.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white truncate">{convo.meta?.sender?.name || 'Sem nome'}</span>
                      <span className="text-xs text-[#8696a0] whitespace-nowrap">
                        {(() => {
                          // Tentar usar o campo timestamp Unix (created_at) da última mensagem
                          if (convo.messages?.[0]?.created_at) {
                            const timestamp = convo.messages[0].created_at;
                            // Se for um número (Unix timestamp), converter para string ISO
                            const dateStr = typeof timestamp === 'number' 
                              ? new Date(timestamp * 1000).toISOString() 
                              : timestamp;
                            return formatDate(dateStr);
                          }
                          // Fallback para outros campos de data
                          if (convo.last_message_at) return formatDate(convo.last_message_at);
                          if (convo.last_activity_at) return formatDate(convo.last_activity_at);
                          return formatDate(convo.updated_at);
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-[#8696a0] truncate">
                        {convo.messages?.[0]?.content?.substring(0, 30) || 'Sem mensagens'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-[#0b141a]">
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedConversation.meta?.sender?.thumbnail && (
                  <img 
                    src={selectedConversation.meta.sender.thumbnail} 
                    alt={selectedConversation.meta.sender.name} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-white font-medium">{selectedConversation.meta?.sender?.name || 'Sem nome'}</p>
                  <p className="text-xs text-[#8696a0]">{selectedConversation.meta?.sender?.phone_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white"
                  onClick={async () => {
                    if (selectedConversation.status === 'resolved') {
                      // Reabrir conversa se estiver resolvida
                      try {
                        const response = await fetch(
                          getEdgeFunctionUrl(`chatwoot-conversations?conversation_id=${selectedConversation.id}`),
                          {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0',
                            },
                            body: JSON.stringify({ status: 'open' })
                          }
                        );
                        if (response.ok) {
                          toast.success('Conversa reaberta!');
                          fetchConversations();
                        }
                      } catch (err) {
                        console.error('Error reopening conversation:', err);
                      }
                    }
                  }}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white">
                  <Mail className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Área de Mensagens - Fundo limpo com logo WF flutuando */}
            <div className="flex-1 overflow-hidden relative bg-[#0b141a]">
            {/* Logo WF flutuando no fundo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: '0.25' }}>
              <img 
                src="/lovable-uploads/55c76384-6a84-4f3a-a555-8b1652907de7.png" 
                alt="WF Logo" 
                className="w-[700px] h-[700px] object-contain"
                style={{ 
                  animation: 'float 8s ease-in-out infinite',
                  filter: 'blur(1px)'
                }}
              />
            </div>
            <div className="h-full overflow-y-auto px-4 py-6 space-y-2 relative z-10">
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                <>
                  {selectedConversation.messages.map((msg: any, idx: number) => {
                    // Debug: logar estrutura da mensagem
                    if (idx === 0) {
                      console.log('🔍 Primeira mensagem structure:', JSON.stringify(msg, null, 2));
                    }
                    
                    // Detectar tipo de mídia (verificar vários campos possíveis)
                    const hasAttachments = msg.attachments && msg.attachments.length > 0;
                    const contentType = msg.content_type || msg.message_type_name || msg.type;
                    
                    const isAudio = contentType === 'audio' || 
                                   msg.audio || 
                                   (hasAttachments && msg.attachments.some((att: any) => 
                                     att.content_type?.startsWith('audio/') || 
                                     att.file_type === 'audio' ||
                                     att.file?.content_type?.startsWith('audio/')
                                   ));
                                   
                    const isImage = contentType === 'image' || 
                                   msg.image || 
                                   (hasAttachments && msg.attachments.some((att: any) => 
                                     att.content_type?.startsWith('image/') || 
                                     att.file_type === 'image' ||
                                     att.file?.content_type?.startsWith('image/')
                                   ));
                                   
                    const isVideo = contentType === 'video' || 
                                   msg.video || 
                                   (hasAttachments && msg.attachments.some((att: any) => 
                                     att.content_type?.startsWith('video/') || 
                                     att.file_type === 'video' ||
                                     att.file?.content_type?.startsWith('video/')
                                   ));
                                   
                    const isPDF = hasAttachments && msg.attachments.some((att: any) => 
                                     att.content_type === 'application/pdf' || 
                                     att.file_type === 'pdf' ||
                                     att.file?.content_type === 'application/pdf'
                                   );
                    
                    // Pegar URL da mídia (verificar vários campos possíveis)
                    const mediaUrl = msg.audio?.url || 
                                   msg.video?.url ||
                                   msg.image?.url ||
                                   msg.attachments?.[0]?.data_url || 
                                   msg.attachments?.[0]?.url ||
                                   msg.attachments?.[0]?.file?.url ||
                                   msg.attachments?.[0]?.file?.data_url ||
                                   msg.attachments?.[0]?.thumbnail_url;
                    
                                         // Log só para mensagens que parecem ser áudio
                     if (isAudio) {
                       console.log('🎵 Audio detected:', { 
                         isAudio, 
                         mediaUrl, 
                         hasAttachments, 
                         contentType,
                         fullMessage: msg
                       });
                     }
                    
                    return (
                      <div key={msg.id || idx} className={`flex ${msg.message_type === 1 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs rounded-lg shadow-sm overflow-hidden ${
                          msg.message_type === 1 
                            ? 'bg-[#005c4b] text-white' 
                            : 'bg-[#202c33] text-white'
                        } ${msg.status === 'sending' ? 'opacity-70' : ''}`}>
                          
                          {/* Imagem */}
                          {isImage && mediaUrl && (
                            <img 
                              src={mediaUrl} 
                              alt="Imagem" 
                              className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setExpandedImage(mediaUrl)}
                            />
                          )}
                          
                          {/* Vídeo */}
                          {isVideo && mediaUrl && (
                            <video 
                              controls 
                              className="w-full max-h-64"
                              src={mediaUrl}
                            />
                          )}
                          
                          {/* PDF */}
                          {isPDF && mediaUrl && (
                            <div className="p-4 bg-black/20 flex items-center gap-3">
                              <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-medium">PDF Document</p>
                                <a 
                                  href={mediaUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-300 hover:underline"
                                >
                                  Abrir PDF
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {/* Áudio - Estilo WhatsApp */}
                          {isAudio && (
                            <div className="p-3 flex items-center gap-2">
                              {/* Botão Play/Pause */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const audioId = `audio-${msg.id}`;
                                  const audioElement = document.getElementById(audioId) as HTMLAudioElement;
                                  const button = e.currentTarget;
                                  
                                  if (audioElement) {
                                    if (audioElement.paused) {
                                      audioElement.play();
                                      button.innerHTML = `
                                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M6,4H10V20H6M14,4H18V20H14V4Z" />
                                        </svg>
                                      `;
                                    } else {
                                      audioElement.pause();
                                      button.innerHTML = `
                                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                                        </svg>
                                      `;
                                    }
                                  }
                                }}
                                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                                </svg>
                              </button>
                              
                              {/* Player escondido */}
                              {mediaUrl && (
                                <audio 
                                  id={`audio-${msg.id}`}
                                  src={mediaUrl}
                                  onTimeUpdate={(e) => {
                                    const audio = e.currentTarget;
                                    const progressId = `progress-${msg.id}`;
                                    const progressBar = document.getElementById(progressId);
                                    const timeId = `time-${msg.id}`;
                                    const timeSpan = document.getElementById(timeId);
                                    
                                    if (progressBar && audio.duration) {
                                      const percent = (audio.currentTime / audio.duration) * 100;
                                      progressBar.style.width = `${percent}%`;
                                    }
                                    
                                    if (timeSpan && audio.duration) {
                                      const remaining = audio.duration - audio.currentTime;
                                      timeSpan.textContent = formatAudioTime(remaining);
                                    }
                                  }}
                                  onLoadedMetadata={(e) => {
                                    const audio = e.currentTarget;
                                    const durationId = `duration-${msg.id}`;
                                    const durationSpan = document.getElementById(durationId);
                                    
                                    if (durationSpan && audio.duration) {
                                      durationSpan.textContent = formatAudioTime(audio.duration);
                                    }
                                  }}
                                />
                              )}
                              
                              {/* Barra de progresso e tempo */}
                              <div className="flex-1 flex flex-col gap-1">
                                {/* Barra de progresso */}
                                <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                                  <div 
                                    id={`progress-${msg.id}`}
                                    className="absolute h-full bg-white/60 rounded-full transition-all duration-100"
                                    style={{ width: '0%' }}
                                  />
                                </div>
                                
                                {/* Tempo */}
                                <div className="flex items-center justify-between text-xs opacity-80">
                                  <span id={`time-${msg.id}`}>0:00</span>
                                  <span id={`duration-${msg.id}`}>
                                    {msg.audio?.duration ? formatAudioTime(msg.audio.duration) : '0:00'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Texto */}
                          {msg.content && (
                            <div className={`px-3 py-2 ${(isImage || isVideo || isPDF || isAudio) ? 'pt-0' : ''}`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          )}
                          
                          {/* Footer com horário e status */}
                          <div className={`flex items-center justify-end gap-1 px-3 pb-2 ${msg.content ? '' : 'pt-2'}`}>
                            <span className="text-xs opacity-70">
                              {new Date(msg.created_at * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.message_type === 1 && (
                              <>
                                {msg.status === 'sending' && (
                                  <svg className="animate-spin w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                )}
                                {msg.status === 'sent' && (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 15" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.175a.366.366 0 0 0-.063-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.175a.365.365 0 0 0-.063-.51z"/>
                                  </svg>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <p className="text-center text-[#8696a0] py-8">Nenhuma mensagem ainda</p>
              )}
            </div>

            </div>

            {/* Campo de entrada de mensagem */}
            <div className="bg-[#202c33] px-4 py-3">
              {/* Seletor de emoji */}
              {showEmojiPicker && (
                <div className="mb-2 bg-[#111b21] rounded-lg p-3 border border-[#313d45]">
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {['😀', '😂', '🥰', '😍', '🤔', '😎', '😴', '😢', '😡', '👍', '👎', '❤️', '🎉', '✅', '❌', '🔥', '💯', '👏', '🙏', '🎊'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="text-2xl hover:bg-[#2a3942] p-1 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Botão de emoji */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#8696a0] hover:text-white"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>

                {/* Botão de anexar arquivo */}
                <Button variant="ghost" size="sm" className="text-[#8696a0] hover:text-white">
                  <input
                    type="file"
                    className="hidden"
                    id="file-input"
                    onChange={handleFileSelect}
                    accept="image/*,video/*,application/pdf,.doc,.docx"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </label>
                </Button>

                {/* Campo de texto */}
                <div className="flex-1 bg-[#2a3942] rounded-lg overflow-hidden">
                  <Textarea
                    placeholder="Digite uma mensagem"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-transparent border-0 resize-none text-white placeholder:text-[#8696a0] focus-visible:ring-0 min-h-[44px] max-h-32 py-3"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>

                {/* Botões de enviar ou gravar */}
                {message.trim() ? (
                  <Button
                    onClick={sendMessage}
                    disabled={isSending}
                    className="bg-[#005c4b] hover:bg-[#005c4b]/90 text-white rounded-full w-11 h-11 p-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                ) : recordedAudio ? (
                  <>
                    <Button 
                      onClick={cancelRecording}
                      variant="ghost" 
                      className="text-red-500 hover:text-red-600 rounded-full w-11 h-11 p-0"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2 12,2M12,20C7.58,20 4,16.42 4,12C4,7.58 7.58,4 12,4C16.42,4 20,7.58 20,12C20,16.42 16.42,20 12,20M15,8H9V16H15V8Z" />
                      </svg>
                    </Button>
                    <Button
                      onClick={sendAudio}
                      className="bg-[#005c4b] hover:bg-[#005c4b]/90 text-white rounded-full w-11 h-11 p-0"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    variant="ghost" 
                    className={`rounded-full w-11 h-11 p-0 ${isRecording ? 'text-red-500' : 'text-[#8696a0] hover:text-white'}`}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse" />
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
            <div className="text-center text-[#8696a0] max-w-md px-8">
              <MessageSquare className="h-24 w-24 mx-auto mb-6 opacity-20" />
              <h3 className="text-2xl font-light mb-2">Chatwoot WhatsApp</h3>
              <p className="text-sm">Selecione uma conversa para começar a enviar mensagens</p>
              <p className="text-xs mt-4 opacity-70">Suas conversas do Chatwoot aparecerão aqui</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Imagem Expandida */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          {/* Botão Fechar */}
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Imagem */}
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img 
              src={expandedImage} 
              alt="Imagem expandida" 
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
