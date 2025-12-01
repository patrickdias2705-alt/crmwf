import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Database as DatabaseIcon, Table as TableIcon, Users, FileText, BarChart3, MessageSquare, Phone, Settings } from "lucide-react";
import { toast } from "sonner";

interface TableStats {
  table_name: string;
  row_count: number;
  last_updated: string;
}

interface TableData {
  [key: string]: any[];
}

export default function Database() {
  const [stats, setStats] = useState<TableStats[]>([]);
  const [tableData, setTableData] = useState<TableData>({});
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>("");

  const tableIcons: { [key: string]: any } = {
    users: Users,
    leads: FileText,
    conversations: MessageSquare,
    messages: MessageSquare,
    metrics_daily: BarChart3,
    whatsapp_connections: Phone,
    pipelines: Settings,
    stages: Settings,
    tenants: Settings,
    lead_events: FileText,
  };

  const tableDescriptions: { [key: string]: string } = {
    users: "Usuários do sistema",
    leads: "Leads capturados",
    conversations: "Conversas do WhatsApp",
    messages: "Mensagens trocadas",
    metrics_daily: "Métricas diárias",
    whatsapp_connections: "Conexões WhatsApp",
    pipelines: "Pipelines de vendas",
    stages: "Estágios dos pipelines",
    tenants: "Empresas/Organizações",
    lead_events: "Eventos dos leads",
  };

  useEffect(() => {
    loadTableStats();
  }, []);

  const loadTableStats = async () => {
    try {
      setLoading(true);
      
      // Load individual table counts directly
      const tables = [
        'users', 'leads', 'conversations', 'messages', 
        'metrics_daily', 'whatsapp_connections', 'pipelines', 
        'stages', 'tenants', 'lead_events'
      ] as const;
      
      const statsPromises = tables.map(async (table) => {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          return {
            table_name: table,
            row_count: count || 0,
            last_updated: new Date().toISOString()
          };
        } catch (err) {
          return {
            table_name: table,
            row_count: 0,
            last_updated: new Date().toISOString()
          };
        }
      });
      
      const results = await Promise.all(statsPromises);
      setStats(results);
    } catch (error) {
      console.error('Error loading table stats:', error);
      toast.error('Erro ao carregar estatísticas das tabelas');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      const tableMap = {
        'users': 'users',
        'leads': 'leads',
        'conversations': 'conversations',
        'messages': 'messages',
        'metrics_daily': 'metrics_daily',
        'whatsapp_connections': 'whatsapp_connections',
        'pipelines': 'pipelines',
        'stages': 'stages',
        'tenants': 'tenants',
        'lead_events': 'lead_events'
      } as const;

      const table = tableMap[tableName as keyof typeof tableMap];
      if (!table) return;

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(50);
      
      if (error) throw error;
      
      setTableData(prev => ({
        ...prev,
        [tableName]: data || []
      }));
      setSelectedTable(tableName);
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      toast.error(`Erro ao carregar dados da tabela ${tableName}`);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  const getTableIcon = (tableName: string) => {
    const Icon = tableIcons[tableName] || TableIcon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center space-x-2">
          <DatabaseIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Banco de Dados</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="tables">Tabelas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Tabelas</CardTitle>
                  <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.reduce((sum, table) => sum + table.row_count, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maior Tabela</CardTitle>
                  <TableIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.length > 0 
                      ? stats.reduce((max, table) => table.row_count > max.row_count ? table : max).table_name
                      : '-'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((table) => (
                <Card key={table.table_name} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      {getTableIcon(table.table_name)}
                      <CardTitle className="text-sm font-medium capitalize">
                        {table.table_name.replace(/_/g, ' ')}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary">{table.row_count}</Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      {tableDescriptions[table.table_name] || 'Tabela do sistema'}
                    </CardDescription>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => loadTableData(table.table_name)}
                        >
                          Ver Dados
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            {getTableIcon(table.table_name)}
                            <span>Dados da tabela: {table.table_name}</span>
                          </DialogTitle>
                          <DialogDescription>
                            {table.row_count} registros encontrados
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          {tableData[table.table_name] && tableData[table.table_name].length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(tableData[table.table_name][0]).map((column) => (
                                    <TableHead key={column} className="text-xs">
                                      {column}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tableData[table.table_name].slice(0, 10).map((row, index) => (
                                  <TableRow key={index}>
                                    {Object.values(row).map((value, cellIndex) => (
                                      <TableCell key={cellIndex} className="text-xs">
                                        {formatValue(value)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              Nenhum dado encontrado
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Tabelas</CardTitle>
                <CardDescription>
                  Lista completa das tabelas do banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Registros</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((table) => (
                      <TableRow key={table.table_name}>
                        <TableCell className="flex items-center space-x-2">
                          {getTableIcon(table.table_name)}
                          <span className="font-medium">{table.table_name}</span>
                        </TableCell>
                        <TableCell>
                          {tableDescriptions[table.table_name] || 'Tabela do sistema'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{table.row_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => loadTableData(table.table_name)}
                          >
                            Ver Dados
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}