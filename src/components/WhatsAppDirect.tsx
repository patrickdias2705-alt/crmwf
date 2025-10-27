import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Minimize2, Maximize2, QrCode, Smartphone } from 'lucide-react';
import { Button } from './ui/button';

interface WhatsAppDirectProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppDirect: React.FC<WhatsAppDirectProps> = ({ isOpen, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Simular verificação de conexão
  useEffect(() => {
    if (isOpen) {
      // Simular verificação se já está conectado
      const checkConnection = () => {
        // Aqui você pode implementar uma verificação real via API
        // Por enquanto, vamos simular que não está conectado
        setIsConnected(false);
      };
      
      checkConnection();
    }
  }, [isOpen]);

  const handleOpenWhatsApp = () => {
    // Abrir WhatsApp Web em nova aba
    const whatsappWindow = window.open(
      'https://web.whatsapp.com/',
      'WhatsAppWeb',
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (whatsappWindow) {
      whatsappWindow.focus();
      setShowInstructions(false);
    }
  };

  const handleCheckConnection = () => {
    // Simular verificação de conexão
    setIsConnected(true);
    setShowInstructions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className={`bg-white rounded-lg shadow-2xl border transition-all duration-300 ${
        isMinimized 
          ? 'w-80 h-16' 
          : 'w-[450px] h-[600px]'
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
                  {isConnected ? 'Conectado' : 'Conectar WhatsApp'}
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
          <div className="flex flex-col h-[520px]">
            {!isConnected ? (
              <>
                {/* Instruções de Conexão */}
                <div className="flex-1 p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Conectar WhatsApp
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Abra o WhatsApp Web para escanear o QR Code e conectar sua conta
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
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Já conectei, verificar
                      </Button>
                    </div>
                  </div>

                  {/* Instruções */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Como conectar:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Clique em "Abrir WhatsApp Web"</li>
                      <li>2. Escaneie o QR Code com seu celular</li>
                      <li>3. Volte aqui e clique em "Já conectei"</li>
                    </ol>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* WhatsApp Conectado */}
                <div className="flex-1 p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      WhatsApp Conectado!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Seu WhatsApp está conectado e funcionando
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
                    <div className="flex items-center gap-2 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Status: Conectado</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Você pode usar o WhatsApp Web normalmente
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>WhatsApp Web - CRM WF Cirúrgicos</span>
                </div>
                <div className="text-xs text-gray-400">
                  {isConnected ? 'Conectado' : 'Aguardando conexão'}
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
