import React, { useState } from 'react';
import { X, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface MiniWhatsAppWebProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MiniWhatsAppWeb: React.FC<MiniWhatsAppWebProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg">WhatsApp Web</h2>
              <p className="text-sm text-gray-500">Conecte seu WhatsApp para começar</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://web.whatsapp.com/', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando WhatsApp Web...</p>
            </div>
          </div>
        )}

        {/* WhatsApp Web iframe */}
        <div className="flex-1 relative">
          <iframe
            key={refreshKey}
            src="https://web.whatsapp.com/"
            className="w-full h-full border-0"
            onLoad={handleLoad}
            onError={handleError}
            title="WhatsApp Web"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            allow="camera; microphone; clipboard-read; clipboard-write"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Conecte seu WhatsApp para sincronizar conversas</span>
            </div>
            <div className="text-xs">
              Powered by WhatsApp Web
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

