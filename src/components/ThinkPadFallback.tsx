import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Monitor, RefreshCw, Settings } from 'lucide-react';

interface ThinkPadFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

export function ThinkPadFallback({ error, onRetry }: ThinkPadFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleClearCache = () => {
    // Limpar cache do navegador
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Limpar localStorage
    localStorage.clear();
    
    // Recarregar página
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Monitor className="w-8 h-8 text-orange-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Problema de Compatibilidade
            </h1>
            <p className="text-muted-foreground">
              Detectamos um problema específico com seu dispositivo. 
              Isso é comum em alguns ThinkPads e pode ser resolvido facilmente.
            </p>
          </div>
        </div>

        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <strong>Soluções recomendadas:</strong>
            <ul className="mt-2 text-sm space-y-1 text-left">
              <li>• Atualize seu navegador para a versão mais recente</li>
              <li>• Limpe o cache e cookies do navegador</li>
              <li>• Desative extensões temporariamente</li>
              <li>• Tente usar o modo incógnito</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          
          <Button 
            onClick={handleClearCache} 
            variant="outline" 
            className="w-full"
          >
            Limpar Cache e Recarregar
          </Button>
        </div>

        {error && process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
