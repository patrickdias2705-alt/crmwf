import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Chatwoot() {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState<string>("3");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar account_id do localStorage ou usar padrão
    const savedAccountId = localStorage.getItem("chatwoot_account_id");
    if (savedAccountId) {
      setAccountId(savedAccountId);
    } else {
      // Usar account_id padrão baseado no tenant ou usuário
      // Por enquanto, usar 3 como padrão
      setAccountId("3");
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Carregando Chatwoot...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full h-[calc(100vh-4rem)] p-4">
        <iframe
          src={`https://crm.wfcirurgicos.com.br/app/accounts/${accountId}/dashboard`}
          title="Chatwoot Inbox"
          width="100%"
          height="100%"
          style={{
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 0 10px rgba(0,0,0,0.15)",
          }}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </Layout>
  );
}

