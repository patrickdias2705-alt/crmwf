import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, ChevronRight, Loader2, Shield, User, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

type Inbox = {
  id: number;
  name: string;
  phone_number?: string;
  status?: string;
  user_id?: number; // ID do usuário proprietário do inbox
  avatar_url?: string; // URL da foto de perfil do WhatsApp
};

interface InboxSelectorProps {
  onSelect: (inboxId: number) => void;
}

export function InboxSelector({ onSelect }: InboxSelectorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInboxes();
  }, []);

  const loadInboxes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar inboxes do Chatwoot
      const response = await fetch('/functions/v1/chatwoot-conversations?list_inboxes=true', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      let inboxesList = result?.payload || result?.data || [];
      
      // Adicionar campo avatar_url (thumbnail do inbox) se existir
      inboxesList = inboxesList.map((inbox: any) => ({
        ...inbox,
        avatar_url: inbox.thumbnail || inbox.avatar_url || inbox.image_url || undefined
      }));
      
      // Filtrar inboxes baseado no role do usuário
      if (user) {
        if (user.role === 'agent') {
          // Mapeamento de usuários para seus inbox IDs específicos no Chatwoot
          const userInboxMap: Record<string, number> = {
            'mariabrebal26@gmail.com': 2,  // Maria -> Varejo-WF (inbox ID 2)
            'elaineportaporta@gmail.com': 3,   // Elaine -> [seu inbox]
            'julia@wfcirurgicos.com.br': 4,  // Julia -> [seu inbox]
          };
          
          // Buscar o inbox específico do usuário
          const userInboxId = userInboxMap[user.email.toLowerCase()];
          
          if (userInboxId) {
            // Filtrar apenas o inbox desse usuário
            inboxesList = inboxesList.filter((inbox: Inbox) => inbox.id === userInboxId);
            console.log(`🔒 Filtrado inbox ${userInboxId} para ${user.email}`);
          } else {
            // Se não encontrou mapeamento, usar inbox padrão
            console.warn(`⚠️ Usuário ${user.email} sem mapeamento, usando inbox padrão`);
            inboxesList = inboxesList.filter((inbox: Inbox) => inbox.id === 1);
          }
        } else if (user.role === 'supervisor' || user.role === 'admin') {
          // Supervisor e Admin veem TODOS os inboxes
          console.log('👁️ Supervisor/Admin vê todos os inboxes');
          inboxesList = inboxesList;
        }
      }
      
      setInboxes(inboxesList);
    } catch (err: any) {
      console.error('Error loading inboxes:', err);
      setError(err.message || 'Erro ao carregar números');
    } finally {
      setIsLoading(false);
    }
  };

  const isSupervisorOrAdmin = user && (user.role === 'supervisor' || user.role === 'admin');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Carregando números disponíveis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao carregar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadInboxes} variant="outline" className="w-full">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o CRM
          </Button>
        </div>

        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Selecione um Número WhatsApp</h1>
            {isSupervisorOrAdmin && (
              <Shield className="h-6 w-6 text-blue-600" title="Supervisor/Admin - Visualiza todos os números" />
            )}
            {user?.role === 'agent' && (
              <User className="h-6 w-6 text-green-600" title="Agente - Apenas seu número" />
            )}
          </div>
          <p className="text-gray-600">
            {isSupervisorOrAdmin 
              ? 'Você pode visualizar e gerenciar todos os números disponíveis'
              : `Bem-vindo, ${user?.name}. Este é seu número WhatsApp pessoal.`
            }
          </p>
        </div>

        <div className="space-y-4">
          {inboxes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-semibold text-gray-600">Nenhum número encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure números WhatsApp no Chatwoot primeiro
                </p>
              </CardContent>
            </Card>
          ) : (
            inboxes.map((inbox, index) => {
              return (
                <Card 
                  key={inbox.id} 
                  className="hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-blue-300 animate-in fade-in slide-in-from-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => onSelect(inbox.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Profile Avatar with Animation */}
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 ring-2 ring-green-400">
                            {/* Ícone do WhatsApp SVG */}
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </div>
                          {inbox.status === 'connected' && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
                          )}
                          {inbox.status === 'connected' && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {inbox.name}
                          </h3>
                          {inbox.phone_number && (
                            <p className="text-sm text-gray-600 mb-2">
                              📱 {inbox.phone_number}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {inbox.status && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold gap-1 transition-all ${
                                inbox.status === 'connected' 
                                  ? 'bg-green-100 text-green-700 border border-green-300' 
                                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                              }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                  inbox.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                                }`}></div>
                                {inbox.status === 'connected' ? 'Conectado' : 'Desconectado'}
                              </span>
                            )}
                            {isSupervisorOrAdmin && inbox.id && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                                ID: {inbox.id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
