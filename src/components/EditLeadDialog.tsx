import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

      // Update lead
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          source: formData.source,
          stage_id: formData.stage_id,
          order_number: formData.order_number || null,
          fields: fieldsData
        })
        .eq('id', lead.id)
        .eq('tenant_id', user.tenant_id);

      if (updateError) throw updateError;

      toast.success('Lead atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
    } finally {
      setLoading(false);
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
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Fonte</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Estágio</Label>
              <Select value={formData.stage_id} onValueChange={(value) => setFormData({ ...formData, stage_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_amount">Valor do Orçamento (R$)</Label>
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
              <Label htmlFor="order_number">Número do Pedido</Label>
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
            <Label htmlFor="budget_description">Descrição do Orçamento</Label>
            <Textarea
              id="budget_description"
              value={formData.budget_description}
              onChange={(e) => setFormData({ ...formData, budget_description: e.target.value })}
              placeholder="Descreva o orçamento ou serviço..."
              rows={3}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
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
