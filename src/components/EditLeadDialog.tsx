import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  stage_id: string;
  order_number?: string | null;
  fields?: any;
}

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSuccess: () => void;
}

export function EditLeadDialog({ open, onOpenChange, lead, onSuccess }: EditLeadDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    stage_id: '',
    notes: '',
    budget_amount: '',
    budget_description: '',
    order_number: ''
  });

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [existingPdf, setExistingPdf] = useState<{
    name: string;
    base64: string;
  } | null>(null);

  // Load stages when dialog opens
  useEffect(() => {
    if (open && user?.tenant_id) {
      fetchStages();
    }
  }, [open, user?.tenant_id]);

  // Load lead data when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: lead.source || '',
        stage_id: lead.stage_id || '',
        notes: lead.fields?.notes || '',
        budget_amount: lead.fields?.budget_amount || '',
        budget_description: lead.fields?.budget_description || '',
        order_number: lead.order_number || ''
      });

      // Load existing PDF if available
      if (lead.fields?.budget_file_base64 && lead.fields?.budget_file_name) {
        setExistingPdf({
          name: lead.fields.budget_file_name,
          base64: lead.fields.budget_file_base64
        });
      } else {
        setExistingPdf(null);
      }
    }
  }, [lead]);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('id, name, color')
        .eq('tenant_id', user?.tenant_id)
        .order('order', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Erro ao buscar estágios:', error);
      toast.error('Erro ao carregar estágios');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione apenas arquivos PDF');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }

      setPdfFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingPdf = () => {
    setExistingPdf(null);
  };

  const downloadExistingPdf = () => {
    if (existingPdf) {
      const link = document.createElement('a');
      link.href = existingPdf.base64;
      link.download = existingPdf.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !user?.tenant_id) return;

    try {
      setLoading(true);

      // Prepare fields data
      const fieldsData = {
        ...lead.fields,
        notes: formData.notes,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
        budget_description: formData.budget_description
      };

      // Handle PDF upload
      if (pdfFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          fieldsData.budget_file_base64 = base64;
          fieldsData.budget_file_name = pdfFile.name;
          
          await updateLead(fieldsData);
        };
        reader.readAsDataURL(pdfFile);
        return;
      } else if (existingPdf) {
        // Keep existing PDF
        fieldsData.budget_file_base64 = existingPdf.base64;
        fieldsData.budget_file_name = existingPdf.name;
      } else {
        // Remove PDF if both are null
        fieldsData.budget_file_base64 = null;
        fieldsData.budget_file_name = null;
      }

      await updateLead(fieldsData);

    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (fieldsData: any) => {
    try {
      // Update lead
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          origin: formData.source,
          stage_id: formData.stage_id,
          order_number: formData.order_number || null,
          fields: fieldsData
        })
        .eq('id', lead!.id)
        .eq('tenant_id', user!.tenant_id);

      if (updateError) throw updateError;

      toast.success('Lead atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
      throw error;
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white dark:text-white font-medium">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white dark:text-white font-medium">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white dark:text-white font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source" className="text-white dark:text-white font-medium">Fonte</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  <SelectItem value="instagram">Instagram (Direct)</SelectItem>
                  <SelectItem value="facebook">Facebook (Messenger FB)</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="loja">Loja</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="carteirizado">Carteirizado</SelectItem>
                  <SelectItem value="cliente_carteirizado">Cliente Carteirizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage" className="text-white dark:text-white font-medium">Estágio</Label>
              <Select value={formData.stage_id} onValueChange={(value) => setFormData({ ...formData, stage_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_amount" className="text-white dark:text-white font-medium">Valor do Orçamento (R$)</Label>
              <Input
                id="budget_amount"
                type="number"
                step="0.01"
                value={formData.budget_amount}
                onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_number" className="text-white dark:text-white font-medium">Número do Pedido</Label>
              <Input
                id="order_number"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                placeholder="Ex: PED-2024-001"
              />
            </div>
          </div>

          {/* Descrição do Orçamento */}
          <div className="space-y-2">
            <Label htmlFor="budget_description" className="text-white dark:text-white font-medium">Descrição do Orçamento</Label>
            <Textarea
              id="budget_description"
              value={formData.budget_description}
              onChange={(e) => setFormData({ ...formData, budget_description: e.target.value })}
              placeholder="Descreva o orçamento ou serviço..."
              rows={3}
            />
          </div>

          {/* Upload de PDF */}
          <div className="space-y-4">
            <Label>Documento PDF do Orçamento</Label>
            
            {/* PDF existente */}
            {existingPdf && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {existingPdf.name}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          PDF atual anexado
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadExistingPdf}
                        className="text-green-600 border-green-300 hover:bg-green-100"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeExistingPdf}
                        className="text-red-600 border-red-300 hover:bg-red-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Novo PDF */}
            {pdfPreview && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          {pdfFile?.name}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Novo PDF selecionado
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removePdf}
                      className="text-red-600 border-red-300 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload button */}
            {!pdfPreview && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {existingPdf ? 'Substituir PDF' : 'Anexar PDF'}
                </Button>
                <p className="text-sm text-gray-500">
                  Apenas arquivos PDF, máximo 10MB
                </p>
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white dark:text-white font-medium">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais sobre o lead..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
