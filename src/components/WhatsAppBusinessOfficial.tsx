import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Users, Settings, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import WhatsAppBusinessAPI from '@/services/whatsappBusinessApi';

interface WhatsAppBusinessOfficialProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppBusinessOfficial({ isOpen, onClose }: WhatsAppBusinessOfficialProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [whatsappApi, setWhatsappApi] = useState<WhatsAppBusinessAPI | null>(null);

  // Configurações da API (você precisa obter estes dados da Meta)
  const ACCESS_TOKEN = 'SEU_ACCESS_TOKEN_AQUI';
  const PHONE_NUMBER_ID = 'SEU_PHONE_NUMBER_ID_AQUI';

  // Inicializar API
  useEffect(() => {
    if (isOpen && ACCESS_TOKEN && PHONE_NUMBER_ID) {
      const api = new WhatsAppBusinessAPI(ACCESS_TOKEN, PHONE_NUMBER_ID);
      setWhatsappApi(api);
      setIsConnected(true);
      loadContacts();
    }
  }, [isOpen]);

  // Carregar contatos
  const loadContacts = async () => {
    if (!whatsappApi) return;
    
    try {
      setIsLoading(true);
      const contactsData = await whatsappApi.getContacts();
      setContacts(contactsData);
      toast.success(`${contactsData.length} contatos carregados`);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!whatsappApi || !message.trim() || !selectedContact) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setIsLoading(true);
      await whatsappApi.sendTextMessage(selectedContact, message);
      toast.success('Mensagem enviada com sucesso!');
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar template (gratuito)
  const sendTemplate = async (templateName: string) => {
    if (!whatsappApi || !selectedContact) {
      toast.error('Selecione um contato');
      return;
    }

    try {
      setIsLoading(true);
      await whatsappApi.sendTemplateMessage(selectedContact, templateName);
      toast.success('Template enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar template:', error);
      toast.error('Erro ao enviar template');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl mx-auto h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Business API - Meta Oficial
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">
              API Oficial
            </Badge>
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
          {!isConnected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Settings className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Configuração Necessária</h3>
                  <p className="text-muted-foreground">
                    Configure sua API do WhatsApp Business para começar
                  </p>
                </div>
                <div className="text-left space-y-2 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold">Como configurar:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Acesse <a href="https://developers.facebook.com" target="_blank" className="text-blue-600">developers.facebook.com</a></li>
                    <li>Crie um app do WhatsApp Business</li>
                    <li>Obtenha seu Access Token</li>
                    <li>Configure seu Phone Number ID</li>
                    <li>Configure webhooks para receber mensagens</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Informações de custo */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Informações de Custo</h4>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Templates:</strong> Gratuitos (até 1.000/mês)</p>
                  <p>• <strong>Mensagens de texto:</strong> R$ 0,05 (quando cliente inicia)</p>
                  <p>• <strong>Mídia:</strong> R$ 0,10 por mensagem</p>
                </div>
              </div>

              {/* Controles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lista de contatos */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contatos ({contacts.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {contacts.map((contact, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded cursor-pointer ${
                          selectedContact === contact.phone
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedContact(contact.phone)}
                      >
                        <p className="font-medium">{contact.name || 'Sem nome'}</p>
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Área de mensagem */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Enviar Mensagem</h4>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-20"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !message.trim() || !selectedContact}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Templates gratuitos */}
              <div className="space-y-2">
                <h4 className="font-semibold">Templates Gratuitos</h4>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => sendTemplate('hello_world')}
                    disabled={isLoading || !selectedContact}
                    variant="outline"
                    size="sm"
                  >
                    Boas-vindas
                  </Button>
                  <Button
                    onClick={() => sendTemplate('order_confirmation')}
                    disabled={isLoading || !selectedContact}
                    variant="outline"
                    size="sm"
                  >
                    Confirmação de Pedido
                  </Button>
                  <Button
                    onClick={() => sendTemplate('appointment_reminder')}
                    disabled={isLoading || !selectedContact}
                    variant="outline"
                    size="sm"
                  >
                    Lembrete de Agendamento
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="text-center text-sm text-muted-foreground">
                <p>API Oficial da Meta - WhatsApp Business</p>
                <p>Contato selecionado: {selectedContact || 'Nenhum'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
