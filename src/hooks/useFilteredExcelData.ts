import { useState, useEffect } from 'react';
import { loadExcelDataV2 } from '@/services/excelDataServiceV2';

export function useFilteredExcelData() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const hasFilter = startDate && endDate && startDate !== '' && endDate !== '';
      console.log(`🔄 Recarregando dados com filtro: ${hasFilter ? `${startDate} a ${endDate}` : 'todos os meses'}`);
      const result = await loadExcelDataV2(
        hasFilter ? startDate : undefined, 
        hasFilter ? endDate : undefined
      );
      setData(result);
      console.log('✅ Dados recarregados com sucesso:', (result as any)?.kpiData?.periodo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('❌ Erro ao recarregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newStartDate: string, newEndDate: string) => {
    console.log(`📅 Filtro alterado: ${newStartDate || 'todos'} a ${newEndDate || 'todos'}`);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    // Limpar dados antigos para mostrar loading
    setData(null);
  };

  // Carregar dados iniciais
  useEffect(() => {
    refetch();
  }, [startDate, endDate]);

  return {
    data,
    loading,
    error,
    startDate,
    endDate,
    handleFilterChange,
    refetch,
    source: data?.source || 'excel'
  };
}
