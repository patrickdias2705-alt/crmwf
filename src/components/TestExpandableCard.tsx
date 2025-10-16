import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';

export function TestExpandableCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dados fixos para teste
  const testData = [
    { name: '09/10', value: 25 },
    { name: '10/10', value: 18 },
    { name: '11/10', value: 32 },
    { name: '12/10', value: 28 },
    { name: '13/10', value: 35 },
    { name: '14/10', value: 22 },
    { name: '15/10', value: 30 }
  ];

  const handleExpand = () => {
    console.log('🔄 Teste: Expandindo card');
    setLoading(true);
    
    setTimeout(() => {
      setIsExpanded(true);
      setLoading(false);
      console.log('✅ Teste: Modal expandido');
    }, 500);
  };

  return (
    <>
      <Card className="p-6">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Teste de Expansão</h3>
              <p className="text-sm text-gray-600">Clique para expandir</p>
            </div>
            <Button onClick={handleExpand} disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              ) : isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Teste - Gráfico de Dados</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Gráfico de Teste</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={testData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {testData.map((item, index) => (
                <div key={index} className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">{item.name}</div>
                  <div className="text-2xl font-bold text-blue-600">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
