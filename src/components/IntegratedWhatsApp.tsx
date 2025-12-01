import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';

interface IntegratedWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegratedWhatsApp: React.FC<IntegratedWhatsAppProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className={`bg-white rounded-lg shadow-2xl border transition-all duration-300 ${
        isMinimized 
          ? 'w-80 h-16' 
          : 'w-[400px] h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-green-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            {!isMinimized && (
              <div>
                <h3 className="font-semibold text-sm text-green-800">WhatsApp Web</h3>
                <p className="text-xs text-green-600">Conecte seu WhatsApp</p>
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
            
            {!isMinimized && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-6 w-6 p-0 hover:bg-green-200"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://web.whatsapp.com/', '_blank')}
                  className="h-6 w-6 p-0 hover:bg-green-200"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </>
            )}
            
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
          <>
            {/* Loading State */}
            {isLoading && !hasError && (
              <div className="flex-1 flex items-center justify-center bg-gray-50 h-[500px]">
                <div className="text-center">
                  <div className="w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Carregando WhatsApp Web...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {hasError && (
              <div className="flex-1 flex items-center justify-center bg-gray-50 h-[500px]">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">WhatsApp Web não carregou</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    O WhatsApp Web pode ter restrições de segurança. Tente:
                  </p>
                  <div className="space-y-2 text-xs text-gray-600">
                    <p>• Clique em "Abrir Externamente" para usar em nova aba</p>
                    <p>• Ou use o botão "Refresh" para tentar novamente</p>
                  </div>
                  <Button
                    onClick={() => window.open('https://web.whatsapp.com/', '_blank')}
                    className="mt-4 bg-green-500 hover:bg-green-600 text-white"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir WhatsApp Web
                  </Button>
                </div>
              </div>
            )}

            {/* WhatsApp Web iframe */}
            <div className="relative h-[500px]">
              <iframe
                key={refreshKey}
                src="https://web.whatsapp.com/"
                className="w-full h-full border-0"
                onLoad={handleLoad}
                onError={handleError}
                title="WhatsApp Web"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-modals"
                allow="camera; microphone; clipboard-read; clipboard-write; geolocation"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Footer */}
            <div className="p-2 border-t bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>WhatsApp Web integrado</span>
                </div>
                <div className="text-xs text-gray-400">
                  CRM WF Cirúrgicos
                </div>
              </div>
            </div>
          </>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">W</span>
              </div>
              <span className="text-sm font-medium text-green-800">WhatsApp Web</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};
