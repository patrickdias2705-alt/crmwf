import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export function ManageStagesDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3B82F6');

  useEffect(() => {
    if (open && user?.tenant_id) {
      loadStages();
    }
  }, [open, user?.tenant_id]);

  const loadStages = async () => {
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .eq('tenant_id', user?.tenant_id)
        .order('order');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error loading stages:', error);
      toast.error('Erro ao carregar estágios');
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      toast.error('Digite um nome para o estágio');
      return;
    }

    setLoading(true);
    try {
      // Get default pipeline
      const { data: pipeline } = await supabase
        .from('pipelines')
        .select('id')
        .eq('tenant_id', user?.tenant_id)
        .eq('is_default', true)
        .single();

      if (!pipeline) {
        toast.error('Pipeline padrão não encontrado');
        return;
      }

      const { error } = await supabase
        .from('stages')
        .insert({
          name: newStageName,
          color: newStageColor,
          order: stages.length,
          pipeline_id: pipeline.id,
          tenant_id: user?.tenant_id
        });

      if (error) throw error;

      toast.success('Estágio adicionado com sucesso');
      setNewStageName('');
      setNewStageColor('#3B82F6');
      loadStages();
    } catch (error) {
      console.error('Error adding stage:', error);
      toast.error('Erro ao adicionar estágio');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStageColor = async (stageId: string, color: string) => {
    try {
      const { error } = await supabase
        .from('stages')
        .update({ color })
        .eq('id', stageId);

      if (error) throw error;
      
      // Update local state
      setStages(stages.map(s => s.id === stageId ? { ...s, color } : s));
      toast.success('Cor atualizada');
    } catch (error) {
      console.error('Error updating stage color:', error);
      toast.error('Erro ao atualizar cor');
    }
  };

  const handleDeleteStage = async (stageId: string, stageName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o estágio \"${stageName}\"? Os leads neste estágio serão movidos para o primeiro estágio.`)) {
      return;
    }

    try {
      // Move leads to first stage before deleting
      const firstStage = stages[0];
      if (firstStage && firstStage.id !== stageId) {
        await supabase
          .from('leads')
          .update({ stage_id: firstStage.id })
          .eq('stage_id', stageId);
      }

      const { error } = await supabase
        .from('stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;

      toast.success('Estágio excluído com sucesso');
      loadStages();
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Erro ao excluir estágio');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    setStages(updatedItems);

    // Update in database
    try {
      const updates = updatedItems.map(stage => 
        supabase
          .from('stages')
          .update({ order: stage.order })
          .eq('id', stage.id)
      );

      await Promise.all(updates);
      toast.success('Ordem atualizada');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar ordem');
      loadStages(); // Reload on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar Estágios
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Estágios do Pipeline</DialogTitle>
          <DialogDescription>
            Adicione, reordene e personalize os estágios do seu pipeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Stage */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">Adicionar Novo Estágio</h3>
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Input
                placeholder="Nome do estágio"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStage()}
              />
              <Input
                type="color"
                value={newStageColor}
                onChange={(e) => setNewStageColor(e.target.value)}
                className="w-20"
              />
              <Button onClick={handleAddStage} disabled={loading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Existing Stages */}
          <div className="space-y-2">
            <h3 className="font-medium">Estágios Atuais</h3>
            <p className="text-sm text-muted-foreground">
              Arraste para reordenar
            </p>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="stages">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {stages.map((stage, index) => (
                      <Draggable key={stage.id} draggableId={stage.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-2 p-3 border rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg bg-accent' : 'bg-card'
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            </div>
                            
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: stage.color }}
                            />
                            
                            <Input
                              value={stage.name}
                              onChange={async (e) => {
                                const newName = e.target.value;
                                setStages(stages.map(s => 
                                  s.id === stage.id ? { ...s, name: newName } : s
                                ));
                                
                                // Debounced update
                                await supabase
                                  .from('stages')
                                  .update({ name: newName })
                                  .eq('id', stage.id);
                              }}
                              className="flex-1"
                            />
                            
                            <Input
                              type="color"
                              value={stage.color}
                              onChange={(e) => handleUpdateStageColor(stage.id, e.target.value)}
                              className="w-20"
                            />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStage(stage.id, stage.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
