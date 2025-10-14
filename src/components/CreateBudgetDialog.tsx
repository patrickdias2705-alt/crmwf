import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateBudgetDialogProps {
  leadId: string;
  leadName: string;
  onBudgetCreated?: () => void;
}

export function CreateBudgetDialog({ leadId, leadName, onBudgetCreated }: CreateBudgetDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    value: '',
    description: '',
    roi: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenant_id) {
      toast.error('Erro: usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const { data: budget, error } = await supabase
        .from('budgets')
        .insert({
          lead_id: leadId,
          value: parseFloat(formData.value),
          description: formData.description || null,
          roi: formData.roi ? parseFloat(formData.roi) : null,
          status: 'pendente'
        })
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('lead_events').insert({
        tenant_id: user.tenant_id,
        lead_id: leadId,
        type: 'budget.created',
        actor: 'user',
        data: { 
          budget_id: budget.id,
          value: budget.value 
        }
      });

      // Call AI agent to update metrics intelligently
      await supabase.functions.invoke('metrics-ai-update', {
        body: {
          event_type: 'budget.created',
          lead_id: leadId,
          budget_value: budget.value
        }
      });

      toast.success('Orçamento criado com sucesso!');
      setFormData({ value: '', description: '', roi: '' });
      setOpen(false);
      onBudgetCreated?.();
    } catch (error: any) {
      console.error('Error creating budget:', error);
      toast.error(error.message || 'Erro ao criar orçamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <DollarSign className="h-4 w-4 mr-2" />
          Adicionar Orçamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Orçamento</DialogTitle>
          <DialogDescription>
            Adicionar orçamento para: {leadName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$) *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes do orçamento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roi">ROI Estimado (%)</Label>
            <Input
              id="roi"
              type="number"
              step="0.01"
              min="0"
              value={formData.roi}
              onChange={(e) => setFormData(prev => ({ ...prev, roi: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Orçamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
