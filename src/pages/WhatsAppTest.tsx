import React from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WhatsAppTest() {
  console.log('🔍 WhatsAppTest renderizando...');

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">WhatsApp Test</h2>
            <p className="text-muted-foreground">
              Página de teste para debugar o problema
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teste Simples</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Se você está vendo isso, a página está funcionando!</p>
            <p>Timestamp: {new Date().toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
