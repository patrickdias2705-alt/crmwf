import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Building2, Users, Calendar } from "lucide-react";
import { CreateTenantDialog } from "./CreateTenantDialog";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  created_at: string;
  settings: any;
  _count?: {
    users: number;
  };
}

export function TenantsManagement() {
  const { hasRole } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      // Buscar tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      // Buscar contagem de usuários por tenant
      const { data: usersCount } = await supabase
        .from("users")
        .select("tenant_id");

      // Agregar contagem
      const tenantsWithCount = (tenantsData || []).map(tenant => ({
        ...tenant,
        _count: {
          users: usersCount?.filter(u => u.tenant_id === tenant.id).length || 0
        }
      }));

      setTenants(tenantsWithCount);
    } catch (error: any) {
      console.error("Erro ao carregar tenants:", error);
      toast.error("Erro ao carregar tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "default";
      case "pro":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Verificar se é admin
  if (!hasRole(['admin'])) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Acesso negado. Apenas administradores podem gerenciar tenants.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Carregando tenants...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Tenants</CardTitle>
              <CardDescription>
                Gerencie as organizações do sistema
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Tenant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="space-y-3">
              {filteredTenants.map((tenant) => (
                <Card key={tenant.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{tenant.name}</h3>
                          <Badge variant={getPlanBadgeVariant(tenant.plan)}>
                            {tenant.plan.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{tenant._count?.users || 0} usuários</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Criado em {format(new Date(tenant.created_at), "dd/MM/yyyy")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          ID: {tenant.id.slice(0, 8)}...
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTenants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum tenant encontrado" : "Nenhum tenant cadastrado"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateTenantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadTenants}
      />
    </div>
  );
}