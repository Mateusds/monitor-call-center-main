import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BarChart3 } from 'lucide-react';

interface ConsolidatedMonthFilterProps {
    onFilterChange: (startDate: string, endDate: string) => void;
    currentPeriod: string;
}

export function ConsolidatedMonthFilter({ onFilterChange, currentPeriod }: ConsolidatedMonthFilterProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>('');

    // Meses disponíveis para ambos os canais (intersecção de dados)
    const availableMonths = [
        { value: 'all', label: 'Todos os Meses' },
        { value: '2025-11', label: 'Novembro/2025' },
        { value: '2025-12', label: 'Dezembro/2025' },
        { value: '2026-01', label: 'Janeiro/2026' },
    ];

    const handleMonthSelect = (monthValue: string) => {
        setSelectedMonth(monthValue);
        
        if (monthValue === 'all') {
            onFilterChange('', '');
        } else {
            // Converter YYYY-MM para YYYY-MM-DD (primeiro e último dia do mês)
            const [year, month] = monthValue.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = `${year}-${month}-31`;
            
            onFilterChange(startDate, endDate);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    Filtro por Período
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {availableMonths.map((month) => (
                        <Button
                            key={month.value}
                            variant={selectedMonth === month.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleMonthSelect(month.value)}
                            className="text-xs"
                        >
                            {month.label}
                        </Button>
                    ))}
                </div>
                {currentPeriod && currentPeriod !== 'Período Completo' && (
                    <div className="mt-3 text-xs text-muted-foreground">
                        Período: {currentPeriod}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
