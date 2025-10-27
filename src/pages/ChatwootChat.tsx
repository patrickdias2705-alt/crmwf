import { useState } from "react";
import WhatsAppChat from "@/components/WhatsAppChat";
import { InboxSelector } from "@/components/InboxSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChatwootChat() {
  const navigate = useNavigate();
  const [selectedInbox, setSelectedInbox] = useState<number | null>(null);

  // Se não tem inbox selecionado, mostrar o seletor
  if (!selectedInbox) {
    return <InboxSelector onSelect={setSelectedInbox} />;
  }

  // Se tem inbox selecionado, mostrar o chat
  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#313d45]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedInbox(null)}
            className="text-white hover:bg-[#313d45]"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Trocar Número
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-white hover:bg-[#313d45]"
        >
          <Home className="h-5 w-5 mr-2" />
          Voltar para o CRM
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <WhatsAppChat inboxId={selectedInbox.toString()} />
      </div>
    </div>
  );
}
