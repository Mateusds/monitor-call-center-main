import { useState, useEffect } from 'react';
import { loadExcelDataV2, getCachedDataV2, clearCacheV2 } from '@/services/excelDataServiceV2';

interface ExcelDataResponse {
  calls: any[];
  kpiData: any;
  operators: any[];
  dailyStats: any[];
  hourlyData: any[];
  queueData: any[];
  source: 'excel' | 'mock';
}

interface UseExcelDataV2Return {
  data: ExcelDataResponse | null;
  loading: boolean;
  error: string | null;
  source: 'excel' | 'mock' | null;
  refetch: () => Promise<void>;
  clearData: () => void;
}

export function useExcelDataV2(): UseExcelDataV2Return {
  const [data, setData] = useState<ExcelDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'excel' | 'mock' | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const excelData = await loadExcelDataV2() as ExcelDataResponse;
      setData(excelData);
      setSource(excelData.source);
      
      // Log informativo sobre a origem dos dados
      if (excelData.source === 'excel') {
        console.log('🎉 Dashboard usando dados reais do Excel!');
      } else {
        console.log('⚠️ Dashboard usando dados mockados (fallback)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Erro ao carregar dados do Excel:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    clearCacheV2();
    await loadData();
  };

  const clearData = () => {
    clearCacheV2();
    setData(null);
    setError(null);
    setSource(null);
    setLoading(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    loading,
    error,
    source,
    refetch,
    clearData
  };
}
