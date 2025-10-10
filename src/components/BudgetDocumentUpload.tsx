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
}

export function BudgetDocumentUpload({ leadId, leadName, onDocumentUploaded }: BudgetDocumentUploadProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

        // SALVAR NO BANCO
        try {
          console.log('💾 Salvando no lead...');
          const { error: updateError } = await supabase
            .from('leads')
            .update({ 
              fields: {
                budget_file_base64: base64,
                budget_file_name: formData.file.name,
                budget_file_size: formData.file.size,
                budget_description: formData.description,
                budget_amount: parseFloat(formData.amount),
                budget_uploaded_at: new Date().toISOString()
              }
            })
            .eq('id', leadId);

          if (updateError) {
            console.error('❌ Erro ao salvar no banco:', updateError);
            toast.error(`Erro ao salvar: ${updateError.message}`);
            return;
          }

          console.log('✅ Salvo no banco com sucesso!');
          toast.success(`Orçamento salvo! Arquivo: ${formData.file.name}`);
          setFormData({ description: '', amount: '', file: null });
          setOpen(false);
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
      const { data, error } = await supabase
        .from('leads')
        .select('fields')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      
      // Verificar se tem orçamento salvo
      const fields = data?.fields || {};
      if (fields.budget_file_base64) {
        setDocuments([{
          id: '1',
          file_name: fields.budget_file_name || 'Documento',
          file_url: fields.budget_file_base64, // Base64 como URL
          file_size: fields.budget_file_size || 0,
          description: fields.budget_description || '',
          amount: fields.budget_amount || 0,
          created_at: fields.budget_uploaded_at || new Date().toISOString(),
          uploaded_by: user?.name || user?.email || 'Usuário'
        }]);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
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

  // Verificar se já tem orçamento
  const hasExistingBudget = documents.length > 0;
  const budgetAmount = documents[0]?.amount;

  return (
    <>
      {hasExistingBudget ? (
        // Se já tem orçamento, mostra botão "Marcar como Vendido"
        <MarkAsSoldButton 
          leadId={leadId}
          leadName={leadName}
          budgetAmount={budgetAmount}
          onSuccess={onDocumentUploaded}
        />
      ) : (
        // Se não tem orçamento, mostra botão "Enviar Orçamento"
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="outline"
              onClick={fetchDocuments}
            >
              <Upload className="h-4 w-4 mr-2" />
              Enviar Orçamento
            </Button>
          </DialogTrigger>
      
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enviar Orçamento - {leadName}</DialogTitle>
              <DialogDescription>
                Faça upload do documento de orçamento para este lead
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
                <h4 className="font-medium mb-3">Orçamentos Enviados</h4>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getFileIcon(doc.file_name)}</span>
                            <div>
                              <div className="font-medium">{doc.description}</div>
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
    </>
  );
}