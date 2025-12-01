import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

export function WhatsAppTest() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-green-600" />
          <CardTitle>WhatsApp Test</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Este é um teste do componente WhatsApp
        </p>
        <Button className="w-full">
          <Smartphone className="mr-2 h-4 w-4" />
          Testar WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}
