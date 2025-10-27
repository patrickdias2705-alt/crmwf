import React, { useState, useRef, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Minimize2, Maximize2, ArrowLeft, ArrowRight, Home, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface MiniBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
}

export const MiniBrowser: React.FC<MiniBrowserProps> = ({ 
  isOpen, 
  onClose, 
  initialUrl = 'https://web.whatsapp.com/' 
}) => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleGoBack = () => {
    if (iframeRef.current && canGoBack) {
      iframeRef.current.contentWindow?.history.back();
    }
  };

  const handleGoForward = () => {
    if (iframeRef.current && canGoForward) {
      iframeRef.current.contentWindow?.history.forward();
    }
  };

  const handleGoHome = () => {
    setCurrentUrl(initialUrl);
    setUrlInput(initialUrl);
    setIsLoading(true);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = urlInput.trim();
    
    // Adicionar https:// se não tiver protocolo
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    setCurrentUrl(url);
    setIsLoading(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
    // Simular histórico de navegação
    setCanGoBack(true);
    setCanGoForward(false);
  };

  const handleError = () => {
    setIsLoading(false);
  };

  // Atualizar URL quando currentUrl mudar
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  }, [currentUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className={`bg-white rounded-lg shadow-2xl border transition-all duration-300 ${
        isMinimized 
          ? 'w-80 h-16' 
          : 'w-[500px] h-[700px]'
      }`}>
        {/* Header do Navegador */}
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 hover:bg-gray-200"
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

        {/* Barra de Navegação */}
        {!isMinimized && (
          <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              disabled={!canGoBack}
              className="h-7 w-7 p-0"
            >
              <ArrowLeft className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoForward}
              disabled={!canGoForward}
              className="h-7 w-7 p-0"
            >
              <ArrowRight className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoHome}
              className="h-7 w-7 p-0"
            >
              <Home className="w-3 h-3" />
            </Button>

            <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-1">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Digite a URL..."
                className="h-7 text-xs"
              />
              <Button
                type="submit"
                size="sm"
                className="h-7 px-2"
              >
                <Search className="w-3 h-3" />
              </Button>
            </form>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(currentUrl, '_blank')}
              className="h-7 w-7 p-0"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Conteúdo do Navegador */}
        {!isMinimized && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="flex-1 flex items-center justify-center bg-gray-50 h-[600px]">
                <div className="text-center">
                  <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Carregando página...</p>
                </div>
              </div>
            )}

            {/* Página Web */}
            <div className="relative h-[600px]">
              <iframe
                ref={iframeRef}
                src={currentUrl}
                className="w-full h-full border-0"
                onLoad={handleLoad}
                onError={handleError}
                title="Mini Browser"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-modals"
                allow="camera; microphone; clipboard-read; clipboard-write; geolocation"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between p-2 border-t bg-gray-50 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Mini Browser - CRM WF Cirúrgicos</span>
              </div>
              <div className="text-xs text-gray-400">
                {currentUrl}
              </div>
            </div>
          </>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">🌐</span>
              </div>
              <span className="text-sm font-medium text-gray-800">Mini Browser</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};
