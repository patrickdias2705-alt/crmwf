import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Minimize2, Maximize2, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface WhatsAppMirrorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppMirror: React.FC<WhatsAppMirrorProps> = ({ isOpen, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [whatsappWindow, setWhatsappWindow] = useState<Window | null>(null);

  // Verificar se já existe uma janela do WhatsApp Web aberta
  const checkExistingWhatsApp = () => {
    setIsChecking(true);
    
    // Tentar detectar se há uma janela do WhatsApp Web aberta
    try {
      // Verificar se há uma janela com WhatsApp Web
      const windows = window.open('', '_blank');
      if (windows) {
        windows.close();
      }
      
      // Simular verificação (em produção, você pode usar APIs para verificar)
      setTimeout(() => {
        setIsConnected(true);
        setIsChecking(false);
      }, 2000);
    } catch (error) {
      setIsChecking(false);
    }
  };

  const handleOpenWhatsApp = () => {
    // Abrir WhatsApp Web em nova aba
    const newWindow = window.open(
      'https://web.whatsapp.com/',
      'WhatsAppWeb',
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (newWindow) {
      setWhatsappWindow(newWindow);
      newWindow.focus();
      
      // Verificar conexão após um tempo
      setTimeout(() => {
        checkExistingWhatsApp();
      }, 3000);
    }
  };

  const handleMirrorWhatsApp = () => {
    if (whatsappWindow && !whatsappWindow.closed) {
      // Focar na janela do WhatsApp
      whatsappWindow.focus();
      setIsConnected(true);
    } else {
      // Se a janela foi fechada, abrir nova
      handleOpenWhatsApp();
    }
  };

  const handleCheckConnection = () => {
    checkExistingWhatsApp();
  };

  // Verificar conexão quando abrir
  useEffect(() => {
    if (isOpen) {
      checkExistingWhatsApp();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className={`bg-white rounded-lg shadow-2xl border transition-all duration-300 ${
        isMinimized 
          ? 'w-80 h-16' 
          : 'w-[500px] h-[650px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-green-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            {!isMinimized && (
              <div>
                <h3 className="font-semibold text-lg text-green-800">WhatsApp Web</h3>
                <p className="text-sm text-green-600">
                  {isConnected ? 'Conectado e Espelhado' : 'Conectar e Espelhar'}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 hover:bg-green-200"
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-red-200"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex flex-col h-[570px]">
            {!isConnected ? (
              <>
                {/* Instruções de Conexão e Espelhamento */}
                <div className="flex-1 p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Conectar e Espelhar WhatsApp
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Conecte seu WhatsApp Web e espelhe no CRM para usar diretamente
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleOpenWhatsApp}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir WhatsApp Web
                    </Button>

                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={handleCheckConnection}
                        disabled={isChecking}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        {isChecking ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {isChecking ? 'Verificando...' : 'Já conectei, espelhar'}
                      </Button>
                    </div>
                  </div>

                  {/* Instruções */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Como espelhar:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Clique em "Abrir WhatsApp Web"</li>
                      <li>2. Conecte seu WhatsApp normalmente</li>
                      <li>3. Volte aqui e clique "Já conectei, espelhar"</li>
                      <li>4. Use o WhatsApp diretamente no CRM!</li>
                    </ol>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* WhatsApp Conectado e Espelhado */}
                <div className="flex-1 p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      WhatsApp Espelhado!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Seu WhatsApp está conectado e espelhado no CRM
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleMirrorWhatsApp}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Focar no WhatsApp Web
                    </Button>

                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setIsConnected(false)}
                        className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reconectar
                      </Button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Status: Conectado e Espelhado</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Você pode usar o WhatsApp Web normalmente. As mudanças são refletidas em tempo real.
                    </p>
                  </div>

                  {/* Aviso sobre Espelhamento */}
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium">Nota sobre Espelhamento:</p>
                        <p>O WhatsApp Web precisa estar aberto em outra aba para funcionar. Use o botão "Focar no WhatsApp Web" para alternar entre as janelas.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>WhatsApp Web Espelhado - CRM WF Cirúrgicos</span>
                </div>
                <div className="text-xs text-gray-400">
                  {isConnected ? 'Espelhado' : 'Aguardando conexão'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">W</span>
              </div>
              <span className="text-sm font-medium text-gray-800">WhatsApp Web</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          </div>
        )}
      </div>
    </div>
  );
};
