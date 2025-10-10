import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { TenantsManagement } from '@/components/admin/TenantsManagement';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { PipelineTemplates } from '@/components/admin/PipelineTemplates';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Building, Users, Settings, FileText, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tenants');

  // Only allow admin users
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    {
      id: 'tenants',
      label: 'Tenants',
      icon: Building,
      description: 'Gerenciar empresas e planos'
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      description: 'Gerenciar usuários do sistema'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: Settings,
      description: 'Modelos de pipeline padrão'
    },
    {
      id: 'logs',
      label: 'Auditoria',
      icon: Activity,
      description: 'Logs e eventos do sistema'
    }
  ];

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Administração</h2>
            <p className="text-muted-foreground">
              Painel administrativo do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="h-5 w-5 text-primary" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>{tab.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tab.id === 'tenants' && <TenantsManagement />}
                  {tab.id === 'users' && <UsersManagement />}
                  {tab.id === 'templates' && <PipelineTemplates />}
                  {tab.id === 'logs' && <AuditLogs />}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}