import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Line } from 'recharts';

interface TestMetricCardProps {
  title: string;
  value: number;
  color: string;
}

export default function TestMetricCard({ title, value, color }: TestMetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const generateTestData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      data.push({
        name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: Math.floor(Math.random() * 100) + 10,
        timestamp: date.toISOString()
      });
    }
    return data;
  };

  const testData = generateTestData();

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <Card className="p-6 bg-white shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-3xl font-bold" style={{ color }}>
              {value}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Mini Chart */}
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={testData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{title} - Análise Detalhada</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpand}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Expanded Chart */}
            <div className="h-96 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={testData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#666" 
                    fontSize={12}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis 
                    stroke="#666" 
                    fontSize={12}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600">
                            <p className="font-semibold">{`Data: ${label}`}</p>
                            <p className="text-blue-400">{`${title}: ${payload[0].value}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={color} 
                    strokeWidth={3}
                    dot={{ fill: color, strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, fill: color, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...testData.map(d => d.value))}
                </div>
                <div className="text-sm text-blue-600">Máximo</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.min(...testData.map(d => d.value))}
                </div>
                <div className="text-sm text-green-600">Mínimo</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(testData.reduce((sum, d) => sum + d.value, 0) / testData.length).toFixed(1)}
                </div>
                <div className="text-sm text-purple-600">Média</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {testData.reduce((sum, d) => sum + d.value, 0)}
                </div>
                <div className="text-sm text-orange-600">Total</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
