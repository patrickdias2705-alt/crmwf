import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MessageSquare, Clock, Users, TrendingUp } from 'lucide-react';
import { getEdgeFunctionUrl } from '@/utils/api';

interface BIReportsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxId: number;
}

export function WhatsAppBIReports({ open, onOpenChange, inboxId }: BIReportsProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [metrics, setMetrics] = useState({
    totalConversations: 0,
    openConversations: 0,
    resolvedConversations: 0,
    pendingConversations: 0,
    avgResponseTime: 0,
    totalMessages: 0
  });

  const [conversationsByHour, setConversationsByHour] = useState([]);
  const [conversationsByDay, setConversationsByDay] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);

  useEffect(() => {
    if (open && inboxId) {
      fetchBIReport();
    }
  }, [open, inboxId]);

  const fetchBIReport = async () => {
    try {
      setLoading(true);
      
      // Buscar apenas 4 páginas (100 conversas mais recentes) para otimizar performance
      let allConversations: any[] = [];
      const MAX_PAGES = 4;
      
      for (let page = 1; page <= MAX_PAGES; page++) {
        setLoadingProgress(`Carregando página ${page}/4...`);
        
        const fullUrl = getEdgeFunctionUrl(`chatwoot-conversations${inboxId ? `?inbox_id=${inboxId}&page=${page}` : `?page=${page}`}`);
        
        console.log('🔍 Buscando página', page, fullUrl);
        
        const response = await fetch(fullUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0',
          },
        });

        if (!response.ok) throw new Error('Erro ao buscar dados');

        const result = await response.json();
        const conversations = result?.data?.payload || [];
        
        console.log(`📊 Página ${page}: ${conversations.length} conversas encontradas`);
        
        allConversations = allConversations.concat(conversations);
        
        // Se retornou menos de 25, não há mais páginas
        if (conversations.length < 25) {
          console.log('✅ Todas as páginas carregadas. Total:', allConversations.length);
          break;
        }
      }
      
      setLoadingProgress(`Analisando ${allConversations.length} conversas mais recentes...`);
      
      // Remover duplicatas por ID
      const conversations = allConversations.filter((convo, index, self) =>
        index === self.findIndex((c) => c.id === convo.id)
      );

      // Calcular métricas básicas
      const total = conversations.length;
      const open = conversations.filter((c: any) => c.status === 'open').length;
      const resolved = conversations.filter((c: any) => c.status === 'resolved').length;
      const pending = conversations.filter((c: any) => c.status === 'pending').length;
      
      // Total de mensagens (usar unread_count como aproximação rápida)
      const totalMessages = conversations.reduce((sum: number, c: any) => {
        return sum + (c.unread_count || 0);
      }, total); // Adicionar total como base mínima

      setMetrics({
        totalConversations: total,
        openConversations: open,
        resolvedConversations: resolved,
        pendingConversations: pending,
        avgResponseTime: 0, // TODO: calcular tempo médio de resposta
        totalMessages
      });

      // Gráfico por hora (últimas 24h)
      const now = new Date();
      const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        return {
          hour: hour.getHours().toString().padStart(2, '0') + ':00',
          conversations: 0
        };
      });

      conversations.forEach((conv: any) => {
        const convDate = new Date(conv.created_at);
        const hourDiff = Math.floor((now.getTime() - convDate.getTime()) / (1000 * 60 * 60));
        if (hourDiff < 24) {
          hours[23 - hourDiff].conversations++;
        }
      });

      setConversationsByHour(hours);

      // Gráfico por dia (últimos 7 dias)
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return {
          day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          conversations: 0
        };
      });

      conversations.forEach((conv: any) => {
        const convDate = new Date(conv.created_at);
        const dayDiff = Math.floor((now.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff < 7) {
          days[6 - dayDiff].conversations++;
        }
      });

      setConversationsByDay(days);

      // Distribuição por status
      setStatusDistribution([
        { name: 'Abertas', value: open, color: '#25D366' },
        { name: 'Resolvidas', value: resolved, color: '#8696a0' },
        { name: 'Pendentes', value: pending, color: '#f59e0b' }
      ]);

    } catch (error) {
      console.error('Erro ao buscar relatórios BI:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#25D366', '#8696a0', '#f59e0b'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-[#111b21] border-[#313d45] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Relatórios BI - WhatsApp</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Análise de desempenho das conversas do Chatwoot
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#25D366]"></div>
            {loadingProgress && (
              <p className="mt-4 text-[#8696a0] text-sm">{loadingProgress}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Cards de Métricas */}
            <Card className="bg-[#202c33] border-[#313d45]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#25D366]" />
                  Total de Conversas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#25D366]">
                  {metrics.totalConversations}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#202c33] border-[#313d45]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#25D366]" />
                  Total de Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#25D366]">
                  {metrics.totalMessages}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#202c33] border-[#313d45]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#25D366]" />
                  Conversas Abertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#25D366]">
                  {metrics.openConversations}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#202c33] border-[#313d45]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#25D366]" />
                  Resolvidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#25D366]">
                  {metrics.resolvedConversations}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico por Horas */}
            <Card className="bg-[#202c33] border-[#313d45] md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white text-sm">Conversas por Hora (Últimas 24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={conversationsByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#313d45" />
                    <XAxis dataKey="hour" stroke="#8696a0" fontSize={12} />
                    <YAxis stroke="#8696a0" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #313d45' }} />
                    <Bar dataKey="conversations" fill="#25D366" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico por Dias */}
            <Card className="bg-[#202c33] border-[#313d45] md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white text-sm">Conversas por Dia (Últimos 7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={conversationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#313d45" />
                    <XAxis dataKey="day" stroke="#8696a0" fontSize={12} />
                    <YAxis stroke="#8696a0" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #313d45' }} />
                    <Line type="monotone" dataKey="conversations" stroke="#25D366" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por Status */}
            <Card className="bg-[#202c33] border-[#313d45] md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white text-sm">Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #313d45' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
