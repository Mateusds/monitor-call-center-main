import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BarChart3 } from 'lucide-react';

interface MonthFilterProps {
  onFilterChange: (startDate: string, endDate: string) => void;
  currentPeriod: string;
}

export function MonthFilter({ onFilterChange, currentPeriod }: MonthFilterProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Mêses disponíveis baseados no período atual
  const availableMonths = [
    { value: 'all', label: 'Todos os Meses' },
    { value: '2025-10', label: 'Outubro/2025' },
    { value: '2025-11', label: 'Novembro/2025' },
    { value: '2025-12', label: 'Dezembro/2025' },
    { value: '2026-01', label: 'Janeiro/2026' },
  ];

  const handleMonthChange = (monthValue: string) => {
    setSelectedMonth(monthValue);
    
    if (monthValue === 'all') {
      // Resetar para o período completo
      onFilterChange('', '');
    } else {
      // Converter para datas de início e fim do mês
      const [year, month] = monthValue.split('-').map(Number);
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Último dia do mês
      
      onFilterChange(startDate, endDate);
    }
  };

  const handleClearFilter = () => {
    setSelectedMonth('');
    // Resetar para o período completo
    onFilterChange('', '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Filtro por Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Selecione o Período:</label>
            <div className="space-y-2">
              <Button
                variant={selectedMonth === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMonthChange('all')}
                className="w-full justify-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Todos os Meses
              </Button>
              <div className="grid grid-cols-2 gap-2">
                {availableMonths.slice(1).map((month) => (
                  <Button
                    key={month.value}
                    variant={selectedMonth === month.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMonthChange(month.value)}
                    className="text-xs"
                  >
                    {month.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {selectedMonth && selectedMonth !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilter}
              className="w-full"
            >
              Limpar Filtro
            </Button>
          )}
          
          <div className="text-xs text-muted-foreground">
            Período atual: {currentPeriod}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
