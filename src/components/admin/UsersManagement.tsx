import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserPlus, Edit, Search, Shield, Star, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { CreateUserDialog } from './CreateUserDialog';
import { EditRoleDialog } from './EditRoleDialog';

interface Tenant {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
  tenants: Tenant;
}

export function UsersManagement() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('name');

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Load users with tenant info
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          tenants (
            id,
            name,
            plan,
            created_at
          )
        `)
        .order('name');

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'supervisor':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'supervisor':
        return Star;
      default:
        return User;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!hasRole(['admin'])) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Acesso não autorizado - apenas admins</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gerenciamento de Usuários
            </CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border rounded-md bg-background"
              >
                <option value="all">Todas as Roles</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <RoleIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                            <Badge variant="outline">{user.tenants?.name}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEditRole(user)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Role
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        tenants={tenants}
        onSuccess={loadData}
      />

      <EditRoleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSuccess={loadData}
      />
    </div>
  );
}