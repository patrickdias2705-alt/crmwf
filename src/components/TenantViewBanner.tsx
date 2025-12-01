import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, X, Activity, BarChart3, Users } from 'lucide-react';
import { useTenantView } from '@/contexts/TenantViewContext';
import { useNavigate, useLocation } from 'react-router-dom';

export function TenantViewBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isViewingOtherTenant, isViewingAgent, viewingTenantName, viewingAgentName, setViewingTenant } = useTenantView();

  if (!isViewingOtherTenant && !isViewingAgent) return null;

  const handleReturn = () => {
    setViewingTenant(null, null);
    navigate('/supervisor');
  };

  const quickLinks = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/leads', label: 'Leads', icon: Users },
    { path: '/pipelines', label: 'Pipeline', icon: BarChart3 },
  ];

  return (
    <Alert className="mb-4 border-primary bg-gradient-to-r from-primary/15 to-primary/5 shadow-lg">
      <Eye className="h-5 w-5 text-primary" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {isViewingAgent ? (
              <>
                <span className="text-sm">
                  Visualizando painel do agente:
                </span>
                <Badge variant="default" className="font-bold px-3 py-1">
                  {viewingAgentName || 'Sem nome'}
                </Badge>
                {viewingTenantName && (
                  <span className="text-xs text-muted-foreground">
                    • {viewingTenantName}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-sm">Visualizando a conta:</span>
                <Badge variant="default" className="font-bold px-3 py-1">
                  {viewingTenantName || 'Sem nome'}
                </Badge>
              </>
            )}
          </div>
          
          {/* Quick Navigation Links */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Navegação rápida:</span>
            {quickLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => navigate(link.path)}
                >
                  <Icon className="h-3 w-3" />
                  {link.label}
                </Button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs animate-pulse">
            <Activity className="h-3 w-3 mr-1" />
            Tempo Real
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReturn}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Voltar ao Supervisor
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}