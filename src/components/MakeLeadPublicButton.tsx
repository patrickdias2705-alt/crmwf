import { Button } from '@/components/ui/button';
import { ArrowUp, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MakeLeadPublicButtonProps {
  leadId: string;
  isPublic: boolean;
  onSuccess?: () => void;
}

export function MakeLeadPublicButton({ leadId, isPublic, onSuccess }: MakeLeadPublicButtonProps) {
  const { toast } = useToast();

  const handleMakePublic = async () => {
    try {
      const { data, error } = await supabase.rpc('make_lead_public', {
        lead_id: leadId
      });

      if (error) throw error;

      toast({
        title: "Lead subido para lista geral!",
        description: "O lead agora é visível para todos os supervisores.",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error making lead public:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao subir lead para lista geral",
        variant: "destructive",
      });
    }
  };

  if (isPublic) {
    return (
      <Button size="sm" variant="secondary" disabled>
        <Eye className="h-4 w-4 mr-2" />
        Na Lista Geral
      </Button>
    );
  }

  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={handleMakePublic}
    >
      <ArrowUp className="h-4 w-4 mr-2" />
      Subir para Lista Geral
    </Button>
  );
}




