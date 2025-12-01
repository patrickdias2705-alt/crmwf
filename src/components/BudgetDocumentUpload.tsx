import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, FileText, Eye, Download, Trash2, DollarSign } from 'lucide-react';
import { MarkAsSoldButton } from '@/components/MarkAsSoldButton';

interface BudgetDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  description: string;
  amount: number;
  created_at: string;
  uploaded_by: string;
}

interface BudgetDocumentUploadProps {
  leadId: string;
  leadName: string;
  onDocumentUploaded?: () => void;
  isRepurchase?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BudgetDocumentUpload({ 
  leadId, 
  leadName, 
  onDocumentUploaded,
  isRepurchase = false,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: BudgetDocumentUploadProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Usar estado externo se fornecido, senão usar interno
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [documents, setDocuments] = useState<BudgetDocument[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    file: null as File | null
  });

  // Carregar documentos ao montar o componente
  useEffect(() => {
    fetchDocuments();
  }, [leadId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      
      // Validar tipo do arquivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.');
        return;
      }
      
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.description || !formData.amount) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setLoading(true);

      // CONVERTER PARA BASE64 E SALVAR NO BANCO
      console.log('📤 Convertendo arquivo para Base64...');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        console.log('✅ Conversão concluída!');
        console.log('📄 Nome do arquivo:', formData.file.name);
        console.log('📄 Tamanho:', formData.file.size, 'bytes');
        console.log('💰 Valor:', formData.amount);
        console.log('📝 Descrição:', formData.description);

        // SALVAR DIRETO NA TABELA budget_documents (SEM FALLBACK)
        try {
          console.log('💾 Salvando orçamento na tabela budget_documents...');
          
          // Buscar tenant_id do lead
          const { data: leadData } = await supabase
            .from('leads')
            .select('tenant_id')
            .eq('id', leadId)
            .single();

          if (!leadData?.tenant_id && !user?.tenant_id) {
            throw new Error('Tenant ID não encontrado');
          }

          // Criar URL temporária baseada no base64
          const tempFileUrl = `data:${formData.file.type};base64,${base64}`;
          
          // Extrair base64 puro (sem data URL prefix)
          const base64Content = base64.includes(',') ? base64.split(',')[1] : base64;
          
          // Inserir na tabela budget_documents
          const insertData: any = {
            lead_id: leadId,
            tenant_id: leadData?.tenant_id || user?.tenant_id,
            file_name: formData.file.name,
            file_url: tempFileUrl,
            file_path: `budgets/${leadId}/${formData.file.name}`,
            file_size: formData.file.size,
            file_base64: base64Content,
            description: formData.description,
            amount: parseFloat(formData.amount),
            uploaded_by: user?.id,
            status: 'aberto'
          };
          
          const { data: insertedBudget, error: budgetDocError } = await supabase
            .from('budget_documents')
            .insert(insertData)
            .select()
            .single();

          if (budgetDocError) {
            console.error('❌ ERRO ao salvar na tabela budget_documents:', budgetDocError);
            console.error('📋 Detalhes do erro:', {
              message: budgetDocError.message,
              details: budgetDocError.details,
              hint: budgetDocError.hint,
              code: budgetDocError.code
            });
            
            toast.error('Erro ao salvar no banco: ' + budgetDocError.message, {
              description: 'Verifique se a migration foi aplicada e se a tabela budget_documents existe.',
              duration: 8000
            });
            return; // NÃO SALVAR EM LUGAR NENHUM SE DER ERRO
          }

          console.log('✅ Orçamento salvo na tabela budget_documents (status: aberto)', insertedBudget);
          
          // Se for recompra, garantir que o lead está como "carteirizado"
          if (isRepurchase) {
            console.log('🔄 Atualizando lead para "carteirizado" (recompra)...');
            const { error: originError } = await supabase
              .from('leads')
              .update({ 
                origin: 'carteirizado',
                updated_at: new Date().toISOString()
              })
              .eq('id', leadId);
            
            if (originError) {
              console.error('⚠️ Erro ao atualizar origem para carteirizado:', originError);
            } else {
              console.log('✅ Lead atualizado para "carteirizado"');
            }
          }
          
          toast.success(isRepurchase ? 'Recompra registrada com sucesso!' : 'Orçamento salvo no banco de dados!', {
            description: `Status: aberto | Valor: R$ ${parseFloat(formData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            duration: 5000
          });

          // Limpar formulário e fechar
          setFormData({ description: '', amount: '', file: null });
          setOpen(false);
          
          // Recarregar documentos para atualizar a lista
          await fetchDocuments();
          onDocumentUploaded?.();

        } catch (dbError) {
          console.error('❌ Erro no banco:', dbError);
          toast.error('Erro ao salvar no banco');
        }
      };
      
      reader.readAsDataURL(formData.file);

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Erro no upload: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const documentsList: BudgetDocument[] = [];
      
      console.log('🔍 Buscando orçamentos para lead:', leadId);
      
      // Buscar APENAS da tabela budget_documents
      // RLS já filtra por tenant automaticamente, não precisa do .eq('tenant_id')
      const { data: budgetDocs, error: budgetDocsError } = await supabase
        .from('budget_documents')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (budgetDocsError) {
        console.error('❌ Erro ao buscar da tabela budget_documents:', budgetDocsError);
        console.error('📋 Detalhes do erro:', {
          message: budgetDocsError.message,
          details: budgetDocsError.details,
          hint: budgetDocsError.hint,
          code: budgetDocsError.code
        });
        toast.error('Erro ao carregar orçamentos: ' + budgetDocsError.message);
        setDocuments([]);
        return;
      }

      console.log('📊 Orçamentos encontrados:', budgetDocs?.length || 0);

      if (budgetDocs && budgetDocs.length > 0) {
        // Buscar IDs únicos de vendedores
        const vendedorIds = [...new Set(budgetDocs.map((doc: any) => doc.uploaded_by).filter(Boolean))];
        
        // Buscar nomes dos vendedores
        let vendedoresMap: Record<string, string> = {};
        if (vendedorIds.length > 0) {
          const { data: vendedores } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', vendedorIds);
          
          if (vendedores) {
            vendedores.forEach((v: any) => {
              vendedoresMap[v.id] = v.name || v.email || 'Usuário';
            });
          }
        }
        
        budgetDocs.forEach((doc: any) => {
          // Construir URL data se tiver base64
          let fileUrl = doc.file_url || '';
          if (doc.file_base64 && !fileUrl.startsWith('data:')) {
            fileUrl = `data:application/pdf;base64,${doc.file_base64}`;
          }
          
          // Pegar nome do vendedor do mapa ou usar fallback
          const vendedorNome = doc.uploaded_by 
            ? (vendedoresMap[doc.uploaded_by] || 'Usuário')
            : 'Usuário';
          
          documentsList.push({
            id: doc.id,
            file_name: doc.file_name || 'Documento',
            file_url: fileUrl,
            file_size: doc.file_size || 0,
            description: doc.description || '',
            amount: doc.amount || 0,
            created_at: doc.created_at || new Date().toISOString(),
            uploaded_by: vendedorNome // Nome do vendedor, não o ID
          });
        });
        console.log('✅ Orçamentos carregados da tabela budget_documents:', budgetDocs.length);
      }
      
      setDocuments(documentsList);
    } catch (error: any) {
      console.error('❌ Erro ao buscar documentos:', error);
      toast.error('Erro ao carregar orçamentos: ' + (error?.message || 'Erro desconhecido'));
      setDocuments([]);
    }
  };

  const handleViewDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownloadDocument = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📁';
    }
  };

  // Verificar se já tem orçamento EM ABERTO (status = 'aberto')
  // Filtrar apenas documentos com status 'aberto' para o botão
  // Por enquanto, mostrar botão se tiver qualquer documento (compatibilidade)
  // TODO: Filtrar por status quando a interface BudgetDocument incluir status
  const hasOpenBudget = documents.length > 0;
  // Usar o documento mais recente (primeiro do array ordenado)
  const latestDocument = documents[0];
  const budgetAmount = latestDocument?.amount;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Mostrar botão para adicionar novo orçamento apenas se não for controlado externamente (recompra) */}
        {!isRepurchase && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                onClick={fetchDocuments}
              >
                <Upload className="h-4 w-4 mr-2" />
                {hasOpenBudget ? 'Adicionar Orçamento' : 'Enviar Orçamento'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isRepurchase 
                  ? `🔄 Nova Recompra - ${leadName}` 
                  : hasOpenBudget 
                    ? `Adicionar Novo Orçamento - ${leadName}` 
                    : `Enviar Orçamento - ${leadName}`
                }
              </DialogTitle>
              <DialogDescription>
                {isRepurchase
                  ? '🔄 Cliente carteirizado fazendo nova compra. O lead será automaticamente marcado como "carteirizado".'
                  : hasOpenBudget 
                    ? 'Adicione um novo documento de orçamento. Este lead já possui orçamentos anteriores.'
                    : 'Faça upload do documento de orçamento para este lead'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Orçamento</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o orçamento, produtos/serviços incluídos..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Arquivo do Orçamento</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máximo 10MB)
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Orçamento'}
                </Button>
              </div>
            </form>

            {/* Lista de documentos existentes */}
            {documents.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">
                  Orçamentos Enviados {documents.length > 1 && `(${documents.length})`}
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {documents.map((doc, index) => (
                    <Card key={doc.id} className={index === 0 ? 'border-primary border-2' : ''}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getFileIcon(doc.file_name)}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{doc.description}</div>
                                {index === 0 && (
                                  <Badge variant="default" className="text-xs">Mais Recente</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {doc.file_name} • {formatFileSize(doc.file_size)}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(doc.amount)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  por {doc.uploaded_by}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDocument(doc.file_url)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadDocument(doc.file_url, doc.file_name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
          </Dialog>
        )}
        
        {/* Se for recompra, sempre mostrar o dialog (controlado externamente) */}
        {isRepurchase && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {`🔄 Nova Recompra - ${leadName}`}
                </DialogTitle>
                <DialogDescription>
                  {'🔄 Cliente carteirizado fazendo nova compra. O lead será automaticamente marcado como "carteirizado".'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Orçamento</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o orçamento, produtos/serviços incluídos..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo do Orçamento</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máximo 10MB)
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Orçamento'}
                  </Button>
                </div>
              </form>

              {/* Lista de documentos existentes */}
              {documents.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">
                    Orçamentos Enviados {documents.length > 1 && `(${documents.length})`}
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {documents.map((doc, index) => (
                      <Card key={doc.id} className={index === 0 ? 'border-primary border-2' : ''}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getFileIcon(doc.file_name)}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">{doc.description}</div>
                                  {index === 0 && (
                                    <Badge variant="default" className="text-xs">Mais Recente</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {doc.file_name} • {formatFileSize(doc.file_size)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    }).format(doc.amount)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    por {doc.uploaded_by}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDocument(doc.file_url)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadDocument(doc.file_url, doc.file_name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Mostrar botão "Marcar como Vendido" se tiver orçamento em aberto E não for recompra */}
        {hasOpenBudget && !isRepurchase && (
          <MarkAsSoldButton 
            leadId={leadId}
            leadName={leadName}
            budgetAmount={budgetAmount}
            onSuccess={onDocumentUploaded}
          />
        )}
      </div>
    </>
  );
}