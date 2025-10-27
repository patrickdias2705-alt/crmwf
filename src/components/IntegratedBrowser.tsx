import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Home,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface IntegratedBrowserProps {
  defaultUrl?: string;
  title?: string;
  isConnected?: boolean;
  instanceId?: string;
}

export function IntegratedBrowser({ 
  defaultUrl = 'https://web.whatsapp.com/', 
  title = 'WhatsApp Web',
  isConnected = false,
  instanceId
}: IntegratedBrowserProps) {
  const [currentUrl, setCurrentUrl] = useState(defaultUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
    setError(null);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentUrl(e.target.value);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUrl) {
      setRefreshKey(prev => prev + 1);
      setIsLoading(true);
      setError(null);
    }
  };

  // Evitar loops infinitos
  useEffect(() => {
    console.log('🔍 IntegratedBrowser montado:', { currentUrl, isLoading });
  }, [currentUrl, isLoading]);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGoHome = () => {
    setCurrentUrl(defaultUrl);
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
    setError(null);
  };

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="text-xl font-semibold">WhatsApp não conectado</h3>
          <p className="text-muted-foreground">
            Conecte seu WhatsApp primeiro para acessar o WhatsApp Web
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-[600px]'} flex flex-col border rounded-lg overflow-hidden`}>
      {/* Barra de navegação */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/20">
        {/* Botões de navegação */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoHome}
            title="Página inicial"
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.forward()}
            title="Avançar"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Barra de endereço */}
        <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
          <Input
            value={currentUrl}
            onChange={handleUrlChange}
            placeholder="Digite a URL..."
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="outline">
            Ir
          </Button>
        </form>

        {/* Botões de ação */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            title="Abrir em nova aba"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Status de conexão */}
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Conectado
        </Badge>
      </div>

      {/* Aviso sobre compatibilidade */}
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> O WhatsApp Web funciona melhor no Chrome, Firefox ou Edge. 
          Se não carregar, tente abrir em uma nova aba.
        </AlertDescription>
      </Alert>

      {/* Área do iframe */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando {title}...</p>
            </div>
          </div>
        )}
        
        <iframe
          key={refreshKey}
          src={currentUrl}
          className="w-full h-full border-0"
          title={title}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
          onLoad={() => {
            setIsLoading(false);
            setError(null);
          }}
          onError={() => {
            setError('Erro ao carregar a página. Verifique sua conexão ou tente abrir em uma nova aba.');
            setIsLoading(false);
          }}
        />
      </div>

      {/* Rodapé com informações */}
      <div className="p-3 border-t bg-muted/20 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{currentUrl}</span>
            </div>
            {instanceId && (
              <div className="text-xs">
                Instância: {instanceId.substring(0, 8)}...
              </div>
            )}
          </div>
          <div className="text-xs">
            {title} integrado ao CRM
          </div>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenExternal}
                className="mr-2"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir em nova aba
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Tentar novamente
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
