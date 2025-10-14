import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportLeadsToExcel } from "@/lib/excelExport";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export const ExportLeadsButton = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!user?.tenant_id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: "Exportando...",
      description: "Gerando arquivo Excel com todos os leads",
    });

    try {
      const result = await exportLeadsToExcel(user.tenant_id);
      
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Arquivo Excel baixado com sucesso",
        });
      } else {
        throw new Error("Falha ao exportar");
      }
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? "Exportando..." : "Exportar Excel"}
    </Button>
  );
};
