import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Truck } from 'lucide-react';

interface SupervisorCategorySelectorProps {
  selectedCategory: 'varejo' | 'distribuidores';
  onCategoryChange: (category: 'varejo' | 'distribuidores') => void;
  varejoCount: number;
  distribuidoresCount: number;
}

export function SupervisorCategorySelector({ 
  selectedCategory, 
  onCategoryChange, 
  varejoCount, 
  distribuidoresCount 
}: SupervisorCategorySelectorProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Visualizando:</span>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant={selectedCategory === 'varejo' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('varejo')}
          className="flex items-center gap-2"
        >
          <Store className="h-4 w-4" />
          Varejo
          <Badge variant="secondary" className="ml-1">
            {varejoCount}
          </Badge>
        </Button>
        
        <Button
          variant={selectedCategory === 'distribuidores' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('distribuidores')}
          className="flex items-center gap-2"
        >
          <Truck className="h-4 w-4" />
          Distribuidores
          <Badge variant="secondary" className="ml-1">
            {distribuidoresCount}
          </Badge>
        </Button>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Total na Lista Geral:</span>
        <Badge variant="outline">
          {varejoCount + distribuidoresCount} leads
        </Badge>
      </div>
    </div>
  );
}




